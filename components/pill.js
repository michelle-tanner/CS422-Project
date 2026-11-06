// pill.js
// Usage:
//   <ingredient-pill
//     label=""     -> the ingredient's name, shown in the pill
//   ></ingredient-pill>
//
// These attributes are filled in from the data we retrieve.

class IngredientPill extends HTMLElement {
  // The attributes this element uses (the dynamic data)
  static get observedAttributes() {
    return ["label"];
  }

  connectedCallback() {
    this.render();

    // Styles: added to the page once, no matter how many pills there are
    if (!document.getElementById("ingredient-pill-styles")) {
      const style = document.createElement("style");
      style.id = "ingredient-pill-styles";
      style.textContent = `
        ingredient-pill {
          display: inline-flex;
          align-items: center;
          padding: var(--space-xs) var(--space-md);
          border-radius: var(--radius-pill); /* fully rounded ends */
          background-color: var(--color-accent-pill); /* every pill is the same color */
          color: var(--color-text);
          font-family: var(--font-base);
          font-size: var(--font-size-sm);
          font-weight: 600;
          white-space: nowrap; /* keep the name on one line */
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Runs when one of the observed attributes changes
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  // Puts the label inside the pill (textContent is safe: no HTML gets in)
  render() {
    this.textContent = this.getAttribute("label") || "Ingredient";
  }
}

customElements.define("ingredient-pill", IngredientPill);
