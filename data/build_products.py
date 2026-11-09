import ast
import json
import re
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup

# SCRIPT for building products.json
# Uses ingredients.json (and functions.json as a fallback) to add functions per product
# **Dependencies are both ingredients.json(build_ingreds.py), and functions.json(build_funcs.py)
# Reads a spreadsheet of products (skincare_small.csv--about 125 products) and identifies each products functions from its ingredients; web scrapes each shop page for the picture and description of the product.
# Saves NAME, URL, TYPE, INGREDS, PRICE, FUNCTIONS, IMAGE, and DESC to products.json  

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (CS422 class project)"

def norm(s):
    return " ".join(str(s).split()).lower()

#Get description and text from actual shop web page
def scrape(url):
    try:
        r = session.get(url, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"HTML Error: {e}")
        return pd.Series({"image": "", "desc": ""})
    time.sleep(0.5)
    img = soup.select_one("img.snap-center.mx-auto.object-cover")
    desc = soup.find(id="product-subtitle")
    return pd.Series({
        "image": img.get("src") if img else "",
        "desc": " ".join(desc.get_text().split()) if desc else "",
    })

#for looking up from functions to ingredients
lookup = {}

with open("ingredients.json", encoding="utf-8") as f:
    for row in json.load(f):
        lookup[norm(row["name"])] = row["function"]

with open("functions.json", encoding="utf-8") as f:
    for fn in json.load(f):
        for ing in fn["ingredients"]:
            funcs = lookup.setdefault(norm(ing), [])
            if not funcs or fn["label"] not in funcs:
                if fn["label"] not in funcs:
                    funcs.append(fn["label"])

def parse_ingreds(cell):
    if isinstance(cell, list):
        return cell
    try:
        return ast.literal_eval(cell)
    except (ValueError, SyntaxError):
        return [x.strip(" '\"[]") for x in str(cell).split(",")]

def get_functions(ingreds):
    found = set()
    for ing in ingreds:
        key = norm(ing)
        funcs = lookup.get(key)
        if funcs is None:  # try without parentheses
            funcs = lookup.get(norm(re.sub(r"\(.*?\)", "", key)), [])
        found.update(funcs)
    return sorted(found)

df = pd.read_csv("skincare_small.csv")
df = df.rename(columns={
    "product_name": "name",
    "product_type": "type",
    "clean_ingreds": "ingreds",
    "product_url": "url",
})

df["ingreds"] = df["ingreds"].apply(parse_ingreds)
df["ingreds"] = df["ingreds"].apply(lambda xs: list(dict.fromkeys(norm(x) for x in xs)))  # dedupe, keep order
df["functions"] = df["ingreds"].apply(get_functions)
df[["image", "desc"]] = df["url"].apply(scrape)

all_ings = {i for xs in df["ingreds"] for i in xs}
missing = sorted(i for i in all_ings if i not in lookup)
print(f"{len(missing)} of {len(all_ings)} ingredients had no match:")
print(missing)

df.to_json("products.json", orient="records", indent=2, force_ascii=False)