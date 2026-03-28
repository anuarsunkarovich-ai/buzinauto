from __future__ import annotations

from decimal import Decimal

JAPAN_EXPENSES_JPY = Decimal("162500")
CUSTOMS_BROKER_RUB = Decimal("45000")
SVH_TRANSPORT_RUB = Decimal("5500")

BASE_UTIL_FEE_RUB = Decimal("20000")
COMMERCIAL_TRIGGER_HORSEPOWER = 160
ELECTRIC_PREFERENTIAL_TRIGGER_HORSEPOWER = 80
HP_TO_KW = Decimal("0.73549875")

INDIVIDUAL_IMPORTER = "individual"
LEGAL_IMPORTER = "legal"
PRIVATE_USAGE = "private"
COMMERCIAL_USAGE = "commercial"

CUSTOMS_CLEARANCE_FEES_RUB: tuple[tuple[int, Decimal], ...] = (
    (200000, Decimal("1231")),
    (450000, Decimal("2462")),
    (1200000, Decimal("4924")),
    (2700000, Decimal("13541")),
    (4200000, Decimal("18465")),
    (5500000, Decimal("21344")),
    (10000000, Decimal("49240")),
)
CUSTOMS_CLEARANCE_FEE_MAX_RUB = Decimal("73860")

DUTY_RATES_NEW: tuple[tuple[Decimal, Decimal, Decimal], ...] = (
    (Decimal("8500"), Decimal("0.54"), Decimal("2.5")),
    (Decimal("16700"), Decimal("0.48"), Decimal("3.5")),
    (Decimal("42300"), Decimal("0.48"), Decimal("5.5")),
    (Decimal("84500"), Decimal("0.48"), Decimal("7.5")),
    (Decimal("169000"), Decimal("0.48"), Decimal("15")),
    (Decimal("999999999"), Decimal("0.48"), Decimal("20")),
)

DUTY_RATES_3_TO_5: tuple[tuple[int, Decimal], ...] = (
    (1000, Decimal("1.5")),
    (1500, Decimal("1.7")),
    (1800, Decimal("2.5")),
    (2300, Decimal("2.7")),
    (3000, Decimal("3.0")),
    (999999999, Decimal("3.6")),
)

DUTY_RATES_5_PLUS: tuple[tuple[int, Decimal], ...] = (
    (1000, Decimal("3.0")),
    (1500, Decimal("3.2")),
    (1800, Decimal("3.5")),
    (2300, Decimal("4.8")),
    (3000, Decimal("5.0")),
    (999999999, Decimal("5.7")),
)

EXCISE_RATES_BY_YEAR: dict[int, dict[str, Decimal]] = {
    2025: {
        "90-150": Decimal("61"),
        "150-200": Decimal("583"),
        "200-300": Decimal("955"),
        "300-400": Decimal("1628"),
        "400-500": Decimal("1685"),
        "500+": Decimal("1740"),
    },
    2026: {
        "90-150": Decimal("63"),
        "150-200": Decimal("606"),
        "200-300": Decimal("993"),
        "300-400": Decimal("1693"),
        "400-500": Decimal("1752"),
        "500+": Decimal("1810"),
    },
    2027: {
        "90-150": Decimal("66"),
        "150-200": Decimal("630"),
        "200-300": Decimal("1033"),
        "300-400": Decimal("1761"),
        "400-500": Decimal("1822"),
        "500+": Decimal("1882"),
    },
}

PREFERENTIAL_SENTINEL = Decimal("-1")
PREFERENTIAL_NEW_COEFF = Decimal("0.17")
PREFERENTIAL_USED_COEFF = Decimal("0.26")

PowerBracket = tuple[Decimal, Decimal, Decimal]
VolumeCategory = tuple[int, tuple[PowerBracket, ...]]

LEGAL_ELECTRIC_BRACKETS: tuple[PowerBracket, ...] = (
    (Decimal("58.84"), Decimal("33.37"), Decimal("58.7")),
    (Decimal("73.55"), Decimal("41.3"), Decimal("68.4")),
    (Decimal("95.61"), Decimal("54.9"), Decimal("79.7")),
    (Decimal("117.68"), Decimal("65"), Decimal("92.8")),
    (Decimal("139.75"), Decimal("77"), Decimal("108.1")),
    (Decimal("161.81"), Decimal("91.4"), Decimal("126")),
    (Decimal("183.88"), Decimal("108.3"), Decimal("146.8")),
    (Decimal("205.94"), Decimal("128.3"), Decimal("171")),
    (Decimal("999999"), Decimal("152"), Decimal("199.2")),
)

