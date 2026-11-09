// mock-data.js
// MOCK DATA: stand-in data so the pages have something to show before the real data is hooked up.
// When the real data is ready, load it into the same variable names below
// (same shape), then delete this file and its <script> tag.

// ---- Functions page ----
// One object per function. Each one becomes a <function-dropdown>.
//   label        -> the function's name, shown on the dropdown button
//   color        -> the dropdown's color (a CSS color or a token from index.css)
//   description  -> what the function does, shown when opened
//   ingredients  -> list of ingredient names, each one becomes an <ingredient-pill>
const FUNCTIONS = [
  {
    label: "Hydrating",
    color: "var(--color-function-green)",
    description:
      "The official definition from CosIng is that ingredients that help 'lightening discomfort of the skin'. Nice anti-inflammatory and ani-irritant ingredients belong to this category that reduce inflammation and soothe the skin. They are helpful in general to slow the aging process of the skin and they are super helpful for several common skin diseases like acne, rosacea or sensitive skin.",
    ingredients: [
      "Glycerin", "Hyaluronic acid", "Squalane", "Niacinamide", "Panthenol", "Allantoin",
      "Centella asiatica", "Ceramide NP", "Aloe vera", "Bisabolol", "Madecassoside", "Beta-glucan",
      "Oat extract", "Green tea extract", "Licorice root extract", "Urea", "Sodium PCA", "Betaine",
    ],
  },
  {
    label: "Exfoliating",
    color: "var(--color-function-blue)",
    description:
      "Helps loosen and remove dead skin cells from the surface, for smoother, brighter-looking skin.",
    ingredients: ["Glycolic acid", "Lactic acid", "Salicylic acid", "Mandelic acid", "Gluconolactone"],
  },
  {
    label: "Fragrance",
    color: "var(--color-function-red)",
    description:
      "Adds a scent to the product. Can irritate sensitive skin.",
    ingredients: ["Parfum", "Linalool", "Limonene", "Citronellol", "Geraniol"],
  },
];

// ---- Functions page: OTHER functions ----
// Shown when the toggle is switched to the right side.
// Same shape as FUNCTIONS, but with no color, so every dropdown is gray (--color-function-gray).
const OTHER_FUNCTIONS = [
  {
    label: "Emulsifying",
    description: "Helps oil and water mix together, so the product stays smooth and doesn't separate.",
    ingredients: ["Cetearyl alcohol", "Polysorbate 20", "Glyceryl stearate", "Lecithin"],
  },
  {
    label: "Preservative",
    description: "Keeps bacteria and mold from growing, so the product lasts longer.",
    ingredients: ["Phenoxyethanol", "Ethylhexylglycerin", "Sodium benzoate", "Potassium sorbate"],
  },
  {
    label: "Viscosity controlling",
    description: "Makes the product thicker or thinner, so it has the right texture.",
    ingredients: ["Xanthan gum", "Carbomer", "Hydroxyethylcellulose", "Sodium chloride"],
  },
];

// ---- Ingredient INCLUDE / EXCLUDE lists ----
// The starting choices for the pills' circle (used by data/ingredient-lists.js
// until the user makes their own choices, which are then saved in the browser).
//   include -> ingredients the user wants  (pill shows a green check)
//   exclude -> ingredients the user avoids (pill shows a red x)
const INGREDIENT_LISTS = {
  include: ["Glycerin", "Niacinamide"],
  exclude: ["Parfum"],
};
