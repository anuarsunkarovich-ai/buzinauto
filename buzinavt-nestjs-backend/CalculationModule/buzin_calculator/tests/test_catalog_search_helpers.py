from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from main import resolve_aleado_ids, resolve_aleado_model_ids  # noqa: E402


class CatalogSearchHelpersTests(unittest.TestCase):
    @patch("main.fetch_aleado_filters")
    def test_resolve_aleado_model_ids_expands_base_family_matches(self, mock_fetch_filters) -> None:
        mock_fetch_filters.side_effect = [
            [{"id": "14", "name": "VOLKSWAGEN"}],
            [
                {"id": "1030", "name": "PASSAT", "modelDisplay": "PASSAT"},
                {"id": "1031", "name": "PASSAT VARIANT", "modelDisplay": "PASSAT VARIANT"},
                {"id": "1032", "name": "PASSAT GTE", "modelDisplay": "PASSAT GTE"},
                {"id": "2040", "name": "GOLF", "modelDisplay": "GOLF"},
            ],
        ]

        brand_id, model_ids, matched = resolve_aleado_model_ids("volkswagen", "passat")

        self.assertEqual(brand_id, "14")
        self.assertTrue(matched)
        self.assertEqual(model_ids, ["1030", "1031", "1032"])

    @patch("main.fetch_aleado_filters")
    def test_resolve_aleado_model_ids_keeps_specific_variant_family(self, mock_fetch_filters) -> None:
        mock_fetch_filters.side_effect = [
            [{"id": "14", "name": "VOLKSWAGEN"}],
            [
                {"id": "1030", "name": "PASSAT", "modelDisplay": "PASSAT"},
                {"id": "1032", "name": "PASSAT GTE", "modelDisplay": "PASSAT GTE"},
                {
                    "id": "1033",
                    "name": "PASSAT GTE VARIANT",
                    "modelDisplay": "PASSAT GTE VARIANT",
                },
            ],
        ]

        brand_id, model_ids, matched = resolve_aleado_model_ids("volkswagen", "passat-gte")

        self.assertEqual(brand_id, "14")
        self.assertTrue(matched)
        self.assertEqual(model_ids, ["1032", "1033"])

    @patch("main.fetch_aleado_filters")
    def test_resolve_aleado_ids_remains_backward_compatible(self, mock_fetch_filters) -> None:
        mock_fetch_filters.side_effect = [
            [{"id": "14", "name": "VOLKSWAGEN"}],
            [
                {"id": "1030", "name": "PASSAT", "modelDisplay": "PASSAT"},
                {"id": "1031", "name": "PASSAT VARIANT", "modelDisplay": "PASSAT VARIANT"},
            ],
        ]

        brand_id, model_id, matched = resolve_aleado_ids("volkswagen", "passat")

        self.assertEqual(brand_id, "14")
        self.assertEqual(model_id, "1030")
        self.assertTrue(matched)


if __name__ == "__main__":
    unittest.main()
