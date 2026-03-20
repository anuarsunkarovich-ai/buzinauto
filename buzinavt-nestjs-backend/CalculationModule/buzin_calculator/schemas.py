from pydantic import BaseModel, Field


class CalculationRequest(BaseModel):
    price_jpy: int = Field(ge=0)
    engine_cc: int = Field(ge=0)
    power_hp: int = Field(ge=0)
    age_category: str
    usage_type: str = "private"
    user_type: str = "individual"
    engine_type: str = "gasoline"
    duty_buffer_rub: float = 0


class CostBreakdown(BaseModel):
    buy_and_delivery_rub: float = 0
    customs_broker_rub: float = 0
    customs_duty_rub: float = 0
    customs_processing_fee_rub: float = 0
    excise_rub: float = 0
    util_fee_rub: float = 0
    svh_transport_rub: float = 0
    company_commission: float = 0
    duty_buffer_rub: float = 0
    effective_user_type: str = "individual"
    effective_usage_type: str = "private"
    forced_commercial: bool = False


class CalculationResponse(BaseModel):
    status: str
    exchange_rate: float
    bank_buy_rate: float
    breakdown: CostBreakdown
    total_rub: float
