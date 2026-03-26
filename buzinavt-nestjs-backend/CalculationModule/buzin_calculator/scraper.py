import asyncio
import contextlib
from datetime import datetime, timedelta
import os
import re
import time
from typing import Any
from urllib.parse import parse_qsl, urlparse

from decimal import Decimal, ROUND_HALF_UP
import httpx
from bs4 import BeautifulSoup
from calculator_core import _as_decimal, quantize_money, ZERO, MONEY_Q

_EUR_CACHE = {"rate": 105.0, "timestamp": 0.0}
_ATB_CACHE = {"buy": 0.502, "sell": 0.55, "timestamp": 0.0}
_ALEADO_SESSION_CACHE = {"cookies": None, "timestamp": 0.0}
_FILTER_CACHE: dict[str, dict[str, Any]] = {}
_AVERAGE_PRICE_CACHE: dict[str, dict[str, Any]] = {}
_LOT_DETAILS_CACHE: dict[str, dict[str, Any]] = {}
_MODIFICATIONS_CACHE: dict[str, dict[str, Any]] = {}

ALEADO_BASE_URL = "https://auctions.aleado.ru"
ALEADO_LOGIN_URL = f"{ALEADO_BASE_URL}/auth/login.php"
ATB_URL = "https://www.atb.su/services/exchange/"
CBR_EUR_URL = "https://www.cbr-xml-daily.ru/daily_json.js"

ALEADO_USERNAME = os.getenv("ALEADO_USERNAME", "106943767")
ALEADO_PASSWORD = os.getenv("ALEADO_PASSWORD", "Anuar1234")

ALEADO_SESSION_TTL_SECONDS = 30 * 60
FILTER_CACHE_TTL_SECONDS = 30 * 60
AVERAGE_PRICE_CACHE_TTL_SECONDS = 30 * 60
LOT_DETAILS_CACHE_TTL_SECONDS = 24 * 3600  # Increase to 24h
MODIFICATIONS_CACHE_TTL_SECONDS = 24 * 3600
ALEADO_RESULTS_PAGE_SIZE = 100
ALEADO_MAX_RESULT_PAGES = 5

ALEADO_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Referer": ALEADO_BASE_URL,
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/136.0.0.0 Safari/537.36"
    ),
}


def _normalize(text: str) -> str:
    return re.sub(r"[^0-9a-zа-яё]+", "", (text or "").lower())


def _absolute_aleado_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith(("http://", "https://")):
        return url
    if url.startswith("/"):
        return f"{ALEADO_BASE_URL}{url}"
    return f"{ALEADO_BASE_URL}/{url.lstrip('/')}"


def _is_login_page(text: str, url: str = "") -> bool:
    lowered = (text or "").lower()
    return (
        "auth/login.php" in (url or "")
        or ('name="username"' in lowered and 'name="password"' in lowered)
        or ("для входа в систему" in lowered and "password" in lowered)
    )


def _is_guest_page(text: str, url: str = "") -> bool:
    lowered = (text or "").lower()
    return _is_login_page(text, url) or (
        "выход" not in lowered
        and "для доступа к разделам сайта" in lowered
        and "регистрация" in lowered
    )


def _is_authenticated_page(text: str) -> bool:
    lowered = (text or "").lower()
    return "выход" in lowered and "для доступа к разделам сайта" not in lowered


def _get_cached_filters(cache_key: str) -> list[dict[str, str]] | None:
    cached = _FILTER_CACHE.get(cache_key)
    if not cached:
        return None
    if time.time() - cached["timestamp"] >= FILTER_CACHE_TTL_SECONDS:
        return None
    return cached["data"]


def _set_cached_filters(cache_key: str, data: list[dict[str, str]]) -> None:
    _FILTER_CACHE[cache_key] = {"data": data, "timestamp": time.time()}


def _get_cached_average_price(cache_key: str) -> int | None:
    cached = _AVERAGE_PRICE_CACHE.get(cache_key)
    if not cached:
        return None
    if time.time() - cached["timestamp"] >= AVERAGE_PRICE_CACHE_TTL_SECONDS:
        return None
    return int(cached["data"])


def _set_cached_average_price(cache_key: str, data: int) -> None:
    _AVERAGE_PRICE_CACHE[cache_key] = {"data": int(data), "timestamp": time.time()}


def _get_cached_payload(
    cache: dict[str, dict[str, Any]],
    cache_key: str,
    ttl_seconds: int,
) -> Any | None:
    cached = cache.get(cache_key)
    if not cached:
        return None
    if time.time() - cached["timestamp"] >= ttl_seconds:
        return None
    return cached["data"]


def _set_cached_payload(
    cache: dict[str, dict[str, Any]],
    cache_key: str,
    data: Any,
) -> None:
    cache[cache_key] = {"data": data, "timestamp": time.time()}


# Single persistent client for connection pooling
_ALEADO_CLIENT = httpx.Client(headers=ALEADO_HEADERS, follow_redirects=True, timeout=30.0)


def _build_aleado_client() -> httpx.Client:
    """Return the shared Aleado client with current session cookies."""
    cached_cookies = _ALEADO_SESSION_CACHE.get("cookies")
    if cached_cookies and (time.time() - _ALEADO_SESSION_CACHE["timestamp"] < ALEADO_SESSION_TTL_SECONDS):
        _ALEADO_CLIENT.cookies.update(cached_cookies)
    return _ALEADO_CLIENT


@contextlib.contextmanager
def _aleado_session_context():
    """Dummy context manager to maintain compatibility with existing 'with' usage."""
    yield _build_aleado_client()


def _flatten_client_cookies(client: httpx.Client) -> dict[str, str]:
    flat: dict[str, str] = {}
    for cookie in client.cookies.jar:
        flat[cookie.name] = cookie.value
    return flat


def _cache_aleado_session(client: httpx.Client) -> None:
    _ALEADO_SESSION_CACHE["cookies"] = _flatten_client_cookies(client)
    _ALEADO_SESSION_CACHE["timestamp"] = time.time()


def _extract_form_inputs(form) -> dict[str, str]:
    payload: dict[str, str] = {}
    if not form:
        return payload
    for item in form.select("input[name]"):
        name = (item.get("name") or "").strip()
        value = (item.get("value") or "").strip()
        if name:
            payload[name] = value
    return payload


