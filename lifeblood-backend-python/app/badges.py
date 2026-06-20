LIFE_SAVER_THRESHOLD = 10
HERO_DONOR_THRESHOLD = 5


def get_badge(total_donations: int) -> str | None:
    if total_donations >= LIFE_SAVER_THRESHOLD:
        return "Life Saver"
    if total_donations >= HERO_DONOR_THRESHOLD:
        return "Hero Donor"
    return None
