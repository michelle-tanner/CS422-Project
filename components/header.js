// header.js
// Defines the <my-header> custom element. Loaded by every page in /pages,
// which then just writes <my-header></my-header> instead of duplicating markup.
// These are real page-to-page links now (full navigation), not hash routes.

class MyHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <p>Header placeholder</p>
      <nav>
        <a href="home.html">Home</a>
        <a href="catalog.html">Catalog</a>
        <a href="product.html">Product</a>
        <a href="ingredient.html">Ingredient</a>
      </nav>
    `;
  }
}

customElements.define("my-header", MyHeader);
