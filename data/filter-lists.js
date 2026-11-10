// filter-lists.js

// What is stored in LocalStorage: 
// selectedConcern:   The user's selected skin concern  
// filter-lists:      INCLUDE and EXCLUDE ingredients list for the catalog page. The pill.js file 
//                    reads from filter-lists, so the same ingredient shows the SAME choice on every 
//                    page. 
//                    The catalog page can read this list to filter products (getInclude / getExclude)
//                    Saved choices are stored in the browser (localStorage), otherwise starting list 
//                    FILTER_LISTS from data/mock-data.js

// New users start with empty lists. Their choices are saved in this browser (localStorage),
// so they're still there after a reload.

// Functions:
//   FilterLists.getStatus(), getInclude(), getExclude(), setSelectedConcern(), getSelectedConcern()

const FilterLists = (() => {
  const STORAGE_KEY = "filter-lists";
  const CONCERN_KEY = "selectedConcern";
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

    getSelectedConcern() {
      try {
        return localStorage.getItem(CONCERN_KEY) || "";
      } catch {
        return ""; // storage blocked: treat it as no concern selected
      }
    },

    setSelectedConcern(id) {
      try {
        localStorage.setItem(CONCERN_KEY, id);
      } catch {
        // storage blocked: the page just won't remember the concern
      }
    },
  };
})();
