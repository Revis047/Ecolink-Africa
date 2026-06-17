import math
from typing import Optional, Tuple

from app.config import LANGUAGES_BY_COUNTRY, SUPPORTED_LANGUAGES

AFRICA_BOUNDING_BOXES = {
    "Rwanda": {"min_lat": -2.84, "max_lat": -1.05, "min_lng": 28.86, "max_lng": 30.90},
    "Burundi": {"min_lat": -4.47, "max_lat": -2.31, "min_lng": 28.99, "max_lng": 30.85},
    "DRC": {"min_lat": -13.46, "max_lat": 5.39, "min_lng": 12.20, "max_lng": 31.31},
    "Congo": {"min_lat": -5.03, "max_lat": 3.70, "min_lng": 11.20, "max_lng": 18.65},
    "Uganda": {"min_lat": -1.48, "max_lat": 4.23, "min_lng": 29.57, "max_lng": 35.00},
    "Kenya": {"min_lat": -4.72, "max_lat": 4.62, "min_lng": 33.91, "max_lng": 41.91},
    "Tanzania": {"min_lat": -11.76, "max_lat": -0.99, "min_lng": 29.33, "max_lng": 40.44},
    "Nigeria": {"min_lat": 4.07, "max_lat": 13.89, "min_lng": 2.68, "max_lng": 14.68},
    "Ghana": {"min_lat": 4.71, "max_lat": 11.17, "min_lng": -3.26, "max_lng": 1.19},
    "South Africa": {"min_lat": -34.83, "max_lat": -22.13, "min_lng": 16.45, "max_lng": 32.89},
    "Ethiopia": {"min_lat": 3.40, "max_lat": 14.89, "min_lng": 33.00, "max_lng": 48.00},
    "Somalia": {"min_lat": -1.66, "max_lat": 12.19, "min_lng": 40.99, "max_lng": 51.41},
    "Senegal": {"min_lat": 12.24, "max_lat": 16.69, "min_lng": -17.54, "max_lng": -11.38},
    "Mali": {"min_lat": 10.16, "max_lat": 25.00, "min_lng": -12.24, "max_lng": 4.24},
    "Botswana": {"min_lat": -26.91, "max_lat": -17.78, "min_lng": 19.99, "max_lng": 29.36},
    "Zimbabwe": {"min_lat": -22.42, "max_lat": -15.61, "min_lng": 25.24, "max_lng": 33.06},
    "Zambia": {"min_lat": -18.08, "max_lat": -8.22, "min_lng": 21.99, "max_lng": 33.70},
    "Malawi": {"min_lat": -17.13, "max_lat": -9.37, "min_lng": 32.67, "max_lng": 35.92},
    "Madagascar": {"min_lat": -25.61, "max_lat": -11.95, "min_lng": 43.22, "max_lng": 50.48},
    "Cameroon": {"min_lat": 1.65, "max_lat": 13.08, "min_lng": 8.50, "max_lng": 16.19},
    "Côte d'Ivoire": {"min_lat": 4.36, "max_lat": 10.74, "min_lng": -8.60, "max_lng": -2.50},
    "Burkina Faso": {"min_lat": 9.40, "max_lat": 15.08, "min_lng": -5.52, "max_lng": 2.40},
    "Niger": {"min_lat": 11.70, "max_lat": 23.52, "min_lng": 0.17, "max_lng": 15.99},
    "Togo": {"min_lat": 6.10, "max_lat": 11.14, "min_lng": -0.15, "max_lng": 1.80},
    "Sierra Leone": {"min_lat": 6.82, "max_lat": 10.00, "min_lng": -13.31, "max_lng": -10.28},
    "Angola": {"min_lat": -18.04, "max_lat": -4.39, "min_lng": 11.68, "max_lng": 24.09},
    "Mozambique": {"min_lat": -26.87, "max_lat": -10.47, "min_lng": 30.22, "max_lng": 40.84},
    "Guinea": {"min_lat": 7.19, "max_lat": 12.68, "min_lng": -15.08, "max_lng": -7.64},
    "Liberia": {"min_lat": 4.33, "max_lat": 8.55, "min_lng": -11.49, "max_lng": -7.37},
    "Gambia": {"min_lat": 13.06, "max_lat": 13.83, "min_lng": -16.84, "max_lng": -13.80},
    "Lesotho": {"min_lat": -30.68, "max_lat": -28.57, "min_lng": 27.01, "max_lng": 29.46},
    "Eswatini": {"min_lat": -27.32, "max_lat": -25.72, "min_lng": 30.79, "max_lng": 32.14},
    "Namibia": {"min_lat": -28.97, "max_lat": -16.96, "min_lng": 11.72, "max_lng": 25.26},
    "CAR": {"min_lat": 2.22, "max_lat": 11.01, "min_lng": 14.42, "max_lng": 27.46},
    "Chad": {"min_lat": 7.44, "max_lat": 23.45, "min_lng": 13.47, "max_lng": 24.00},
    "South Sudan": {"min_lat": 3.49, "max_lat": 12.24, "min_lng": 23.44, "max_lng": 35.95},
    "Sudan": {"min_lat": 8.68, "max_lat": 22.23, "min_lng": 21.82, "max_lng": 38.61},
    "Mauritania": {"min_lat": 14.72, "max_lat": 27.30, "min_lng": -17.07, "max_lng": -4.83},
    "Morocco": {"min_lat": 27.67, "max_lat": 35.92, "min_lng": -13.17, "max_lng": -1.00},
    "Algeria": {"min_lat": 18.97, "max_lat": 37.09, "min_lng": -8.67, "max_lng": 11.99},
    "Tunisia": {"min_lat": 30.24, "max_lat": 37.54, "min_lng": 7.52, "max_lng": 11.59},
    "Libya": {"min_lat": 19.50, "max_lat": 33.19, "min_lng": 9.39, "max_lng": 25.38},
    "Egypt": {"min_lat": 22.00, "max_lat": 31.68, "min_lng": 24.70, "max_lng": 36.90},
    "Djibouti": {"min_lat": 10.93, "max_lat": 12.72, "min_lng": 41.77, "max_lng": 43.42},
    "Eritrea": {"min_lat": 12.36, "max_lat": 18.00, "min_lng": 36.44, "max_lng": 43.15},
    "Gabon": {"min_lat": -3.98, "max_lat": 2.32, "min_lng": 8.70, "max_lng": 14.50},
    "Equatorial Guinea": {"min_lat": 1.00, "max_lat": 3.79, "min_lng": 5.62, "max_lng": 11.34},
    "Comoros": {"min_lat": -12.39, "max_lat": -11.36, "min_lng": 43.22, "max_lng": 44.54},
    "Mauritius": {"min_lat": -20.53, "max_lat": -19.99, "min_lng": 57.30, "max_lng": 57.79},
    "Seychelles": {"min_lat": -4.72, "max_lat": -4.28, "min_lng": 55.39, "max_lng": 56.00},
    "Cape Verde": {"min_lat": 14.80, "max_lat": 17.20, "min_lng": -25.36, "max_lng": -22.66},
    "São Tomé and Príncipe": {"min_lat": 0.02, "max_lat": 1.70, "min_lng": 6.46, "max_lng": 7.47},
    "Guinea-Bissau": {"min_lat": 10.96, "max_lat": 12.69, "min_lng": -16.72, "max_lng": -13.70},
}

