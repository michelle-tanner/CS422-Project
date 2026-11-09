##Sources

###Functions come directly from inkeedecoder (https://inkeedecoder.com/ingredient-functions)

###Ingredients from from huggingface dataset, and are cross referenced with Functions (https://huggingface.co/datasets/Scanalyze/Skincare-ingredients)

###Products come from huggingface dataset, and are crossreferenced with the ingredients dataset(https://www.kaggle.com/datasets/eward96/skincare-products-clean-dataset)


###Components of each JSON file

####ingredients.json
  - name: str
  - function: [] list of strs that an ingredient maps to from inkeedecoder
  - rating: str from {"Safe", "Moderate Risk"}
  - description: str

####functions.json
  - label : str, name of function
  - ingredients : [] list of strs of all ingredients for a certain function from inkeedecoder
  - description: str

####products.json
  - name: str
  - url: str, http product page
  - type: str from {"Moisturizer", "Serum", "Oil", etc}
  - ingreds: [] list of strs, all map to entries in ingredients.json
  - price: str in GBP ("£6.20")
  - functions: [] list of str, from functions.json
  - image: str, http link for loading in js
  - desc: str