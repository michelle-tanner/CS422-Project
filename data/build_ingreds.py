import json
import re
import pandas as pd

# Script for building ingredients.JSON
# **functions.JSON (build_funcs.py) is a dependency for getting functions per ingredient

def norm(s):
    return " ".join(str(s).split()).lower()

with open("functions.JSON", encoding="utf-8") as f:
    functions = json.load(f)

ing_to_funcs = {}
for fn in functions:
    for ing in fn["ingredients"]:
        funcs = ing_to_funcs.setdefault(norm(ing), [])
        if fn["label"] not in funcs:
            funcs.append(fn["label"])

df = pd.read_csv("hf://datasets/Scanalyze/Skincare-ingredients/copy paste final.csv")
df = df.rename(columns={
    "Ingredient Name": "name",
    "Function": "function",
    "Safety Rating": "rating",
    "Brief Description": "description",
})
df["name"] = df["name"].map(norm)
df = df.drop_duplicates(subset="name", keep="first").reset_index(drop=True)

def name_variants(name):
    """'sodium lauryl sulfate (sls)' -> ['sodium lauryl sulfate (sls)',
    'sodium lauryl sulfate', 'sls']"""
    variants = [name]
    stripped = norm(re.sub(r"\(.*?\)", "", name))
    if stripped and stripped not in variants:
        variants.append(stripped)
    for inner in re.findall(r"\((.*?)\)", name):
        inner = norm(inner)
        if inner and inner not in variants:
            variants.append(inner)
    return variants

def get_functions(name):
    found = []
    for v in name_variants(name):
        for f in ing_to_funcs.get(v, []):
            if f not in found:
                found.append(f)
    return found

df["function"] = df["name"].map(get_functions)

covered = {v for name in df["name"] for v in name_variants(name)}

#Get ingredients not within dataset but from inkee functions
#These entries have no description or rating as those are only provided by dataset ingredients
extra = pd.DataFrame(
    [
        {"name": name, "function": funcs, "rating": "", "description": ""}
        for name, funcs in ing_to_funcs.items()
        if name not in covered
    ],
    columns=["name", "function", "rating", "description"],
)

df["rating"] = df["rating"].fillna("")
df["description"] = df["description"].fillna("")

df = pd.concat([df, extra], ignore_index=True)

assert df["name"].is_unique, df[df["name"].duplicated()]["name"].tolist()

empty = df["function"].str.len() == 0
print(f"{len(df) - len(extra)} from dataset, {len(extra)} added from functions.JSON")
print(f"{empty.sum()} dataset ingredients matched no function")
print(sorted(df.loc[empty, "name"]))

df.to_json("ingredients.JSON", orient="records", indent=2, force_ascii=False)