// mock-data.js
// MOCK DATA: stand-in data so the pages have something to show before the real data is hooked up.
// When the real data is ready, load it into the same variable names below
// (same shape), then delete this file and its <script> tag.

// ---- Ingredient INCLUDE / EXCLUDE lists ----
// The starting choices for the pills' circle (used by data/ingredient-lists.js
// until the user makes their own choices, which are then saved in the browser).
//   include -> ingredients the user wants  (pill shows a green check)
//   exclude -> ingredients the user avoids (pill shows a red x)
const INGREDIENT_LISTS = {
  include: ["Glycerin", "Niacinamide"],
  exclude: ["Parfum"],
};
