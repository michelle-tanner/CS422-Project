// dropdown.js

// Usage:
//   <function-dropdown
//     color=""            -> the function's color (e.g. var(--color-function-green))
//     function-label=""   -> the function's name, shown on the dropdown
//     description=""      -> what the function does, shown when opened
//     ingredients='[]'    -> the function's ingredients, as a JSON list (shown when opened)
//                            e.g. '["Glycerin", "Squalane"]'
//   ></function-dropdown>
//
// These attributes are filled in from the data we retrieve
// (see renderFunctions() in pages/functions.html and data/functions.json).

// How many pills to build when a dropdown first opens. The rest are built on "more ingredients".
const INITIAL_PILL_COUNT = 30;

class MyDropdown extends HTMLElement {
  static get observedAttributes() {
    return ["color", "function-label", "description", "ingredients"];
  }

    // Open and Closing the dropdown
  connectedCallback() {
    this.render();
    this.addEventListener("click", (event) => {
      const more = event.target.closest(".more-ingredients");
      if (more) {
        const list = this.querySelector(".ingredients");
        const isExpanded = list.classList.toggle("is-expanded");
        if (isExpanded) this.showPills(this.ingredientNames.length);
        more.setAttribute("aria-expanded", String(isExpanded));
        more.querySelector(".more-text").textContent = isExpanded ? "fewer ingredients" : "more ingredients";
        return;
      }

      const toggle = event.target.closest(".dropdown-toggle");
      if (!toggle) return;

      const content = this.querySelector(".dropdown-content");
      const isOpen = !content.hidden;
      content.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
      this.classList.toggle("is-open", !isOpen);
      if (!isOpen) this.showPills(INITIAL_PILL_COUNT);
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
          ${ingredients.length
            ? `<!-- Pills are added by showPills() when the dropdown opens, so closed dropdowns stay fast -->
               <div class="ingredients"></div>

               <!-- Only shows when the pills don't fit on one line (see watchIngredients) -->
               <button type="button" class="more-ingredients" aria-expanded="false" hidden>
                 <span class="more-text">more ingredients</span>
                 <span class="arrow" aria-hidden="true"></span>
               </button>`
            : `<p class="placeholder">Ingredients go here.</p>`}
          </div>

          <a class="explore-btn" href="catalog.html?function=${encodeURIComponent(label)}">
            <span>Explore products</span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
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
        function-dropdown .explore-btn {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          align-self: flex-end; /* right side */
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          color: var(--color-border-dark);
          font-size: var(--font-size-xl);
          font-weight: 700;
          text-decoration: none; 
        }

        function-dropdown .explore-btn i {
          font-size: var(--font-size-2xl);
        }

        function-dropdown .explore-btn span {
          font-size: var(--font-size-lg);
        }

        function-dropdown .explore-btn:hover,
        function-dropdown .explore-btn:focus-visible {
          background-color: var(--color-surface);
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

        /* row of ingredient pills */
        function-dropdown .ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
          padding-bottom: var(--space-lg); 
          max-height: calc(27px + var(--space-sm));
          overflow: hidden;
        }

        function-dropdown .ingredients.is-expanded {
          max-height: none; /* show every line */
        }

        /* "more ingredients" button */
        function-dropdown .more-ingredients {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          margin: 0;
          padding: 0;
          border: none;
          background: none;
          color: var(--color-text-muted);
          font-family: var(--font-base);
          font-size: var(--font-size-sm);
          font-weight: 600;
          cursor: pointer;
        }

        function-dropdown .more-ingredients[hidden] {
          display: none;
        }

        function-dropdown .more-ingredients[aria-expanded="true"] .arrow {
          transform: rotate(180deg);
        }

        function-dropdown .placeholder {
          color: var(--color-text-muted);
          font-style: italic;
        }
      </style>
    `;

    this.watchIngredients();
    if (isOpen) this.showPills(INITIAL_PILL_COUNT);
  }

  // Adds pills until the first `count` ingredients have one (needs pill.js)
  showPills(count) {
    const list = this.querySelector(".ingredients");
    if (!list || count <= this.pillsShown) return;

    const newPills = this.ingredientNames
      .slice(this.pillsShown, count)
      .map((name) => `<ingredient-pill label="${escapeText(name)}"></ingredient-pill>`)
      .join("");
    list.insertAdjacentHTML("beforeend", newPills);
    this.pillsShown = count;
  }

  watchIngredients() {
    if (this.ingredientsObserver) this.ingredientsObserver.disconnect(); // stop watching the old row (render replaced it)

    const list = this.querySelector(".ingredients");
    const more = this.querySelector(".more-ingredients");
    if (!list || !more) return;

    this.ingredientsObserver = new ResizeObserver(() => {
      if (list.classList.contains("is-expanded")) return; // already showing everything, keep the button
      more.hidden = list.scrollHeight <= list.clientHeight; // hidden pills exist only if the content is taller than the box
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

// Makes text safe to put into innerHTML (the data comes from outside).
function escapeText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

customElements.define("function-dropdown", MyDropdown);
