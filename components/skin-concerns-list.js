// skin-concerns-list.js
// Defines the <skin-concerns-list> custom element. It turns the SKIN_CONCERNS
// array below into a row of buttons, laid out with flexbox.
//
// Usage:
//   <skin-concerns-list></skin-concerns-list>
//
// Optional attribute:
//   direction="column"  -> stack the buttons vertically instead of in a row

// Load the Font Awesome icon library once (header.js does the same thing,
// so this only matters on a page that doesn't use <my-header>).
if (!document.getElementById("font-awesome")) {
  const fa = document.createElement("link");
  fa.id = "font-awesome";
  fa.rel = "stylesheet";
  fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  document.head.appendChild(fa);
}

// One entry per button.
//   label -> the text on the button
//   icon  -> a Font Awesome class name (find more at fontawesome.com/icons)
//   id    -> the localStorage key for this concern's "future" information
const SKIN_CONCERNS = [
  { label: "Redness",        icon: "fa-fire",          id: "redness" },
  { label: "Acne",           icon: "fa-circle-dot",    id: "acne" },
  { label: "Anti-aging",     icon: "fa-hourglass-half", id: "anti-aging" },
  { label: "Dryness",        icon: "fa-droplet-slash", id: "dryness" },
  { label: "Dark spots",     icon: "fa-sun",           id: "dark-spots" },
  { label: "Clogged pores",  icon: "fa-braille",       id: "clogged-pores" },
  { label: "Texture",        icon: "fa-hand-dots",     id: "texture" },
  { label: "Sensitive skin", icon: "fa-feather",       id: "sensitive-skin" },
  { label: "Dullness",       icon: "fa-cloud",         id: "dullness" },
  { label: "Oiliness",       icon: "fa-droplet",       id: "oiliness" },
];

class SkinConcernsList extends HTMLElement {
  connectedCallback() {
    // .map turns each concern object into one <li><button> string,
    // and .join("") glues them together into one block of HTML.
    this.innerHTML = `
      <ul class="items">
        ${SKIN_CONCERNS.map(
          (concern) => `
            <li>
              <!-- aria-labelledby gives the icon-only button its name for screen readers -->
              <button type="button" class="concern" data-id="${concern.id}"
                      aria-labelledby="${concern.id}-label">
                <i class="fa-solid ${concern.icon}" aria-hidden="true"></i>
              </button>
              <span class="label" id="${concern.id}-label">${concern.label}</span>
            </li>
          `
        ).join("")}
      </ul>
    `;

    // One click listener for the whole list: find which button was clicked
    // and read its data-id.
    this.addEventListener("click", (event) => {
      const button = event.target.closest("button.concern");
      if (!button) return;

      const id = button.dataset.id;
      const data = getConcernData(id);

      // Placeholder until the "future" information exists.
      console.log(`Clicked "${id}". Data from localStorage:`, data);

      // Let the page react to the click: listen for "concern-select" on the
      // list and use event.detail.id / event.detail.data.
      this.dispatchEvent(
        new CustomEvent("concern-select", { detail: { id, data }, bubbles: true })
      );
    });

    // Add the styles once per page, not once per list.
    if (!document.getElementById("skin-concerns-list-styles")) {
      const style = document.createElement("style");
      style.id = "skin-concerns-list-styles";
      style.textContent = `
        skin-concerns-list {
          display: block;
        }

        skin-concerns-list .items {
          display: flex;
          justify-content: center;
          flex-wrap: wrap; /* buttons move to the next line if they run out of room */
          gap: var(--space-xl);
          list-style: none; /* no bullet points */
          margin: 0;
          padding: 40px 40px;
        }

        skin-concerns-list[direction="column"] .items {
          flex-direction: column;
        }

        /* Each item: the square button with its label underneath */
        skin-concerns-list .items li {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          width: 140px; /* a little wider than the button so labels like "Clogged pores" fit */
        }

        /* The square button: same width and height, icon centered */
        skin-concerns-list .concern {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 140px;
          height: 140px;
          padding: 0;
          background-color: var(--color-accent);
          border: 3px solid var(--color-border-dark);
          border-radius: var(--radius-xl);
          cursor: pointer;
        }

        skin-concerns-list .concern:hover,
        skin-concerns-list .concern:focus-visible {
          border-color: var(--color-accent-muted);
          background-color: var(--color-accent-muted);
        }

        skin-concerns-list .concern i {
          font-size: var(--font-size-3xl);
          color: var(--color-border-dark);
        }

        skin-concerns-list .label {
          font-family: var(--font-base);
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-text);
          text-align: center;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Reads a concern's saved data from localStorage, using its id as the key.
// Returns null if nothing has been saved yet (or storage is unavailable).
function getConcernData(id) {
  try {
    const raw = localStorage.getItem(id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

customElements.define("skin-concerns-list", SkinConcernsList);
