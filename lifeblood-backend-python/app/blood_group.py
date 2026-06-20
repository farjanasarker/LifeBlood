TO_API = {
    "A+": "A_PLUS",
    "A-": "A_NEG",
    "B+": "B_PLUS",
    "B-": "B_NEG",
    "AB+": "AB_PLUS",
    "AB-": "AB_NEG",
    "O+": "O_PLUS",
    "O-": "O_NEG",
}

TO_DB = {api: db for db, api in TO_API.items()}


def to_api(db_value: str | None) -> str | None:
    if db_value is None:
        return None
    if db_value not in TO_API:
        raise ValueError(f"Unknown blood group value from DB: {db_value}")
    return TO_API[db_value]


def to_db(api_value: str | None) -> str | None:
    if api_value is None:
        return None
    if api_value not in TO_DB:
        raise ValueError(f"Unknown blood group: {api_value}")
    return TO_DB[api_value]
