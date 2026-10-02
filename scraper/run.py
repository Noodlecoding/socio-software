"""Find small/medium dental practices in Manchester and score them as leads.

SAFE BY DEFAULT: nothing is uploaded unless you pass --save. Without it the
results are written to scraper/leads_preview.csv only.

    python run.py --csv path/to/cqc_directory.csv --limit 20          # test, preview only
    python run.py --csv path/to/cqc_directory.csv --save              # upload to Supabase
"""
import argparse
import asyncio
import csv
import os
import re
import sys
import time
from urllib.parse import urljoin, urlparse

import httpx
from dotenv import load_dotenv

import leads_lib as L

PAGE_HINTS = ("team", "about", "contact", "form", "new-patient", "join", "career", "vacanc", "membership", "refer", "book")
USER_AGENT = "Mozilla/5.0 (compatible; SocioLeadResearch/1.0; +contact owner)"


def pick_pages(base: str, markdown: str, links: list[str], max_pages: int) -> list[str]:
    host = urlparse(base).netloc
    picked = []
    for href in links:
        full = urljoin(base, href)
        if urlparse(full).netloc != host or full in picked or full.rstrip("/") == base.rstrip("/"):
            continue
        if any(h in full.lower() for h in PAGE_HINTS):
            picked.append(full)
    return picked[:max_pages]


async def crawl_site(crawler, config, url: str, max_pages: int, delay: float) -> str:
    """Return combined markdown of the homepage plus a few useful subpages."""
    home = await crawler.arun(url=url, config=config)
    if not home.success:
        return ""
    texts = [home.markdown or ""]
    links = [l.get("href", "") for l in (home.links or {}).get("internal", [])]
    for page in pick_pages(url, texts[0], links, max_pages):
        await asyncio.sleep(delay)
        sub = await crawler.arun(url=page, config=config)
        if sub.success:
            texts.append(sub.markdown or "")
    return "\n\n".join(str(t) for t in texts)


def companies_house_lookup(client: httpx.Client, key: str, name: str, owner: str | None) -> str:
    """Return 'ltd' if an active company matches the owner/practice name, else 'unknown'."""
    for query in filter(None, [owner, name]):
        r = client.get("https://api.company-information.service.gov.uk/search/companies",
                       params={"q": query, "items_per_page": 3}, auth=(key, ""))
        if r.status_code != 200:
            continue
        for item in r.json().get("items", []):
            norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
            if item.get("company_status") == "active" and norm(item.get("title", "")).startswith(norm(query)[:12]):
                return "ltd"
    return "unknown"


def save_to_supabase(rows: list[dict]) -> None:
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in scraper/.env to use --save.")
    # status/notes are deliberately not sent, so re-running never overwrites your own edits.
    r = httpx.post(
        f"{url}/rest/v1/scraped_leads?on_conflict=cqc_location_id",
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=rows, timeout=60,
    )
    r.raise_for_status()
    print(f"Saved {len(rows)} leads to Supabase.")


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="CQC care directory CSV you downloaded")
    ap.add_argument("--limit", type=int, default=20, help="max practices to crawl (default 20)")
    ap.add_argument("--max-sites", type=int, default=6, help="skip owners with more dental sites than this (chains)")
    ap.add_argument("--max-dentists", type=int, default=8, help="skip practices with more dentists than this")
    ap.add_argument("--delay", type=float, default=2.0, help="seconds between page requests")
    ap.add_argument("--save", action="store_true", help="upload results to Supabase (default: CSV preview only)")
    args = ap.parse_args()
    load_dotenv()

    locations, owner_sites = L.extract_dental_locations(L.load_cqc_csv(args.csv))
    locations = [l for l in locations
                 if owner_sites.get(l["owner_name"] or "", 1) <= args.max_sites
                 and not L.is_chain(l["name"], l["owner_name"])]
    with_site = [l for l in locations if l["website"]]
    no_site = [l for l in locations if not l["website"]]
    print(f"{len(locations)} Manchester-area dental practices after removing chains: "
          f"{len(with_site)} with a website (crawling {min(args.limit, len(with_site))}), "
          f"{len(no_site)} without one (phone/letter leads).")

    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig  # imported late so tests don't need it

    ch_key = os.environ.get("COMPANIES_HOUSE_API_KEY")
    ch_client = httpx.Client(timeout=20)
    config = CrawlerRunConfig(check_robots_txt=True, page_timeout=30000)
    results = []

    async with AsyncWebCrawler(config=BrowserConfig(headless=True, user_agent=USER_AGENT)) as crawler:
        for loc in with_site[: args.limit]:
            print(f"- {loc['name']} ({loc['website']})")
            try:
                text = await crawl_site(crawler, config, loc["website"], max_pages=4, delay=args.delay)
            except Exception as exc:  # one broken site must not stop the run
                print(f"  skipped: {exc}")
                continue
            await asyncio.sleep(args.delay)
            if not text:
                continue
            dentists = L.count_dentists(text)
            if dentists and dentists > args.max_dentists:
                print(f"  skipped: {dentists} dentists (too big)")
                continue
            sites = owner_sites.get(loc["owner_name"] or "", 1)
            email = L.pick_best_email(L.find_emails(text), loc["website"])
            signals = L.detect_signals(text, sites)
            ctype = L.guess_company_type(loc["name"], loc["owner_name"])
            if ctype == "unknown" and ch_key:
                ctype = companies_house_lookup(ch_client, ch_key, loc["name"], loc["owner_name"])
                time.sleep(0.6)  # Companies House allows ~600 requests / 5 min
            results.append({
                **loc,
                "city": "Manchester",
                "email": email,
                "company_type": ctype,
                "can_cold_email": ctype == "ltd" and bool(email),
                "team_size": dentists,
                "sites_count": sites,
                "signals": signals,
                "score": L.score_lead(signals, dentists, email),
                "opener": L.build_opener(loc["name"], signals),
            })

    for loc in no_site:
        ctype = L.guess_company_type(loc["name"], loc["owner_name"])
        sites = owner_sites.get(loc["owner_name"] or "", 1)
        signals = L.detect_signals("", sites)
        signals = [x for x in signals if not x.startswith("No online booking")] + ["No website listed"]
        results.append({
            **loc, "city": "Manchester", "email": None, "company_type": ctype,
            "can_cold_email": False, "team_size": None, "sites_count": sites,
            "signals": signals, "score": L.score_lead(signals, None, None),
            "opener": L.build_opener(loc["name"], signals),
        })

    results.sort(key=lambda r: r["score"], reverse=True)
    with open("leads_preview.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["score", "name", "email", "phone", "website", "company_type", "can_cold_email", "dentists", "sites", "signals"])
        for r in results:
            w.writerow([r["score"], r["name"], r["email"], r["phone"], r["website"], r["company_type"],
                        r["can_cold_email"], r["team_size"], r["sites_count"], "; ".join(r["signals"])])
    print(f"Wrote {len(results)} leads to leads_preview.csv")

    if args.save and results:
        save_to_supabase(results)
    elif not args.save:
        print("Preview only. Re-run with --save to upload to your dashboard.")


if __name__ == "__main__":
    asyncio.run(main())
