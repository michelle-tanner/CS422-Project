import pandas as pd
import numpy as np
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datasets import load_dataset
import json

# Script for building functions.json, 
# Scrapes inkeedecoder for both functions/function descriptions and ingredients mapping to each function
# Saves each function to functions.json with LABEL, DESCRIPTION, and INGREDIENTS (a list of ingredients with that function)

#for scraping incidecoder
URL_BASE = "https://inkeedecoder.com"
URL_START = "https://inkeedecoder.com/ingredient-functions"
funcsList = []
#unique_ingreds = set()

def build_funcs(url):
  try:
    page = requests.get(url) #Initial request to base page with funtion
    soup = BeautifulSoup(page.text, "html.parser")
    for tag in soup.find_all('a', class_ ="klavika simpletextlistitem"):
      if not tag:
        continue
      pageUrl = urljoin(URL_BASE, tag.get("href")) # Go within function page for more info
      page = requests.get(pageUrl)
      soup2 = BeautifulSoup(page.text, "html.parser")

      li_tags = soup2.find_all('a', class_="klavika simpletextlistitem")
      n=0 # offset number
      ingreds = []

      #Iterate through multiple pages of ingredients within each function
      #Stops when there are no more ingredient tags for a given function
      while li_tags: 
        ingreds += [myTag.get_text().lower() for myTag in li_tags]
        #unique_ingreds.update(ingreds)
        n+=1
        offsetUrl = urljoin(pageUrl, f"?offset={n}")
        page = requests.get(offsetUrl)
        soup2 = BeautifulSoup(page.text, "html.parser")
        li_tags = soup2.find_all('a', class_="klavika simpletextlistitem")

      print(f"Broken out of {tag.get_text()} at n={n}")

      desc = soup2.find('p')
      funcObj = {
        "label":tag.get_text(),
        "ingredients": ingreds,
        "description":desc.get_text().strip(),
      }
      # print()
      # print(funcObj)
      # print()
      funcsList.append(funcObj)
    
    return funcsList
  
  except requests.exceptions.ConnectionError as e:
    print(f'HTML Error:{e}')
    return ''

fullList = build_funcs(URL_START)

#unqiue_ingreds = sorted(unique_ingreds)
#print(unique_ingreds)

with open("functions.json", "w", encoding="utf-8") as f:
  json.dump(fullList, f, indent=2, ensure_ascii=False)