# Lead scraper (Manchester dentists)

Runs **on your own computer** and writes prospects into the Supabase `scraped_leads`
table, which appears in the admin dashboard under **Leads**.

Nothing runs automatically. It is safe by default: without `--save` it only writes a
local `leads_preview.csv`.

## One-time setup

1. Apply the migration `supabase/migrations/20260917000000_scraped_leads.sql` to your
   Supabase project (SQL editor, or `supabase db push`).
2. Install (Python 3.10+):
   ```
   cd scraper
   python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   crawl4ai-setup
   ```
3. Download the free CQC care directory CSV from
   https://www.cqc.org.uk/about-us/transparency/using-cqc-data (look for "CQC care directory").
4. Copy `.env.example` to `.env` and fill in the Supabase URL and **service_role** key
   (Project Settings > API). Never commit `.env`; it is git-ignored.

## Run

```
python run.py --csv path/to/cqc_directory.csv --limit 20      # test: preview CSV only
python run.py --csv path/to/cqc_directory.csv --save          # upload to the dashboard
```

Re-running is safe: leads are matched by CQC location ID, and your status/notes are never
overwritten.

## Rules it follows

- Respects `robots.txt` and waits between requests (`--delay`).
- Skips chains (owners with more than `--max-sites` dental sites) and big practices.
- Tags each practice **OK to email** only when it is a limited company (UK PECR); partnerships
  and sole traders are tagged **Phone / letter** instead. Without a Companies House key this
  is guessed from the name, so unknown practices default to phone/letter.
- Check TPS/CTPS before cold calling, and include an opt-out in any cold email.
