/* ============================================
   FRENZO — Bottom Sheet Drawer
   Agent 3: Frontend & UI/UX Engineer
   ============================================ */

/**
 * Drawer Controller
 * Manages the bottom-sheet drawer with touch gestures,
 * keyboard controls, and smooth animations.
 */
class FrenzoDrawer {
  constructor() {
    this.overlay = document.getElementById('drawerOverlay');
    this.panel = document.getElementById('drawerPanel');
    this.closeBtn = document.getElementById('drawerClose');
    this.handle = document.getElementById('drawerHandle');
    this.body = document.getElementById('drawerBody');
    this.lookTitle = document.getElementById('drawerLookTitle');
    this.lookSeason = document.getElementById('drawerLookSeason');
    this.productList = document.getElementById('drawerProductList');
    this.shopAllBtn = document.getElementById('drawerShopAll');

    this.isOpen = false;
    this.isDragging = false;
    this.startY = 0;
    this.currentY = 0;
    this.scrollTop = 0;

    this._bindEvents();
  }

  /**
   * Opens the drawer with the given look data
   * @param {Object} look - Look data object
   */
  open(look) {
    if (this.isOpen) return;
    this.isOpen = true;

    // Populate content
    this._renderContent(look);

    // Show drawer
    this.overlay.classList.add('active');
    this.panel.classList.add('active');
    this.overlay.classList.remove('closing');
    this.panel.classList.remove('closing');

    // Lock body scroll
    document.body.classList.add('drawer-open');
    this._savedScrollY = window.scrollY;

    // Reset panel position
    this.panel.style.transform = '';

    // Focus management
    this.closeBtn.focus();

    // Announce to screen readers
    this.panel.setAttribute('aria-hidden', 'false');
  }

  /**
   * Closes the drawer with animation
   */
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Trigger close animations
    this.overlay.classList.add('closing');
    this.panel.classList.add('closing');

    // Wait for animation to complete
    const onAnimEnd = () => {
      this.overlay.classList.remove('active', 'closing');
      this.panel.classList.remove('active', 'closing');
      this.panel.style.transform = '';

      // Restore body scroll
      document.body.classList.remove('drawer-open');
      window.scrollTo(0, this._savedScrollY || 0);

      // Accessibility
      this.panel.setAttribute('aria-hidden', 'true');

      this.panel.removeEventListener('animationend', onAnimEnd);
    };

    this.panel.addEventListener('animationend', onAnimEnd, { once: true });

    // Fallback timeout in case animationend doesn't fire
    setTimeout(onAnimEnd, 500);
  }

  /**
   * Renders products inside the drawer
   * @param {Object} look - Look data
   * @private
   */
  _renderContent(look) {
    // Header
    this.lookTitle.textContent = look.title;
    this.lookSeason.textContent = look.season;

    // Clear and populate products
    this.productList.innerHTML = '';

    look.products.forEach((product, idx) => {
      const item = this._createProductItem(product, idx);
      this.productList.appendChild(item);
    });

    // Setup shop all button
    if (this.shopAllBtn) {
      if (look.products && look.products.length > 0) {
        this.shopAllBtn.style.display = 'block';
        this.shopAllBtn.href = look.products[0].affiliateUrl;
      } else {
        this.shopAllBtn.style.display = 'none';
      }
    }

    // Reset scroll position
    this.body.scrollTop = 0;
  }

  /**
   * Creates a single product item element
   * @param {Object} product - Product data
   * @param {number} idx - Index for animation stagger
   * @returns {HTMLElement}
   * @private
   */
  _createProductItem(product, idx) {
    const li = document.createElement('li');
    li.className = 'product-item';
    li.style.setProperty('--product-delay', `${200 + idx * 80}ms`);

    const indexStr = String(product.index).padStart(2, '0');

    li.innerHTML = `
      <a 
        class="product-link" 
        href="${product.affiliateUrl}" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="${indexStr}. ${product.label} - ${product.name}, ${product.price}"
        data-product-id="${product.id}"
      >
        <div class="product__image-wrap">
          <img 
            class="product__image" 
            src="${product.image}" 
            alt="${product.name}"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="product__info">
          <div class="product__label">
            ${indexStr}. ${product.label}
            <span class="product__category-tag">${product.category}</span>
          </div>
          <div class="product__name">${product.name}</div>
          <div class="product__brand">${product.brand}</div>
          <div class="product__price">${product.price}</div>
        </div>
        <svg class="product__arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3l5 5-5 5"/>
        </svg>
      </a>
    `;

    // Track affiliate click
    const link = li.querySelector('.product-link');
    link.addEventListener('click', (e) => {
      trackAffiliateClick(product.id, product.affiliateUrl);
    });

    // Handle image error
    const img = li.querySelector('.product__image');
    img.addEventListener('error', () => {
      img.parentElement.style.backgroundColor = '#EDE5DA';
      img.style.display = 'none';
    });

    return li;
  }

  /**
   * Binds all event listeners
   * @private
   */
  _bindEvents() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.close());

    // Overlay click to close
    this.overlay.addEventListener('click', () => this.close());

    // Prevent clicks inside panel from closing
    this.panel.addEventListener('click', (e) => e.stopPropagation());

    // Keyboard: Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // ── Touch Gestures (Swipe to Dismiss) ──
    this._bindTouchGestures();
  }

  /**
   * Touch gesture handling for swipe-to-dismiss
   * @private
   */
  _bindTouchGestures() {
    const handle = this.handle;
    const panel = this.panel;
    const body = this.body;

    let touchStartY = 0;
    let touchCurrentY = 0;
    let isDragging = false;
    let isAtTop = true;

    // Touch start
    const onTouchStart = (e) => {
      // Only allow dragging from handle or when scrolled to top
      const touchTarget = e.target;
      const isHandle = handle.contains(touchTarget);
      isAtTop = body.scrollTop <= 0;

      if (isHandle || isAtTop) {
        isDragging = true;
        touchStartY = e.touches[0].clientY;
        touchCurrentY = touchStartY;
        panel.style.transition = 'none';
      }
    };

    // Touch move
    const onTouchMove = (e) => {
      if (!isDragging) return;

      touchCurrentY = e.touches[0].clientY;
      const deltaY = touchCurrentY - touchStartY;

      // Only allow dragging downward
      if (deltaY > 0) {
        e.preventDefault();
        // Apply resistance as user drags further
        const resistance = 0.6;
        const translateY = deltaY * resistance;
        panel.style.transform = `translateY(${translateY}px)`;
      }
    };

    // Touch end
    const onTouchEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;

      const deltaY = touchCurrentY - touchStartY;
      const velocity = deltaY / (Date.now() - (this._touchStartTime || Date.now()));

      panel.style.transition = '';

      // Dismiss if dragged far enough or with enough velocity
      if (deltaY > 120 || velocity > 0.5) {
        this.close();
      } else {
        // Snap back
        panel.style.transform = '';
      }
    };

    // Record touch start time
    panel.addEventListener('touchstart', (e) => {
      this._touchStartTime = Date.now();
      onTouchStart(e);
    }, { passive: false });

    panel.addEventListener('touchmove', onTouchMove, { passive: false });
    panel.addEventListener('touchend', onTouchEnd, { passive: true });
  }
}