def _login_aleado(client: httpx.Client) -> None:
    if not ALEADO_USERNAME or not ALEADO_PASSWORD:
        raise RuntimeError("Aleado credentials are not configured")

    login_page = client.get(ALEADO_LOGIN_URL)
    login_page.raise_for_status()

    soup = BeautifulSoup(login_page.text, "html.parser")
    form = soup.find("form")
    payload = _extract_form_inputs(form)
    payload.update(
        {
            "username": ALEADO_USERNAME,
            "password": ALEADO_PASSWORD,
        }
    )
    payload.setdefault("Submit", "Вход")

    action_url = _absolute_aleado_url(form.get("action") if form else ALEADO_LOGIN_URL)
    response = client.post(
        action_url,
        data=payload,
        headers={"Referer": str(login_page.url), **ALEADO_HEADERS},
    )
    response.raise_for_status()

    probe = client.get(
        f"{ALEADO_BASE_URL}/auctions/",
        params={"p": "project/searchform", "searchtype": "max", "s": "", "ld": ""},
    )
    probe.raise_for_status()

    if _is_guest_page(probe.text, str(probe.url)) or not _is_authenticated_page(probe.text):
        raise RuntimeError("Aleado login failed: guest page returned after authentication")

    _cache_aleado_session(client)


def _ensure_aleado_session(client: httpx.Client) -> None:
    cached_cookies = _ALEADO_SESSION_CACHE.get("cookies")
    if cached_cookies and time.time() - _ALEADO_SESSION_CACHE["timestamp"] < ALEADO_SESSION_TTL_SECONDS:
        client.cookies.update(cached_cookies)
        return
    _login_aleado(client)


def _fetch_aleado_page(
    path: str,
    params: dict[str, Any] | list[tuple[str, Any]] | None = None,
    *,
    method: str = "GET",
    data: dict[str, Any] | list[tuple[str, Any]] | None = None,
) -> httpx.Response:
    with _aleado_session_context() as client:
        _ensure_aleado_session(client)

        if method.upper() == "POST":
            response = client.post(_absolute_aleado_url(path), params=params, data=data)
        else:
            response = client.get(_absolute_aleado_url(path), params=params)
        if response.status_code in {401, 403} or _is_guest_page(response.text, str(response.url)):
            _login_aleado(client)
            if method.upper() == "POST":
                response = client.post(_absolute_aleado_url(path), params=params, data=data)
            else:
                if search_type == "stats":
                    response = client.post(
                        _absolute_aleado_url(path),
                        data=_build_stats_search_payload(brand_id, model_id),
                    )
                else:
                    response = client.get(_absolute_aleado_url(path), params=params)

        response.raise_for_status()
        if _is_guest_page(response.text, str(response.url)):
            raise RuntimeError("Aleado returned guest page instead of authenticated content")

        _cache_aleado_session(client)
        return response


def get_euro_rate() -> float:
    current_time = time.time()
    if current_time - _EUR_CACHE["timestamp"] < 3600:
        return float(_EUR_CACHE["rate"])

    try:
        response = httpx.get(CBR_EUR_URL, timeout=5.0)
        response.raise_for_status()
        rate = float(response.json()["Valute"]["EUR"]["Value"])
        _EUR_CACHE["rate"] = rate
        _EUR_CACHE["timestamp"] = current_time
        return rate
    except Exception as exc:
        print(f"CBR EUR fetch failed: {exc}")
        return float(_EUR_CACHE["rate"])


