from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from config import (
    BASE_UTIL_FEE_RUB,
    COMMERCIAL_TRIGGER_HORSEPOWER,
    COMMERCIAL_USAGE,
    CUSTOMS_BROKER_RUB,
    CUSTOMS_CLEARANCE_FEES_RUB,
    CUSTOMS_CLEARANCE_FEE_MAX_RUB,
    DUTY_RATES_3_TO_5,
    DUTY_RATES_5_PLUS,
    DUTY_RATES_NEW,
    ELECTRIC_PREFERENTIAL_TRIGGER_HORSEPOWER,
    EXCISE_RATES_BY_YEAR,
    HP_TO_KW,
    INDIVIDUAL_ELECTRIC_BRACKETS,
    INDIVIDUAL_ICE_TABLE,
    INDIVIDUAL_IMPORTER,
    JAPAN_EXPENSES_JPY,
    LEGAL_ELECTRIC_BRACKETS,
    LEGAL_ICE_TABLE,
    LEGAL_IMPORTER,
    PREFERENTIAL_NEW_COEFF,
    PREFERENTIAL_SENTINEL,
    PREFERENTIAL_USED_COEFF,
    PRIVATE_USAGE,
    SVH_TRANSPORT_RUB,
)

ZERO = Decimal("0")
MONEY_Q = Decimal("0.01")


@dataclass(slots=True)
class CalculationContext:
    price_jpy: int
    engine_volume: int
    horsepower: int
    age_category: str
    sell_rate: float
    eur_rate: float
    user_type: str = INDIVIDUAL_IMPORTER
    usage_type: str = PRIVATE_USAGE
    engine_type: str = "gasoline"
    year: int = date.today().year
    duty_buffer_rub: float = 0.0


@dataclass(slots=True)
class CalculationBreakdown:
    auction_rub: Decimal
    japan_expenses_rub: Decimal
    customs_broker_rub: Decimal
    customs_duty_rub: Decimal
    customs_processing_fee_rub: Decimal
    excise_rub: Decimal
    util_fee_rub: Decimal
    svh_transport_rub: Decimal
    company_commission_rub: Decimal
    duty_buffer_rub: Decimal
    total_rub: Decimal
    exchange_rate: Decimal
    effective_user_type: str
    effective_usage_type: str
    forced_commercial: bool


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_Q, rounding=ROUND_HALF_UP)


def _as_decimal(value: int | float | str | Decimal) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def normalize_user_type(user_type: str | None) -> str:
    normalized = (user_type or "").strip().lower()
    if normalized in {LEGAL_IMPORTER, "jur", "company", "entity", "commercial"}:
        return LEGAL_IMPORTER
    return INDIVIDUAL_IMPORTER


def normalize_usage_type(usage_type: str | None) -> str:
    normalized = (usage_type or "").strip().lower()
    if normalized in {COMMERCIAL_USAGE, "коммерческий", "legal"}:
        return COMMERCIAL_USAGE
    return PRIVATE_USAGE


def age_category_to_years(age_category: str) -> int:
    normalized = (age_category or "").strip().lower()
    if normalized in {"0-3", "0_3", "under3", "<3", "new"}:
        return 2
    if normalized in {"3-5", "3_5"}:
        return 4
    if normalized in {"5-7", "5_7"}:
        return 6
    return 8


def estimate_power_kw(engine_volume: int) -> Decimal:
    if engine_volume <= 1000:
        return Decimal("55")
    if engine_volume <= 2000:
        return Decimal("110")
    if engine_volume <= 3000:
        return Decimal("155")
    if engine_volume <= 3500:
        return Decimal("220")
    return Decimal("270")


