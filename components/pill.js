// pill.js
// Usage:
//   <ingredient-pill
//     label=""     -> the ingredient's name, shown in the pill
//   ></ingredient-pill>
//
// These attributes are filled in from the data we retrieve.

const PILL_STATUSES = ["", "check", "x"];

class IngredientPill extends HTMLElement {
  static get observedAttributes() {
    return ["label"];
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
      // square: move to the next choice and save it to the shared lists
      if (event.target.closest(".pill-check")) {
        const label = this.getAttribute("label") || "";
        const current = FilterLists.getStatus(label);
        const next = PILL_STATUSES[(PILL_STATUSES.indexOf(current) + 1) % PILL_STATUSES.length];
        FilterLists.setStatus(label, next); // the change event then updates every matching pill
        return;
      }

      // "i" button
      if (event.target.closest(".pill-info")) {
        this.dispatchEvent(
          new CustomEvent("pill-info", { detail: { label: this.getAttribute("label") }, bubbles: true })
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

        /* shared reset for the two buttons inside the pill */
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

        /* status button: the square and icon are one SVG, so they always stay lined up */
        ingredient-pill .pill-check {
          flex: none; /* never squeeze the square into a rectangle */
          width: 18px;
          height: 18px;
        }

        ingredient-pill .pill-check svg {
          display: block;
          width: 18px;
          height: 18px;
          overflow: visible;
        }

        /* default: empty square with a muted outline */
        ingredient-pill .pill-check rect {
          fill: none;
          stroke: var(--color-text-muted);
          stroke-width: 2;
        }

        /* check or "x" inside the square: white so it shows on the colored fill */
        ingredient-pill .pill-check path {
          fill: none;
          stroke: var(--color-text-white);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* green square with a check */
        ingredient-pill[status="check"] .pill-check rect {
          fill: var(--color-text-green);
          stroke: var(--color-text-green);
        }

        /* red square with an x */
        ingredient-pill[status="x"] .pill-check rect {
          fill: var(--color-text-red);
          stroke: var(--color-text-red);
        }
      `;
      document.head.appendChild(style);
    }
  }

  disconnectedCallback() {
    window.removeEventListener("filter-lists-change", this.onListsChange);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const label = this.getAttribute("label") || "Ingredient";

    this.innerHTML = `
      <button type="button" class="pill-info" aria-label="More info about ${escapePillText(label)}">
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
      </button>
      <span class="pill-label">${escapePillText(label)}</span>
      <button type="button" class="pill-check"></button>
    `;

    this.showStatus(FilterLists.getStatus(label));
  }

  // Shows a choice ("", "check", or "x") in the square. Only changes how the pill looks;
  // saving the choice is done by FilterLists.setStatus.
  showStatus(status) {
    const label = this.getAttribute("label") || "Ingredient";
    const box = this.querySelector(".pill-check");

    if (status) this.setAttribute("status", status);
    else this.removeAttribute("status");

    // One SVG holds the square and icon: a CSS border gets rounded to pixels separately from what's inside it
    const icon =
      status === "check" ? `<path d="M5.5 9.2 8 11.5 12.5 6.5"/>` :
      status === "x"     ? `<path d="M6 6 12 12M12 6 6 12"/>` :
      "";
    box.innerHTML = `<svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/>${icon}</svg>`;

    const stateText = status === "check" ? "included" : status === "x" ? "excluded" : "not in a list";
    // Hint: the next click's result, shown as a tooltip on hover so the hidden "exclude" step can be found
    const nextHint =
      status === "check" ? "Click to exclude" :
      status === "x"     ? "Click to clear" :
      "Click to include";
    box.setAttribute("title", nextHint);
    box.setAttribute("aria-label", `${label}: ${stateText}. ${nextHint}.`);
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
