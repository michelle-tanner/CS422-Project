// pill.js
// Usage:
//   <ingredient-pill
//     label=""     -> the ingredient's name, shown in the pill
//   ></ingredient-pill>
//
// These attributes are filled in from the data we retrieve.
//
// The pill has two separate buttons: include (check) and exclude (x).
// Clicking an inactive button sets that status. Clicking the already-active button clears it.

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
      const label = this.getAttribute("label") || "";

      // include / exclude buttons: set that status directly, or clear it if it's already active
      const statusButton = event.target.closest(".pill-check, .pill-x");
      if (statusButton) {
        const clicked = statusButton.classList.contains("pill-check") ? "check" : "x";
        const current = FilterLists.getStatus(label);
        FilterLists.setStatus(label, current === clicked ? "" : clicked); // the change event then updates every matching pill
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

    // One SVG per button holds the square and its icon
    this.innerHTML = `
      <button type="button" class="pill-info" aria-label="More info about ${escapePillText(label)}">
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
      </button>
      <span class="pill-label">${escapePillText(label)}</span>
      <span class="pill-actions">
        <button type="button" class="pill-check">
          <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/><path d="M5.5 9.2 8 11.5 12.5 6.5"/></svg>
        </button>
        <button type="button" class="pill-x">
          <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/><path d="M6 6 12 12M12 6 6 12"/></svg>
        </button>
      </span>
    `;

    this.showStatus(FilterLists.getStatus(label));
  }

  // Shows a choice ("", "check", or "x") on the two buttons. Only changes how the pill looks;
  // saving the choice is done by FilterLists.setStatus.
  showStatus(status) {
    const label = this.getAttribute("label") || "Ingredient";
    const includeButton = this.querySelector(".pill-check");
    const excludeButton = this.querySelector(".pill-x");
    if (!includeButton || !excludeButton) return;

    if (status) this.setAttribute("status", status);
    else this.removeAttribute("status");

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