// ingredient-lists.js
// The user's INCLUDE and EXCLUDE ingredient lists, shared by the whole site.
//   - Pills read from it, so the same ingredient shows the same choice on every page.
//   - The catalog page can read it to filter products (getInclude / getExclude).
//
// Pill choice -> list:
//   green check ("check") -> INCLUDE
//   red x       ("x")     -> EXCLUDE
//   empty       ("")      -> in neither list
//
// Where the lists come from (for now):
//   1. saved choices in this browser (localStorage), if there are any
//   2. otherwise the starting lists INGREDIENT_LISTS from data/mock-data.js
// When the real data is ready, swap load() and save() below to read/write it
// (e.g. from the user's account); the rest of the site doesn't need to change.
//
// Usage:
//   IngredientLists.getStatus("Glycerin")          -> "check" | "x" | ""
//   IngredientLists.setStatus("Glycerin", "check") -> moves Glycerin into INCLUDE
//   IngredientLists.getInclude()                   -> ["Glycerin", ...]
//   IngredientLists.getExclude()                   -> ["Parfum", ...]
//
// Whenever a choice changes, an "ingredient-lists-change" event is sent on window
// with detail { name, status }, so every pill (or the catalog page) can update.

const IngredientLists = (() => {
  const STORAGE_KEY = "ingredient-lists";
  let lists = null; // { include: [...], exclude: [...] }, loaded on first use

  // Same ingredient even if the capitals or spaces differ ("glycerin " = "Glycerin")
  const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const without = (list, name) => list.filter((n) => !sameName(n, name));

  function load() {
    if (lists) return lists;

    // 1. saved choices in this browser
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) lists = JSON.parse(saved);
    } catch {
      // storage blocked or bad data: fall through to the starting lists
    }

    // 2. starting lists from the mock data (or empty if there isn't any)
    if (!lists) {
      const start = typeof INGREDIENT_LISTS !== "undefined" ? INGREDIENT_LISTS : {};
      lists = { include: [...(start.include || [])], exclude: [...(start.exclude || [])] };
    }
    return lists;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch {
      // storage blocked: the choice still works until the page is reloaded
    }
  }

  function announce(detail) {
    window.dispatchEvent(new CustomEvent("ingredient-lists-change", { detail }));
  }

  // A change made in another tab: reload the lists and tell this page's pills
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    lists = null;
    announce({}); // no name = "anything may have changed"
  });

  return {
    getStatus(name) {
      const { include, exclude } = load();
      if (include.some((n) => sameName(n, name))) return "check";
      if (exclude.some((n) => sameName(n, name))) return "x";
      return "";
    },

    setStatus(name, status) {
      const current = load();
      // take it out of both lists, then add it to the right one
      current.include = without(current.include, name);
      current.exclude = without(current.exclude, name);
      if (status === "check") current.include.push(name);
      if (status === "x") current.exclude.push(name);

      save();
      announce({ name, status });
    },

    getInclude() {
      return [...load().include];
    },

    getExclude() {
      return [...load().exclude];
    },
  };
})();
