// breadcrumb.js
// Defines the <my-breadcrumb> custom element: the trail of links
// (e.g. Home > Catalog > Product) that sits right under the navigation bar.
//
// Usage (right after <my-header></my-header>):
//   <my-breadcrumb></my-breadcrumb>

class MyBreadcrumb extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav aria-label="Breadcrumb">
        <ol class="trail">
          <!-- breadcrumb items go here -->
        </ol>
      </nav>

      <style>
        my-breadcrumb {
          /* breadcrumb bar */
        }

        my-breadcrumb .trail {
          /* row of items */
        }

        my-breadcrumb a {
          /* links to earlier pages */
        }

        my-breadcrumb [aria-current="page"] {
          /* the current page */
        }
      </style>
    `;
  }
}

customElements.define("my-breadcrumb", MyBreadcrumb);
