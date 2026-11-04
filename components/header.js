// header.js
// Defines the <my-header> custom element. Loaded by every page in /pages,
// which then just writes <my-header></my-header> instead of duplicating markup.
// These are real page-to-page links now (full navigation), not hash routes.
// The header's styles live in the <style> block below, so pages don't need a separate <link>.

class MyHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <a href="home.html" class="logo">MySkindex</a>
        <!-- Pressing Enter submits this form, which goes to catalog.html?q=<what you typed> -->
        <form class="search" action="catalog.html" method="get" role="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="text" name="q" placeholder="Search..." aria-label="Search" />
        </form>
        <nav>
          <a href="#" class="login">Login/Signup</a>
          <a href="#" class="profile" aria-label="Profile">
            <i class="fa-solid fa-circle-user" aria-hidden="true"></i>
          </a>
        </nav>


      <style>
        my-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: var(--space-md) var(--space-xl);
          background-color: var(--color-surface-alt);
          box-shadow: var(--shadow-md);
        }
          
        my-header .logo {
          font-size: var(--font-size-2xl);
          font-weight: bolder;
          color: var(--color-text-muted);
          text-decoration: none; /* no link underline */
        }

        /* Search bar: the icon sits on top of the input, on the left */
        my-header .search {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 740px;
        }

        my-header .search i {
          position: absolute;
          left: var(--space-md);
          font-size: var(--font-size-lg);
          color: var(--color-text-muted);
          pointer-events: none; /* clicks go through to the input */
        }

        my-header .search input {
          width: 100%;
          padding: 12px var(--space-md) 12px 48px; /* left padding makes room for the icon */
          font-size: var(--font-size-base);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background-color: var(--color-surface);
        }

        my-header .search input:focus {
          outline: none;
          border-color: var(--color-border-dark);
        }

        my-header nav {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* Plain text look: no blue color or underline */
        my-header .login {
          font-family: var(--font-base);
          font-size: var(--font-size-md);
          font-weight: normal;
          color: var(--color-text);
          text-decoration: none;
        }

        my-header .profile {
          font-size: var(--font-size-2xl);
          line-height: 1;
          color: var(--color-text);
        }
      </style>

      
    `;

    // Keep the search text in the box after landing on the catalog page.
    const query = new URLSearchParams(window.location.search).get("q");
    if (query) {
      this.querySelector(".search input").value = query;
    }
  }
}

customElements.define("my-header", MyHeader);
