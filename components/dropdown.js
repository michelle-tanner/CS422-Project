// dropdown.js

// Usage:
//   <function-dropdown
//     color=""            -> the function's color (e.g. var(--color-function-green))
//     function-label=""   -> the function's name, shown on the dropdown
//     description=""      -> what the function does, shown when opened
//     ingredients='{}'    -> the function's ingredients, as JSON (shown when opened)
//                            e.g. '{"Glycerin": "Pulls water into the skin", "Squalane": "Locks moisture in"}'
//   ></function-dropdown>
//
// These attributes are filled in from the data we retrieve.

// TEMPORARY: set to true to keep every dropdown open (for testing/styling).
// Set back to false (or delete it and its two uses) when done.
const ALWAYS_OPEN_DROPDOWN = true;

class MyDropdown extends HTMLElement {
  // The attributes this element uses (the dynamic data)
  static get observedAttributes() {
    return ["color", "function-label", "description", "ingredients"];
  }

//   Open and Closing the dropdown
  connectedCallback() {
    this.render();
    this.addEventListener("click", (event) => {
      const toggle = event.target.closest(".dropdown-toggle");
      if (!toggle) return;
      if (ALWAYS_OPEN_DROPDOWN) return; // TEMPORARY: can't close while testing

      const content = this.querySelector(".dropdown-content");
      const isOpen = !content.hidden;
      content.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
      this.classList.toggle("is-open", !isOpen);
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
    if (ALWAYS_OPEN_DROPDOWN) this.classList.add("is-open"); // TEMPORARY: start open while testing
    const isOpen = this.classList.contains("is-open"); // keep it open if it was open

    this.style.setProperty("--dropdown-color", color);

    this.innerHTML = `
      <div class="dropdown">
        <button type="button" class="dropdown-toggle" aria-expanded="${isOpen}">
          <span>${escapeText(label)}</span>
          <span class="arrow" aria-hidden="true"></span>
        </button>

        <div class="dropdown-content" ${isOpen ? "" : "hidden"}>
          <p class="description">${escapeText(description)}</p>

          <h3 class="ingredients-heading">Common Ingredients</h3>
          ${ingredients.length
            ? `<div class="ingredients">
                 ${ingredients
                   .map(([name]) => `<ingredient-pill label="${escapeText(name)}"></ingredient-pill>`) // one pill per ingredient (needs pill.js)
                   .join("")}
               </div>`
            : `<p class="placeholder">Ingredients go here.</p>`}
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

        /* the label text: trim the font's built-in space above the capitals and below the baseline,
           so the letters themselves sit in the middle (newer browsers; older ones just ignore it) */
        function-dropdown .dropdown-toggle span:not(.arrow) {
          text-box: trim-both cap alphabetic;
        }

        function-dropdown .dropdown-toggle .arrow {
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
        }

        function-dropdown .placeholder {
          color: var(--color-text-muted);
          font-style: italic;
        }
      </style>
    `;
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
