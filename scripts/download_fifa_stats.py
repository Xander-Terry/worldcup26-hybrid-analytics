import requests
import json
import urllib.parse
import time
from pathlib import Path

BASE = "https://gameday-prod.fifa.mangodev.co.uk/1-0/stories"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Origin": "https://www.fifa.com",
    "Referer": "https://www.fifa.com/",
    "Accept": "application/json, text/plain, */*"
}

OUTPUT_DIR = Path("data/raw_fifa")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ----------------------------
# AUTH
# ----------------------------
def get_token():
    r = requests.get(
        "https://cxm-api.fifa.com/fifaplusweb/api/external/gameDay/token",
        headers=HEADERS
    )
    r.raise_for_status()
    return r.json()["token"]


# ----------------------------
# FETCH SINGLE PAGE
# ----------------------------
def fetch_page(token, query):
    headers = HEADERS.copy()
    headers["Authorization"] = f"Bearer {token}"

    url = f"{BASE}?query={urllib.parse.quote(query)}&skip=0&limit=1"

    r = requests.get(url, headers=headers)
    r.raise_for_status()
    return r.json()


# ----------------------------
# PAGINATION EXPANDER
# ----------------------------
def fetch_all_pages(token, base_query):
    first = fetch_page(token, base_query)

    items = first["items"]
    tags = items[0].get("tags", [])

    page_count = 1
    for t in tags:
        if t["name"] == "urn:gd:tag:story:page_count":
            page_count = int(t["value"])

    all_items = []

    print(f"Detected {page_count} pages")

    for page in range(1, page_count + 1):

        paged_query = base_query.replace(
            "page:1$",
            f"page:{page}$"
        )

        url = f"{BASE}?query={urllib.parse.quote(paged_query)}&skip=0&limit=1"

        headers = HEADERS.copy()
        headers["Authorization"] = f"Bearer {token}"

        r = requests.get(url, headers=headers)
        r.raise_for_status()

        data = r.json()
        story = data["items"][0]

        all_items.append(story)

        print(f"Fetched page {page}/{page_count}")

        time.sleep(0.2)

    return all_items


# ----------------------------
# SAVE FUNCTION
# ----------------------------
def save_tab(tab_name, data):
    path = OUTPUT_DIR / f"{tab_name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Saved {tab_name}: {len(data)} stories → {path}")


# ----------------------------
# ALL TABS CONFIG
# ----------------------------
TABS = {
    "attack": "gcp_attack",
    "defense": "gcp_defending",
    "distribution": "gcp_distribution",
    "discipline": "gcp_discipline",
    "goalkeeping": "gcp_goalkeeping",
    "movement": "gcp_movement",
    "physical": "gcp_physical",
    "top_scorer": "gcp_top_scorer"
}


def build_query(classification):
    return (
        "(and resourceStatus==`urn:gd:resourceStatus:active` "
        f"_externalId~`urn:gd:story:classification:{classification}:competitionId:285023:(.*):rank_asc:page:1$`)"
    )


# ----------------------------
# MAIN PIPELINE
# ----------------------------
def main():
    token = get_token()

    for tab_name, classification in TABS.items():

        print("\n======================")
        print(f"Downloading tab: {tab_name}")
        print("======================")

        query = build_query(classification)

        try:
            data = fetch_all_pages(token, query)
            save_tab(tab_name, data)

        except Exception as e:
            print(f"FAILED {tab_name}: {e}")

        time.sleep(1)


if __name__ == "__main__":
    main()