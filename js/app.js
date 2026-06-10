/* ============================================
   FRENZO — App Controller
   Agent 4: Integration & QA Engineer
   ============================================ */

/**
 * Main application controller
 * Wires together data, grid, and drawer modules
 */
class FrenzoApp {
  constructor() {
    this.gridContainer = document.getElementById('lookbookGrid');
    this.drawer = null;
    this.data = null;
    this.currentFilter = 'all';
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // 1. Fetch lookbook data
      this.data = await fetchLookbook();

      // 2. Initialize drawer
      this.drawer = new FrenzoDrawer();

      // 3. Render grid
      renderGrid(
        this.data.looks,
        this.gridContainer,
        (look) => this._onLookClick(look)
      );

      // 4. Setup filter tabs
      this._setupFilterTabs();

      // 5. Setup scroll effects
      this._setupScrollEffects();

      // 6. Listen to favorites toggling for reactive grid updates
      window.addEventListener('frenzo:favorite-toggle', () => {
        if (this.currentFilter === 'favorites') {
          this._applyFilter('favorites');
        }
      });

      // 7. Log ready state
      console.log(
        '%c F R E N Z O %c Lookbook Ready ',
        'background: #4A3225; color: #F4EDE4; padding: 6px 12px; font-family: Georgia; letter-spacing: 4px;',
        'background: #F4EDE4; color: #4A3225; padding: 6px 12px; font-family: Arial; letter-spacing: 1px;'
      );

    } catch (error) {
      console.error('[FRENZO] Failed to initialize:', error);
      this._showError();
    }
  }

  /**
   * Handle look card click
   * @param {Object} look - Look data
   * @private
   */
  _onLookClick(look) {
    if (this.drawer) {
      this.drawer.open(look);
    }
  }

  /**
   * Setup season switcher tabs events
   * @private
   */
  _setupFilterTabs() {
    const tabsContainer = document.getElementById('filterTabs');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filterVal = tab.getAttribute('data-filter');
        
        // Remove active class from all tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });

        // Add active class to clicked tab
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        this.currentFilter = filterVal;
        this._applyFilter(filterVal);
      });
    });
  }

  /**
   * Filter and render lookbook cards
   * @param {string} filterVal
   * @private
   */
  _applyFilter(filterVal) {
    let filteredLooks = [];

    if (filterVal === 'all') {
      filteredLooks = this.data.looks;
    } else if (filterVal === 'favorites') {
      const favorites = JSON.parse(localStorage.getItem('frenzo_favorites') || '[]');
      filteredLooks = this.data.looks.filter(look => favorites.includes(look.id));
    } else {
      filteredLooks = this.data.looks.filter(look => look.season === filterVal);
    }

    if (filterVal === 'favorites' && filteredLooks.length === 0) {
      this._showEmptyFavorites();
    } else {
      renderGrid(
        filteredLooks,
        this.gridContainer,
        (look) => this._onLookClick(look)
      );
    }
  }

  /**
   * Render premium looking empty state for favorites
   * @private
   */
  _showEmptyFavorites() {
    if (this.gridContainer) {
      this.gridContainer.innerHTML = `
        <div style="
          grid-column: 1 / -1;
          padding: 6rem 2rem;
          text-align: center;
          font-family: var(--font-body);
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: headerReveal 0.6s var(--ease-out-expo) forwards;
        ">
          <svg style="width: 32px; height: 32px; stroke-width: 1.2; margin-bottom: var(--space-md); color: var(--text-tertiary); fill: none; stroke: currentColor;" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <p style="font-size: var(--fs-md); letter-spacing: var(--ls-wide); text-transform: uppercase; font-family: var(--font-display); font-weight: var(--fw-light);">
            No Saved Looks Yet
          </p>
          <p style="font-size: var(--fs-xs); color: var(--text-tertiary); margin-top: 0.5rem; max-width: 240px; line-height: 1.6;">
            Tap the heart icon on any look to save it to your collection.
          </p>
        </div>
      `;
    }
  }

  /**
   * Setup header scroll effects
   * @private
   */
  _setupScrollEffects() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    const onScroll = () => {
      const currentScroll = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Add/remove scrolled class for header blur
          if (currentScroll > 10) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          
          lastScroll = currentScroll;
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
   * Show error state if initialization fails
   * @private
   */
  _showError() {
    if (this.gridContainer) {
      this.gridContainer.innerHTML = `
        <div style="
          grid-column: 1 / -1;
          padding: 4rem 2rem;
          text-align: center;
          font-family: var(--font-body);
          color: var(--text-tertiary);
        ">
          <p style="font-size: var(--fs-sm); letter-spacing: var(--ls-wider); text-transform: uppercase;">
            Unable to load lookbook
          </p>
          <p style="font-size: var(--fs-xs); margin-top: 0.5rem;">
            Please refresh the page to try again.
          </p>
        </div>
      `;
    }
  }
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  const app = new FrenzoApp();
  app.init();
});
