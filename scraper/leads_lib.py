"""Pure helpers (no network, no crawl4ai) so they can be tested on their own."""
import csv
import re
from collections import Counter

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
BAD_EMAIL_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js")
BAD_EMAIL_DOMAINS = ("sentry.io", "example.com", "wixpress.com", "domain.com")
DR_RE = re.compile(r"\bDr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)?)")
CORPORATE_HINT_RE = re.compile(r"\b(ltd|limited|llp|plc)\b\.?", re.I)
DENTAL_RE = re.compile(r"\bdent(al|ist|istry|ists)\b", re.I)
POSTCODE_RE = re.compile(r"^M\d{1,2}\s*\d[A-Z]{2}$", re.I)  # Manchester M postcodes


def find_col(headers: list[str], *candidates: str) -> str | None:
    """Return the first header whose lowercase text contains any candidate."""
    lowered = {h: h.lower() for h in headers}
    for cand in candidates:
        for h, low in lowered.items():
            if cand in low:
                return h
    return None


def load_cqc_csv(path: str) -> list[dict]:
    """Read the CQC care directory CSV. Skips any preamble rows above the header."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    header_idx = next(
        (i for i, r in enumerate(rows[:30]) if any("postcode" in c.lower() for c in r) and any("name" in c.lower() for c in r)),
        None,
    )
    if header_idx is None:
        raise SystemExit("Could not find a header row (needs 'Name' and 'Postcode' columns). Check the CSV.")
    headers = [h.strip() for h in rows[header_idx]]
    return [dict(zip(headers, r)) for r in rows[header_idx + 1:] if any(c.strip() for c in r)]


def extract_dental_locations(rows: list[dict], postcode_re=POSTCODE_RE) -> tuple[list[dict], Counter]:
    """Return (locations in the target area, owner -> number of dental sites nationwide)."""
    if not rows:
        return [], Counter()
    headers = list(rows[0].keys())
    c_name = find_col(headers, "name")
    c_post = find_col(headers, "postcode", "post code")
    c_phone = find_col(headers, "phone", "telephone")
    c_web = find_col(headers, "website")
    c_addr = find_col(headers, "address")
    c_types = find_col(headers, "service type", "service types", "type")
    c_owner = find_col(headers, "provider name", "provider", "owner")
    c_id = find_col(headers, "location id", "location_id", "cqc location")
    # The "Name" column can match "Provider name" first; prefer an exact location name column.
    for h in headers:
        if h.lower() in ("name", "location name", "service name"):
            c_name = h
            break

    owner_sites: Counter = Counter()
    dental = []
    for r in rows:
        if not DENTAL_RE.search((r.get(c_types) or "") + " " + (r.get(c_name) or "")):
            continue
        owner = (r.get(c_owner) or "").strip()
        if owner:
            owner_sites[owner] += 1
        dental.append(r)

    out = []
    for r in dental:
        postcode = (r.get(c_post) or "").strip()
        if not postcode_re.match(postcode):
            continue
        out.append({
            "cqc_location_id": (r.get(c_id) or "").strip() or None,
            "name": (r.get(c_name) or "").strip(),
            "website": normalise_url(r.get(c_web)),
            "phone": format_phone(r.get(c_phone)),
            "address": (r.get(c_addr) or "").strip() or None,
            "postcode": postcode.upper(),
            "owner_name": (r.get(c_owner) or "").strip() or None,
        })
    return out, owner_sites


def normalise_url(u: str | None) -> str | None:
    u = (u or "").strip()
    if not u:
        return None
    return u if u.lower().startswith("http") else "https://" + u


CHAIN_BRANDS = ("mydentist", "bupa", "portman", "oasis dental", "rodericks", "colosseum",
                "integrated dental", "dentex", "pearl dental", "tdl ", "dental care group")


def is_chain(*names: str | None) -> bool:
    """Big corporate groups have their own IT teams; local owner names can hide the brand."""
    return any(n and any(b in n.lower() for b in CHAIN_BRANDS) for n in names)


def guess_company_type(*names: str | None) -> str:
    """Name-based guess only. 'ltd' means a corporate subscriber under PECR (LLPs count).
    'Partnership' in the name is a strong sign of a partnership (not a corporate subscriber)."""
    if any(n and re.search(r"\bpartnership\b", n, re.I) for n in names):
        return "partnership_or_sole_trader"
    return "ltd" if any(n and CORPORATE_HINT_RE.search(n) for n in names) else "unknown"


def format_phone(raw: str | None) -> str | None:
    """The CQC file stores numbers as integers, so the leading 0 is lost."""
    digits = re.sub(r"\D", "", raw or "")
    if not digits:
        return None
    return digits if digits.startswith("0") else "0" + digits


def find_emails(text: str) -> list[str]:
    seen, out = set(), []
    for m in EMAIL_RE.findall(text):
        e = m.lower().strip(".")
        if e.endswith(BAD_EMAIL_SUFFIXES) or e.split("@")[1] in BAD_EMAIL_DOMAINS or e in seen:
            continue
        seen.add(e)
        out.append(e)
    return out


def pick_best_email(emails: list[str], website: str | None) -> str | None:
    """Prefer an address on the practice's own domain, then generic inboxes."""
    if not emails:
        return None
    domain = re.sub(r"^https?://(www\.)?", "", website or "").split("/")[0].lower()
    def rank(e: str):
        local, dom = e.split("@")
        return (domain not in dom if domain else 0, local not in ("info", "hello", "reception", "enquiries", "admin", "contact", "appointments"))
    return sorted(emails, key=rank)[0]


