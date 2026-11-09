// skin-concerns-list.js
// Defines the <skin-concerns-list> custom element. It turns the SKIN_CONCERNS
// data (loaded from concerns.json) into a row of buttons, laid out with flexbox.
//
// Usage:
//   <skin-concerns-list></skin-concerns-list>
//
// Optional attribute:
//   direction="column"  -> stack the buttons vertically instead of in a row

import CONCERNS_DATA from '../data/concerns.json' with { type: 'json' };

// Turn the JSON object ({ redness: {...}, acne: {...} }) into the same array
// shape the rest of this file already uses: [{ id: "redness", label, icon, ... }]
const SKIN_CONCERNS = Object.entries(CONCERNS_DATA.concerns).map(
  ([id, concern]) => ({ id, ...concern })
);

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
      // X button in the panel's top-right corner closes the panel
      if (event.target.closest("button.close-panel")) {
        this.closePanel();
        return;
      }

      // "Explore functions" link: remember which concern was picked for the Functions page
      if (event.target.closest(".explore-btn")) {
        FilterLists.setSelectedConcern(this.querySelector("button.concern.is-active").dataset.id);
        return;
      }

      const button = event.target.closest("button.concern");
      if (!button) return;
      // close already open panel 
      if (button.classList.contains("is-active")) {
        this.closePanel();
        return;
      }

      const id = button.dataset.id;
      const concern = SKIN_CONCERNS.find((c) => c.id === id);
      if (!concern) return;

      this.setActive(button);
      this.showPanel(concern);

      this.dispatchEvent(
        new CustomEvent("concern-select", { detail: { id, data: concern }, bubbles: true })
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
        
        /* label */
        skin-concerns-list .label {
          font-family: var(--font-base);
          font-size: var(--font-size-xl);
          line-height: 1.2;
          font-weight: 700;
          color: var(--color-text);
          text-align: center;
        }

        /* button */
        skin-concerns-list .concern {
          width: 140px;
          height: 140px;
          padding: 0;
          background-color: var(--color-accent);
          border: 5px solid var(--color-border-dark);
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
          /* Minimum height so the panel can be scrolled to the center of <main>.
             100cqh = the height of <main> (it's a size container, see index.css).
             Taking away the gap twice leaves the same space above and below the panel. */
          min-height: calc(100cqh - 2 * var(--panel-gap));
          overflow: hidden;
          font-family: var(--font-base);
          color: var(--color-text);
        }

        /* hidden attribute */ 
        skin-concerns-list .concern-panel[hidden] {
          display: none;
        }

        /* arrow that points to the button */
        skin-concerns-list .concern-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: calc(var(--arrow-x, 50%) - 18px); /* minus half the width = centered */
          width: 36px;
          height: 18px;
          clip-path: polygon(0 0, 100% 0, 50% 100%); /* top-left, top-right, bottom-middle */
          background: var(--page-bg);
          background-attachment: fixed;
        }

        skin-concerns-list .panel-left {
          padding: var(--space-xl) var(--space-xl);
        }
        skin-concerns-list .panel-right {
          padding: var(--space-xl) var(--space-lg);
        }

        skin-concerns-list .panel-left {
          background-color: var(--color-accent-muted);
        }

        skin-concerns-list .panel-right {
          display: flex;
          flex-direction: column; 
          gap: var(--space-xl);
          background-color: var(--color-surface); 
        }

        /* Grows to fill the leftover height, so the button sits at the bottom */
        skin-concerns-list .panel-right-content {
          flex: 1;
        }

        skin-concerns-list .explore-btn {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          align-self: flex-end; 
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
        }

        skin-concerns-list .explore-btn:hover,
        skin-concerns-list .explore-btn:focus-visible {
          background-color: var(--color-bg);
        }

        /* concern title */ 
        skin-concerns-list .concern-panel h2 {
          margin: 0 0 var(--space-sm);
          font-size: var(--font-size-2xl);
          font-weight: 600;
        }

        /* Common causes text */
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

        /* X (close) button, pinned to the panel's top-right corner */
        skin-concerns-list .close-panel {
          position: absolute; /* placed relative to the panel (it's position: relative) */
          top: var(--space-sm);
          right: var(--space-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--color-border-dark);
          font-size: var(--font-size-xl);
          cursor: pointer;
        }

        skin-concerns-list .close-panel:hover,
        skin-concerns-list .close-panel:focus-visible {
          background-color: var(--color-bg);
        }

        /* Gray italic text for anything that doesn't have real data yet */
        skin-concerns-list .placeholder {
          color: var(--color-text-muted);
          font-style: italic;
        }

        /* Narrow screens: stack the two sides */
        @media (max-width: 700px) {
          skin-concerns-list .concern-panel {
            grid-template-columns: 1fr;
            --panel-gap: var(--space-xl);
            margin: 0 var(--space-md) var(--panel-gap);
          }
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
  // Reads these fields from the concern's entry in concerns.json:
  //   description (string), causes (array), gofor (array),
  //   thesehelp (array), avoid (array)
  // Anything missing shows placeholder text instead.
  showPanel(concern) {
    // Grow the panel in if it's closed (or still closing). If it's already open, just swap the content.
    const shouldGrow = this.panel.hidden || Boolean(this.closingAnimation);
    let startHeight = 0;
    let startOpacity = 0;

    // If the panel is still closing, stop that and grow back from where it is
    if (this.closingAnimation) {
      startHeight = this.panel.offsetHeight;
      startOpacity = Number(getComputedStyle(this.panel).opacity);
      this.closingAnimation.cancel();
      this.closingAnimation = null;
    }

    this.panel.setAttribute("aria-label", `${concern.label} information`);
    this.panel.innerHTML = `
      <button type="button" class="close-panel" aria-label="Close ${escapeHtml(concern.label)} information">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      <div class="panel-left">
        <h2>${escapeHtml(concern.label)}</h2>
        ${renderText(concern.description, `Description of ${concern.label.toLowerCase()} goes here.`)}

        <h3>Common causes</h3>
        ${renderList(concern.causes, "Common causes go here.")}
      </div>

      <div class="panel-right">
        <!-- flex: 1 makes this grow and fill the space, pushing the
             Explore button to the bottom of the panel -->
        <div class="panel-right-content">
          <h3 class="go-for">Go For</h3>
          ${renderList(concern.gofor, "Ingredients to look for go here.")}

          <h3 class="these-help">These Help</h3>
          ${renderList(concern.thesehelp, "Helpful products go here.")}

          <h3 class="avoid">Avoid</h3>
          ${renderList(concern.avoid, "Things to avoid go here.")}
        </div>

        <!-- A link (not a <button>) because it goes to another page.
             Clicking it saves the concern with FilterLists (see the click listener above). -->
        <a class="explore-btn" href="functions.html">
          <span>Explore functions</span>
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          
        </a>
      </div>
    `;

    this.panel.hidden = false;
    this.positionArrow();
    window.addEventListener("resize", this.positionArrow);

    if (shouldGrow && !prefersReducedMotion()) {
      this.growPanel(startHeight, startOpacity);
    } else {
      // scroll so the panel is in the middle of <main>
      this.panel.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    }
  }

  // Grows and fades the panel in (the reverse of closePanel), while scrolling it to the middle of <main>
  growPanel(startHeight, startOpacity) {
    const scroller = this.closest("main") || document.scrollingElement; // on the home page, <main> is what scrolls
    const height = this.panel.offsetHeight;

    // Find where the scroll should end up once the panel is full size, then go back to where we started
    const from = scroller.scrollTop;
    this.panel.scrollIntoView({ behavior: "instant", block: "center" });
    const to = scroller.scrollTop;
    scroller.scrollTop = from;

    const animation = this.panel.animate(
      [
        { height: `${startHeight}px`, minHeight: `${startHeight}px`, opacity: startOpacity },
        { height: `${height}px`, minHeight: `${height}px`, opacity: 1 },
      ],
      { duration: 300, easing: "ease-in-out" }
    );
    this.openingAnimation = animation;

    // Scroll in step with the growing panel, so both finish together
    const followPanel = () => {
      if (this.openingAnimation !== animation) return; // finished, or interrupted by closing
      const grown = (this.panel.offsetHeight - startHeight) / Math.max(1, height - startHeight);
      scroller.scrollTop = from + (to - from) * Math.min(1, Math.max(0, grown));
      requestAnimationFrame(followPanel);
    };
    requestAnimationFrame(followPanel);

    animation.onfinish = () => {
      this.openingAnimation = null;
      scroller.scrollTop = to;
    };
  }

  // Shrinks and fades the panel out, then hides it and puts focus back on the button that opened it.
  closePanel() {
    if (this.panel.hidden || this.closingAnimation) return;

    // Start shrinking from wherever the panel is now (it may still be growing)
    const height = `${this.panel.offsetHeight}px`;
    const opacity = Number(getComputedStyle(this.panel).opacity);
    if (this.openingAnimation) {
      this.openingAnimation.cancel();
      this.openingAnimation = null;
    }

    const active = this.querySelector("button.concern.is-active");
    this.setActive(null);
    window.removeEventListener("resize", this.positionArrow);
    if (active) active.focus({ preventScroll: true }); // preventScroll: no jump while the panel shrinks

    const hide = () => {
      this.closingAnimation = null;
      this.panel.hidden = true;
    };

    // Skip the animation for people who turned on "reduce motion" in their system settings
    if (prefersReducedMotion()) {
      hide();
      return;
    }

    // Shrinking the height (not just fading) lets the page slide back smoothly instead of jumping
    this.closingAnimation = this.panel.animate(
      [
        { height, minHeight: height, opacity },
        { height: "0px", minHeight: "0px", opacity: 0 },
      ],
      { duration: 300, easing: "ease-in-out" }
    );
    this.closingAnimation.onfinish = hide;
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

// True if the person turned on "reduce motion" in their system settings
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

customElements.define("skin-concerns-list", SkinConcernsList);