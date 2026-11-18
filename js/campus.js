/* ==========================================================================
   CAMPUS 360 - CAMPUS & GALLERY PAGE JAVASCRIPT (PHASE 2 BACKEND CONNECTED)
   Facility Tabs & Photo Gallery Category Handler (Fetches from /api/gallery)
   ========================================================================== */

let galleryData = [];

document.addEventListener('DOMContentLoaded', () => {
  initFacilityTabs();
  fetchGalleryFromAPI();
  initGalleryFilters();
});

/**
 * Handles Facility Tab switching
 */
function initFacilityTabs() {
  const tabs = document.querySelectorAll('.facility-tab');
  const panels = document.querySelectorAll('.facility-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/**
 * Fetches gallery items from MongoDB REST API
 */
async function fetchGalleryFromAPI() {
  const container = document.getElementById('galleryContainer');
  if (container) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 2rem;">⏳ Loading campus gallery...</p>`;
  }

  try {
    const response = await fetch('/api/gallery');
    const result = await response.json();

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      galleryData = result.data;
    } else {
      galleryData = [];
    }
  } catch (error) {
    console.warn('Backend API connection warning. Showing empty gallery state:', error);
    galleryData = [];
  }

  renderGallery(galleryData);
}

/**
 * Renders gallery items to grid
 */
function renderGallery(items) {
  const container = document.getElementById('galleryContainer');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 2rem; border: 1px dashed var(--soft-rose); border-radius: var(--radius-md);">No gallery items available.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="gallery-card">
      <div class="gallery-placeholder">
        <span style="font-size: 3rem; margin-bottom: 0.5rem;">${item.imagePath || '🖼️'}</span>
        <span class="gallery-cat-badge">${item.category || 'Campus'}</span>
        <h4 style="color: var(--white); font-size: 1.05rem; margin-top: 0.5rem;">${item.title}</h4>
      </div>
    </div>
  `).join('');
}

/**
 * Initializes Gallery category filtering buttons
 */
function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btns .filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-cat');
      if (cat === 'All') {
        renderGallery(galleryData);
      } else {
        const filtered = galleryData.filter(img => img.category === cat);
        renderGallery(filtered);
      }
    });
  });
}
