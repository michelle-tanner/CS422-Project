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
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-pill); 
          background-color: var(--color-accent-pill);
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.10); /* inner shadow: no offset, 4px blur, 25% black */
          color: var(--color-text);
          font-family: var(--font-base);
          font-size: var(--font-size-base);
          font-weight: 600;
          line-height: 1; /* no extra space above/below the text (body's 1.6 line-height added some) */
          margin: 0;
          white-space: nowrap;
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
