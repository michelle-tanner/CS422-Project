// footer.js
// Defines the <my-footer> custom element — one small chunk, loaded by
// index.html, used once in the layout.

class MyFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<p>Footer placeholder</p>`;
  }
}

customElements.define("my-footer", MyFooter);
