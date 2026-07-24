import json
import datetime
import re
import urllib.request
import email.utils
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

WINDOW_HOURS = 72

# ==========================================
# 1. RSS FEED CONFIGURATION
# ==========================================
FEEDS = {
    "rbi": [
        "https://www.rbi.org.in/notifications_rss.xml",
        "https://www.rbi.org.in/pressreleases_rss.xml",
    ],
    "sebi": [
        "https://www.sebi.gov.in/sebirss.xml",
    ],
    "pib": [
        "https://pib.gov.in/newsite/rssenglish.aspx"
    ]
}

def count_rss_items(url, hours=WINDOW_HOURS):
    """Fetches and parses RSS feeds using BeautifulSoup to handle broken XML."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    data = urllib.request.urlopen(req, timeout=20).read()
    
    # Using BeautifulSoup instead of ElementTree because government XML is often broken/invalid
    soup = BeautifulSoup(data, 'xml') 
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=hours)
    
    count = 0
    items = soup.find_all("item")
    for item in items:
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

# ==========================================
# 2. HEADLESS SCRAPER CONFIGURATION
# ==========================================
SCRAPE_TARGETS = {
    "gst": {
        "url": "https://services.gst.gov.in/services/advisoryandreleases",
        "selector": "p.news-item--date",
        "format": "%b %d, %Y"
    },
    "itd": {
        "url": "https://www.incometax.gov.in/iec/foportal/",
        "selector": "div.views-field-field-news-uploaded-date",
        "format": "%d %b %Y"
    },
    "mca21": {
        "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
        "selector": "div.doc-date",
        "format": "%d-%m-%Y"
    },
    "nse": {
        "url": "https://www.nseindia.com/resources/exchange-communication-circulars",
        "selector": "table#CircularTable tbody tr td:first-child",
        "format": "%B %d, %Y"
    },
    "bse": {
        "url": "https://www.bseindia.com/markets/MarketInfo/NoticesCirculars.aspx?id=0",
        "selector": "td.ng-star-inserted:nth-child(2)",
        "format": "%d/%m/%Y"
    }
}

def clean_date_string(date_str):
    """Strips ordinal indicators (st, nd, rd, th) and extra spaces."""
    date_str = date_str.strip()
    return re.sub(r'(?<=\d)(st|nd|rd|th)', '', date_str)

def scrape_dynamic_portal(target_config, hours=WINDOW_HOURS):
    """Launches Playwright with stealth settings to evaluate dynamic JS."""
    count = 0
    cutoff_time = datetime.datetime.now() - datetime.timedelta(hours=hours)

    with sync_playwright() as p:
        # Added extra arguments to bypass Cloudflare/Akamai bot detection
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--ignore-certificate-errors", "--disable-http2"],

        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            }
        )
        page = context.new_page()
        
        try:
            page.goto(target_config["url"], wait_until="domcontentloaded", timeout=45000)
            
            html = page.content()
            soup = BeautifulSoup(html, 'html.parser')
            date_elements = soup.select(target_config["selector"])
            
            for el in date_elements:
                raw_date_str = clean_date_string(el.text)
                try:
                    notice_date = datetime.datetime.strptime(raw_date_str, target_config["format"])
                    if notice_date >= cutoff_time:
                        count += 1
                except ValueError:
                    continue
                    
        except Exception as e:
            print(f"WARN: Failed to scrape {target_config['url']}: {e}")
            return None
        finally:
            context.close()
            browser.close()
            
    return count

# ==========================================
# 3. MAIN ORCHESTRATOR
# ==========================================
def main():
    result = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "window_hours": WINDOW_HOURS,
        "counts": {}
    }

    print("Processing RSS feeds...")
    for key, urls in FEEDS.items():
        total = 0
        got_any = False
        for url in urls:
            try:
                total += count_rss_items(url)
                got_any = True
            except Exception as e:
                print(f"WARN: Failed to fetch RSS {url}: {e}")
        result["counts"][key] = total if got_any else None

    print("Processing dynamic headless targets...")
    for key, config in SCRAPE_TARGETS.items():
        print(f" -> Scraping {key.upper()}...")
        result["counts"][key] = scrape_dynamic_portal(config)

    with open("notices.json", "w") as f:
        json.dump(result, f, indent=2)

    print("Update complete.")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()