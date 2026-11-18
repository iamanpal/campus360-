/* ==========================================================================
   CAMPUS 360 - STUDENT NOTICES JAVASCRIPT
   Fetches notices for Student Portal layout
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentNotices();
});

async function fetchStudentNotices() {
  const container = document.getElementById('studentNoticesContainer');

  try {
    const response = await fetch('/api/notices');
    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No notices available.</p>`;
      return;
    }

    const notices = result.data;

    if (notices.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No active circulars on notice board.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = notices.map(n => {
        const dateStr = n.publishedDate
          ? new Date(n.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent';

        return `
          <div class="card" style="margin-bottom: 1.25rem; border-left: 5px solid var(--maroon);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <span class="badge badge-info">${n.category || 'General'}</span>
              <span style="font-size: 0.85rem; color: var(--muted);">📅 ${dateStr}</span>
            </div>
            <h3 style="color: var(--dark-maroon); font-size: 1.25rem; margin-bottom: 0.5rem;">${n.title}</h3>
            <p style="color: var(--charcoal); margin-bottom: 0.5rem;">${n.content}</p>
            <div style="font-size: 0.8rem; color: var(--muted); border-top: 1px dashed var(--soft-rose); padding-top: 0.5rem; margin-top: 0.5rem;">
              Publisher: Office of Academic Affairs
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching student notices:', error);
  }
}
