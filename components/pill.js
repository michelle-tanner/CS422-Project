// pill.js
// Usage:
//   <ingredient-pill
//     label=""     -> the ingredient's name, shown in the pill
//     removable    -> (optional) show one "remove" button instead of include / exclude
//   ></ingredient-pill>
//
// These attributes are filled in from the data we retrieve.
//
// The pill has two separate buttons: include (check) and exclude (x).
// Clicking an inactive button sets that status. Clicking the already-active button clears it.
// The "i" button opens a small popup above the pill with info from data/ingredients.json.

// Where this script was loaded from, so the data path works from any page folder
const PILL_SCRIPT_URL = document.currentScript ? document.currentScript.src : "";

// ---- Ingredient info (data/ingredients.json) ----
// Loaded once, then shared by every pill on the page. Map: lowercase name -> entry.
let ingredientInfoPromise = null;

function loadIngredientInfo() {
  if (!ingredientInfoPromise) {
    const url = PILL_SCRIPT_URL
      ? new URL("../data/ingredients.json", PILL_SCRIPT_URL)
      : "../data/ingredients.json";
    ingredientInfoPromise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Couldn't load ingredients.json (${res.status})`);
        return res.json();
      })
      .then((list) => new Map(list.map((i) => [i.name.trim().toLowerCase(), i])))
      .catch((error) => {
        console.error(error);
        ingredientInfoPromise = null; // try again on the next click
        return new Map();
      });
  }
  return ingredientInfoPromise;
}

// Same labels and colors as the rating pill on the product page
const POPUP_RATINGS = {
  "Safe": { text: "Safe", color: "var(--pill-good)" },
  "Safe (in low %)": { text: "Neutral", color: "var(--pill-default)" },
  "Moderate Risk": { text: "Icky", color: "var(--pill-moderate)" },
  "Bad": { text: "Bad", color: "var(--pill-bad)" },
};

// ---- Info popup ----
// One popup at a time, attached to <body> so no parent (like a dropdown) can clip it.
let openPopup = null; // { el, pill }
let popupToken = 0;   // guards against a slow load finishing after the user moved on

function closePopup() {
  popupToken++;
  if (!openPopup) return;
  openPopup.el.remove();
  const button = openPopup.pill.querySelector(".pill-info");
  if (button) button.setAttribute("aria-expanded", "false");
  openPopup = null;
}

function buildPopup(label, info) {
  const el = document.createElement("div");
  el.className = "pill-popup";
  el.setAttribute("role", "tooltip");

  const title = document.createElement("p");
  title.className = "pill-popup-title";
  title.textContent = label;
  el.appendChild(title);

  const rating = POPUP_RATINGS[info.rating];
  const hasFunctions = Array.isArray(info.function) && info.function.length > 0;

  if (hasFunctions || rating) {
    const row = document.createElement("div");
    row.className = "pill-popup-tags";
    if (hasFunctions) {
      const fns = document.createElement("span");
      fns.className = "pill-popup-functions";
      fns.textContent = info.function.join(", ");
      row.appendChild(fns);
    }
    if (rating) {
      const chip = document.createElement("span");
      chip.className = "pill-popup-rating";
      chip.style.backgroundColor = rating.color;
      chip.textContent = rating.text;
      row.appendChild(chip);
    }
    el.appendChild(row);
  }

  const desc = document.createElement("p");
  const hasDesc = info.description && String(info.description).trim();
  desc.className = hasDesc ? "pill-popup-desc" : "pill-popup-desc pill-popup-missing";
  desc.textContent = hasDesc ? info.description : "Description not available";
  el.appendChild(desc);

  return el;
}

