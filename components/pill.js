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

        /* status circle -- default: empty circle with a muted outline */
        ingredient-pill .pill-check {
          width: 1.1em;
          height: 1.1em;
          border: 2px solid var(--color-text-muted);
          border-radius: 50%; /* circle */
          font-size: 1em;
        }

        /* check or "x" inside the circle: white so it shows on the colored fill */
        ingredient-pill .pill-check i {
          font-size: 0.65em;
          color: var(--color-text-white);
        }

        /* green circle with a check */
        ingredient-pill[status="check"] .pill-check {
          background-color: var(--color-text-green);
          border-color: var(--color-text-green);
        }

        /* red circle with an x */
        ingredient-pill[status="x"] .pill-check {
          background-color: var(--color-text-red);
          border-color: var(--color-text-red);
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

    box.innerHTML =
      status === "check" ? `<i class="fa-solid fa-check" aria-hidden="true"></i>` :
      status === "x"     ? `<i class="fa-solid fa-xmark" aria-hidden="true"></i>` :
      "";

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