def count_dentists(text: str) -> int | None:
    names = {m.lower() for m in DR_RE.findall(text)}
    return len(names) or None


def detect_signals(text: str, sites_count: int | None) -> list[str]:
    t = text.lower()
    signals = []
    if re.search(r"(registration|medical history|new patient|patient)\s+form", t) and ".pdf" in t:
        signals.append("Patient forms are downloadable PDFs (paper/email intake)")
    online_booking = re.search(r"book (an appointment )?online|online booking|book now|patient portal|dentally|pearl|calendly|myhealth|simplybook", t)
    if not online_booking:
        signals.append("No online booking found")
    if re.search(r"(vacanc|careers|join our team|we are recruiting|we're recruiting)", t) and re.search(r"receptionist|practice manager|administrator|admin\b", t):
        signals.append("Hiring reception/admin staff")
    if re.search(r"referral form|refer a patient|referrals?\b.{0,40}\bdentists?", t):
        signals.append("Takes referrals from other dentists")
    if re.search(r"(membership|practice|our) (plan|scheme)", t) and not re.search(r"denplan|simply ?health|bupa dental", t):
        signals.append("In-house membership plan")
    if "nhs" in t and "private" in t:
        signals.append("Mixes NHS and private patients")
    if sites_count and sites_count >= 2:
        signals.append(f"Owner runs {sites_count} sites")
    return signals


SIGNAL_WEIGHTS = [
    ("Patient forms", 25), ("No online booking", 20), ("Hiring", 15),
    ("Takes referrals", 10), ("In-house membership", 15), ("Mixes NHS", 5), ("Owner runs", 10), ("No website", 10),
]


def score_lead(signals: list[str], dentists: int | None, email: str | None) -> int:
    score = sum(w for key, w in SIGNAL_WEIGHTS if any(s.startswith(key) for s in signals))
    if dentists and 2 <= dentists <= 6:
        score += 15
    if email:
        score += 5
    return min(score, 100)


def build_opener(name: str, signals: list[str]) -> str:
    hooks = {
        "Patient forms": "noticed new patients have to download and return PDF forms",
        "No online booking": "noticed there's no way to book online on your website",
        "Hiring": "saw you're hiring for the front desk",
        "In-house membership": "saw you run your own membership plan",
        "Takes referrals": "saw you take referrals from other dentists",
    }
    for key, text in hooks.items():
        if any(s.startswith(key) for s in signals):
            return f"Hi, I came across {name} and {text}. I build custom software that takes that kind of admin off the front desk. Worth a quick chat?"
    return f"Hi, I came across {name}. I build custom software for dental practices that takes admin off the front desk. Worth a quick chat?"