COUNTRY_IP_RANGES = {
    "41.0.0.0/8": "Rwanda", "41.74.0.0/16": "Kenya",
    "41.57.0.0/16": "Nigeria", "41.67.0.0/16": "Ethiopia",
    "41.168.0.0/16": "South Africa", "41.203.0.0/16": "Ghana",
    "41.204.0.0/16": "Tanzania", "41.215.0.0/16": "Uganda",
    "41.216.0.0/16": "Zimbabwe", "41.217.0.0/16": "Zambia",
    "41.218.0.0/16": "DRC", "41.221.0.0/16": "Cameroon",
    "41.222.0.0/16": "Côte d'Ivoire", "41.223.0.0/16": "Senegal",
    "102.0.0.0/8": "South Africa", "105.0.0.0/8": "South Africa",
    "154.0.0.0/8": "Africa", "156.0.0.0/8": "Africa",
    "160.0.0.0/8": "Africa", "164.0.0.0/8": "Africa",
    "165.0.0.0/8": "Africa", "168.0.0.0/8": "Africa",
    "169.0.0.0/8": "Africa", "192.0.0.0/8": "Africa",
    "196.0.0.0/8": "South Africa", "197.0.0.0/8": "Africa",
    "41.130.0.0/16": "Ghana", "41.190.0.0/16": "Nigeria",
    "41.191.0.0/16": "Kenya", "41.210.0.0/16": "Tanzania",
    "41.212.0.0/16": "Uganda", "41.215.0.0/16": "Uganda",
    "105.16.0.0/12": "Rwanda", "105.20.0.0/14": "Kenya",
    "102.128.0.0/10": "DRC", "102.176.0.0/12": "Zimbabwe",
    "102.208.0.0/12": "Ethiopia", "102.216.0.0/12": "Nigeria",
}