def estimate_horsepower(engine_volume: int) -> int:
    return int((estimate_power_kw(engine_volume) / HP_TO_KW).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def horsepower_to_kw(horsepower: int, engine_volume: int) -> Decimal:
    if horsepower > 0:
        return quantize_money(_as_decimal(horsepower) * HP_TO_KW)
    return estimate_power_kw(engine_volume)


def is_electric_engine(engine_type: str | None) -> bool:
    normalized = (engine_type or "").strip().lower()
    return normalized in {"electric", "ev", "hybrid-sequential", "sequential-hybrid"}


def should_force_commercial(engine_type: str, horsepower: int) -> bool:
    if horsepower <= 0:
        return False
    if is_electric_engine(engine_type):
        return horsepower > ELECTRIC_PREFERENTIAL_TRIGGER_HORSEPOWER
    return horsepower > COMMERCIAL_TRIGGER_HORSEPOWER


def resolve_effective_modes(
    user_type: str | None,
    usage_type: str | None,
    engine_type: str,
    horsepower: int,
) -> tuple[str, str, bool]:
    normalized_user = normalize_user_type(user_type)
    normalized_usage = normalize_usage_type(usage_type)
    forced_commercial = should_force_commercial(engine_type, horsepower)

    effective_usage_type = (
        COMMERCIAL_USAGE
        if normalized_user == LEGAL_IMPORTER
        or normalized_usage == COMMERCIAL_USAGE
        or forced_commercial
        else PRIVATE_USAGE
    )

    return normalized_user, effective_usage_type, forced_commercial


def get_customs_clearance_fee_rub(car_price_rub: Decimal) -> Decimal:
    for upper_bound, fee in CUSTOMS_CLEARANCE_FEES_RUB:
        if car_price_rub < _as_decimal(upper_bound):
            return fee
    return CUSTOMS_CLEARANCE_FEE_MAX_RUB


def get_new_car_duty_rub(car_price_rub: Decimal, engine_volume: int, eur_rate: Decimal) -> Decimal:
    car_value_eur = car_price_rub / eur_rate if eur_rate > 0 else ZERO
    for upper_eur, percent, min_rate in DUTY_RATES_NEW:
        if car_value_eur <= upper_eur:
            percentage_duty = car_price_rub * percent
            volume_duty = _as_decimal(engine_volume) * min_rate * eur_rate
            return quantize_money(max(percentage_duty, volume_duty))
    return ZERO


def get_volume_duty_rub(engine_volume: int, rates: tuple[tuple[int, Decimal], ...], eur_rate: Decimal) -> Decimal:
    for upper_bound, rate in rates:
        if engine_volume <= upper_bound:
            return quantize_money(_as_decimal(engine_volume) * rate * eur_rate)
    return ZERO


def calculate_customs_duty_rub(
    price_jpy: int,
    engine_volume: int,
    age_category: str,
    sell_rate: Decimal,
    eur_rate: Decimal,
) -> tuple[Decimal, Decimal]:
    auction_rub = _as_decimal(price_jpy) * sell_rate
    clearance_fee_rub = get_customs_clearance_fee_rub(auction_rub)
    age_years = age_category_to_years(age_category)

    if age_years <= 3:
        duty_rub = get_new_car_duty_rub(auction_rub, engine_volume, eur_rate)
    elif age_years <= 5:
        duty_rub = get_volume_duty_rub(engine_volume, DUTY_RATES_3_TO_5, eur_rate)
    else:
        duty_rub = get_volume_duty_rub(engine_volume, DUTY_RATES_5_PLUS, eur_rate)

    return duty_rub, clearance_fee_rub


def get_excise_rate(year: int, horsepower: int) -> Decimal:
    normalized_year = max(2025, min(year, 2027))
    rates = EXCISE_RATES_BY_YEAR[normalized_year]
    if horsepower < 90:
        return ZERO
    if horsepower <= 150:
        return rates["90-150"]
    if horsepower <= 200:
        return rates["150-200"]
    if horsepower <= 300:
        return rates["200-300"]
    if horsepower <= 400:
        return rates["300-400"]
    if horsepower <= 500:
        return rates["400-500"]
    return rates["500+"]


def calculate_excise_rub(year: int, horsepower: int, effective_user_type: str) -> Decimal:
    if effective_user_type != LEGAL_IMPORTER:
        return ZERO
    rate = get_excise_rate(year, horsepower)
    return quantize_money(_as_decimal(horsepower) * rate)


def get_year_multiplier(year: int) -> Decimal:
    if year <= 2025:
        return Decimal("1")
    if year == 2026:
        return Decimal("1.2")

    capped = min(year, 2030)
    multiplier = Decimal("1.2")
    for _ in range(2027, capped + 1):
        multiplier *= Decimal("1.1")
    return multiplier


def _find_power_bracket(brackets: tuple[tuple[Decimal, Decimal, Decimal], ...], power_kw: Decimal) -> tuple[Decimal, Decimal, Decimal]:
    for bracket in brackets:
        if power_kw <= bracket[0]:
            return bracket
    return brackets[-1]


def _find_volume_brackets(volume_table, engine_volume: int):
    for max_volume, brackets in volume_table:
        if engine_volume <= max_volume:
            return brackets
    return volume_table[-1][1]


def calculate_recycling_fee_rub(
    year: int,
    effective_user_type: str,
    engine_type: str,
    engine_volume: int,
    age_category: str,
    horsepower: int,
) -> Decimal:
    power_kw = horsepower_to_kw(horsepower, engine_volume)
    is_new = age_category_to_years(age_category) <= 3

    if effective_user_type == LEGAL_IMPORTER:
        brackets = LEGAL_ELECTRIC_BRACKETS if is_electric_engine(engine_type) else _find_volume_brackets(LEGAL_ICE_TABLE, engine_volume)
    else:
        brackets = INDIVIDUAL_ELECTRIC_BRACKETS if is_electric_engine(engine_type) else _find_volume_brackets(INDIVIDUAL_ICE_TABLE, engine_volume)

    _, new_coeff, used_coeff = _find_power_bracket(brackets, power_kw)
    coeff = new_coeff if is_new else used_coeff

    if coeff == PREFERENTIAL_SENTINEL:
        coeff = PREFERENTIAL_NEW_COEFF if is_new else PREFERENTIAL_USED_COEFF
        return quantize_money(BASE_UTIL_FEE_RUB * coeff)

    return quantize_money(BASE_UTIL_FEE_RUB * coeff * get_year_multiplier(year))


def calculate_total(context: CalculationContext) -> CalculationBreakdown:
    sell_rate = _as_decimal(context.sell_rate)
    eur_rate = _as_decimal(context.eur_rate)
    duty_buffer_rub = _as_decimal(max(0.0, float(context.duty_buffer_rub or 0)))

    effective_user_type, effective_usage_type, forced_commercial = resolve_effective_modes(
        user_type=context.user_type,
        usage_type=context.usage_type,
        engine_type=context.engine_type,
        horsepower=context.horsepower,
    )

    auction_rub = quantize_money(_as_decimal(context.price_jpy) * sell_rate)
    japan_expenses_rub = quantize_money(JAPAN_EXPENSES_JPY * sell_rate)
    customs_duty_core_rub, customs_processing_fee_rub = calculate_customs_duty_rub(
        price_jpy=context.price_jpy,
        engine_volume=context.engine_volume,
        age_category=context.age_category,
        sell_rate=sell_rate,
        eur_rate=eur_rate,
    )
    excise_rub = calculate_excise_rub(
        year=context.year,
        horsepower=context.horsepower,
        effective_user_type=effective_user_type,
    )
    customs_duty_rub = quantize_money(
        customs_duty_core_rub + customs_processing_fee_rub + excise_rub + duty_buffer_rub
    )
    util_user_type = (
        LEGAL_IMPORTER
        if effective_user_type == LEGAL_IMPORTER or effective_usage_type == COMMERCIAL_USAGE
        else INDIVIDUAL_IMPORTER
    )
    util_fee_rub = calculate_recycling_fee_rub(
        year=context.year,
        effective_user_type=util_user_type,
        engine_type=context.engine_type,
        engine_volume=context.engine_volume,
        age_category=context.age_category,
        horsepower=context.horsepower,
    )

    total_rub = quantize_money(
        auction_rub
        + japan_expenses_rub
        + CUSTOMS_BROKER_RUB
        + customs_duty_rub
        + util_fee_rub
        + SVH_TRANSPORT_RUB
    )

    return CalculationBreakdown(
        auction_rub=auction_rub,
        japan_expenses_rub=japan_expenses_rub,
        customs_broker_rub=CUSTOMS_BROKER_RUB,
        customs_duty_rub=customs_duty_rub,
        customs_processing_fee_rub=customs_processing_fee_rub,
        excise_rub=excise_rub,
        util_fee_rub=util_fee_rub,
        svh_transport_rub=SVH_TRANSPORT_RUB,
        company_commission_rub=ZERO,
        duty_buffer_rub=duty_buffer_rub,
        total_rub=total_rub,
        exchange_rate=sell_rate,
        effective_user_type=effective_user_type,
        effective_usage_type=effective_usage_type,
        forced_commercial=forced_commercial,
    )