// Puts the popup centered above the pill (below it if there's no room), kept inside the window
function positionPopup(el, pill) {
  const margin = 8;
  const rect = pill.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

  let top = rect.top - height - margin;
  if (top < margin) top = rect.bottom + margin;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

async function toggleInfoPopup(pill, label) {
  // clicking the "i" of the pill whose popup is open closes it
  if (openPopup && openPopup.pill === pill) {
    closePopup();
    return;
  }
  closePopup();
  const token = popupToken;

  const info = (await loadIngredientInfo()).get(label.trim().toLowerCase()) || {};
  if (token !== popupToken || !pill.isConnected) return; // user moved on while it loaded

  const el = buildPopup(label, info);
  el.style.visibility = "hidden"; // measure first, then show
  document.body.appendChild(el);
  positionPopup(el, pill);
  el.style.visibility = "";

  openPopup = { el, pill };
  const button = pill.querySelector(".pill-info");
  if (button) button.setAttribute("aria-expanded", "true");
}

// Close on: a click anywhere else, Escape, scrolling, or resizing
document.addEventListener("pointerdown", (event) => {
  if (!openPopup) return;
  if (event.target.closest(".pill-popup") || event.target.closest(".pill-info")) return;
  closePopup();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePopup();
});
window.addEventListener("scroll", closePopup, true); // true: also catches scrolling inside containers
window.addEventListener("resize", closePopup);

class IngredientPill extends HTMLElement {
  static get observedAttributes() {
    return ["label", "removable"];
  }

  connectedCallback() {
    this.render();

    // When any choice changes (this pill, another pill, or another tab),
    // update this pill if it's the same ingredient.
    this.onListsChange = (event) => {
      const { name } = event.detail;
      const label = this.getAttribute("label") || "";
      if (!name || name.trim().toLowerCase() === label.trim().toLowerCase()) {
        this.showStatus(FilterLists.getStatus(label));
      }
    };
    window.addEventListener("filter-lists-change", this.onListsChange);

    if (this.hasClickListener) return;
    this.hasClickListener = true;

    this.addEventListener("click", (event) => {
      const label = this.getAttribute("label") || "";

      // remove button (removable pills): clears this ingredient from its list
      if (event.target.closest(".pill-remove")) {
        FilterLists.setStatus(label, "");
        return;
      }

      // include / exclude buttons: set that status directly, or clear it if it's already active
      const statusButton = event.target.closest(".pill-check, .pill-x");
      if (statusButton) {
        const clicked = statusButton.classList.contains("pill-check") ? "check" : "x";
        const current = FilterLists.getStatus(label);
        FilterLists.setStatus(label, current === clicked ? "" : clicked); // the change event then updates every matching pill
        return;
      }

      // "i" button: show or hide the info popup
      if (event.target.closest(".pill-info")) {
        toggleInfoPopup(this, label);
        this.dispatchEvent(
          new CustomEvent("pill-info", { detail: { label }, bubbles: true })
        );
      }
    });

    // Styles
    if (!document.getElementById("ingredient-pill-styles")) {
      const style = document.createElement("style");
      style.id = "ingredient-pill-styles";
      style.textContent = `
        ingredient-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-pill);
          background-color: var(--color-accent-pill);
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.10); /* inner shadow: no offset, 4px blur, 10% black */
          color: var(--color-text);
          font-family: var(--font-base);
          font-size: var(--font-size-base);
          font-weight: 600;
          line-height: 1; /* no extra space above/below the text (body's 1.6 line-height added some) */
          margin: 0;
          white-space: nowrap;
        }

        /* shared reset for the buttons inside the pill */
        ingredient-pill button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          background-color: transparent;
          font: inherit;
          cursor: pointer;
        }

        /* "i" icon */
        ingredient-pill .pill-info {
          color: var(--color-text-muted);
        }

        ingredient-pill .pill-info:hover,
        ingredient-pill .pill-info[aria-expanded="true"] {
          color: var(--color-text);
        }

        /* the include and exclude buttons sit side by side */
        ingredient-pill .pill-actions {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          margin-left: var(--space-xs);
        }

        /* each button: the square and icon are one SVG, so they always stay lined up */
        ingredient-pill .pill-check,
        ingredient-pill .pill-x {
          flex: none; /* never squeeze the square into a rectangle */
          width: 18px;
          height: 18px;
        }

        ingredient-pill .pill-check svg,
        ingredient-pill .pill-x svg {
          display: block;
          width: 18px;
          height: 18px;
          overflow: visible;
        }

        /* default: muted outline square with a muted icon, so each button shows what it does */
        ingredient-pill .pill-check rect,
        ingredient-pill .pill-x rect {
          fill: none;
          stroke: var(--color-text-muted);
          stroke-width: 2;
        }

        ingredient-pill .pill-check path,
        ingredient-pill .pill-x path {
          fill: none;
          stroke: var(--color-text-muted);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* hover hint on a button that isn't active yet */
        ingredient-pill .pill-check[aria-pressed="false"]:hover rect {
          stroke: var(--color-text-green);
        }
        ingredient-pill .pill-x[aria-pressed="false"]:hover rect {
          stroke: var(--color-text-red);
        }

        /* included: green filled square, white check */
        ingredient-pill[status="check"] .pill-check rect {
          fill: var(--color-text-green);
          stroke: var(--color-text-green);
        }
        ingredient-pill[status="check"] .pill-check path {
          stroke: var(--color-text-white);
        }

        /* excluded: red filled square, white x */
        ingredient-pill[status="x"] .pill-x rect {
          fill: var(--color-text-red);
          stroke: var(--color-text-red);
        }
        ingredient-pill[status="x"] .pill-x path {
          stroke: var(--color-text-white);
        }

        /* keyboard tabbing */
        ingredient-pill button:focus-visible {
          outline: 2px solid var(--color-border-dark);
          outline-offset: 2px;
          border-radius: 4px;
        }

        /* remove button (pills with the "removable" attribute) */
        ingredient-pill .pill-remove {
          flex: none;
          width: 18px;
          height: 18px;
          color: var(--color-text-muted);
        }

        ingredient-pill .pill-remove svg {
          display: block;
          width: 14px;
          height: 14px;
          overflow: visible;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
        }

        ingredient-pill[status="check"] .pill-remove { color: var(--color-text-green); }
        ingredient-pill[status="x"] .pill-remove { color: var(--color-text-red); }
        ingredient-pill .pill-remove:hover { opacity: 0.7; }

        /* ---- info popup (lives on <body>, so it uses fixed positioning) ---- */
        .pill-popup {
          position: fixed;
          z-index: 10000;
          box-sizing: border-box;
          width: 260px;
          max-width: calc(100vw - 16px);
          padding: var(--space-md);
          border: 1px solid var(--color-border-dark);
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          box-shadow: var(--shadow-md);
          color: var(--color-text);
          font-family: var(--font-base);
          font-size: var(--font-size-sm);
          font-weight: 400;
          line-height: 1.4;
          white-space: normal;
          text-align: left;
        }

        .pill-popup p {
          margin: 0;
        }

        .pill-popup-title {
          margin-bottom: var(--space-xs) !important;
          font-size: var(--font-size-base);
          font-weight: 600;
          text-transform: capitalize;
        }

        .pill-popup-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .pill-popup-functions {
          color: var(--color-text-muted);
        }

        .pill-popup-rating {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-pill);
          color: var(--color-text-white);
          font-size: var(--font-size-xs);
          font-weight: 600;
          line-height: 1;
        }

        .pill-popup-missing {
          color: var(--color-text-muted);
          font-style: italic;
        }
      `;
      document.head.appendChild(style);
    }
  }

  disconnectedCallback() {
    window.removeEventListener("filter-lists-change", this.onListsChange);
    if (openPopup && openPopup.pill === this) closePopup();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const label = this.getAttribute("label") || "Ingredient";

    // Normally two buttons (include / exclude); removable pills get a single remove button.
    // One SVG per button holds its icon.
    const actions = this.hasAttribute("removable")
      ? `<button type="button" class="pill-remove">
          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M5 5 13 13M13 5 5 13"/></svg>
        </button>`
      : `<span class="pill-actions">
        <button type="button" class="pill-check">
          <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/><path d="M5.5 9.2 8 11.5 12.5 6.5"/></svg>
        </button>
        <button type="button" class="pill-x">
          <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/><path d="M6 6 12 12M12 6 6 12"/></svg>
        </button>
      </span>`;

    this.innerHTML = `
      <button type="button" class="pill-info" aria-label="More info about ${escapePillText(label)}" aria-expanded="false">
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
      </button>
      <span class="pill-label">${escapePillText(label)}</span>
      ${actions}
    `;

    this.showStatus(FilterLists.getStatus(label));
  }

  // Shows a choice ("", "check", or "x") on the two buttons. Only changes how the pill looks;
  // saving the choice is done by FilterLists.setStatus.
  showStatus(status) {
    const label = this.getAttribute("label") || "Ingredient";
    if (status) this.setAttribute("status", status);
    else this.removeAttribute("status");

    // Removable pill: one button that clears the choice
    const removeButton = this.querySelector(".pill-remove");
    if (removeButton) {
      const hint = `Remove from ${status === "x" ? "excluded" : "included"} list`;
      removeButton.setAttribute("title", hint);
      removeButton.setAttribute("aria-label", `${label}: ${hint}.`);
      return;
    }

    const includeButton = this.querySelector(".pill-check");
    const excludeButton = this.querySelector(".pill-x");
    if (!includeButton || !excludeButton) return;

    const included = status === "check";
    const excluded = status === "x";

    includeButton.setAttribute("aria-pressed", String(included));
    excludeButton.setAttribute("aria-pressed", String(excluded));

    // Tooltips say what a click will do
    const includeHint = included ? "Click to remove from included" : "Click to include ingredient";
    const excludeHint = excluded ? "Click to remove from excluded" : "Click to exclude ingredient";

    includeButton.setAttribute("title", includeHint);
    includeButton.setAttribute("aria-label", `${label}: ${includeHint}.`);
    excludeButton.setAttribute("title", excludeHint);
    excludeButton.setAttribute("aria-label", `${label}: ${excludeHint}.`);
  }
}

// Makes text safe to put into innerHTML
function escapePillText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

customElements.define("ingredient-pill", IngredientPill);