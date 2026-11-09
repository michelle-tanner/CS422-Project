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
        this.showStatus(IngredientLists.getStatus(label));
      }
    };
    window.addEventListener("ingredient-lists-change", this.onListsChange);

    if (this.hasClickListener) return;
    this.hasClickListener = true;

    this.addEventListener("click", (event) => {
      // circle: move to the next choice and save it to the shared lists
      if (event.target.closest(".pill-check")) {
        const label = this.getAttribute("label") || "";
        const current = IngredientLists.getStatus(label);
        const next = PILL_STATUSES[(PILL_STATUSES.indexOf(current) + 1) % PILL_STATUSES.length];
        IngredientLists.setStatus(label, next); // the change event then updates every matching pill
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

        /* status button: the circle and icon are one SVG, so they always stay lined up */
        ingredient-pill .pill-check {
          flex: none; /* never squeeze the circle into an oval */
          width: 18px;
          height: 18px;
        }

        ingredient-pill .pill-check svg {
          display: block;
          width: 18px;
          height: 18px;
          overflow: visible;
        }

        /* default: empty circle with a muted outline */
        ingredient-pill .pill-check circle {
          fill: none;
          stroke: var(--color-text-muted);
          stroke-width: 2;
        }

        /* check or "x" inside the circle: white so it shows on the colored fill */
        ingredient-pill .pill-check path {
          fill: none;
          stroke: var(--color-text-white);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* green circle with a check */
        ingredient-pill[status="check"] .pill-check circle {
          fill: var(--color-text-green);
          stroke: var(--color-text-green);
        }

        /* red circle with an x */
        ingredient-pill[status="x"] .pill-check circle {
          fill: var(--color-text-red);
          stroke: var(--color-text-red);
        }
      `;
      document.head.appendChild(style);
    }
  }

  disconnectedCallback() {
    window.removeEventListener("ingredient-lists-change", this.onListsChange);
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

    this.showStatus(IngredientLists.getStatus(label));
  }

  // Shows a choice ("", "check", or "x") in the circle. Only changes how the pill looks;
  // saving the choice is done by IngredientLists.setStatus.
  showStatus(status) {
    const label = this.getAttribute("label") || "Ingredient";
    const box = this.querySelector(".pill-check");

    if (status) this.setAttribute("status", status);
    else this.removeAttribute("status");

    // One SVG holds the circle and icon: a CSS border gets rounded to pixels separately from what's inside it
    const icon =
      status === "check" ? `<path d="M5.5 9.2 8 11.5 12.5 6.5"/>` :
      status === "x"     ? `<path d="M6 6 12 12M12 6 6 12"/>` :
      "";
    box.innerHTML = `<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8"/>${icon}</svg>`;

    const stateText = status === "check" ? "included" : status === "x" ? "excluded" : "not in a list";
    box.setAttribute("aria-label", `${label}: ${stateText}. Click to change.`);
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
