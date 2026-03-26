"""FastAPI module exposing calculator and scraping helpers."""

import time
from collections import Counter

import asyncio
from datetime import date, datetime
import re

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from calculator_core import (
    CalculationContext,
    calculate_total as run_total_calculation,
    estimate_horsepower,
)
from config import CUSTOMS_BROKER_RUB, SVH_TRANSPORT_RUB
from schemas import CalculationRequest, CalculationResponse, CostBreakdown
from scraper import (
    fetch_aleado_average_price,
    fetch_aleado_data,
    fetch_aleado_filters,
    fetch_aleado_lot_details,
    fetch_atb_jpy_rate,
    get_euro_rate,
)

app = FastAPI(title="Buzinavto Calc API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "buzinavto-calc-api"}


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


def _normalize_token(value: str) -> str:
    return value.strip().lower().replace(" ", "").replace("-", "").replace("_", "")


def resolve_aleado_ids(brand: str, model: str) -> tuple[str, str, bool]:
    # Sanitize input immediately - remove any quotes, backslashes, or whitespace
    def clean_id(s: str) -> str:
        if not s: return ""
        # Remove literal backslashes and quotes
        return str(s).strip().replace('\\', '').strip('"').strip("'").strip()

    brand = clean_id(brand)
    model = clean_id(model)
    
    brand_id = brand
    model_id = model
    model_matched = False

    try:
        brands = fetch_aleado_filters()
        brand_match = next(
            (
                item
                for item in brands
                if _normalize_token(str(item.get("id", ""))) == _normalize_token(brand)
                or _normalize_token(str(item.get("name", ""))) == _normalize_token(brand)
            ),
            None,
        )
        if brand_match:
            brand_id = clean_id(str(brand_match["id"]))

        models = fetch_aleado_filters(brand_id)
        normalized_model = _normalize_token(model)
        model_match = None
        for item in models:
            item_raw_id = clean_id(str(item.get("id", "")))
            if item_raw_id in {"", "-1"}:
                continue

            item_name = _normalize_token(str(item.get("name", "")))
            item_display = _normalize_token(str(item.get("modelDisplay", "")))
            item_id_norm = _normalize_token(item_raw_id)

            if (
                item_id_norm == _normalize_token(model)
                or item_name == _normalize_token(model)
                or item_display == _normalize_token(model)
                or (normalized_model and item_name in normalized_model)
                or (normalized_model and normalized_model in item_name)
            ):
                model_match = item
                break

        if model_match:
            model_id = clean_id(str(model_match["id"]))
            model_matched = True
        elif models:
            print(f"DEBUG: No exact model match for '{model}', setting model_id to empty")
            model_id = ""
    except Exception as exc:
        print(f"DEBUG: Aleado ID resolution failed: {exc}")

    return brand_id, model_id, model_matched


def resolve_aleado_names(brand_id: str, model_id: str) -> tuple[str, str]:
    brand_name = brand_id
    model_name = model_id

    try:
        brands = fetch_aleado_filters()
        brand_match = next(
            (item for item in brands if str(item.get("id")) == str(brand_id)), None
        )
        if brand_match:
            brand_name = brand_match.get("name", brand_id)

        if model_id:
            models = fetch_aleado_filters(brand_id)
            model_match = next(
                (item for item in models if str(item.get("id")) == str(model_id)), None
            )
            if model_match:
                model_name = model_match.get("name", model_id)
    except Exception as exc:
        print(f"DEBUG: Aleado name resolution failed: {exc}")

    return brand_name, model_name


def get_age_category_from_years(age: int) -> str:
    if age < 3:
        return "0-3"
    if age < 5:
        return "3-5"
    if age < 7:
        return "5-7"
    return "7+"


class RateResponse(BaseModel):
    rate: float
    source: str
    date: str | None = None


# ── Auction Stats types ───────────────────────────────────────────────────────


class RecentLot(BaseModel):
    lot: str
    brand: str
    model: str
    year: str
    engine_cc: str
    horsepower: int = 0
    mileage: str
    grade: str
    price_jpy: int
    price_rub: float
    image_url: str
    auction_date: str
    color: str
    transmission: str
    body: str


class PriceRange(BaseModel):
    min_jpy: int
    max_jpy: int
    min_rub: float
    max_rub: float


class AuctionStatsResponse(BaseModel):
    status: str
    brand: str
    model: str
    total_lots: int
    avg_price_jpy: int
    avg_price_rub: float
    price_range: PriceRange
    grade_distribution: dict[str, int]
    popular_modification: str
    recent_lots: list[RecentLot]
    exchange_rate: float
    cached: bool
    rate_date: str | None = None


# ── In-memory stats cache (TTL = 8 hours) ─────────────────────────────────────
_STATS_CACHE: dict[str, dict] = {}
STATS_CACHE_TTL = 8 * 3600  # 8 hours


@app.get("/api/v1/rate", response_model=RateResponse)
def get_exchange_rate() -> RateResponse:
    rates = fetch_atb_jpy_rate()
    return RateResponse(
        rate=rates["buy"], source="ATB Bank", date=datetime.now().strftime("%d.%m.%Y")
    )


@app.get("/api/v1/rate/v6/{api_key}/latest/RUB")
@app.get("/api/v1/rate/latest/RUB")
def get_mock_exchange_rate(api_key: str = None):
    rates = fetch_atb_jpy_rate()
    rate_rub_per_jpy = rates["buy"]
    return {
        "result": "success",
        "doc": "https://www.exchangerate-api.com/docs",
        "base_code": "RUB",
        "rate_rub_per_jpy": rate_rub_per_jpy,
        "conversion_rates": {
            "JPY": round(1 / rate_rub_per_jpy, 4),
            "RUB": 1,
        },
    }


def _safe_number(value: object) -> float:
    if value is None:
        return 0.0
    try:
        val_str = str(value)
        # Remove anything except digits and period
        clean = re.sub(r"[^0-9.]+", "", val_str)
        return float(clean or 0.0)
    except Exception:
        return 0.0


@app.get("/api/v1/search")
async def search_and_calculate(
    brand: str = "9",
    model: str = "718",
    auction_date: str | None = None,
    body: str | None = None,
    min_grade: str | None = None,
    max_grade: str | None = None,
    min_year: int | None = None,
    max_year: int | None = None,
    min_mileage_km: float | None = None,
    max_mileage_km: float | None = None,
    min_engine_volume_l: float | None = None,
    max_engine_volume_l: float | None = None,
    min_price_rub: float | None = None,
    max_price_rub: float | None = None,
    usage_type: str = "private",
    limit: int | None = Query(None, description="Max number of cars to return"),
):
    rates = fetch_atb_jpy_rate()
    sell_rate = rates["sell"]
    buy_rate = rates["buy"]
    eur_rate = get_euro_rate()
    resolved_brand, resolved_model, model_matched = resolve_aleado_ids(brand, model)
    print(
        f"DEBUG: FINAL RESOLVED brand/model for search: {resolved_brand}/{resolved_model} (matched: {model_matched})"
    )
    brand_name, model_name = resolve_aleado_names(resolved_brand, resolved_model)
    cars = await asyncio.to_thread(
        fetch_aleado_data,
        resolved_brand,
        resolved_model,
        search_type="max",
        body=str(body or ""),
    )

    # ── Apply Filters ────────────────────────────────────────────────────────
    if auction_date:
        cars = [
            car
            for car in cars
            if str(car.get("auction_date", "")).startswith(auction_date)
        ]
    if min_grade:
        cars = [
            car
            for car in cars
            if str(car.get("grade") or car.get("rating") or "").strip().upper()
            >= min_grade.strip().upper()
        ]
    if max_grade:
        cars = [
            car
            for car in cars
            if str(car.get("grade") or car.get("rating") or "").strip().upper()
            <= max_grade.strip().upper()
        ]
    if body:
        normalized_body = _normalize_token(body)
        cars = [
            car
            for car in cars
            if _normalize_token(str(car.get("body") or "")) == normalized_body
        ]
    if min_year is not None:
        cars = [car for car in cars if _safe_number(car.get("year")) >= min_year]
    if max_year is not None:
        cars = [car for car in cars if _safe_number(car.get("year")) <= max_year]
    if min_mileage_km is not None:
        cars = [
            car for car in cars if _safe_number(car.get("mileage")) >= min_mileage_km
        ]
    if max_mileage_km is not None:
        cars = [
            car for car in cars if _safe_number(car.get("mileage")) <= max_mileage_km
        ]

    if min_engine_volume_l is not None:
        min_engine_cc = min_engine_volume_l * 1000
        cars = [
            car for car in cars if _safe_number(car.get("engine_cc")) >= min_engine_cc
        ]
    if max_engine_volume_l is not None:
        max_engine_cc = max_engine_volume_l * 1000
        cars = [
            car for car in cars if _safe_number(car.get("engine_cc")) <= max_engine_cc
        ]

    # Limit the number of cars BEFORE enrichment to avoid excessive network calls
    if limit and limit > 0:
        cars = cars[:limit]
    else:
        # Default safety limit if not specified
        cars = cars[:50]

    # Use a semaphore to limit concurrent network requests to Aleado
    semaphore = asyncio.Semaphore(10)

    async def enrich_car(
        car: dict, sell_rate: float, buy_rate: float, eur_rate: float
    ) -> dict:
        async with semaphore:
            try:
                # ... check cache etc. inside enrichment
                current_year = date.today().year
                car_year = (
                    int(car["year"]) if str(car["year"]).isdigit() else current_year - 4
                )
                age = current_year - car_year
                age_cat = get_age_category_from_years(age)
                lot_price_jpy = int(_safe_number(car.get("price_jpy") or 0))
                engine_cc = int(_safe_number(car.get("engine_cc") or 1500))

                # Enrich from lot detail page
                details = await asyncio.to_thread(
                    fetch_aleado_lot_details, str(car.get("detail_link") or "")
                )
                detail_hp = (
                    int(_safe_number(details.get("horsepower")))
                    if details.get("horsepower")
                    else 0
                )
                horsepower = detail_hp or int(_safe_number(car.get("horsepower") or 0))
                if horsepower <= 0:
                    horsepower = estimate_horsepower(engine_cc)

                average_price_jpy = int(
                    _safe_number(details.get("average_price_jpy") or 0)
                )
                calculation_price_jpy = average_price_jpy or lot_price_jpy

                # Prefer detail images if available
                image_urls = details.get("image_urls") or car.get("image_urls") or []
                car["image_urls"] = image_urls
                car["image_url"] = details.get("image_url") or (
                    image_urls[0] if image_urls else car.get("image_url", "")
                )
                car["auction_sheet_url"] = details.get("auction_sheet_url") or car.get(
                    "auction_sheet_url", ""
                )

                calculation = run_total_calculation(
                    CalculationContext(
                        price_jpy=calculation_price_jpy,
                        engine_volume=engine_cc,
                        horsepower=horsepower,
                        age_category=age_cat,
                        sell_rate=sell_rate,
                        buy_rate=buy_rate,
                        eur_rate=eur_rate,
                        usage_type=usage_type,
                        user_type="individual",
                        engine_type=str(car.get("engine_type") or "gasoline"),
                        year=current_year,
                    )
                )

                car["average_price_jpy"] = (
                    str(average_price_jpy) if average_price_jpy > 0 else ""
                )
                car["calculation_price_jpy"] = str(calculation_price_jpy)
                car["price_source"] = "average" if average_price_jpy > 0 else "lot"
                car["horsepower"] = horsepower

                car["price_details"] = {
                    "car_price_rub": float(calculation.auction_rub),
                    "car_price_jpy": calculation_price_jpy,
                    "lot_price_jpy": lot_price_jpy,
                    "average_price_jpy": average_price_jpy,
                    "buy_and_delivery_rub": float(calculation.japan_expenses_rub),
                    "customs_broker_rub": float(CUSTOMS_BROKER_RUB),
                    "customs_duty_rub": float(calculation.customs_duty_rub),
                    "customs_processing_fee_rub": float(
                        calculation.customs_processing_fee_rub
                    ),
                    "excise_rub": float(calculation.excise_rub),
                    "util_fee_rub": float(calculation.util_fee_rub),
                    "company_commission": 0,
                    "exchange_rate": buy_rate,
                    "rate_source": "ATB Bank",
                    "bank_buy_rate": buy_rate,
                    "usage_type": calculation.effective_usage_type,
                    "user_type": calculation.effective_user_type,
                    "forced_commercial": calculation.forced_commercial,
                }
                car["brand"] = car.get("brand") or brand_name
                car["model"] = car.get("model") or model_name
                car["modelDisplay"] = (
                    car.get("modelDisplay")
                    or " ".join(
                        part
                        for part in [
                            car.get("brand"),
                            car.get("model"),
                            car.get("model_code"),
                            car.get("body"),
                        ]
                        if part
                    ).strip()
                )
                car["modelSlug"] = car.get("modelSlug") or car["model"].lower().replace(
                    " ", "-"
                )
                car["saleCountry"] = car.get("saleCountry") or "JAPAN"
                car["total_rub"] = float(calculation.total_rub)
                return car
            except Exception as exc:
                print(f"DEBUG: Failed to enrich car {car.get('lot')}: {exc}")
                return car

    enriched_results = await asyncio.gather(
        *(enrich_car(car, sell_rate, buy_rate, eur_rate) for car in cars),
        return_exceptions=True,
    )
    enriched = [c for c in enriched_results if isinstance(c, dict)]
    if min_price_rub is not None:
        enriched = [
            car for car in enriched if float(car.get("total_rub") or 0) >= min_price_rub
        ]
    if max_price_rub is not None:
        enriched = [
            car for car in enriched if float(car.get("total_rub") or 0) <= max_price_rub
        ]
    return {
        "status": "success",
        "results": enriched,
        "exchange_rate": buy_rate,
        "rate_source": "ATB Bank",
        "rate_date": datetime.now().strftime("%d.%m.%Y"),
    }


@app.get("/api/v1/auction/filters")
def get_auction_filters(
    brand_id: str = Query(None, description="Brand ID or Name to fetch models for"),
    model_id: str = Query(None, description="Model ID or Name to fetch body types for"),
):
    try:
        # Resolve potentially passed names/slugs to Aleado IDs
        brand = brand_id or ""
        model = model_id or ""
        res_brand, res_model, _ = resolve_aleado_ids(brand, model)
        
        # If we were looking for models for a brand
        if brand and not model:
            target_brand = res_brand
            target_model = None
        # If we were looking for bodies for a model
        elif model:
            target_brand = res_brand
            target_model = res_model
        else:
            target_brand = None
            target_model = None

        data = fetch_aleado_filters(target_brand, target_model)
        return {"status": "success", "results": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/v1/calculate", response_model=CalculationResponse)
async def calculate_total(request: CalculationRequest) -> CalculationResponse:
    print(f"DEBUG: Received request: {request}")
    rates = fetch_atb_jpy_rate()
    sell_rate = rates["sell"]
    buy_rate = rates["buy"]
    calculation = run_total_calculation(
        CalculationContext(
            price_jpy=request.price_jpy,
            engine_volume=request.engine_cc,
            horsepower=request.power_hp,
            age_category=request.age_category,
            sell_rate=sell_rate,
            buy_rate=buy_rate,
            eur_rate=get_euro_rate(),
            user_type=request.user_type,
            usage_type=request.usage_type,
            engine_type=request.engine_type,
            year=date.today().year,
            duty_buffer_rub=request.duty_buffer_rub,
        )
    )

    response = CalculationResponse(
        status="success",
        exchange_rate=buy_rate,
        bank_buy_rate=buy_rate,
        rate_date=datetime.now().strftime("%d.%m.%Y"),
        breakdown=CostBreakdown(
            buy_and_delivery_rub=float(calculation.japan_expenses_rub),
            customs_broker_rub=float(calculation.customs_broker_rub),
            customs_duty_rub=float(calculation.customs_duty_rub),
            customs_processing_fee_rub=float(calculation.customs_processing_fee_rub),
            excise_rub=float(calculation.excise_rub),
            util_fee_rub=float(calculation.util_fee_rub),
            company_commission=float(calculation.company_commission_rub),
            duty_buffer_rub=float(calculation.duty_buffer_rub),
            effective_user_type=calculation.effective_user_type,
            effective_usage_type=calculation.effective_usage_type,
            forced_commercial=calculation.forced_commercial,
        ),
        total_rub=float(calculation.total_rub),
    )

    print(f"DEBUG: Response: {response}")
    return response


@app.post("/api/v1/sync")
async def sync_cars(brand_id: str = "9", model_id: str = "718"):
    brand_name, model_name = resolve_aleado_names(brand_id, model_id)
    cars = fetch_aleado_data(brand_id, model_id)
    return {
        "status": "success",
        "brand": brand_name,
        "model": model_name,
        "synced": len(cars),
        "total_scraped": len(cars),
    }


@app.get("/api/v1/auction/stats", response_model=AuctionStatsResponse)
async def auction_stats(
    brand: str = Query("9", description="Brand ID or slug"),
    model: str = Query("", description="Model ID or slug (optional)"),
    body: str | None = Query(None, description="Body type (optional)"),
    min_mileage_km: int = Query(None),
    max_mileage_km: int = Query(None),
    min_year: int = Query(None),
    max_year: int = Query(None),
    min_grade: str = Query(None),
    max_grade: str = Query(None),
) -> AuctionStatsResponse:
    """Return aggregated market statistics for a brand/model combination.
    Results are cached in memory for 1 hour to incorporate current filters.
    """
    # ── Create unique cache key for current filter set ────────────────────────
    filters_str = f"mil_{min_mileage_km}-{max_mileage_km}yr_{min_year}-{max_year}grade_{min_grade}-{max_grade}_body_{body}"
    cache_key = f"{brand}::{model}::{filters_str}"

    cached = _STATS_CACHE.get(cache_key)
    if cached and time.time() - cached["ts"] < 3600:
        payload = cached["data"]
        payload["cached"] = True
        return AuctionStatsResponse(**payload)

    # ── Resolve human-readable names ──────────────────────────────────────────
    resolved_brand, resolved_model, _ = resolve_aleado_ids(brand, model)
    brand_name, model_name = resolve_aleado_names(resolved_brand, resolved_model)

    # ── Fetch raw lots ────────────────────────────────────────────────────────
    rates = fetch_atb_jpy_rate()
    sell_rate = rates["sell"]
    buy_rate = rates["buy"]

    cars = await asyncio.to_thread(
        fetch_aleado_data,
        resolved_brand,
        resolved_model,
        search_type="stats",
        body=str(body or ""),
    )
    if not cars:
        print(
            f"DEBUG: Stats search returned 0 rows for {resolved_brand}/{resolved_model}. "
            "Retrying with live search fallback."
        )
        cars = await asyncio.to_thread(
            fetch_aleado_data,
            resolved_brand,
            resolved_model,
            search_type="max",
            body="",
        )

    # ── Apply Filtering ───────────────────────────────────────────────────────
    def _to_int_price(v) -> int:
        try:
            return int(float(str(v).replace(" ", "") or 0))
        except Exception:
            return 0

    if min_mileage_km is not None:
        cars = [c for c in cars if _safe_number(c.get("mileage")) >= min_mileage_km]
    if max_mileage_km is not None:
        cars = [c for c in cars if _safe_number(c.get("mileage")) <= max_mileage_km]
    if min_year is not None:
        cars = [c for c in cars if _safe_number(c.get("year")) >= min_year]
    if max_year is not None:
        cars = [c for c in cars if _safe_number(c.get("year")) <= max_year]
    if min_grade:
        cars = [
            car
            for car in cars
            if str(car.get("grade") or car.get("rating") or "").strip().upper()
            >= min_grade.strip().upper()
        ]
    if max_grade:
        cars = [
            car
            for car in cars
            if str(car.get("grade") or car.get("rating") or "").strip().upper()
            <= max_grade.strip().upper()
        ]
    if body:
        norm_body = _normalize_token(body)
        cars = [
            c for c in cars if _normalize_token(str(c.get("body") or "")) == norm_body
        ]

    priced = [c for c in cars if _to_int_price(c.get("price_jpy", 0)) > 0]

    if not priced:
        empty: dict = {
            "status": "success",
            "brand": brand_name,
            "model": model_name,
            "total_lots": 0,
            "avg_price_jpy": 0,
            "avg_price_rub": 0.0,
            "price_range": {"min_jpy": 0, "max_jpy": 0, "min_rub": 0.0, "max_rub": 0.0},
            "grade_distribution": {},
            "popular_modification": "",
            "recent_lots": [],
            "exchange_rate": buy_rate,
            "cached": False,
            "rate_date": datetime.now().strftime("%d.%m.%Y"),
        }
        _STATS_CACHE[cache_key] = {"data": empty, "ts": time.time()}
        return AuctionStatsResponse(**empty)

    # ── Aggregate stats ───────────────────────────────────────────────────────
    # Use same calculator math as search_and_calculate to compute real RUB totals
    total_rub_list: list[float] = []
    prices_jpy = []
    for c in priced:
        lot_price_jpy = _to_int_price(c.get("price_jpy", 0))
        prices_jpy.append(lot_price_jpy)
        engine_cc = int(c.get("engine_cc") or 1500)
        hp = int(_safe_number(c.get("horsepower")))
        if hp <= 0:
            hp = estimate_horsepower(engine_cc)

        current_year = date.today().year
        car_year = int(c["year"]) if str(c.get("year")).isdigit() else current_year - 4
        age = current_year - car_year
        age_cat = get_age_category_from_years(age)

        calculation = run_total_calculation(
            CalculationContext(
                price_jpy=lot_price_jpy,
                engine_volume=engine_cc,
                horsepower=hp,
                age_category=age_cat,
                sell_rate=sell_rate,
                buy_rate=buy_rate,
                eur_rate=get_euro_rate(),
                usage_type="private",
                user_type="individual",
                engine_type=str(c.get("engine_type") or "gasoline"),
                year=current_year,
            )
        )
        total_rub_list.append(float(calculation.total_rub))

    avg_jpy = int(sum(prices_jpy) / len(prices_jpy))
    min_jpy = min(prices_jpy)
    max_jpy = max(prices_jpy)
    grade_dist = dict(
        Counter(
            str(c.get("grade") or c.get("rating", "")).strip()
            for c in priced
            if (c.get("grade") or c.get("rating"))
        )
    )

    modifications = [
        str(c.get("modification") or c.get("model_code", "")).strip() for c in priced
    ]
    popular_mod = Counter(m for m in modifications if m).most_common(1)
    popular_modification = popular_mod[0][0] if popular_mod else ""

    def _sort_key(c: dict) -> str:
        return str(c.get("auction_date") or "")

    sorted_cars = sorted(priced, key=_sort_key, reverse=True)[:20]

    recent_lots = [
        RecentLot(
            lot=str(c.get("lot") or ""),
            brand=str(c.get("brand") or brand_name),
            model=str(c.get("model") or model_name),
            year=str(c.get("year") or ""),
            engine_cc=str(c.get("engine_cc") or ""),
            horsepower=(
                int(_safe_number(c.get("horsepower")))
                if int(_safe_number(c.get("horsepower"))) > 0
                else estimate_horsepower(int(_safe_number(c.get("engine_cc"))))
            ),
            mileage=str(c.get("mileage") or ""),
            grade=str(c.get("grade") or c.get("rating") or ""),
            price_jpy=_to_int_price(c.get("price_jpy", 0)),
            price_rub=round(_to_int_price(c.get("price_jpy", 0)) * buy_rate, 2),
            image_url=str(c.get("image_url") or ""),
            auction_date=str(c.get("auction_date") or ""),
            color=str(c.get("color") or ""),
            transmission=str(c.get("transmission") or ""),
            body=str(c.get("body") or ""),
        )
        for c in sorted_cars
    ]

    avg_total_rub = (
        round(sum(total_rub_list) / len(total_rub_list), 2) if total_rub_list else 0.0
    )
    min_total_rub = round(min(total_rub_list), 2) if total_rub_list else 0.0
    max_total_rub = round(max(total_rub_list), 2) if total_rub_list else 0.0

    payload_dict: dict = {
        "status": "success",
        "brand": brand_name,
        "model": model_name,
        "total_lots": len(priced),
        "avg_price_jpy": avg_jpy,
        "avg_price_rub": avg_total_rub,
        "price_range": {
            "min_jpy": min_jpy,
            "max_jpy": max_jpy,
            "min_rub": min_total_rub,
            "max_rub": max_total_rub,
        },
        "grade_distribution": grade_dist,
        "popular_modification": popular_modification,
        # Replace price_rub for recent lots with calculated total_rub when available
        "recent_lots": [
            dict(
                lot.model_dump(),
                price_rub=round(total_rub_list[idx], 2)
                if idx < len(total_rub_list)
                else lot.price_rub,
            )
            for idx, lot in enumerate(recent_lots)
        ],
        "exchange_rate": buy_rate,
        "cached": False,
        "rate_date": datetime.now().strftime("%d.%m.%Y"),
    }

    _STATS_CACHE[cache_key] = {"data": payload_dict, "ts": time.time()}
    return AuctionStatsResponse(**payload_dict)