LEGAL_ICE_TABLE: tuple[VolumeCategory, ...] = (
    (
        1000,
        (
            (Decimal("117.68"), Decimal("12.4"), Decimal("23")),
            (Decimal("139.75"), Decimal("12.8"), Decimal("23.69")),
            (Decimal("161.81"), Decimal("13.2"), Decimal("24.4")),
            (Decimal("183.88"), Decimal("13.5"), Decimal("25.1")),
            (Decimal("999999"), Decimal("14.4"), Decimal("25.1")),
        ),
    ),
    (
        2000,
        (
            (Decimal("117.68"), Decimal("33.37"), Decimal("58.7")),
            (Decimal("139.75"), Decimal("37.5"), Decimal("62.2")),
            (Decimal("161.81"), Decimal("39.7"), Decimal("66")),
            (Decimal("183.88"), Decimal("42.1"), Decimal("69.9")),
            (Decimal("205.94"), Decimal("47.6"), Decimal("76.6")),
            (Decimal("228"), Decimal("53.8"), Decimal("83.8")),
            (Decimal("250.07"), Decimal("60.8"), Decimal("91.8")),
            (Decimal("272.13"), Decimal("69.3"), Decimal("100.5")),
            (Decimal("294.2"), Decimal("79"), Decimal("110")),
            (Decimal("316.26"), Decimal("90"), Decimal("120.5")),
            (Decimal("338.33"), Decimal("102.7"), Decimal("132")),
            (Decimal("367.75"), Decimal("117"), Decimal("144.5")),
            (Decimal("999999"), Decimal("133.4"), Decimal("158.2")),
        ),
    ),
    (
        3000,
        (
            (Decimal("139.75"), Decimal("96.11"), Decimal("144")),
            (Decimal("161.81"), Decimal("98.5"), Decimal("145.9")),
            (Decimal("183.88"), Decimal("100.1"), Decimal("148")),
            (Decimal("205.94"), Decimal("105"), Decimal("152.5")),
            (Decimal("228"), Decimal("109.2"), Decimal("157.1")),
            (Decimal("250.07"), Decimal("113.6"), Decimal("161.4")),
            (Decimal("272.13"), Decimal("118.1"), Decimal("165.9")),
            (Decimal("294.2"), Decimal("122.9"), Decimal("170.6")),
            (Decimal("316.26"), Decimal("127.8"), Decimal("175.4")),
            (Decimal("338.33"), Decimal("132.9"), Decimal("180.3")),
            (Decimal("367.75"), Decimal("138.2"), Decimal("185.3")),
            (Decimal("999999"), Decimal("143.7"), Decimal("190.5")),
        ),
    ),
    (
        3500,
        (
            (Decimal("117.68"), Decimal("107.67"), Decimal("164.84")),
            (Decimal("139.75"), Decimal("109.8"), Decimal("166.7")),
            (Decimal("161.81"), Decimal("112"), Decimal("168.5")),
            (Decimal("183.88"), Decimal("114.3"), Decimal("170.3")),
            (Decimal("205.94"), Decimal("117.1"), Decimal("172.7")),
            (Decimal("228"), Decimal("120"), Decimal("177")),
            (Decimal("250.07"), Decimal("126.6"), Decimal("181.5")),
            (Decimal("272.13"), Decimal("133.6"), Decimal("186.9")),
            (Decimal("294.2"), Decimal("141"), Decimal("192.5")),
            (Decimal("316.26"), Decimal("148.7"), Decimal("198.3")),
            (Decimal("338.33"), Decimal("156.9"), Decimal("204.2")),
            (Decimal("367.75"), Decimal("165.5"), Decimal("210.4")),
            (Decimal("999999"), Decimal("174.6"), Decimal("216.7")),
        ),
    ),
    (
        999999999,
        (
            (Decimal("117.68"), Decimal("137.11"), Decimal("180.24")),
            (Decimal("139.75"), Decimal("139.4"), Decimal("182.9")),
            (Decimal("161.81"), Decimal("141.8"), Decimal("185.7")),
            (Decimal("183.88"), Decimal("144.2"), Decimal("188.5")),
            (Decimal("205.94"), Decimal("147.1"), Decimal("192.8")),
            (Decimal("228"), Decimal("150"), Decimal("197.2")),
            (Decimal("250.07"), Decimal("155.3"), Decimal("208")),
            (Decimal("272.13"), Decimal("160.73"), Decimal("219.5")),
            (Decimal("294.2"), Decimal("166.4"), Decimal("231.6")),
            (Decimal("316.26"), Decimal("172.2"), Decimal("244.3")),
            (Decimal("338.33"), Decimal("178.2"), Decimal("257.8")),
            (Decimal("367.75"), Decimal("184.4"), Decimal("272")),
            (Decimal("999999"), Decimal("190.9"), Decimal("286.9")),
        ),
    ),
)

INDIVIDUAL_ELECTRIC_BRACKETS: tuple[PowerBracket, ...] = (
    (Decimal("58.84"), PREFERENTIAL_SENTINEL, PREFERENTIAL_SENTINEL),
    (Decimal("73.55"), Decimal("41.3"), Decimal("68.4")),
    (Decimal("95.61"), Decimal("54.9"), Decimal("79.7")),
    (Decimal("117.68"), Decimal("65"), Decimal("92.8")),
    (Decimal("139.75"), Decimal("77"), Decimal("108.1")),
    (Decimal("161.81"), Decimal("91.4"), Decimal("126")),
    (Decimal("183.88"), Decimal("108.3"), Decimal("146.8")),
    (Decimal("205.94"), Decimal("128.3"), Decimal("171")),
    (Decimal("999999"), Decimal("152"), Decimal("199.2")),
)