IP_TO_COUNTRY_CACHE = {}


def ip_to_int(ip: str) -> int:
    parts = ip.split(".")
    return (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])


def ip_in_cidr(ip: str, cidr: str) -> bool:
    network, bits_str = cidr.split("/")
    bits = int(bits_str)
    ip_int = ip_to_int(ip)
    net_int = ip_to_int(network)
    mask = (0xFFFFFFFF << (32 - bits)) & 0xFFFFFFFF
    return (ip_int & mask) == (net_int & mask)


def detect_country_by_coordinates(lat: float, lng: float) -> Optional[str]:
    for country, box in AFRICA_BOUNDING_BOXES.items():
        if box["min_lat"] <= lat <= box["max_lat"] and box["min_lng"] <= lng <= box["max_lng"]:
            return country
    return None


def detect_country_by_ip(ip_address: str) -> Optional[str]:
    if ip_address in IP_TO_COUNTRY_CACHE:
        return IP_TO_COUNTRY_CACHE[ip_address]

    if ip_address.startswith("127.") or ip_address.startswith("10.") or ip_address.startswith("192.168."):
        return None

    for cidr, country in COUNTRY_IP_RANGES.items():
        if ip_in_cidr(ip_address, cidr):
            IP_TO_COUNTRY_CACHE[ip_address] = country
            return country

    return None


def detect_language(country: Optional[str], preferred_lang: Optional[str] = None) -> dict:
    if country and country in LANGUAGES_BY_COUNTRY:
        info = LANGUAGES_BY_COUNTRY[country]
        primary = info["primary"]
        lang_name = SUPPORTED_LANGUAGES.get(primary, primary)
        all_options = [primary] + info["others"]
        return {
            "country": country,
            "language": primary,
            "language_name": lang_name,
            "all_languages": [
                {"code": l, "name": SUPPORTED_LANGUAGES.get(l, l)}
                for l in all_options if l in SUPPORTED_LANGUAGES
            ],
        }

    if preferred_lang and preferred_lang in SUPPORTED_LANGUAGES:
        return {
            "country": "Unknown",
            "language": preferred_lang,
            "language_name": SUPPORTED_LANGUAGES[preferred_lang],
            "all_languages": [],
        }

    return {
        "country": "Unknown",
        "language": "en",
        "language_name": "English",
        "all_languages": [],
    }


def resolve_location(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    ip_address: Optional[str] = None,
    preferred_lang: Optional[str] = None,
) -> dict:
    country = None

    if latitude is not None and longitude is not None:
        country = detect_country_by_coordinates(latitude, longitude)

    if country is None and ip_address:
        country = detect_country_by_ip(ip_address)

    return detect_language(country, preferred_lang)
