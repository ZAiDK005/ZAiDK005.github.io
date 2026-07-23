import urllib.request
import xml.etree.ElementTree as ET
import email.utils
import datetime
import json

FEEDS = {
    "rbi": [
        "https://www.rbi.org.in/notifications_rss.xml",
        "https://www.rbi.org.in/pressreleases_rss.xml",
    ],
    "sebi": [
        "https://www.sebi.gov.in/sebirss.xml",
    ],
}

WINDOW_HOURS = 72


def count_recent_items(url, hours=WINDOW_HOURS):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=20).read()
    root = ET.fromstring(data)
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=hours)
    count = 0
    for item in root.iter("item"):
        pub_el = item.find("pubDate")
        if pub_el is None or not pub_el.text:
            continue
        try:
            dt = email.utils.parsedate_to_datetime(pub_el.text)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            if dt >= cutoff:
                count += 1
        except Exception:
            continue
    return count


def main():
    result = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "window_hours": WINDOW_HOURS,
        "counts": {},
    }

    for key, urls in FEEDS.items():
        total = 0
        got_any = False
        for url in urls:
            try:
                total += count_recent_items(url)
                got_any = True
            except Exception as e:
                print(f"WARN: failed to fetch {url}: {e}")
        result["counts"][key] = total if got_any else None

    with open("notices.json", "w") as f:
        json.dump(result, f, indent=2)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
