from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from main import (  # noqa: E402
    _build_pagination_info,
    _paginate_items,
    _resolve_average_price_jpy,
    resolve_aleado_ids,
    resolve_aleado_model_ids,
)


class CatalogSearchHelpersTests(unittest.TestCase):
    def test_build_pagination_info_clamps_page_and_limit(self) -> None:
        pagination = _build_pagination_info(35, page=99, limit=500, default_limit=12, max_limit=50)

        self.assertEqual(pagination.page, 1)
        self.assertEqual(pagination.limit, 50)
        self.assertEqual(pagination.total_items, 35)
        self.assertEqual(pagination.total_pages, 1)
        self.assertFalse(pagination.has_next_page)
        self.assertFalse(pagination.has_prev_page)

    def test_paginate_items_returns_requested_page_slice(self) -> None:
        items = [{"lot": str(index)} for index in range(30)]

        paged_items, pagination = _paginate_items(
            items,
            page=2,
            limit=12,
            default_limit=12,
            max_limit=100,
        )

        self.assertEqual(len(paged_items), 12)
        self.assertEqual(paged_items[0]["lot"], "12")
        self.assertEqual(paged_items[-1]["lot"], "23")
        self.assertEqual(pagination.page, 2)
        self.assertEqual(pagination.total_pages, 3)
        self.assertTrue(pagination.has_next_page)
        self.assertTrue(pagination.has_prev_page)

    @patch("main.fetch_aleado_average_price")
    def test_resolve_average_price_prefers_existing_detail_average(self, mock_fetch_average) -> None:
        average_price = _resolve_average_price_jpy(
            {"detail_link": "https://example.com/lot"},
            {"average_price_jpy": "1234567"},
        )

        self.assertEqual(average_price, 1234567)
        mock_fetch_average.assert_not_called()

    @patch("main.fetch_aleado_average_price")
    def test_resolve_average_price_falls_back_to_aleado_lookup(self, mock_fetch_average) -> None:
        mock_fetch_average.return_value = 7654321

        average_price = _resolve_average_price_jpy(
            {"detail_link": "https://example.com/lot?id=42"},
            {},
        )

        self.assertEqual(average_price, 7654321)
        mock_fetch_average.assert_called_once_with("https://example.com/lot?id=42")

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
