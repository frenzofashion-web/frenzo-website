/* ============================================
   FRENZO — Grid Renderer
   Agent 3: Frontend & UI/UX Engineer
   ============================================ */

/**
 * Renders the lookbook grid from data
 * @param {Array} looks - Array of look objects
 * @param {HTMLElement} container - Grid container element
 * @param {Function} onCardClick - Callback when a card is clicked
 */
function renderGrid(looks, container, onCardClick) {
  if (!container || !looks || !looks.length) return;

  // Clear existing content
  container.innerHTML = '';

  looks.forEach((look, index) => {
    const card = createLookCard(look, index);
    
    // Click handler
    card.addEventListener('click', () => {
      onCardClick(look);
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(look);
      }
    });

    container.appendChild(card);
  });

  // Observe cards for scroll-triggered reveal
  observeCards(container);
}

/**
 * Creates a single look card element
 * @param {Object} look - Look data object
 * @param {number} index - Card index for stagger delay
 * @returns {HTMLElement}
 */
function createLookCard(look, index) {
  const card = document.createElement('article');
  card.className = 'look-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `View ${look.title} - ${look.subtitle}`);
  card.dataset.lookId = look.id;

  // Stagger delay for entrance animation
  const delay = 150 + (index * 100);
  card.style.setProperty('--reveal-delay', `${delay}ms`);

  card.innerHTML = `
    <img 
      class="look-card__image" 
      src="${look.image}" 
      alt="${look.alt}"
      loading="${index < 4 ? 'eager' : 'lazy'}"
      decoding="async"
    />
    <div class="look-card__overlay">
      <span class="look-card__title">${look.title}</span>
      <span class="look-card__subtitle">${look.subtitle}</span>
    </div>
  `;

  // Check if look is already in favorites
  const favorites = JSON.parse(localStorage.getItem('frenzo_favorites') || '[]');
  const isFav = favorites.includes(look.id);

  // Create favorite heart button
  const favBtn = document.createElement('button');
  favBtn.className = `look-card__favorite${isFav ? ' is-favorite' : ''}`;
  favBtn.setAttribute('aria-label', isFav ? 'Remove from saved outfits' : 'Save outfit');
  favBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;

  // Connect click listener for favoriting
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Avoid triggering open card drawer event
    
    const currentFavorites = JSON.parse(localStorage.getItem('frenzo_favorites') || '[]');
    let updatedFavorites;
    let newFavState;

    if (currentFavorites.includes(look.id)) {
      updatedFavorites = currentFavorites.filter(id => id !== look.id);
      favBtn.classList.remove('is-favorite');
      favBtn.setAttribute('aria-label', 'Save outfit');
      newFavState = false;
    } else {
      updatedFavorites = [...currentFavorites, look.id];
      favBtn.classList.add('is-favorite');
      favBtn.setAttribute('aria-label', 'Remove from saved outfits');
      newFavState = true;
    }
    localStorage.setItem('frenzo_favorites', JSON.stringify(updatedFavorites));

    // Custom event to reactively notify App controller
    const event = new CustomEvent('frenzo:favorite-toggle', {
      detail: { lookId: look.id, isFavorite: newFavState }
    });
    window.dispatchEvent(event);
  });

  card.appendChild(favBtn);

  // Handle image load error gracefully
  const img = card.querySelector('.look-card__image');
  img.addEventListener('error', () => {
    img.src = createFallbackImage(look.title);
    img.alt = `${look.title} - Image unavailable`;
  });

  return card;
}

/**
 * Creates an SVG fallback image when Unsplash is unavailable
 * @param {string} title - Look title for display
 * @returns {string} Data URI SVG
 */
function createFallbackImage(title) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
      <rect width="400" height="533" fill="#EDE5DA"/>
      <text 
        x="200" y="250" 
        text-anchor="middle" 
        font-family="Georgia, serif" 
        font-size="14" 
        letter-spacing="3"
        fill="#B8A48E"
      >${title}</text>
      <text 
        x="200" y="280" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="10" 
        letter-spacing="2"
        fill="#B8A48E"
      >FRENZO</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/**
 * Intersection Observer for scroll-triggered card reveals
 * (Re-triggers animation for cards scrolled into view)
 * @param {HTMLElement} container
 */
function observeCards(container) {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    }
  );

  container.querySelectorAll('.look-card').forEach((card) => {
    observer.observe(card);
  });
}
