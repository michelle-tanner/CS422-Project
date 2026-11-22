import json, os, time, requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("NCBI_API_KEY")  # in .env: NCBI_API_KEY=your_key_here
if not API_KEY:
    raise SystemExit("NCBI_API_KEY not found in .env")

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
COMMON = {"tool": "myskindex", "email": "your-real-email@example.com", "api_key": API_KEY}
DELAY = 0.12  # stays safely under 10 requests/second
OUT = "research.json"


def get_json(endpoint, params, retries=4):
    """GET with a timeout, retrying on rate limits and server errors."""
    for attempt in range(retries):
        try:
            r = requests.get(f"{EUTILS}/{endpoint}", params={**COMMON, **params}, timeout=30)
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(2 ** attempt)  # wait 1s, 2s, 4s, 8s
                continue
            r.raise_for_status()
            return r.json()
        except (requests.RequestException, ValueError):
            time.sleep(2 ** attempt)
    return None  # gave up on this one


def pubmed_for(name, n=3):
    clean = name.replace('"', "")  # a stray quote would break the search term
    term = (f'"{clean}"[Title/Abstract] AND (skin OR topical OR dermal OR cosmetic) '
            'AND (review[pt] OR "clinical trial"[pt] OR "randomized controlled trial"[pt])')
    data = get_json("esearch.fcgi", {"db": "pubmed", "term": term, "retmax": n,
                                     "sort": "relevance", "retmode": "json"})
    if data is None:
        return None  # None = failed (retry next run); [] = searched, nothing found
    ids = data["esearchresult"].get("idlist", [])
    if not ids:
        return []

    time.sleep(DELAY)
    summary = get_json("esummary.fcgi", {"db": "pubmed", "id": ",".join(ids), "retmode": "json"})
    if summary is None:
        return None
    result = summary["result"]
    return [{
        "pmid": i,
        "title": result[i]["title"],
        "journal": result[i]["source"],
        "year": result[i]["pubdate"][:4],
        "url": f"https://pubmed.ncbi.nlm.nih.gov/{i}/",
    } for i in ids if i in result]


with open("ingredients.json", encoding="utf-8") as f:
    names = [i["name"] for i in json.load(f)]

# Resume: keep anything already saved
research = {}
if os.path.exists(OUT):
    with open(OUT, encoding="utf-8") as f:
        research = json.load(f)

todo = [n for n in names if n not in research]
print(f"{len(research)} already done, {len(todo)} to go")

try:
    for count, name in enumerate(todo, 1):
        print(f"trying {count}:{name}")
        papers = pubmed_for(name)
        if papers is not None:       # failures are left out so the next run retries them
            research[name] = papers
        time.sleep(DELAY)
        if count % 50 == 0:          # save every 50 ingredients
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(research, f, indent=2, ensure_ascii=False)
            print(f"{count}/{len(todo)}")
finally:
    with open(OUT, "w", encoding="utf-8") as f:   # also saves on Ctrl+C or a crash
        json.dump(research, f, indent=2, ensure_ascii=False)