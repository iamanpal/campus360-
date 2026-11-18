/* ==========================================================================
   CAMPUS 360 - ADMIN NOTICES MANAGEMENT JAVASCRIPT
   Publishes & deletes campus-wide notices via /api/admin/notices
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminNotices();
  initCreateNoticeForm();
});

async function fetchAdminNotices() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('adminNoticesContainer');

  try {
    const response = await fetch('/api/admin/notices', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load notices.</p>`;
      return;
    }

    const notices = result.data;

    if (notices.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No active circulars on notice board. Use form above to publish a notice.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = notices.map(n => `
        <div class="card" style="margin-bottom: 1.25rem; border-left: 5px solid var(--maroon);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.35rem;">${n.category || 'General'}</span>
              <h3 style="color: var(--dark-maroon); font-size: 1.2rem; margin-bottom: 0.35rem;">${n.title}</h3>
              <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem;">📅 Published on: ${new Date(n.publishedDate || n.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <button onclick="deleteNotice('${n._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.4rem 0.85rem;">
                🗑️ Delete Notice
              </button>
            </div>
          </div>
          <p style="color: var(--charcoal); margin-top: 0.5rem; margin-bottom: 0;">${n.content}</p>
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching admin notices:', error);
  }
}

function initCreateNoticeForm() {
  const form = document.getElementById('createNoticeForm');
  const alertBox = document.getElementById('noticeAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const title = document.getElementById('newNoticeTitle')?.value.trim();
      const category = document.getElementById('newNoticeCategory')?.value;
      const content = document.getElementById('newNoticeContent')?.value.trim();

      if (!title || !content) {
        showAlert('Please provide notice title and content.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/notices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, category, content })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminNotices();
        } else {
          showAlert(result.message || 'Error publishing notice.', 'error');
        }
      } catch (error) {
        console.error('Error publishing notice:', error);
        showAlert('Network or server error publishing notice.', 'error');
      }
    });
  }

  function showAlert(msg, type) {
    if (alertBox) {
      alertBox.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
    }
  }
}

async function deleteNotice(id) {
  if (!confirm('Are you sure you want to delete this notice circular?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/admin/notices/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminNotices();
    } else {
      alert(result.message || 'Error deleting notice.');
    }
  } catch (error) {
    console.error('Error deleting notice:', error);
  }
}