def fetch_atb_jpy_rate() -> dict[str, float]:
    current_time = time.time()
    if current_time - _ATB_CACHE["timestamp"] < 1800:
        return {"buy": float(_ATB_CACHE["buy"]), "sell": float(_ATB_CACHE["sell"])}

    try:
        response = httpx.get(ATB_URL, timeout=10.0, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        candidates: list[tuple[float, float]] = []

        for row in soup.select("div.currency-table__tr"):
            code_tag = row.select_one("div.currency-table__val")
            if not code_tag or code_tag.get_text(" ", strip=True).upper() != "JPY":
                continue

            # label = row.select_one("span.currency-table__label")
            # label_text = label.get_text(" ", strip=True) if label else ""
            # denominator = 100.0 if "100" in label_text else 1.0

            values: dict[str, float] = {}
            for cell in row.select("div.currency-table__td"):
                head = cell.select_one("div.currency-table__head")
                if not head:
                    continue
                head_text = head.get_text(" ", strip=True).lower()
                raw_text = cell.get_text(" ", strip=True)
                value_text = raw_text.replace(head.get_text(" ", strip=True), "", 1).strip()
                match = re.search(r"(\d[\d\s]*[.,]?\d*)", value_text)
                if not match:
                    continue
                # Clean up spaces and check length
                val_str = match.group(1).replace(" ", "").replace(",", ".")
                # Sanity check: Price/ID shouldn't be excessively long. Max 15 digits is plenty.
                if len(val_str.split('.')[0]) > 15:
                    continue
                values[head_text] = float(val_str)

            buy = values.get("покупка")
            sell = values.get("продажа")
            if buy is None or sell is None:
                continue

            if buy > 5.0:
                normalized_buy = buy / 100.0
                normalized_sell = sell / 100.0
            else:
                normalized_buy = buy
                normalized_sell = sell
            print(f"DEBUG: Found JPY candidate - Raw: Buy={buy}, Sell={sell} | Normalized: Buy={normalized_buy}, Sell={normalized_sell}")
            candidates.append((normalized_buy, normalized_sell))

        if candidates:
            print(f"DEBUG: All JPY candidates: {candidates}")
            # Просто берем первый найденный курс на странице, 
            # обычно это тот, что в главной таблице
            buy, sell = candidates[0]
            print(f"DEBUG: Selected JPY rate (first candidate): Buy={buy}, Sell={sell}")
            _ATB_CACHE.update({"buy": buy, "sell": sell, "timestamp": current_time})
            return {"buy": buy, "sell": sell}

        text = soup.get_text(" ", strip=True)

        numbers = [float(num.replace(",", ".")) for num in re.findall(r"\d+[.,]\d+", text)]
        if len(numbers) >= 2:
            buy, sell = numbers[0], numbers[1]
            _ATB_CACHE.update({"buy": buy, "sell": sell, "timestamp": current_time})
            return {"buy": buy, "sell": sell}
    except Exception as exc:
        print(f"ATB rate fetch failed: {exc}")

    return {"buy": float(_ATB_CACHE["buy"]), "sell": float(_ATB_CACHE["sell"])}


def calculate_private_util_fee(age_category: str) -> int:
    normalized = (age_category or "").strip().lower()
    if normalized in {"0-3", "0_3", "under3", "<3", "new"}:
        return 3400
    return 5200


def calculate_util_fee(engine_cc: int, age_years: int, is_commercial: bool = True) -> int:
    if not is_commercial and engine_cc <= 3000:
        return 3400 if age_years < 3 else 5200

    is_used = age_years >= 3
    if engine_cc <= 1000:
        return 313400 if is_used else 150200
    if engine_cc <= 2000:
        return 1622400 if is_used else 1100000
    if engine_cc <= 3000:
        return 3400000 if is_used else 2203000
    if engine_cc <= 3500:
        return 4200000 if is_used else 2700000
    return 4800000 if is_used else 3000000


def get_age_category_from_years(age: int) -> str:
    if age < 3:
        return "0-3"
    if age < 5:
        return "3-5"
    if age < 7:
        return "5-7"
    return "7+"


def calculate_customs_phys_person(
    price_jpy: int,
    engine_cc: int,
    age_category: str,
    rate_jpy_rub: float,
) -> dict[str, Any]:
    eur_rate = get_euro_rate()
    age = (age_category or "").strip().lower()

    if age in {"7+", "7", ">7", "old"}:
        if engine_cc <= 1000:
            coef = 3.0
        elif engine_cc <= 1500:
            coef = 3.2
        elif engine_cc <= 1800:
            coef = 3.5
        elif engine_cc <= 2300:
            coef = 4.8
        elif engine_cc <= 3000:
            coef = 5.0
        else:
            coef = 5.7
    else:
        if engine_cc <= 1000:
            coef = 1.5
        elif engine_cc <= 1500:
            coef = 1.7
        elif engine_cc <= 1800:
            coef = 2.5
        elif engine_cc <= 2300:
            coef = 2.7
        elif engine_cc <= 3000:
            coef = 3.0
        else:
            coef = 3.6

    duty_rub = engine_cc * coef * eur_rate
    processing_fee = 2462
    util_fee = calculate_private_util_fee(age_category)

    return {
        "clearance": int(duty_rub + processing_fee),
        "utilization": util_fee,
        "processing_fee": processing_fee,
        "eur_rate": eur_rate,
        "coef": coef,
    }


async def fetch_tks_customs_async(
    price_jpy: int,
    engine_cc: int,
    power_hp: int,
    age: str,
    sell_rate: float,
) -> dict[str, Any]:
    return await asyncio.to_thread(calculate_customs_phys_person, price_jpy, engine_cc, age, sell_rate)


def _fallback_body_options_from_live_search(
    brand_id: str | None,
    model_id: str | None,
) -> list[dict[str, str]]:
    if not brand_id or not model_id or model_id == "-1":
        return []

    try:
        cars = fetch_aleado_data(str(brand_id), str(model_id), search_type="max")
        options: list[dict[str, str]] = []
        seen: set[str] = set()

        for car in cars:
            body = str(car.get("body") or "").strip()
            normalized = _normalize(body)
            if not body or body.startswith("---") or not normalized or normalized in seen:
                continue

            seen.add(normalized)
            options.append({"id": body, "name": body})

        return options
    except Exception as exc:
        print(f"DEBUG: Live-search body fallback failed: {exc}")
        return []


def fetch_aleado_filters(
    brand_id: str | None = None, model_id: str | None = None
) -> list[dict[str, str]]:
    """Fetch brands, models, or body types from Aleado via Sajax where possible."""
    if model_id and model_id != "-1":
        cache_key = f"filters:bodies:{brand_id}:{model_id}"
    else:
        cache_key = f"filters:{brand_id or 'brands'}"

    cached = _get_cached_filters(cache_key)
    if cached is not None:
        return cached

    try:
        options: list[dict[str, str]] = []
        seen: set[tuple[str, str]] = set()

        if model_id and model_id != "-1":
            fallback_bodies = _fallback_body_options_from_live_search(brand_id, model_id)
            if fallback_bodies:
                _set_cached_filters(cache_key, fallback_bodies)
                return fallback_bodies

            # Use Sajax to load body types/modifications
            bodies_html = call_aleado_sajax(
                "loadModelsType",
                [brand_id, model_id],
                path="/stats/",
                base_params={"p": "project/findlots"},
            )
            if not bodies_html:
                fallback_bodies = _fallback_body_options_from_live_search(brand_id, model_id)
                if fallback_bodies:
                    _set_cached_filters(cache_key, fallback_bodies)
                return fallback_bodies

            soup = BeautifulSoup(bodies_html, "html.parser")
            for item in soup.find_all("option"):
                value = (item.get("value") or "").strip().strip('"').strip("'")
                text = item.get_text(" ", strip=True)
                if not value or value == "-1" or not text or text.startswith("---"):
                    continue
                key = (value, text)
                if key in seen:
                    continue
                seen.add(key)
                options.append({"id": value, "name": text})

            if not options:
                fallback_bodies = _fallback_body_options_from_live_search(brand_id, model_id)
                if fallback_bodies:
                    _set_cached_filters(cache_key, fallback_bodies)
                return fallback_bodies

        elif brand_id:
            # Use Sajax to load models snippet directly.
            models_html = call_aleado_sajax(
                "loadModels",
                [brand_id, "-1"],
                path="/stats/",
                base_params={"p": "project/findlots"},
            )
            if not models_html:
                return []

            soup = BeautifulSoup(models_html, "html.parser")
            options.append({"id": "-1", "name": "---Все модели---"})

            for item in soup.find_all("option"):
                value = (item.get("value") or "").strip().strip('"').strip("'")
                text = item.get_text(" ", strip=True)
                if not value or value == "-1" or not text or text.startswith("---"):
                    continue

                clean_text = re.sub(r"\s*\(\d+\)\s*$", "", text).strip()
                key = (value, clean_text)
                if key in seen:
                    continue
                seen.add(key)
                options.append({"id": value, "name": clean_text})
        else:
            response = _fetch_aleado_page(
                "/auctions/",
                params={"p": "project/searchform", "searchtype": "max", "s": "", "ld": ""},
            )
            soup = BeautifulSoup(response.text, "html.parser")
            select = soup.find("select", attrs={"name": "mrk"})
            if select:
                for option in select.find_all("option"):
                    value = (option.get("value") or "").strip().strip('"').strip("'")
                    text = option.get_text(" ", strip=True)
                    if not value or value == "-1" or not text or text.startswith("---"):
                        continue
                    key = (value, text)
                    if key in seen:
                        continue
                    seen.add(key)
                    options.append({"id": value, "name": text})

        if options:
            _set_cached_filters(cache_key, options)
            return options
    except Exception as exc:
        print(f"DEBUG: Aleado filters fetch failed: {exc}")

    if model_id and model_id != "-1":
        fallback_bodies = _fallback_body_options_from_live_search(brand_id, model_id)
        if fallback_bodies:
            _set_cached_filters(cache_key, fallback_bodies)
        return fallback_bodies

    fallback = (
        [
            {"id": "-1", "name": "---Все модели---"},
            {"id": "2236", "name": "N BOX"},
            {"id": "109", "name": "FIT"},
            {"id": "71", "name": "STEPWGN"},
        ]
        if brand_id
        else [
            {"id": "9", "name": "Toyota"},
            {"id": "2", "name": "Honda"},
            {"id": "11", "name": "Nissan"},
            {"id": "6", "name": "Mazda"},
            {"id": "8", "name": "Subaru"},
        ]
    )
    _set_cached_filters(cache_key, fallback)
    return fallback


def _extract_first_number(text: str) -> int:
    digits = re.sub(r"[^0-9]", "", text or "")
    return int(digits) if digits else 0


def _contains_no_results_marker(text: str) -> bool:
    normalized = " ".join(str(text or "").split()).lower()
    markers = (
        "всего найдено лотов: 0",
        "всего найдено лотов 0",
        "found lots: 0",
        "total lots found: 0",
    )
    return any(marker in normalized for marker in markers)


def _find_lot_candidate_rows(soup: BeautifulSoup) -> list[Any]:
    candidates: list[Any] = []

    for row in soup.find_all("tr"):
        if row.find("a", href=re.compile(r"project/(lot|statslot)", re.IGNORECASE)):
            candidates.append(row)
            continue

        if row.find("input", attrs={"name": re.compile(r"priceLot[ES]\d+", re.IGNORECASE)}):
            candidates.append(row)
            continue

        if row.find("img", attrs={"name": re.compile(r"img_preview", re.IGNORECASE)}):
            candidates.append(row)
            continue

        cells = row.find_all("td")
        if len(cells) >= 18:
            lot_text = cells[1].get_text(" ", strip=True) if len(cells) > 1 else ""
            if re.fullmatch(r"\d+", re.sub(r"\s+", "", lot_text)):
                candidates.append(row)

    return candidates


def _parse_thousand_yen_price(raw_value: str) -> int:
    text = (raw_value or "").strip().replace(" ", "").replace(",", ".")
    if not text or not re.search(r"\d", text):
        return 0

    try:
        return int(float(text) * 1000)
    except ValueError:
        return 0


def _matches_normalized_body_filter(body_filter: str, *candidates: str) -> bool:
    normalized_filter = _normalize(body_filter)
    if not normalized_filter:
        return True

    for candidate in candidates:
        normalized_candidate = _normalize(candidate)
        if not normalized_candidate:
            continue
        if (
            normalized_candidate == normalized_filter
            or normalized_candidate in normalized_filter
            or normalized_filter in normalized_candidate
        ):
            return True

    return False


def _parse_price_jpy(soup: BeautifulSoup, row, cols: list[str] | None = None) -> int:
    row_index_match = re.search(r"cell_(\d+)", row.get("id", "") or "")
    row_index = row_index_match.group(1) if row_index_match else ""

    for selector in (
        {"name": re.compile(rf"priceLotE{row_index or r'\d+'}")},
        {"name": re.compile(rf"priceLotS{row_index or r'\d+'}")},
    ):
        input_tag = row.find("input", attrs=selector)
        if input_tag:
            raw_value = (input_tag.get("value", "") or "").strip().replace(" ", "").replace(",", ".")
            if raw_value and re.search(r"\d", raw_value):
                try:
                    return int(float(raw_value) * 1000)
                except ValueError:
                    pass

    if cols and len(cols) >= 3:
        for raw_value in (cols[-2], cols[-3]):
            parsed_price = _parse_thousand_yen_price(raw_value)
            if parsed_price > 0:
                return parsed_price

    if not row_index:
        return 0

    raw_price = ""
    end_price = soup.find(id=f"priceLotE{row_index}")
    start_price = soup.find(id=f"priceLotS{row_index}")

    if end_price and end_price.get_text(strip=True):
        raw_price = end_price.get_text(strip=True)
    elif start_price and start_price.get_text(strip=True):
        raw_price = start_price.get_text(strip=True)

    return _parse_thousand_yen_price(raw_price)


def _build_stats_search_payload(
    brand_id: str,
    model_id: str = "",
    *,
    page: int = 1,
    page_size: int = ALEADO_RESULTS_PAGE_SIZE,
) -> dict[str, str]:
    today = datetime.utcnow() + timedelta(hours=9)
    start_date = today - timedelta(days=90)
    payload = {
        "p": "project/findlots",
        "result": "0",
        "vs": str(page_size),
        "pg": str(max(1, page)),
        "mrk": brand_id,
        "sday": start_date.strftime("%d"),
        "smonth": start_date.strftime("%m"),
        "syear": start_date.strftime("%Y"),
        "fday": today.strftime("%d"),
        "fmonth": today.strftime("%m"),
        "fyear": today.strftime("%Y"),
        "year1": "",
        "year2": "",
        "v1": "",
        "v2": "",
        "transmission": "",
        "rollback_data": "",
    }
    if model_id and model_id != "-1":
        payload["mdl"] = model_id
    return payload


def _extract_total_result_rows(soup: BeautifulSoup) -> int:
    rows_input = soup.find("input", attrs={"name": "rows"})
    if rows_input:
        return _extract_first_number(str(rows_input.get("value") or ""))

    text = soup.get_text(" ", strip=True)
    match = re.search(r"Всего найдено лотов:\s*([0-9 ]+)", text, re.IGNORECASE)
    if match:
        return _extract_first_number(match.group(1))
    return 0


def _extract_average_price_args(page_html: str) -> list[str]:
    call_match = re.search(
        r"loadPhoto\(\);\s*getAveragePrice\((.*?)\);",
        page_html,
        re.S,
    )
    if not call_match:
        matches = re.findall(r"getAveragePrice\((.*?)\);", page_html, re.S)
        if not matches:
            return []
        raw_args = matches[-1]
    else:
        raw_args = call_match.group(1)

    args: list[str] = []
    for match in re.finditer(r"'((?:\\'|[^'])*)'|(-?\d+)", raw_args):
        quoted_value, numeric_value = match.groups()
        if quoted_value is not None:
            args.append(quoted_value.replace("\\'", "'"))
        elif numeric_value is not None:
            args.append(numeric_value)
    return args


def decode_sajax_result(response_text: str) -> str:
    """Decode Sajax response from Aleado.
    Handles both 'var res = ...' and '+:...' formats.
    """
    if not response_text:
        return ""

    text = response_text.strip()

    # Format 1: +: 'result' or -: 'error'
    if text.startswith(("+", "-")):
        status = text[0]
        # Skip the status and the colon if present
        data = text[2:].strip() if len(text) > 1 and text[1] == ":" else text[1:].strip()
        if status == "-":
            print(f"DEBUG: Aleado Sajax returned error: {data}")
            return ""

        # If it's a quoted string, unwrap it (basic version of JS eval)
        if (data.startswith("'") and data.endswith("'")) or (
            data.startswith('"') and data.endswith('"')
        ):
            try:
                content = data[1:-1]
                # Sajax escapes / as \/
                content = content.replace("\\/", "/")
                # For more complex cases, a proper JS string parser might be needed,
                # but this usually suffices for Aleado.
                return content.encode("utf-8").decode("unicode_escape")
            except Exception:
                return data[1:-1]
        return data

    # Format 2: var res = '...'; res;
    match = re.search(r"var res = '(.*)';\s*res;", response_text, re.S)
    if match:
        payload = match.group(1)
        return (
            payload.replace("\\n", "\n")
            .replace("\\t", "\t")
            .replace("\\/", "/")
            .replace('\\"', '"')
            .replace("\\'", "'")
        )

    return response_text


def call_aleado_sajax(
    func_name: str,
    args: list[Any],
    path: str = "/stats/",
    method: str = "GET",
    base_params: dict[str, str] | None = None,
) -> str:
    """Emulate Aleado's Sajax mechanism."""
    # Sajax expects arguments in a specific format in the query string or POST body:
    # rs=func_name&rsargs[]=arg1&rsargs[]=arg2...
    params = []
    if base_params:
        for k, v in base_params.items():
            params.append((k, v))

    params.extend(
        [
            ("rs", func_name),
            ("rst", ""),
            ("rsrnd", str(int(time.time() * 1000))),
        ]
    )

    for arg in args:
        params.append(("rsargs[]", str(arg)))

    with _aleado_session_context() as client:
        _ensure_aleado_session(client)

        url = _absolute_aleado_url(path)
        try:
            if method.upper() == "GET":
                response = client.get(url, params=params)
            else:
                response = client.post(url, data=params)

            if response.status_code in {401, 403} or _is_guest_page(
                response.text, str(response.url)
            ):
                _login_aleado(client)
                if method.upper() == "GET":
                    response = client.get(url, params=params)
                else:
                    response = client.post(url, data=params)

            response.raise_for_status()
            _cache_aleado_session(client)
            return decode_sajax_result(response.text)
        except Exception as exc:
            print(f"DEBUG: Aleado Sajax call {func_name} failed: {exc}")
            return ""


def _get_lot_cache_key(detail_link: str) -> str:
    if not detail_link:
        return ""

    parsed = urlparse(detail_link)
    lot_id = dict(parse_qsl(parsed.query)).get("id", "").strip()
    return lot_id or detail_link


def _extract_photo_urls_from_detail(detail_soup: BeautifulSoup) -> list[str]:
    image_urls: list[str] = []
    seen: set[str] = set()

    for anchor in detail_soup.select('a[href*="i.aleado.ru/pic/"][href*="system=auto"]'):
        href = (anchor.get("href") or "").strip()
        if not href:
            continue
        normalized_url = _absolute_aleado_url(href.split("&h=")[0])
        if normalized_url and normalized_url not in seen:
            seen.add(normalized_url)
            image_urls.append(normalized_url)

    if image_urls:
        return image_urls

    for image in detail_soup.select('img[load_src], img[src*="i.aleado.ru/pic/"]'):
        raw_url = (image.get("load_src") or image.get("src") or "").strip()
        if not raw_url:
            continue
        normalized_url = _absolute_aleado_url(raw_url.split("&h=")[0].split("?w=")[0])
        if normalized_url and normalized_url not in seen:
            seen.add(normalized_url)
            image_urls.append(normalized_url)

    return image_urls


def _extract_calc_src_from_detail(detail_soup: BeautifulSoup) -> str:
    calc_frame = detail_soup.find("iframe", attrs={"id": "calc_frame"})
    if not calc_frame:
        return ""
    return _absolute_aleado_url((calc_frame.get("src") or "").strip())


def _reorder_image_urls(image_urls: list[str], detail_soup: BeautifulSoup, auction_sheet_url: str | None = None) -> list[str]:
    """Reorder images so that front views come first, rear views second,
    then other views, and ensure the auction/sheet image is last.

    Uses simple keyword heuristics on URLs. Deduplicates while preserving
    the desired ordering."""
    if not image_urls:
        return []

    front_kw = ["front", "fr", "face", "facade", "перед", "前"]
    rear_kw = ["rear", "back", "rear_view", "зад", "后"]
    auction_kw = ["auction", "slot", "sheet", "lot", "project/slot", "auction_sheet"]

    seen: set[str] = set()
    front: list[str] = []
    rear: list[str] = []
    auction: list[str] = []
    others: list[str] = []

    # Build a mapping from normalized image URL -> descriptive text (alt/title/anchor)
    url_texts: dict[str, str] = {}
    if detail_soup:
        try:
            for img in detail_soup.find_all("img"):
                raw = (img.get("load_src") or img.get("src") or "").strip()
                if not raw:
                    continue
                norm = _absolute_aleado_url(raw.split("&h=")[0].split("?w=")[0])
                if not norm or norm not in image_urls:
                    continue
                parts: list[str] = []
                alt = (img.get("alt") or "").strip()
                if alt:
                    parts.append(alt)
                title = (img.get("title") or "").strip()
                if title:
                    parts.append(title)
                parent = img.parent
                if parent and getattr(parent, "name", None) == "a":
                    ptxt = (parent.get_text(" ", strip=True) or parent.get("href") or "").strip()
                    if ptxt:
                        parts.append(ptxt)
                if parts:
                    url_texts[norm] = " ".join(parts)

            for a in detail_soup.find_all("a", href=True):
                href = (a.get("href") or "").strip()
                norm = _absolute_aleado_url(href.split("&h=")[0].split("?w=")[0])
                if not norm or norm not in image_urls:
                    continue
                if norm in url_texts:
                    continue
                atxt = (a.get_text(" ", strip=True) or "").strip()
                if atxt:
                    url_texts[norm] = atxt
        except Exception:
            # Non-critical: if parsing fails, fallback to URL-only heuristics
            url_texts = {}

    def classify(url: str) -> None:
        low_url = (url or "").lower()
        low_text = (url_texts.get(url) or "").lower()

        # Prioritize textual hints from alt/title/anchor when available
        for kw in front_kw:
            if kw in low_text or kw in low_url:
                front.append(url)
                return
        for kw in rear_kw:
            if kw in low_text or kw in low_url:
                rear.append(url)
                return
        for kw in auction_kw:
            if kw in low_text or kw in low_url:
                auction.append(url)
                return
        others.append(url)

    for u in image_urls:
        if not u:
            continue
        if u in seen:
            continue
        seen.add(u)
        classify(u)

    ordered: list[str] = []
    for bucket in (front, rear, others, auction):
        for u in bucket:
            if u not in ordered:
                ordered.append(u)

    # If auction_sheet_url is provided and is not an image in the list,
    # append it at the end (user requested auction pic always last).
    if auction_sheet_url:
        norm_sheet = auction_sheet_url.strip()
        if norm_sheet and norm_sheet not in ordered:
            ordered.append(norm_sheet)

    return ordered


def _fetch_newcalc_modifications(model_id: str, year: str) -> list[dict[str, Any]]:
    if not model_id or not year:
        return []

    cache_key = f"{model_id}:{year}"
    cached = _get_cached_payload(_MODIFICATIONS_CACHE, cache_key, MODIFICATIONS_CACHE_TTL_SECONDS)
    if cached is not None:
        return cached

    try:
        modifications_html = call_aleado_sajax(
            "putModificationsList", [model_id, year], path="/newcalc"
        )
        if not modifications_html:
            _set_cached_payload(_MODIFICATIONS_CACHE, cache_key, [])
            return []

        soup = BeautifulSoup(modifications_html, "html.parser")
        modifications: list[dict[str, Any]] = []

        for row in soup.find_all("tr"):
            output_input = row.find("input", attrs={"id": re.compile(r"^output_\d+$")})
            if not output_input:
                continue

            row_id_match = re.search(r"output_(\d+)", output_input.get("id", "") or "")
            if not row_id_match:
                continue

            row_index = row_id_match.group(1)
            model_type_inputs = row.find_all(
                "input",
                attrs={"id": re.compile(rf"^model_type_{row_index}_\d+$")},
            )
            model_types = [
                str(input_tag.get("value") or "").strip().upper()
                for input_tag in model_type_inputs
                if str(input_tag.get("value") or "").strip()
            ]
            if not model_types:
                continue

            cells = row.find_all("td")
            grade = cells[0].get_text(" ", strip=True) if len(cells) > 0 else ""
            engine_code = cells[2].get_text(" ", strip=True) if len(cells) > 2 else ""
            displacement = _extract_first_number(
                str(
                    (
                        row.find("input", attrs={"id": f"displacement_{row_index}"}) or {}
                    ).get("value", "")
                )
            )
            horsepower = _extract_first_number(str(output_input.get("value") or ""))
            fuel_use = _extract_first_number(
                str(
                    (
                        row.find("input", attrs={"id": f"fuel_use_{row_index}"}) or {}
                    ).get("value", "")
                )
            )

            modifications.append(
                {
                    "model_types": model_types,
                    "grade": grade,
                    "engine_code": engine_code,
                    "displacement": displacement,
                    "horsepower": horsepower,
                    "fuel_use": fuel_use,
                }
            )

        _set_cached_payload(_MODIFICATIONS_CACHE, cache_key, modifications)
        return modifications
    except Exception as exc:
        print(f"DEBUG: Aleado modifications fetch failed: {exc}")
        return []


def _find_horsepower_from_calc_src(calc_src: str) -> int:
    if not calc_src:
        return 0

    parsed_calc = urlparse(calc_src)
    calc_params = dict(parse_qsl(parsed_calc.query, keep_blank_values=True))
    model_id = str(calc_params.get("model_id") or "").strip()
    year = str(calc_params.get("year") or "").strip()
    target_model_type = str(calc_params.get("model_type") or "").strip().upper()
    target_displacement = _extract_first_number(str(calc_params.get("disp") or ""))

    modifications = _fetch_newcalc_modifications(model_id, year)
    if not modifications:
        return 0

    if target_model_type:
        for modification in modifications:
            if target_model_type in modification["model_types"]:
                return int(modification.get("horsepower") or 0)

    if target_displacement > 0:
        compatible = [
            modification
            for modification in modifications
            if abs(int(modification.get("displacement") or 0) - target_displacement) <= 50
        ]
        if compatible:
            return int(compatible[0].get("horsepower") or 0)

    return int(modifications[0].get("horsepower") or 0)


def fetch_aleado_lot_details(detail_link: str) -> dict[str, Any]:
    if not detail_link:
        return {
            "average_price_jpy": 0,
            "horsepower": 0,
            "image_url": "",
            "image_urls": [],
            "auction_sheet_url": "",
        }

    cache_key = _get_lot_cache_key(detail_link)
    cached = _get_cached_payload(_LOT_DETAILS_CACHE, cache_key, LOT_DETAILS_CACHE_TTL_SECONDS)
    if cached is not None:
        return dict(cached)

    try:
        average_price = _get_cached_average_price(cache_key) or 0
        parsed = urlparse(detail_link)
        path = parsed.path or "/auctions/"
        base_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
        detail_response = _fetch_aleado_page(path, params=base_params)
        detail_soup = BeautifulSoup(detail_response.text, "html.parser")
        image_urls = _extract_photo_urls_from_detail(detail_soup)
        calc_src = _extract_calc_src_from_detail(detail_soup)
        horsepower = _find_horsepower_from_calc_src(calc_src)
        average_args = _extract_average_price_args(detail_response.text)
        if average_price <= 0 and len(average_args) >= 9:
            average_html = call_aleado_sajax("getAveragePrice", average_args, path=path)
            if average_html:
                soup = BeautifulSoup(average_html, "html.parser")
                average_node = soup.find(id="average-price-sum")
                if average_node:
                    # Clean up any currency symbols or text around the number
                    text_val = average_node.get_text(" ", strip=True)
                    average_price = _extract_first_number(text_val)
                else:
                    # If specific ID is missing, don't just take any text (prevents mega-numbers from page text)
                    average_price = 0

        if average_price > 0:
            _set_cached_average_price(cache_key, average_price)

        auction_sheet_link = detail_soup.find(
            "a",
            href=re.compile(r"p=project/slot", re.IGNORECASE),
        )
        auction_sheet_url = (
            _absolute_aleado_url(auction_sheet_link.get("href", ""))
            if auction_sheet_link
            else ""
        )

        ordered_images = _reorder_image_urls(image_urls, detail_soup, auction_sheet_url)

        # Force the original first image (thumbnail/preview) to be moved
        # to the end of the list we return, but keep the auction sheet image
        # always last. This makes the current first pic become last-but-one
        # while auction_sheet_url remains final.
        original_primary = image_urls[0] if image_urls else ""
        if original_primary:
            prim_norm = _absolute_aleado_url(original_primary.split("&h=")[0].split("?w=")[0])
            if prim_norm in ordered_images:
                try:
                    ordered_images.remove(prim_norm)
                except Exception:
                    pass
            if prim_norm:
                ordered_images.append(prim_norm)

        # Ensure auction sheet URL is always the final image
        if auction_sheet_url:
            if auction_sheet_url in ordered_images:
                try:
                    ordered_images.remove(auction_sheet_url)
                except Exception:
                    pass
            if auction_sheet_url:
                ordered_images.append(auction_sheet_url)

        payload = {
            "average_price_jpy": average_price,
            "horsepower": horsepower,
            "image_url": ordered_images[0] if ordered_images else "",
            "image_urls": ordered_images,
            "auction_sheet_url": auction_sheet_url,
        }
        _set_cached_payload(_LOT_DETAILS_CACHE, cache_key, payload)
        return dict(payload)
    except Exception as exc:
        print(f"DEBUG: Aleado lot details fetch failed: {exc}")
        return {
            "average_price_jpy": 0,
            "horsepower": 0,
            "image_url": "",
            "image_urls": [],
            "auction_sheet_url": "",
        }


def fetch_aleado_average_price(detail_link: str) -> int:
    return int(fetch_aleado_lot_details(detail_link).get("average_price_jpy") or 0)


def _fetch_aleado_data_single_page(
    brand_id: str,
    model_id: str = "",
    search_type: str = "max",
    body: str = "",
    *,
    page: int = 1,
    page_size: int = ALEADO_RESULTS_PAGE_SIZE,
) -> list[dict[str, Any]]:
    """Fetch car lots from Aleado based on search type (live/stats) and body code."""
    def clean_id(s: str) -> str:
        if not s: return ""
        return str(s).strip().replace('\\', '').strip('"').strip("'").strip()

    brand_id = clean_id(brand_id)
    model_id = clean_id(model_id)
    body = clean_id(body)
    
    # Base params as a list of tuples to handle flag-only params like s and ld correctly
    params = [
        ("p", "project/findlots"),
        ("searchtype", search_type),
        ("mrk", brand_id),
        ("s", None), # Flag style (no value)
        ("ld", None), # Flag style (no value)
        ("vs", str(page_size)),
        ("pg", str(max(1, page))),
    ]
    if model_id and model_id != "-1":
        params.append(("mdl[]", model_id))
    if body and search_type != "stats":
        params.append(("body", body))

    print(
        f"DEBUG: Scraper calling Aleado path={search_type} page={page} "
        f"page_size={page_size} params={params}"
    )

    try:
        path = "/stats/" if search_type == "stats" else "/auctions/"
        request_kwargs: dict[str, Any] = {"params": params}
        if search_type == "stats":
            path = "/stats/?p=project/findlots&s&ld"
            request_kwargs = {
                "method": "POST",
                "data": _build_stats_search_payload(
                    brand_id,
                    model_id,
                    page=page,
                    page_size=page_size,
                ),
            }

        response = _fetch_aleado_page(path, **request_kwargs)
        
        # Check for login redirection
        if "Вход" in response.text and (("username" in response.text) or ("password" in response.text)):
            print("DEBUG: Aleado search failed - redirected to login. Re-authenticating...")
            with _aleado_session_context() as client:
                _login_aleado(client)
                if search_type == "stats":
                    response = client.post(
                        _absolute_aleado_url(path),
                        data=_build_stats_search_payload(
                            brand_id,
                            model_id,
                            page=page,
                            page_size=page_size,
                        ),
                    )
                else:
                    response = client.get(_absolute_aleado_url(path), params=params)

        soup = BeautifulSoup(response.text, "html.parser")

        cars: list[dict[str, Any]] = []
        rows = _find_lot_candidate_rows(soup)

        # Broaden the selector when the markup varies or when stats rows do not contain links.
        if not rows:
            rows = soup.find_all("tr", id=re.compile(r"^cell_|^row_|^id_lot_|\d+"))
        if not rows:
            rows = soup.find_all("tr", class_=re.compile(r"row\s*\d+|lot-row", re.IGNORECASE))
        if len(rows) < 2:
            rows = [r for r in soup.find_all("tr") if len(r.find_all("td")) >= 8]

        for row in rows:
            cols = [td.get_text(" ", strip=True) for td in row.find_all("td")]
            if len(cols) < 10: # Minimum columns to be a valid lot
                continue

            # Identify lot number - usually in 2nd column
            raw_lot = cols[1] if len(cols) > 1 else ""
            lot = re.sub(r"\s+", "", raw_lot)
            if not re.fullmatch(r"\d+", lot):
                continue

            auction_name = cols[2] if len(cols) > 2 else ""
            brand_name = cols[4] if len(cols) > 4 else ""
            model_name = cols[5] if len(cols) > 5 else ""
            model_code = cols[6] if len(cols) > 6 else ""
            body_val = cols[7] if len(cols) > 7 else ""
            year = cols[8] if len(cols) > 8 else ""
            engine_cc = _extract_first_number(cols[9]) if len(cols) > 9 else 0
            transmission = cols[10] if len(cols) > 10 else ""
            if search_type == "stats":
                color = cols[12] if len(cols) > 12 else (cols[11] if len(cols) > 11 else "")
            else:
                color = cols[11] if len(cols) > 11 else ""
            mileage = cols[14] if len(cols) > 14 else ""
            grade = cols[15] if len(cols) > 15 else ""
            sale_status = cols[-1] if cols else ""

            price_jpy = _parse_price_jpy(soup, row, cols)

            img_tag = row.find("img", attrs={"name": re.compile(r"img_preview", re.IGNORECASE)}) or row.find("img")
            raw_image_url = ""
            if img_tag:
                raw_image_url = img_tag.get("load_src") or img_tag.get("src", "")
            image_url = _absolute_aleado_url(raw_image_url.split("?w=")[0]) if raw_image_url else ""

            link_tag = row.find("a", href=True)
            detail_link = _absolute_aleado_url(link_tag.get("href", "")) if link_tag else ""

            modification = " ".join(part for part in [model_code, body_val] if part).strip()
            model_display = " ".join(
                part for part in [brand_name, model_name, model_code, body_val] if part
            ).strip()

            cars.append(
                {
                    "lot": lot,
                    "auction_name": auction_name,
                    "year": str(year),
                    "engine_cc": str(engine_cc),
                    "mileage": mileage,
                    "auction_date": cols[0] if cols else "",
                    "price_jpy": str(price_jpy),
                    "image_url": image_url,
                    "image_urls": [image_url] if image_url else [],
                    "brand": brand_name,
                    "model": model_name,
                    "modelDisplay": model_display,
                    "modelSlug": _normalize(model_name) or _normalize(model_code),
                    "body": body_val,
                    "modification": modification,
                    "rating": grade,
                    "model_code": model_code,
                    "color": color,
                    "transmission": transmission,
                    "grade": grade,
                    "detail_link": detail_link,
                    "sale_status": sale_status,
                    "raw_cols": cols,
                }
            )

        if body:
            cars = [
                car
                for car in cars
                if _matches_normalized_body_filter(
                    body,
                    str(car.get("body") or ""),
                    str(car.get("model_code") or ""),
                    str(car.get("modification") or ""),
                )
            ]

        print(f"DEBUG: Parsed {len(cars)} Aleado result rows")
        return cars
    except Exception as exc:
        print(f"DEBUG: Aleado scrape failed: {exc}")
        return []


def fetch_aleado_data(
    brand_id: str,
    model_id: str = "",
    search_type: str = "max",
    body: str = "",
) -> list[dict[str, Any]]:
    first_page_rows = _fetch_aleado_data_single_page(
        brand_id,
        model_id,
        search_type=search_type,
        body=body,
        page=1,
        page_size=ALEADO_RESULTS_PAGE_SIZE,
    )

    try:
        if search_type == "stats":
            response = _fetch_aleado_page(
                "/stats/?p=project/findlots&s&ld",
                method="POST",
                data=_build_stats_search_payload(
                    str(brand_id or ""),
                    str(model_id or ""),
                    page=1,
                    page_size=ALEADO_RESULTS_PAGE_SIZE,
                ),
            )
        else:
            params: list[tuple[str, Any]] = [
                ("p", "project/findlots"),
                ("searchtype", search_type),
                ("mrk", str(brand_id or "")),
                ("s", None),
                ("ld", None),
                ("vs", str(ALEADO_RESULTS_PAGE_SIZE)),
                ("pg", "1"),
            ]
            if model_id and model_id != "-1":
                params.append(("mdl[]", str(model_id)))
            response = _fetch_aleado_page("/auctions/", params=params)

        total_rows = _extract_total_result_rows(BeautifulSoup(response.text, "html.parser"))
    except Exception as exc:
        print(f"DEBUG: Aleado total rows detection failed: {exc}")
        total_rows = len(first_page_rows)

    page_count = max(
        1,
        min(
            ALEADO_MAX_RESULT_PAGES,
            (total_rows + ALEADO_RESULTS_PAGE_SIZE - 1) // ALEADO_RESULTS_PAGE_SIZE
            if total_rows > 0
            else 1,
        ),
    )

    cars_by_key: dict[str, dict[str, Any]] = {}
    for car in first_page_rows:
        car_key = str(car.get("lot") or "") or str(car.get("detail_link") or "")
        if car_key:
            cars_by_key[car_key] = car

    for page in range(2, page_count + 1):
        page_rows = _fetch_aleado_data_single_page(
            brand_id,
            model_id,
            search_type=search_type,
            body=body,
            page=page,
            page_size=ALEADO_RESULTS_PAGE_SIZE,
        )
        for car in page_rows:
            car_key = str(car.get("lot") or "") or str(car.get("detail_link") or "")
            if car_key:
                cars_by_key[car_key] = car

    cars = list(cars_by_key.values())
    print(
        f"DEBUG: Aggregated {len(cars)} Aleado rows across {page_count} page(s) "
        f"(reported total rows: {total_rows})"
    )
    return cars
