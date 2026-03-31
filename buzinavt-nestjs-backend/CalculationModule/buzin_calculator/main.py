"""FastAPI module exposing calculator and scraping helpers."""

import time
from collections import Counter

import asyncio
from datetime import date, datetime, timedelta
import re

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from calculator_core import (
    CalculationContext,
    calculate_total as run_total_calculation,
    estimate_horsepower,
)
from config import SVH_TRANSPORT_RUB
from schemas import CalculationRequest, CalculationResponse, CostBreakdown
from scraper import (
    fetch_aleado_average_price,
    fetch_aleado_data,
    fetch_aleado_filters,
    fetch_aleado_lot_details,
    fetch_atb_jpy_rate,
    get_cbr_jpy_rate,
    get_euro_rate,
    infer_horsepower_from_identifiers,
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


def _tokenize_filter_value(value: str) -> list[str]:
    return [
        token
        for token in re.split(r"[^0-9a-zа-яё]+", str(value or "").strip().lower())
        if token
    ]


def _matches_body_filter(body_filter: str, *candidates: str) -> bool:
    normalized_filter = _normalize_token(body_filter)
    if not normalized_filter:
        return True

    filter_tokens = _tokenize_filter_value(body_filter)

    for candidate in candidates:
        candidate_text = str(candidate or "")
        normalized_candidate = _normalize_token(candidate_text)
        if not normalized_candidate:
            continue

        if normalized_candidate == normalized_filter:
            return True

        candidate_tokens = _tokenize_filter_value(candidate_text)
        if filter_tokens and candidate_tokens and all(
            token in candidate_tokens for token in filter_tokens
        ):
            return True

    return False


def _resolve_car_horsepower(car: dict, detail_hp: int = 0) -> int:
    horsepower = detail_hp or int(_safe_number(car.get("horsepower") or 0))
    if horsepower > 0:
        return horsepower

    inferred_horsepower = infer_horsepower_from_identifiers(
        model_code=str(car.get("model_code") or ""),
        body=str(car.get("body") or ""),
        modification=str(car.get("modification") or ""),
        model_display=str(car.get("modelDisplay") or ""),
        model=str(car.get("model") or ""),
        engine_cc=int(_safe_number(car.get("engine_cc") or 0)),
    )
    if inferred_horsepower > 0:
        return inferred_horsepower

    return estimate_horsepower(int(_safe_number(car.get("engine_cc") or 0)))


def _build_lot_identity(car: dict) -> str:
    lot = str(car.get("lot") or "").strip()
    auction_date = str(car.get("auction_date") or "").strip()
    detail_link = str(car.get("detail_link") or "").strip()
    return "::".join(part for part in [lot, auction_date, detail_link] if part)


def _parse_auction_datetime(value: object) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None

    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    return None


def _sort_catalog_cars(cars: list[dict]) -> list[dict]:
    def _sort_key(car: dict) -> tuple[datetime, str]:
        parsed_date = _parse_auction_datetime(car.get("auction_date")) or datetime.min
        return parsed_date, str(car.get("lot") or "")

    return sorted(cars, key=_sort_key, reverse=True)


def _clean_aleado_identifier(value: object) -> str:
    if not value:
        return ""

    return str(value).strip().replace("\\", "").strip('"').strip("'").strip()


def _dedupe_cars(cars: list[dict]) -> list[dict]:
    deduped: list[dict] = []
    seen: set[str] = set()

    for car in cars:
        identity = _build_lot_identity(car)
        if identity and identity in seen:
            continue

        if identity:
            seen.add(identity)
        deduped.append(car)

    return deduped


def _dedupe_model_ids(items: list[dict]) -> list[str]:
    model_ids: list[str] = []
    seen: set[str] = set()

    for item in items:
        item_id = _clean_aleado_identifier(item.get("id", ""))
        if item_id in {"", "-1"} or item_id in seen:
            continue

        seen.add(item_id)
        model_ids.append(item_id)

    return model_ids


def _get_model_match_groups(models: list[dict], model: str) -> tuple[list[dict], list[dict], list[dict]]:
    normalized_model = _normalize_token(model)
    if not normalized_model:
        return [], [], []

    exact_matches: list[dict] = []
    family_matches: list[dict] = []
    partial_matches: list[dict] = []

    for item in models:
        item_id = _clean_aleado_identifier(item.get("id", ""))
        if item_id in {"", "-1"}:
            continue

        item_name_raw = str(item.get("name", "") or "")
        item_display_raw = str(item.get("modelDisplay", "") or "")
        item_id_norm = _normalize_token(item_id)
        item_name = _normalize_token(item_name_raw)
        item_display = _normalize_token(item_display_raw)
        text_candidates = [candidate for candidate in [item_name, item_display] if candidate]
        token_candidates = [
            *_tokenize_filter_value(item_name_raw),
            *_tokenize_filter_value(item_display_raw),
        ]

        is_exact = normalized_model in {item_id_norm, item_name, item_display}
        is_family = any(candidate.startswith(normalized_model) for candidate in text_candidates) or any(
            token.startswith(normalized_model) for token in token_candidates
        )
        is_partial = normalized_model and any(
            normalized_model in candidate or candidate in normalized_model
            for candidate in text_candidates
        )

        if is_exact:
            exact_matches.append(item)
        if is_family:
            family_matches.append(item)
        elif is_partial:
            partial_matches.append(item)

    return exact_matches, family_matches, partial_matches


def resolve_aleado_model_ids(brand: str, model: str) -> tuple[str, list[str], bool]:
    brand = _clean_aleado_identifier(brand)
    model = _clean_aleado_identifier(model)

    brand_id = brand
    matched_model_ids: list[str] = []
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
            brand_id = _clean_aleado_identifier(str(brand_match["id"]))

        if not model:
            return brand_id, [], False

        models = fetch_aleado_filters(brand_id)
        exact_matches, family_matches, partial_matches = _get_model_match_groups(models, model)

        if family_matches:
            matched_model_ids = _dedupe_model_ids(family_matches + exact_matches)
            model_matched = True
        elif exact_matches:
            matched_model_ids = _dedupe_model_ids(exact_matches)
            model_matched = True
        elif partial_matches:
            matched_model_ids = _dedupe_model_ids(partial_matches)
            model_matched = True
        elif models:
            print(f"DEBUG: No Aleado model family match for '{model}'")
    except Exception as exc:
        print(f"DEBUG: Aleado ID resolution failed: {exc}")

    return brand_id, matched_model_ids, model_matched


def resolve_aleado_ids(brand: str, model: str) -> tuple[str, str, bool]:
    brand_id, model_ids, model_matched = resolve_aleado_model_ids(brand, model)
    return brand_id, model_ids[0] if model_ids else "", model_matched


async def _fetch_aleado_data_for_models(
    brand_id: str,
    model_ids: list[str],
    *,
    search_type: str,
    body: str = "",
    result_filter: str | None = None,
) -> list[dict]:
    effective_model_ids = model_ids or [""]
    tasks = [
        asyncio.to_thread(
            fetch_aleado_data,
            brand_id,
            model_id,
            search_type=search_type,
            body=body,
            result_filter=result_filter,
        )
        for model_id in effective_model_ids
    ]

    batches = await asyncio.gather(*tasks, return_exceptions=True)
    merged: list[dict] = []
    errors: list[str] = []

    for model_id, batch in zip(effective_model_ids, batches):
        if isinstance(batch, Exception):
            error_message = f"{brand_id}/{model_id or 'ALL'}: {batch}"
            print(f"DEBUG: Failed to fetch Aleado batch for {error_message}")
            errors.append(error_message)
            continue
        merged.extend(batch or [])

    if errors and not merged:
        raise RuntimeError(
            "Aleado upstream fetch failed for all requested model batches: "
            + "; ".join(errors[:5])
        )

    return _sort_catalog_cars(_dedupe_cars(merged))


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
    total_rub: float | None = None
    image_url: str
    auction_date: str
    color: str
    transmission: str
    body: str
    sale_status: str = ""


class PriceRange(BaseModel):
    min_jpy: int
    max_jpy: int
    min_rub: float
    max_rub: float


class PaginationInfo(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int
    has_next_page: bool
    has_prev_page: bool


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
    recent_lots_pagination: PaginationInfo
    exchange_rate: float
    duty_exchange_rate: float | None = None
    duty_rate_source: str | None = None
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


def _resolve_average_price_jpy(car: dict, details: dict | None = None) -> int:
    details = details or {}

    average_price_jpy = int(
        _safe_number(
            details.get("average_price_jpy")
            or car.get("average_price_jpy")
            or 0
        )
    )
    if average_price_jpy > 0:
        return average_price_jpy

    detail_link = str(car.get("detail_link") or "").strip()
    if not detail_link:
        return 0

    try:
        return int(_safe_number(fetch_aleado_average_price(detail_link)))
    except Exception as exc:
        print(
            f"DEBUG: Failed to resolve Aleado average price for lot {car.get('lot')}: {exc}"
        )
        return 0


def _build_pagination_info(
    total_items: int,
    page: int | None,
    limit: int | None,
    *,
    default_limit: int = 12,
    max_limit: int = 100,
) -> PaginationInfo:
    safe_total = max(0, int(total_items or 0))
    safe_limit = int(limit or default_limit)
    if safe_limit <= 0:
        safe_limit = default_limit
    safe_limit = min(safe_limit, max_limit)

    total_pages = max(1, (safe_total + safe_limit - 1) // safe_limit) if safe_total else 1
    safe_page = int(page or 1)
    if safe_page <= 0:
        safe_page = 1
    safe_page = min(safe_page, total_pages)

    return PaginationInfo(
        page=safe_page,
        limit=safe_limit,
        total_items=safe_total,
        total_pages=total_pages,
        has_next_page=safe_page < total_pages,
        has_prev_page=safe_page > 1,
    )


def _paginate_items(
    items: list[dict],
    page: int | None,
    limit: int | None,
    *,
    default_limit: int = 12,
    max_limit: int = 100,
) -> tuple[list[dict], PaginationInfo]:
    pagination = _build_pagination_info(
        len(items),
        page,
        limit,
        default_limit=default_limit,
        max_limit=max_limit,
    )
    start = (pagination.page - 1) * pagination.limit
    end = start + pagination.limit
    return items[start:end], pagination


def _build_empty_search_payload(
    *,
    exchange_rate: float,
    rate_source: str,
    duty_exchange_rate: float,
    duty_rate_source: str,
    page: int | None,
    limit: int | None,
) -> dict:
    pagination = _build_pagination_info(
        0,
        page,
        limit,
        default_limit=12,
        max_limit=100,
    )
    return {
        "status": "success",
        "results": [],
        "pagination": pagination.model_dump(),
        "exchange_rate": exchange_rate,
        "rate_source": rate_source,
        "duty_exchange_rate": duty_exchange_rate,
        "duty_rate_source": duty_rate_source,
        "rate_date": datetime.now().strftime("%d.%m.%Y"),
    }


def _is_completed_auction_date(value: object) -> bool:
    text = str(value or "").strip()
    if not text:
        return False

    now_jst = datetime.utcnow() + timedelta(hours=9)

    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            auction_dt = datetime.strptime(text, fmt)
            return auction_dt <= now_jst
        except ValueError:
            continue

    return False


def _is_catalog_active_lot(car: dict) -> bool:
    sale_status = str(car.get("sale_status") or "").strip().lower()

    if _is_completed_auction_date(car.get("auction_date")):
        return False

    if not sale_status:
        return True

    if "не продан" in sale_status:
        return False

    blocked_status_tokens = ("продан", "отмен", "cancel", "sold", "unsold")
    return not any(token in sale_status for token in blocked_status_tokens)


@app.get("/api/v1/search")
async def search_and_calculate(
    brand: str = "9",
    model: str = "",
    page: int = Query(1, description="Results page number"),
    lot: str | None = None,
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
    include_completed: bool = Query(False, description="Include completed/archive lots"),
    enrich_details: bool = Query(
        False, description="Fetch lot detail page data such as gallery and auction sheet"
    ),
    limit: int | None = Query(None, description="Max number of cars to return per page"),
):
    atb_rates = fetch_atb_jpy_rate()
    commercial_rate = atb_rates["buy"]
    sell_rate = atb_rates["sell"]
    duty_rate = get_cbr_jpy_rate()
    eur_rate = get_euro_rate()
    resolved_brand, resolved_models, model_matched = resolve_aleado_model_ids(brand, model)
    resolved_model = resolved_models[0] if resolved_models else ""
    requested_model_name = str(model or "").strip()
    print(
        "DEBUG: FINAL RESOLVED brand/models for search: "
        f"{resolved_brand}/{resolved_models or ['ALL']} (matched: {model_matched})"
    )
    if requested_model_name and not model_matched and not resolved_models:
        return _build_empty_search_payload(
            exchange_rate=commercial_rate,
            rate_source="ATB Bank",
            duty_exchange_rate=duty_rate,
            duty_rate_source="CBR",
            page=page,
            limit=limit,
        )
    brand_name, model_name = resolve_aleado_names(resolved_brand, resolved_model)
    try:
        if include_completed:
            cars = await _fetch_aleado_data_for_models(
                resolved_brand,
                resolved_models,
                search_type="stats",
                result_filter="2",
            )
        else:
            cars = await _fetch_aleado_data_for_models(
                resolved_brand,
                resolved_models,
                search_type="max",
                body=str(body or ""),
            )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # ── Apply Filters ────────────────────────────────────────────────────────
    if not include_completed:
        cars = [car for car in cars if _is_catalog_active_lot(car)]

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
        cars = [
            car
            for car in cars
            if _matches_body_filter(
                body,
                str(car.get("body") or ""),
                str(car.get("model_code") or ""),
                str(car.get("modification") or ""),
            )
        ]
    if lot:
        normalized_lot = re.sub(r"[^\d]+", "", str(lot or ""))
        if normalized_lot:
            cars = [
                car
                for car in cars
                if re.sub(r"[^\d]+", "", str(car.get("lot") or "")) == normalized_lot
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

    cars = _sort_catalog_cars(cars)
    cars, pagination = _paginate_items(
        cars,
        page,
        limit,
        default_limit=12,
        max_limit=100,
    )

    # Use a semaphore to limit concurrent network requests to Aleado
    semaphore = asyncio.Semaphore(10)

    async def enrich_car(
        car: dict,
        duty_rate: float,
        commercial_rate: float,
        sell_rate: float,
        eur_rate: float,
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
                row_engine_cc = int(_safe_number(car.get("engine_cc") or 1500))
                details: dict = {}
                if enrich_details:
                    details = await asyncio.to_thread(
                        fetch_aleado_lot_details, str(car.get("detail_link") or "")
                    )
                detail_engine_cc = (
                    int(_safe_number(details.get("engine_cc")))
                    if details.get("engine_cc")
                    else 0
                )
                engine_cc = detail_engine_cc or row_engine_cc
                detail_hp = (
                    int(_safe_number(details.get("horsepower")))
                    if details.get("horsepower")
                    else 0
                )
                horsepower = _resolve_car_horsepower(car, detail_hp)
                average_price_jpy = await asyncio.to_thread(
                    _resolve_average_price_jpy, car, details
                )
                calculation_price_jpy = average_price_jpy or lot_price_jpy

                preview_image = str(car.get("image_url") or "").strip()
                image_urls = details.get("image_urls") or car.get("image_urls") or []
                if not image_urls and preview_image:
                    image_urls = [preview_image]
                car["image_urls"] = image_urls
                car["image_url"] = details.get("image_url") or (
                    image_urls[0] if image_urls else preview_image
                )
                car["auction_sheet_url"] = (
                    details.get("auction_sheet_url") if enrich_details else ""
                ) or car.get("auction_sheet_url", "")

                calculation = run_total_calculation(
                    CalculationContext(
                        price_jpy=calculation_price_jpy,
                        engine_volume=engine_cc,
                        horsepower=horsepower,
                        age_category=age_cat,
                        duty_rate=duty_rate,
                        buy_rate=commercial_rate,
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
                car["engine_cc"] = str(engine_cc)
                car["horsepower"] = horsepower

                car["price_details"] = {
                    "car_price_rub": float(calculation.auction_rub),
                    "car_price_jpy": calculation_price_jpy,
                    "lot_price_jpy": lot_price_jpy,
                    "average_price_jpy": average_price_jpy,
                    "buy_and_delivery_rub": float(calculation.japan_expenses_rub),
                    "buy_and_delivery_jpy": calculation.japan_expenses_jpy,
                    "customs_broker_rub": float(calculation.customs_broker_rub),
                    "customs_duty_rub": float(calculation.customs_duty_rub),
                    "customs_processing_fee_rub": float(
                        calculation.customs_processing_fee_rub
                    ),
                    "excise_rub": float(calculation.excise_rub),
                    "util_fee_rub": float(calculation.util_fee_rub),
                    "company_commission": 0,
                    "exchange_rate": commercial_rate,
                    "rate_source": "ATB Bank",
                    "bank_buy_rate": atb_rates["buy"],
                    "bank_sell_rate": sell_rate,
                    "duty_exchange_rate": duty_rate,
                    "duty_rate_source": "CBR",
                    "rate_date": datetime.now().strftime("%d.%m.%Y"),
                    "usage_type": calculation.effective_usage_type,
                    "user_type": calculation.effective_user_type,
                    "forced_commercial": calculation.forced_commercial,
                    "total_rub": float(calculation.total_rub),
                }
                car["brand"] = car.get("brand") or brand_name
                car["model"] = car.get("model") or requested_model_name or model_name
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
        *(enrich_car(car, duty_rate, commercial_rate, sell_rate, eur_rate) for car in cars),
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
        "pagination": pagination.model_dump(),
        "exchange_rate": commercial_rate,
        "rate_source": "ATB Bank",
        "duty_exchange_rate": duty_rate,
        "duty_rate_source": "CBR",
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
        res_brand, res_models, _ = resolve_aleado_model_ids(brand, model)
        
        # If we were looking for models for a brand
        if brand and not model:
            target_brand = res_brand
            data = fetch_aleado_filters(target_brand)
        # If we were looking for bodies for a model
        elif model:
            target_brand = res_brand
            target_models = res_models or [_clean_aleado_identifier(model)]
            if model and not res_models:
                return {"status": "success", "results": []}
            if len(target_models) <= 1:
                data = fetch_aleado_filters(target_brand, target_models[0] if target_models else None)
            else:
                merged_bodies: list[dict] = []
                seen_keys: set[str] = set()
                for target_model in target_models:
                    for item in fetch_aleado_filters(target_brand, target_model):
                        key = _normalize_token(
                            str(item.get("id") or item.get("name") or item.get("label") or "")
                        )
                        if not key or key in seen_keys:
                            continue
                        seen_keys.add(key)
                        merged_bodies.append(item)
                data = merged_bodies
        else:
            data = fetch_aleado_filters()
        return {"status": "success", "results": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/v1/calculate", response_model=CalculationResponse)
async def calculate_total(request: CalculationRequest) -> CalculationResponse:
    print(f"DEBUG: Received request: {request}")
    atb_rates = fetch_atb_jpy_rate()
    commercial_rate = atb_rates["buy"]
    sell_rate = atb_rates["sell"]
    duty_rate = get_cbr_jpy_rate()
    calculation = run_total_calculation(
        CalculationContext(
            price_jpy=request.price_jpy,
            engine_volume=request.engine_cc,
            horsepower=request.power_hp,
            age_category=request.age_category,
            duty_rate=duty_rate,
            buy_rate=commercial_rate,
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
        exchange_rate=commercial_rate,
        bank_buy_rate=atb_rates["buy"],
        bank_sell_rate=sell_rate,
        duty_exchange_rate=duty_rate,
        duty_rate_source="CBR",
        rate_date=datetime.now().strftime("%d.%m.%Y"),
        breakdown=CostBreakdown(
            buy_and_delivery_rub=float(calculation.japan_expenses_rub),
            buy_and_delivery_jpy=calculation.japan_expenses_jpy,
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
    page: int = Query(1, description="Recent lots page number"),
    limit: int = Query(12, description="Recent lots page size"),
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
    filters_str = (
        f"mil_{min_mileage_km}-{max_mileage_km}"
        f"yr_{min_year}-{max_year}"
        f"grade_{min_grade}-{max_grade}"
        f"_body_{body}"
        f"_page_{page}_limit_{limit}"
    )
    cache_key = f"{brand}::{model}::{filters_str}"

    cached = _STATS_CACHE.get(cache_key)
    if cached and time.time() - cached["ts"] < 3600:
        payload = cached["data"]
        payload["cached"] = True
        return AuctionStatsResponse(**payload)

    # ── Resolve human-readable names ──────────────────────────────────────────
    resolved_brand, resolved_models, _ = resolve_aleado_model_ids(brand, model)
    resolved_model = resolved_models[0] if resolved_models else ""
    brand_name, resolved_model_name = resolve_aleado_names(resolved_brand, resolved_model)
    model_name = str(model or "").strip() or resolved_model_name
    if model and not resolved_models:
        atb_rates = fetch_atb_jpy_rate()
        commercial_rate = atb_rates["buy"]
        duty_rate = get_cbr_jpy_rate()
        empty_pagination = _build_pagination_info(
            0,
            page,
            limit,
            default_limit=12,
            max_limit=50,
        )
        empty_payload: dict = {
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
            "recent_lots_pagination": empty_pagination.model_dump(),
            "exchange_rate": commercial_rate,
            "duty_exchange_rate": duty_rate,
            "duty_rate_source": "CBR",
            "cached": False,
            "rate_date": datetime.now().strftime("%d.%m.%Y"),
        }
        _STATS_CACHE[cache_key] = {"data": empty_payload, "ts": time.time()}
        return AuctionStatsResponse(**empty_payload)

    # ── Fetch raw lots ────────────────────────────────────────────────────────
    atb_rates = fetch_atb_jpy_rate()
    commercial_rate = atb_rates["buy"]
    duty_rate = get_cbr_jpy_rate()

    try:
        cars = await _fetch_aleado_data_for_models(
            resolved_brand,
            resolved_models,
            search_type="stats",
            body=str(body or ""),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not cars:
        print(
            f"DEBUG: Stats search returned 0 rows for {resolved_brand}/{resolved_models or ['ALL']}. "
            "Retrying with live search fallback."
        )
        try:
            cars = await _fetch_aleado_data_for_models(
                resolved_brand,
                resolved_models,
                search_type="max",
                body="",
            )
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
    cars = [c for c in cars if _is_completed_auction_date(c.get("auction_date"))]

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
        cars = [
            c
            for c in cars
            if _matches_body_filter(
                body,
                str(c.get("body") or ""),
                str(c.get("model_code") or ""),
                str(c.get("modification") or ""),
            )
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
            "recent_lots_pagination": _build_pagination_info(
                0,
                page,
                limit,
                default_limit=12,
                max_limit=50,
            ).model_dump(),
            "exchange_rate": commercial_rate,
            "duty_exchange_rate": duty_rate,
            "duty_rate_source": "CBR",
            "cached": False,
            "rate_date": datetime.now().strftime("%d.%m.%Y"),
        }
        _STATS_CACHE[cache_key] = {"data": empty, "ts": time.time()}
        return AuctionStatsResponse(**empty)

    # ── Aggregate stats ───────────────────────────────────────────────────────
    # Use same calculator math as search_and_calculate to compute real RUB totals
    price_lookup_semaphore = asyncio.Semaphore(10)

    async def _build_price_snapshot(car: dict) -> dict:
        async with price_lookup_semaphore:
            lot_price_jpy = _to_int_price(car.get("price_jpy", 0))
            average_price_jpy = await asyncio.to_thread(_resolve_average_price_jpy, car)
            calculation_price_jpy = average_price_jpy or lot_price_jpy
            return {
                "car": car,
                "lot_price_jpy": lot_price_jpy,
                "average_price_jpy": average_price_jpy,
                "calculation_price_jpy": calculation_price_jpy,
            }

    priced_snapshots = await asyncio.gather(
        *(_build_price_snapshot(car) for car in priced)
    )

    total_rub_list: list[float] = []
    total_rub_by_lot: dict[str, float] = {}
    calculation_price_by_lot: dict[str, int] = {}
    prices_jpy = []
    for snapshot in priced_snapshots:
        c = snapshot["car"]
        calculation_price_jpy = snapshot["calculation_price_jpy"]
        prices_jpy.append(calculation_price_jpy)
        engine_cc = int(c.get("engine_cc") or 1500)
        hp = _resolve_car_horsepower(c)

        current_year = date.today().year
        car_year = int(c["year"]) if str(c.get("year")).isdigit() else current_year - 4
        age = current_year - car_year
        age_cat = get_age_category_from_years(age)

        calculation = run_total_calculation(
            CalculationContext(
                price_jpy=calculation_price_jpy,
                engine_volume=engine_cc,
                horsepower=hp,
                age_category=age_cat,
                duty_rate=duty_rate,
                buy_rate=commercial_rate,
                eur_rate=get_euro_rate(),
                usage_type="private",
                user_type="individual",
                engine_type=str(c.get("engine_type") or "gasoline"),
                year=current_year,
            )
        )
        calculated_total_rub = float(calculation.total_rub)
        total_rub_list.append(calculated_total_rub)
        lot_identity = _build_lot_identity(c)
        total_rub_by_lot[lot_identity] = calculated_total_rub
        calculation_price_by_lot[lot_identity] = calculation_price_jpy

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

    sorted_cars = sorted(priced, key=_sort_key, reverse=True)
    paged_recent_cars, recent_lots_pagination = _paginate_items(
        sorted_cars,
        page,
        limit,
        default_limit=12,
        max_limit=50,
    )

    async def _fetch_recent_lot_detail_snapshot(car: dict) -> tuple[dict, dict]:
        detail_link = str(car.get("detail_link") or "").strip()
        if not detail_link:
            return car, {}

        try:
            details = await asyncio.to_thread(fetch_aleado_lot_details, detail_link)
            return car, details or {}
        except Exception as exc:
            print(f"DEBUG: Failed to enrich recent stats lot {car.get('lot')}: {exc}")
            return car, {}

    recent_car_details = await asyncio.gather(
        *(_fetch_recent_lot_detail_snapshot(car) for car in paged_recent_cars)
    )

    recent_lots = []
    for c, details in recent_car_details:
        detail_engine_cc = int(_safe_number(details.get("engine_cc") or 0))
        detail_hp = int(_safe_number(details.get("horsepower") or 0))
        resolved_engine_cc = detail_engine_cc or int(_safe_number(c.get("engine_cc") or 0))
        resolved_horsepower = _resolve_car_horsepower(
            {**c, "engine_cc": str(resolved_engine_cc)}, detail_hp
        )

        recent_lots.append(
            RecentLot(
                lot=str(c.get("lot") or ""),
                brand=str(c.get("brand") or brand_name),
                model=str(c.get("model") or model_name),
                year=str(c.get("year") or ""),
                engine_cc=str(resolved_engine_cc or c.get("engine_cc") or ""),
                horsepower=resolved_horsepower,
                mileage=str(c.get("mileage") or ""),
                grade=str(c.get("grade") or c.get("rating") or ""),
                price_jpy=calculation_price_by_lot.get(
                    _build_lot_identity(c),
                    _to_int_price(c.get("price_jpy", 0)),
                ),
                price_rub=round(
                    total_rub_by_lot.get(
                        _build_lot_identity(c),
                        _to_int_price(c.get("price_jpy", 0)) * commercial_rate,
                    ),
                    2,
                ),
                total_rub=round(
                    total_rub_by_lot.get(
                        _build_lot_identity(c),
                        _to_int_price(c.get("price_jpy", 0)) * commercial_rate,
                    ),
                    2,
                ),
                image_url=str(c.get("image_url") or ""),
                auction_date=str(c.get("auction_date") or ""),
                color=str(c.get("color") or ""),
                transmission=str(c.get("transmission") or ""),
                body=str(c.get("body") or ""),
                sale_status=str(c.get("sale_status") or ""),
            )
        )

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
        "recent_lots": [lot.model_dump() for lot in recent_lots],
        "recent_lots_pagination": recent_lots_pagination.model_dump(),
        "exchange_rate": commercial_rate,
        "duty_exchange_rate": duty_rate,
        "duty_rate_source": "CBR",
        "cached": False,
        "rate_date": datetime.now().strftime("%d.%m.%Y"),
    }

    _STATS_CACHE[cache_key] = {"data": payload_dict, "ts": time.time()}
    return AuctionStatsResponse(**payload_dict)
