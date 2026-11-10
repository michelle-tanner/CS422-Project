// filter-lists.js

// What is stored in LocalStorage: 
// selectedConcerns:  List of the user's selected skin concern ids, e.g. ["acne", "dryness"].
//                    The home page sets it to the one concern picked there; the catalog's Concerns
//                    checkboxes add/remove from it. The last one in the list is the most recent.
// selectedFunctions: List of selected function labels, e.g. ["soothing"]. "Explore products" on
//                    the functions page sets it to that one function; the catalog's Functions
//                    checkboxes add/remove from it.
// filter-lists:      INCLUDE and EXCLUDE ingredients list for the catalog page. The pill.js file 
//                    reads from filter-lists, so the same ingredient shows the SAME choice on every 
//                    page. 
//                    The catalog page can read this list to filter products (getInclude / getExclude)
//                    Saved choices are stored in the browser (localStorage), otherwise starting list 
//                    FILTER_LISTS from data/mock-data.js

// New users start with empty lists. Their choices are saved in this browser (localStorage),
// so they're still there after a reload.

// Functions:
//   FilterLists.getStatus(), getInclude(), getExclude(),
//   getSelectedConcerns(), setSelectedConcerns(list), getSelectedConcern(), setSelectedConcern(id),
//   getSelectedFunctions(), setSelectedFunctions(list), setSelectedFunction(label)

const FilterLists = (() => {
  const STORAGE_KEY = "filter-lists";
  const CONCERNS_KEY = "selectedConcerns";
  const FUNCTIONS_KEY = "selectedFunctions";
  const OLD_CONCERN_KEY = "selectedConcern"; // older single-concern string, read once and moved over
  let lists = null; // { include: [...], exclude: [...] }, loaded on first use

  // Same ingredient even if the capitals or spaces differ ("glycerin " = "Glycerin")
  const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const without = (list, name) => list.filter((n) => !sameName(n, name));

  function load() {
    if (lists) return lists;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) lists = JSON.parse(saved);
    } catch {
      // storage blocked or bad data: start empty instead
    }

    if (!lists) lists = { include: [], exclude: [] };
    return lists;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch {
      // storage blocked: the choice still works until the page is reloaded
    }
  }

  // Read / write a saved list (e.g. selectedConcerns). null = nothing saved (or storage blocked / bad data)
  function readList(key) {
    try {
      const list = JSON.parse(localStorage.getItem(key));
      return Array.isArray(list) ? list : null;
    } catch {
      return null;
    }
  }

  function writeList(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify([...list]));
    } catch {
      // storage blocked: the choice still works until the page is reloaded
    }
  }

  function announce(detail) {
    window.dispatchEvent(new CustomEvent("filter-lists-change", { detail }));
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

    // All selected concern ids
    getSelectedConcerns() {
      const saved = readList(CONCERNS_KEY);
      if (saved) return saved;
      try {
        // Older saves kept one concern as a plain string: move it into the list
        const old = localStorage.getItem(OLD_CONCERN_KEY);
        if (old) {
          writeList(CONCERNS_KEY, [old]);
          localStorage.removeItem(OLD_CONCERN_KEY);
          return [old];
        }
      } catch {}
      return [];
    },

    setSelectedConcerns(ids) {
      writeList(CONCERNS_KEY, ids);
    },

    // The one concern the functions page shows: the most recently selected
    getSelectedConcern() {
      return this.getSelectedConcerns().at(-1) || "";
    },

    // Home page: picking a concern there replaces the list with just that one
    setSelectedConcern(id) {
      writeList(CONCERNS_KEY, id ? [id] : []);
    },

    // All selected function labels
    getSelectedFunctions() {
      return readList(FUNCTIONS_KEY) || [];
    },

    setSelectedFunctions(labels) {
      writeList(FUNCTIONS_KEY, labels);
    },

    // Functions page "Explore products": replaces the list with just that one function
    setSelectedFunction(label) {
      writeList(FUNCTIONS_KEY, label ? [label] : []);
    },
  };
})();
