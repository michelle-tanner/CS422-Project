// dropdown.js

// Usage:
//   <function-dropdown
//     color=""            -> the function's color (e.g. var(--color-function-green))
//     function-label=""   -> the function's name, shown on the dropdown
//     description=""      -> what the function does, shown when opened
//     ingredients='[]'    -> the function's ingredients, as a JSON list (shown when opened)
//                            e.g. '["Glycerin", "Squalane"]'
//     concern-label=""    -> optional: the selected skin concern's name (e.g. "Anti-Aging"), used in
//                            the text under "Common Ingredients"
//     concern-group=""    -> optional: how this function relates to that concern: gofor / thesehelp / avoid
//   ></function-dropdown>
//
// These attributes are filled in from the data we retrieve
// (see renderFunctions() in pages/functions.html and data/functions.json).

// Lists with at least this many ingredients get a search box
const SEARCH_MIN_INGREDIENTS = 10;

class MyDropdown extends HTMLElement {
  static get observedAttributes() {
    return ["color", "function-label", "description", "ingredients", "concern-label", "concern-group"];
  }

    // Open and Closing the dropdown
  connectedCallback() {
    this.render();

    // Ingredient search: typing filters the pills
    this.addEventListener("input", (event) => {
      if (event.target.closest(".ingredient-search input")) this.filterIngredients(event.target.value);
    });
    this.addEventListener("click", (event) => {
      // "Explore products": remember this function so the catalog starts with it checked
      if (event.target.closest(".explore-btn")) {
        FilterLists.setSelectedFunction(this.getAttribute("function-label") || "");
        return; // the link then opens the catalog as usual
      }

      const toggle = event.target.closest(".dropdown-toggle");
      if (!toggle) return;

      const content = this.querySelector(".dropdown-content");
      const isOpen = !content.hidden;
      content.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
      this.classList.toggle("is-open", !isOpen);
      if (!isOpen) this.showPills();
    });
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  // Builds the dropdown's HTML from the attributes
  render() {
    const color = this.getAttribute("color") || "var(--color-function-gray)"; // gray when no color is given
    const label = this.getAttribute("function-label") || "Function name";
    const description = this.getAttribute("description") || "Function description goes here.";
    const ingredients = parseIngredients(this.getAttribute("ingredients"));
    const isOpen = this.classList.contains("is-open"); // keep it open if it was open

    this.ingredientNames = ingredients.map(([name]) => name);
    this.pillsShown = 0;

    this.style.setProperty("--dropdown-color", color);

    this.innerHTML = `
      <div class="dropdown">
        <button type="button" class="dropdown-toggle" aria-expanded="${isOpen}">
          <span>${escapeText(label)}</span>
          <span class="arrow" aria-hidden="true"></span>
        </button>

        <div class="dropdown-content" ${isOpen ? "" : "hidden"}>
          <div class="dropdown-main">
          <p class="description">${escapeText(description)}</p>

          <h3 class="ingredients-heading">Common Ingredients</h3>
          <p class="ingredients-intro">${ingredientsIntro(
            label,
            this.getAttribute("concern-label"),
            this.getAttribute("concern-group")
          )}</p>
          ${ingredients.length
            ? `<!-- The box: search on top (long lists only), pills underneath -->
               <div class="ingredients-panel">`
            : ""}
          ${ingredients.length >= SEARCH_MIN_INGREDIENTS
            ? `<div class="ingredient-search">
                 <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                 <input
                   type="search"
                   placeholder="Search ${ingredients.length} ingredients"
                   aria-label="Search ${escapeText(label)} ingredients"
                   autocomplete="off"
                 />
               </div>
               <p class="ingredient-search-message" aria-live="polite">Type a name to find it in this list.</p>`
            : ""}
          ${ingredients.length
            ? `<!-- Pills are added by showPills() when the dropdown opens, so closed dropdowns stay fast.
                    Fixed height: long lists scroll inside it. -->
               <div class="ingredients"></div>

               <!-- Only shows when there are more pills than fit (see updateScrollHint) -->
               <p class="scroll-hint" hidden>Scroll to view more ingredients</p>
               </div>`
            : `<p class="placeholder">Ingredients go here.</p>`}
          </div>

          <a class="explore-btn" href="catalog.html?function=${encodeURIComponent(label)}">
            <span>Explore products for ${escapeText(label)}</span>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <style>
        function-dropdown {
          display: block;
          margin-bottom: var(--space-md);
        }

        /* Function button + dropdown */ 
        function-dropdown .dropdown {
          width: 75%;
          margin-inline: auto; /* center the dropdown left-to-right */
        }
        
        /* Function button -- opens dropdown */
        function-dropdown .dropdown-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%; /* fills wrapper */ 
          padding: var(--space-md) var(--space-xl);
          border: none;
          border-radius: var(--radius-lg);
          background-color: var(--dropdown-color);
          color: var(--color-text-white);
          font-family: var(--font-base);
          font-size: var(--font-size-2xl);
          font-weight: 700;
          cursor: pointer;
        }

        function-dropdown .dropdown-toggle span:not(.arrow) {
          text-box: trim-both cap alphabetic;
        }

        function-dropdown .arrow {
          flex-shrink: 0;
          width: 1.3em;
          height: 0.8em;
          clip-path: polygon(0 0, 100% 0, 50% 100%);
          background-color: currentColor;
          transition: transform 0.2s;
        }

        function-dropdown.is-open .dropdown-toggle {
          border-radius: var(--radius-lg) var(--radius-lg) 0 0; 
        }

        function-dropdown.is-open .dropdown-toggle .arrow {
          transform: rotate(180deg);
        }

        /* entire content of dropdown */ 
        function-dropdown .dropdown-content {
          padding: 25px 50px; 
          border: 2px solid var(--dropdown-color);
          border-top: none;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          background-color: var(--color-bg);
          display: flex;
          flex-direction: column;
        }

        /* "Explore products" button */ 
        function-dropdown .dropdown-main {
          flex: 1;
        }

        /* Explore button: same as the one in the home page's info panel */
        /* Outlined button; fills in on hover */
        function-dropdown .explore-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          align-self: flex-end; /* right side */
          margin-top: var(--space-lg); /* space between the ingredients box and this button */
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-pill);
          border: 2px solid var(--color-border-dark);
          background-color: transparent;
          color: var(--color-border-dark);
          font-weight: 700;
          text-decoration: none; /* no underline on the link */
          cursor: pointer;
          transition: background-color 0.15s, color 0.15s;
        }

        function-dropdown .explore-btn i {
          font-size: var(--font-size-base);
        }

        function-dropdown .explore-btn span {
          font-size: var(--font-size-lg);
        }

        function-dropdown .explore-btn:hover,
        function-dropdown .explore-btn:focus-visible {
          background-color: var(--color-border-dark);
          color: var(--color-text-light);
        }

        function-dropdown .explore-btn:focus-visible {
          outline: 3px solid var(--color-accent);
          outline-offset: 2px;
        }

        function-dropdown .dropdown-content[hidden] {
          display: none;
        }

        function-dropdown .description {
            font-size: var(--font-size-lg);
        }

        /* space between description and "Common Ingredients" */ 
        function-dropdown .dropdown-content p {
            margin: 0 0 var(--space-lg);
        }

        /* "Common Ingredients" */
        function-dropdown .ingredients-heading {
          margin: 0 0 var(--space-sm);
          font-size: var(--font-size-2xl);
          color: var(--color-text-muted);
        }

        /* Ingredient pills: a fixed-height area; long lists scroll inside it instead of stretching the page */
        function-dropdown .ingredients {
          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
          gap: var(--space-md);
          max-height: 260px;
          overflow-y: auto; /* faint scrollbar style comes from index.css */
        }

        /* "Scroll to view more ingredients" under the pills */
        function-dropdown .dropdown-content .scroll-hint {
          margin: var(--space-sm) 0 0;
          font-size: var(--font-size-sm);
          font-style: italic;
          color: var(--color-text-muted);
        }

        function-dropdown .scroll-hint[hidden] {
          display: none;
        }

        /* Text under "Common Ingredients" */
        function-dropdown .dropdown-content .ingredients-intro {
          margin: 0 0 var(--space-md);
          font-size: var(--font-size-base);
          font-style: italic;
          color: var(--color-text-muted);
        }

        function-dropdown .ingredients-intro strong {
          color: var(--color-text);
        }

        /* Ingredient search box */
        function-dropdown .ingredient-search {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 360px;
        }

        function-dropdown .ingredient-search i {
          position: absolute;
          left: 16px;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        function-dropdown .ingredient-search input {
          box-sizing: border-box;
          width: 100%;
          height: 40px;
          padding: 0 16px 0 44px;
          font-family: var(--font-base);
          font-size: var(--font-size-sm);
          color: var(--color-text);
          border: none;
          border-radius: var(--radius-pill);
          background-color: var(--color-accent-muted);
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.10);
        }

        function-dropdown .ingredient-search input::placeholder {
          font-style: italic;
          color: var(--color-text-muted);
        }

        function-dropdown .ingredient-search input:focus {
          outline: none;
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.4);
        }

        /* Hint / result message under the search box */
        function-dropdown .dropdown-content .ingredient-search-message {
          margin: var(--space-xs) 0 var(--space-md) var(--space-md);
          font-size: var(--font-size-sm);
          font-style: italic;
          color: var(--color-text-muted);
        }

        /* Pills that don't match the search */
        function-dropdown ingredient-pill[hidden] {
          display: none !important;
        }

        /* The box: always shown, holds the search bar (on top) and the pills */
        function-dropdown .ingredients-panel {
          padding: var(--space-md);
          border: 1.5px solid var(--color-accent-muted); /* soft pink outline, so the box shows on the beige */
          border-radius: var(--radius-md);
          background-color: var(--color-bg); /* same beige as the dropdown, no white */
        }

        /* A pill too wide for the box: it stops at the box's edge and its name ends in "...".
           Pills that fit are unchanged. updatePillTooltips() adds the full name as a tooltip on cut-off ones. */
        function-dropdown .ingredients ingredient-pill {
          max-width: 100%;
          min-width: 0;
        }

        function-dropdown .ingredients ingredient-pill .pill-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3; /* a bit taller than the pill's 1, so overflow: hidden doesn't clip letters like "g" */
          margin-block: -0.15em; /* ...without making the pill taller */
        }

        function-dropdown .ingredients ingredient-pill > button,
        function-dropdown .ingredients ingredient-pill .pill-actions {
          flex-shrink: 0; /* only the name shrinks, never the icons */
        }

        function-dropdown .placeholder {
          color: var(--color-text-muted);
          font-style: italic;
        }
      </style>
    `;

    this.watchIngredients();
    if (isOpen) this.showPills();
  }

  // Builds every ingredient's pill the first time the dropdown opens (needs pill.js)
  showPills() {
    const list = this.querySelector(".ingredients");
    if (!list || this.pillsShown) return;

    list.innerHTML = this.ingredientNames
      .map((name) => `<ingredient-pill label="${escapeText(name)}"></ingredient-pill>`)
      .join("");
    this.pillsShown = this.ingredientNames.length;
    requestAnimationFrame(() => { // after the new pills have their size
      this.updatePillTooltips();
      this.updateScrollHint();
    });
  }

  // "Scroll to view more ingredients" only shows when there are more pills than fit in the box
  updateScrollHint() {
    const list = this.querySelector(".ingredients");
    const hint = this.querySelector(".scroll-hint");
    if (list && hint) hint.hidden = list.scrollHeight <= list.clientHeight + 1;
  }

  // Cut-off names (ending in "...") get the full name as a tooltip; names that fit get none
  updatePillTooltips() {
    this.querySelectorAll(".ingredients ingredient-pill").forEach((pill) => {
      const label = pill.querySelector(".pill-label");
      if (!label) return;
      if (label.scrollWidth > label.clientWidth) label.title = pill.getAttribute("label") || label.textContent;
      else label.removeAttribute("title");
    });
  }

  // Shows only the pills whose name contains the query, inside the scrolling box.
  filterIngredients(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    const list = this.querySelector(".ingredients");
    const message = this.querySelector(".ingredient-search-message");
    if (!list) return;
    list.scrollTop = 0;
    requestAnimationFrame(() => { // after the pills are shown/hidden
      this.updatePillTooltips(); // pills shown again need their tooltip re-checked
      this.updateScrollHint();   // fewer pills may now fit without scrolling
    });

    if (!query) {
      list.querySelectorAll("ingredient-pill").forEach((pill) => { pill.hidden = false; });
      message.textContent = "Type a name to find it in this list.";
      return;
    }

    let matches = 0;
    list.querySelectorAll("ingredient-pill").forEach((pill) => {
      const match = (pill.getAttribute("label") || "").toLowerCase().includes(query);
      pill.hidden = !match;
      if (match) matches++;
    });

    const shown = rawQuery.trim();
    message.textContent = matches
      ? `${matches} of ${this.ingredientNames.length} ingredients match "${shown}".`
      : `No ingredients match "${shown}". Try a shorter or different spelling.`;
  }

  watchIngredients() {
    if (this.ingredientsObserver) this.ingredientsObserver.disconnect(); // stop watching the old row (render replaced it)

    const list = this.querySelector(".ingredients");
    if (!list) return;

    // The box changed size: different names may be cut off, and the scroll hint may change
    this.ingredientsObserver = new ResizeObserver(() => {
      this.updatePillTooltips();
      this.updateScrollHint();
    });
    this.ingredientsObserver.observe(list);
  }
}

// Turns the ingredients attribute (JSON text) into a list of [name, note] pairs.
// Accepts an object {"Glycerin": "note"} or an array ["Glycerin", "Squalane"].
function parseIngredients(json) {
  try {
    const data = JSON.parse(json || "{}");
    if (Array.isArray(data)) return data.map((name) => [name, ""]);
    return Object.entries(data);
  } catch {
    return []; // bad JSON -> show the placeholder
  }
}

// The sentence under "Common Ingredients". Names the skin concern when one is selected.
function ingredientsIntro(fnLabel, concernLabel, group) {
  const fn = `<strong>${escapeText(fnLabel)}</strong>`;
  if (!concernLabel) {
    return `The most notable and commonly used ingredients for the ${fn} function in skincare products.`;
  }
  const concern = `<strong>${escapeText(concernLabel)}</strong>`;
  if (group === "avoid") {
    return `The most notable and commonly used ingredients for the ${fn} function. ` +
      `If your concern is ${concern}, watch out for these, since this function can make it worse.`;
  }
  return `The most notable and commonly used ingredients for the ${fn} function in ${concern} products.`;
}

// Makes text safe to put into innerHTML (the data comes from outside).
function escapeText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

customElements.define("function-dropdown", MyDropdown);
