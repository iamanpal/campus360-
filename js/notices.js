/* ==========================================================================
   CAMPUS 360 - NOTICES PAGE JAVASCRIPT (PHASE 2 BACKEND CONNECTED)
   Fetches dynamic notices from MongoDB (/api/notices) with filter capabilities.
   ========================================================================== */

let noticesData = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchNoticesFromAPI();
  initNoticeFilters();
});

/**
 * Fetches notice records from MongoDB REST API
 */
async function fetchNoticesFromAPI() {
  const container = document.getElementById('noticesContainer');
  if (container) {
    container.innerHTML = `
      <div style="background: var(--white); padding: 2.5rem; text-align: center; border-radius: var(--radius-md);">
        <p style="color: var(--muted); font-size: 1.1rem;">⏳ Loading official notices from database...</p>
      </div>
    `;
  }

  try {
    const response = await fetch('/api/notices');
    const result = await response.json();

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      noticesData = result.data;
    } else {
      noticesData = [];
    }
  } catch (error) {
    console.warn('Backend API connection warning. Showing empty notice state:', error);
    noticesData = [];
  }

  renderNotices(noticesData);
}

/**
 * Renders notice list to container
 */
function renderNotices(notices) {
  const container = document.getElementById('noticesContainer');
  if (!container) return;

  if (!notices || notices.length === 0) {
    container.innerHTML = `
      <div style="background: var(--white); padding: 2.5rem; text-align: center; border-radius: var(--radius-md); border: 1px dashed var(--soft-rose);">
        <h3 style="color: var(--muted); margin-bottom: 0.5rem;">No notices available.</h3>
        <p style="color: var(--muted); font-size: 0.9rem;">Official circulars and exam announcements will be published here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notices.map(notice => {
    const dateFormatted = notice.publishedDate 
      ? new Date(notice.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Recent';

    return `
      <div class="notice-card">
        <div class="notice-meta">
          <span class="notice-category">${notice.category || 'General'}</span>
          <span class="notice-date">📅 Published on: ${dateFormatted}</span>
        </div>
        <h3>${notice.title}</h3>
        <p>${notice.content}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--muted); border-top: 1px dashed var(--soft-rose); padding-top: 0.75rem;">
          <span>Published by: Office of Academic Affairs</span>
          <a href="login.html" style="color: var(--maroon); font-weight: 600;">Log in for details →</a>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Initializes notice category filtering buttons
 */
function initNoticeFilters() {
  const filterBtns = document.querySelectorAll('.notice-filter-bar .filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-cat');
      if (cat === 'All') {
        renderNotices(noticesData);
      } else {
        const filtered = noticesData.filter(n => n.category === cat);
        renderNotices(filtered);
      }
    });
  });
}
