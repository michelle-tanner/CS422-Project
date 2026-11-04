// skin-concerns-list.js
// Defines the <skin-concerns-list> custom element. It turns the SKIN_CONCERNS
// array below into a row of buttons, laid out with flexbox.
//
// Usage:
//   <skin-concerns-list></skin-concerns-list>
//
// Optional attribute:
//   direction="column"  -> stack the buttons vertically instead of in a row

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
    this.innerHTML = `
      <ul class="items">
        ${SKIN_CONCERNS.map(
          (concern) => `
            <li>
              <button type="button" class="concern" data-id="${concern.id}"
                      aria-labelledby="${concern.id}-label"
                      aria-expanded="false" aria-controls="concern-panel">
                <i class="fa-solid ${concern.icon}" aria-hidden="true"></i>
              </button>
              <span class="label" id="${concern.id}-label">${concern.label}</span>
            </li>
          `
        ).join("")}
      </ul>

      <!-- Info Panel (hidden unless user clicks skin concern button); content is filled in using showPanel() function -->
      <section class="concern-panel" id="concern-panel" hidden></section>
    `;

    this.panel = this.querySelector(".concern-panel");

    // Read data-id for button clicked, find the concern in SKIN_CONCERNS, and show its info in the panel.
    this.addEventListener("click", (event) => {
      const button = event.target.closest("button.concern");
      if (!button) return;
      // close already open panel 
      if (button.classList.contains("is-active")) {
        this.closePanel();
        return;
      }

      const id = button.dataset.id;
      const data = getConcernData(id);
      const concern = SKIN_CONCERNS.find((c) => c.id === id);

      this.setActive(button);
      this.showPanel(concern, data);

      this.dispatchEvent(
        new CustomEvent("concern-select", { detail: { id, data }, bubbles: true })
      );
    });

    // Escape closes the panel too.
    this.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.panel.hidden) this.closePanel();
    });

    // Styles 
    if (!document.getElementById("skin-concerns-list-styles")) {
      const style = document.createElement("style");
      style.id = "skin-concerns-list-styles";
      style.textContent = `

        /* ---- SKIN CONCERN LIST ---- */
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

        /* button + label */
        skin-concerns-list .items li {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          width: 140px; 
        }

        /* button */
        skin-concerns-list .concern {
          width: 140px;
          height: 140px;
          padding: 0;
          background-color: var(--color-accent);
          border: 4px solid var(--color-border-dark);
          border-radius: var(--radius-xl);
          cursor: pointer;
        }

        skin-concerns-list .concern:hover,
        skin-concerns-list .concern:focus-visible {
          border-color: var(--color-accent-muted);
          background-color: var(--color-accent-muted);
        }

        skin-concerns-list .concern.is-active {
          width: 156px;
          height: 156px;
          margin: -8px;
          background-color: var(--color-accent-muted);
          border-color: var(--color-accent-muted);
        }

        /* button icon */ 
        skin-concerns-list .concern i {
          font-size: var(--font-size-3xl);
          color: var(--color-border-dark);
        }

        skin-concerns-list .concern.is-active i {
          font-size: calc(var(--font-size-3xl) + 16px);
        }

        /* ---- INFO PANEL ---- */
        skin-concerns-list .concern-panel {
          position: relative; /* so the arrow below is placed relative to the panel */
          display: grid;
          grid-template-columns: 65fr 35fr; /* left side 65% | right side 35% */
          margin: 0 40px 40px;
          overflow: hidden;
          font-family: var(--font-base);
          color: var(--color-text);
        }

        /* hidden attribute */ 
        skin-concerns-list .concern-panel[hidden] {
          display: none;
        }

        /* arrow */
        skin-concerns-list .concern-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: var(--arrow-x, 50%);
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 18px solid transparent;
          border-right: 18px solid transparent;
          border-top: 18px solid var(--color-bg);
        }

        skin-concerns-list .panel-left,
        skin-concerns-list .panel-right {
          padding: var(--space-lg) var(--space-xl);
        }

        skin-concerns-list .panel-left {
          background-color: var(--color-accent-muted); 
        }

        skin-concerns-list .panel-right {
          display: flex;
          flex-direction: column; 
          gap: var(--space-lg);
          background-color: var(--color-surface); 
        }

        /* Grows to fill the leftover height, so the button sits at the bottom */
        skin-concerns-list .panel-right-content {
          flex: 1;
        }


        skin-concerns-list .explore-btn {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          align-self: flex-start; /* don't stretch across the full column */
          width: min-content; /* shrink to the narrowest fit: icon + longest word, so the text wraps */
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          color: var(--color-border-dark);
          font-size: var(--font-size-xl);
          font-weight: 700;
          text-decoration: none; /* no underline on the link */
        }

        skin-concerns-list .explore-btn i {
          font-size: var(--font-size-2xl);
        }

        skin-concerns-list .explore-btn span {
          font-size: var(--font-size-lg);
          line-height: 1.2; /* keeps the two wrapped lines snug */
        }

        skin-concerns-list .explore-btn:hover,
        skin-concerns-list .explore-btn:focus-visible {
          background-color: var(--color-surface-alt);
        }

        skin-concerns-list .concern-panel h2 {
          margin: 0 0 var(--space-sm);
          font-size: var(--font-size-xl);
        }

        skin-concerns-list .concern-panel h3 {
          margin: var(--space-lg) 0 var(--space-xs);
          font-size: var(--font-size-lg);
        }

        skin-concerns-list .concern-panel h3:first-child {
          margin-top: 0;
        }

        skin-concerns-list .concern-panel p,
        skin-concerns-list .concern-panel ul {
          margin: 0;
        }

        skin-concerns-list .concern-panel ul {
          padding-left: var(--space-lg);
        }

        skin-concerns-list .go-for     { color: var(--color-text-green); } /* #509C8E */
        skin-concerns-list .these-help { color: var(--color-text-blue); }  /* #356B89 */
        skin-concerns-list .avoid      { color: var(--color-text-red); }   /* #C65F5E */

        /* Gray italic text for anything that doesn't have real data yet */
        skin-concerns-list .placeholder {
          color: var(--color-text-muted);
          font-style: italic;
        }

        /* Narrow screens: stack the two sides */
        @media (max-width: 700px) {
          skin-concerns-list .concern-panel {
            grid-template-columns: 1fr;
            margin: 0 var(--space-md) var(--space-xl);
          }
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

  setActive(button) {
    this.querySelectorAll("button.concern").forEach((b) => {
      const isThis = b === button;
      b.classList.toggle("is-active", isThis);
      b.setAttribute("aria-expanded", String(isThis));
    });
  }

  // Fills the panel with one concern's info and shows it.
  //
  // Expected data shape (saved in localStorage under the concern's id):
  //   {
  //     "description": "What it is...",
  //     "causes":      "Common causes...",   (a string, or an array of strings)
  //     "goFor":       ["...", "..."],
  //     "theseHelp":   ["...", "..."],
  //     "avoid":       ["...", "..."]
  //   }
  // Anything missing shows placeholder text instead.
  showPanel(concern, data) {
    const d = data || {};

    this.panel.setAttribute("aria-label", `${concern.label} information`);
    this.panel.innerHTML = `
      <div class="panel-left">
        <h2>${escapeHtml(concern.label)}</h2>
        ${renderText(d.description, `Description of ${concern.label.toLowerCase()} goes here.`)}

        <h3>Common causes</h3>
        ${Array.isArray(d.causes)
          ? renderList(d.causes, "Common causes go here.")
          : renderText(d.causes, "Common causes go here.")}
      </div>

      <div class="panel-right">
        <!-- flex: 1 makes this grow and fill the space, pushing the
             Explore button to the bottom of the panel -->
        <div class="panel-right-content">
          <h3 class="go-for">Go For</h3>
          ${renderList(d.goFor, "Ingredients to look for go here.")}

          <h3 class="these-help">These Help</h3>
          ${renderList(d.theseHelp, "Helpful products go here.")}

          <h3 class="avoid">Avoid</h3>
          ${renderList(d.avoid, "Things to avoid go here.")}
        </div>

        <!-- A link (not a <button>) because it goes to another page.
             ?concern= lets catalog.html know which concern was picked. -->
        <a class="explore-btn" href="catalog.html?concern=${encodeURIComponent(concern.id)}">
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          <span>Explore functions</span>
        </a>
      </div>
    `;

    this.panel.hidden = false;
    this.positionArrow();
    window.addEventListener("resize", this.positionArrow);
    this.panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Hides the panel and puts focus back on the button that opened it.
  closePanel() {
    const active = this.querySelector("button.concern.is-active");
    this.setActive(null);
    this.panel.hidden = true;
    window.removeEventListener("resize", this.positionArrow);
    if (active) active.focus();
  }

  // Moves the arrow so it sits under the center of the selected button.
  positionArrow = () => {
    const active = this.querySelector("button.concern.is-active");
    if (!active || this.panel.hidden) return;

    const button = active.getBoundingClientRect();
    const panel = this.panel.getBoundingClientRect();
    const x = button.left + button.width / 2 - panel.left; // relative to the panel's left edge
    this.panel.style.setProperty("--arrow-x", `${x}px`);
  };
}

// ---- Small helpers for building the panel's HTML ----

// Makes text safe to put into innerHTML (so saved data can't inject markup).
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// A paragraph of real text, or a placeholder paragraph if there's none.
function renderText(text, placeholder) {
  return text
    ? `<p>${escapeHtml(text)}</p>`
    : `<p class="placeholder">${placeholder}</p>`;
}

// A bullet list from an array, or a placeholder if the array is empty/missing.
function renderList(items, placeholder) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="placeholder">${placeholder}</p>`;
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
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
