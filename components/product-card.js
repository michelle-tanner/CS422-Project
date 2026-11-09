class ProductCard extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute("name") || "[Product Name]";
    const description = this.getAttribute("description") || "more information";
    const image = this.getAttribute("image") || "";
    const href = `product.html?name=${encodeURIComponent(name)}`;

    this.innerHTML = `
      <a class="product-card" href="${href}">
        <div class="product-image">
          ${image
            ? `<img src="${image}" alt="${name}" />`
            : `<div class="image-placeholder"></div>`}
        </div>
        <div class="product-info">
          <p class="product-name">${name}</p>
          <p class="product-description">${description}</p>
        </div>
      </a>

      <style>
        /* Every card is exactly the same size, however long its name or type is */
        product-card {
          display: block;
          flex: 0 0 155px;
          width: 155px;
          height: 246px;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: box-shadow 0.2s;
        }

        .product-card:hover {
          box-shadow: 0 8px 28px rgba(44, 39, 34, 0.13);
        }

        .product-image {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden; /* keeps it square even when the photo is taller */
          background: var(--color-bg);
          flex-shrink: 0;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          background: #ddd;
        }

        .product-info {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          padding: var(--space-sm) var(--space-sm) var(--space-md);
        }

        /* Long names stop after 2 lines with "..." */
        .product-name {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0 0 2px;
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text);
        }

        /* Product type stays on 1 line with "..." */
        .product-description {
          margin: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
      </style>
    `;
  }
}

customElements.define("product-card", ProductCard);