INDIVIDUAL_ICE_TABLE: tuple[VolumeCategory, ...] = (
    (
        1000,
        (
            (Decimal("117.68"), PREFERENTIAL_SENTINEL, PREFERENTIAL_SENTINEL),
            (Decimal("139.75"), Decimal("12.8"), Decimal("23.7")),
            (Decimal("161.81"), Decimal("13.2"), Decimal("24.4")),
            (Decimal("183.88"), Decimal("13.5"), Decimal("25.1")),
            (Decimal("999999"), Decimal("14.4"), Decimal("25.1")),
        ),
    ),
    (
        2000,
        (
            (Decimal("117.68"), PREFERENTIAL_SENTINEL, PREFERENTIAL_SENTINEL),
            (Decimal("139.75"), Decimal("37.5"), Decimal("62.2")),
            (Decimal("161.81"), Decimal("39.7"), Decimal("66")),
            (Decimal("183.88"), Decimal("42.1"), Decimal("69.9")),
            (Decimal("205.94"), Decimal("47.6"), Decimal("76.6")),
            (Decimal("228"), Decimal("53.8"), Decimal("83.8")),
            (Decimal("250.07"), Decimal("60.8"), Decimal("91.8")),
            (Decimal("272.13"), Decimal("69.3"), Decimal("100.5")),
            (Decimal("294.2"), Decimal("79"), Decimal("110")),
            (Decimal("316.26"), Decimal("90"), Decimal("120.5")),
            (Decimal("338.33"), Decimal("102.7"), Decimal("132")),
            (Decimal("367.75"), Decimal("117"), Decimal("144.5")),
            (Decimal("999999"), Decimal("133.4"), Decimal("158.2")),
        ),
    ),
    (
        3000,
        (
            (Decimal("117.68"), PREFERENTIAL_SENTINEL, PREFERENTIAL_SENTINEL),
            (Decimal("139.75"), Decimal("96.11"), Decimal("144")),
            (Decimal("161.81"), Decimal("98.5"), Decimal("145.9")),
            (Decimal("183.88"), Decimal("100.1"), Decimal("148")),
            (Decimal("205.94"), Decimal("105"), Decimal("152.5")),
            (Decimal("228"), Decimal("109.2"), Decimal("157.1")),
            (Decimal("250.07"), Decimal("113.6"), Decimal("161.4")),
            (Decimal("272.13"), Decimal("118.1"), Decimal("165.9")),
            (Decimal("294.2"), Decimal("122.9"), Decimal("170.6")),
            (Decimal("316.26"), Decimal("127.8"), Decimal("175.4")),
            (Decimal("338.33"), Decimal("132.9"), Decimal("180.3")),
            (Decimal("367.75"), Decimal("138.2"), Decimal("185.3")),
            (Decimal("999999"), Decimal("143.7"), Decimal("190.5")),
        ),
    ),
    (
        3500,
        (
            (Decimal("117.68"), Decimal("107.67"), Decimal("164.84")),
            (Decimal("139.75"), Decimal("109.8"), Decimal("166.7")),
            (Decimal("161.81"), Decimal("112"), Decimal("168.5")),
            (Decimal("183.88"), Decimal("114.3"), Decimal("170.3")),
            (Decimal("205.94"), Decimal("117.1"), Decimal("172.7")),
            (Decimal("228"), Decimal("120"), Decimal("177")),
            (Decimal("250.07"), Decimal("126.6"), Decimal("181.5")),
            (Decimal("272.13"), Decimal("133.6"), Decimal("186.9")),
            (Decimal("294.2"), Decimal("141"), Decimal("192.5")),
            (Decimal("316.26"), Decimal("148.7"), Decimal("198.3")),
            (Decimal("338.33"), Decimal("156.9"), Decimal("204.2")),
            (Decimal("367.75"), Decimal("165.5"), Decimal("210.4")),
            (Decimal("999999"), Decimal("174.6"), Decimal("216.7")),
        ),
    ),
    (
        999999999,
        (
            (Decimal("117.68"), Decimal("137.11"), Decimal("180.24")),
            (Decimal("139.75"), Decimal("139.4"), Decimal("182.9")),
            (Decimal("161.81"), Decimal("141.8"), Decimal("185.7")),
            (Decimal("183.88"), Decimal("144.2"), Decimal("188.5")),
            (Decimal("205.94"), Decimal("147.1"), Decimal("192.8")),
            (Decimal("228"), Decimal("150"), Decimal("197.2")),
            (Decimal("250.07"), Decimal("155.3"), Decimal("208")),
            (Decimal("272.13"), Decimal("160.73"), Decimal("219.5")),
            (Decimal("294.2"), Decimal("166.4"), Decimal("231.6")),
            (Decimal("316.26"), Decimal("172.2"), Decimal("244.3")),
            (Decimal("338.33"), Decimal("178.2"), Decimal("257.8")),
            (Decimal("367.75"), Decimal("184.4"), Decimal("272")),
            (Decimal("999999"), Decimal("190.9"), Decimal("286.9")),
        ),
    ),
)
