// footer.js
// Defines the <my-footer> custom element — one small chunk, loaded by
// every page in /pages, used once in the layout.

class MyFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav>
        <ul class="links">
          <li><a href="home.html">Home</a></li>
          <li><a href="functions.html">Functions</a></li>
          <li><a href="catalog.html">Catalog</a></li>
          <li><a href="product.html">Product</a></li>
        </ul>
      </nav>
      <p>this is a placeholder footer so you can switch pages easily. &copy; 2026 MySkindex</p>

      <style>
        my-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-xl);
          background-color: var(--color-bg);
          box-shadow: var(--shadow-md);
        }

        my-footer .links {
          display: flex;
          gap: var(--space-xl);
          list-style: none; /* no bullet points */
          margin: 0;
          padding: 0;
          font-size: var(--font-size-sm);
        }

        my-footer .links a {
          color: var(--color-text-muted);
          text-decoration: none;
        }

        my-footer p {
          margin: 0;
          font-size: 0.75rem; /* smaller than --font-size-sm (0.875rem) */
          font-style: italic;
          color: var(--color-text-muted);
        }
      </style>
    `;
  }
}

customElements.define("my-footer", MyFooter);
