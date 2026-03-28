from decimal import Decimal
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from calculator_core import CalculationContext, calculate_total, get_customs_clearance_fee_rub  # noqa: E402


class CustomsClearanceFeeTests(unittest.TestCase):
    def test_uses_2026_import_clearance_fee_table(self) -> None:
        self.assertEqual(get_customs_clearance_fee_rub(Decimal("449999")), Decimal("2462"))
        self.assertEqual(get_customs_clearance_fee_rub(Decimal("450000")), Decimal("4924"))
        self.assertEqual(get_customs_clearance_fee_rub(Decimal("1199999")), Decimal("4924"))
        self.assertEqual(get_customs_clearance_fee_rub(Decimal("1200000")), Decimal("13541"))

    def test_private_1415cc_used_car_keeps_preferential_util_fee(self) -> None:
        result = calculate_total(
            CalculationContext(
                price_jpy=1_500_000,
                engine_volume=1415,
                horsepower=150,
                age_category="7+",
                duty_rate=0.55,
                buy_rate=0.55,
                eur_rate=92.45,
                usage_type="private",
                engine_type="gasoline",
                year=2026,
            )
        )

        self.assertEqual(result.customs_processing_fee_rub, Decimal("4924"))
        self.assertEqual(result.util_fee_rub, Decimal("5200.00"))

    def test_private_2_liter_car_does_not_fall_back_to_preferential_util_fee(self) -> None:
        result = calculate_total(
            CalculationContext(
                price_jpy=1_500_000,
                engine_volume=1998,
                horsepower=225,
                age_category="7+",
                duty_rate=0.55,
                buy_rate=0.55,
                eur_rate=92.45,
                usage_type="private",
                engine_type="gasoline",
                year=2026,
            )
        )

        self.assertEqual(result.customs_processing_fee_rub, Decimal("4924"))
        self.assertGreater(result.util_fee_rub, Decimal("5200"))


if __name__ == "__main__":
    unittest.main()
