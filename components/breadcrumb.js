// breadcrumb.js
// Defines the <my-breadcrumb> custom element: the trail of links
// (e.g. Home > Skin functions > Catalog > Product) that sits right under the navigation bar.
//
// Usage (right after <my-header></my-header>):
//   <my-breadcrumb current="catalog"></my-breadcrumb>
//
//   current -> which page this is. The trail shows every step up to it:
//                "functions"  -> Home > Skin functions
//                "catalog"    -> Home > Skin functions > Catalog
//                "product"    -> Home > Skin functions > Catalog > Product
//                "ingredient" -> Home > Skin functions > Ingredient
// The home page doesn't use a breadcrumb.

// Every page in the trail, in order
const BREADCRUMB_PAGES = {
  home: { label: "Home", href: "home.html" },
  functions: { label: "Skin functions", href: "functions.html" },
  catalog: { label: "Catalog", href: "catalog.html" },
  product: { label: "Product", href: "product.html" },
  ingredient: { label: "Ingredient", href: "ingredient.html" },
};

// The steps leading to each page (including the page itself)
const BREADCRUMB_TRAILS = {
  functions: ["home", "functions"],
  catalog: ["home", "functions", "catalog"],
  product: ["home", "functions", "catalog", "product"],
  ingredient: ["home", "functions", "ingredient"],
};

class MyBreadcrumb extends HTMLElement {
  connectedCallback() {
    const trail = BREADCRUMB_TRAILS[this.getAttribute("current")] || ["home"];

    const items = trail.map((id, i) => {
      const page = BREADCRUMB_PAGES[id];
      const isCurrent = i === trail.length - 1;
      return `
        <li>
          ${i > 0 ? `<i class="fa-solid fa-chevron-right separator" aria-hidden="true"></i>` : ""}
          ${isCurrent
            ? `<span aria-current="page">${page.label}</span>`
            : `<a href="${page.href}">${page.label}</a>`}
        </li>`;
    });

    this.innerHTML = `
      <nav aria-label="Breadcrumb">
        <ol class="trail">${items.join("")}</ol>
      </nav>

      <style>
        /* breadcrumb bar: full-width strip below the header */
        my-breadcrumb {
          display: block;
          width: 100%;
          padding: var(--space-md) var(--space-xl);
          font-family: var(--font-base);
          font-size: var(--font-size-sm);
          background-color: #F4EEEC;
        }

        /* row of items */
        my-breadcrumb .trail {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-sm);
          margin: 0;
          padding: 0;
          list-style: none;
        }

        my-breadcrumb li {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        my-breadcrumb .separator {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        /* links to earlier pages */
        my-breadcrumb a {
          color: var(--color-text-muted);
          text-decoration: none;
        }

        my-breadcrumb a:hover,
        my-breadcrumb a:focus-visible {
          color: var(--color-text);
          text-decoration: underline;
        }

        /* the current page */
        my-breadcrumb [aria-current="page"] {
          color: var(--color-text);
          font-weight: 700;
        }
      </style>
    `;
  }
}

customElements.define("my-breadcrumb", MyBreadcrumb);
