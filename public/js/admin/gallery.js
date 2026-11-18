/* ==========================================================================
   CAMPUS 360 - ADMIN CAMPUS GALLERY JAVASCRIPT
   Adds & manages campus photo gallery items via /api/admin/gallery
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminGallery();
  initAddGalleryItemForm();
});

async function fetchAdminGallery() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('adminGalleryGrid');

  try {
    const response = await fetch('/api/admin/gallery', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; grid-column: 1/-1; padding: 2rem;">Failed to load gallery items.</p>`;
      return;
    }

    const items = result.data;

    if (items.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; grid-column: 1/-1; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No gallery images uploaded yet. Use the form above to publish new photos to the Public Website.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = items.map(item => `
        <div class="card" style="display: flex; flex-direction: column; height: 100%;">
          <div style="background: var(--blush); height: 160px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 3.5rem; margin-bottom: 0.85rem; overflow: hidden;">
            ${item.imagePath && (item.imagePath.startsWith('http') || item.imagePath.startsWith('/') || item.imagePath.startsWith('images/')) 
              ? `<img src="${item.imagePath}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='🏛️'">`
              : (item.imagePath || '🏛️')}
          </div>
          <span class="badge badge-info" style="align-self: flex-start; margin-bottom: 0.35rem;">${item.category || 'Campus'}</span>
          <h4 style="color: var(--dark-maroon); font-size: 1.1rem; margin-bottom: 0.35rem;">${item.title}</h4>
          <p style="color: var(--muted); font-size: 0.85rem; flex-grow: 1; margin-bottom: 0.85rem;">${item.description || 'Campus facility & life highlight.'}</p>
          <button onclick="deleteGalleryItem('${item._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; width: 100%;">
            🗑️ Delete Photo
          </button>
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching admin gallery:', error);
  }
}

function initAddGalleryItemForm() {
  const form = document.getElementById('addGalleryForm');
  const alertBox = document.getElementById('galleryAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const title = document.getElementById('galleryTitle')?.value.trim();
      const category = document.getElementById('galleryCategory')?.value;
      const imagePath = document.getElementById('galleryImagePath')?.value.trim();
      const description = document.getElementById('galleryDescription')?.value.trim();

      if (!title || !imagePath) {
        showAlert('Please provide photo title and image path or emoji icon.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, category, imagePath, description })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminGallery();
        } else {
          showAlert(result.message || 'Error adding gallery photo.', 'error');
        }
      } catch (error) {
        console.error('Error adding gallery item:', error);
        showAlert('Network or server error uploading photo.', 'error');
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

async function deleteGalleryItem(id) {
  if (!confirm('Are you sure you want to delete this photo from the campus gallery?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminGallery();
    } else {
      alert(result.message || 'Error deleting gallery item.');
    }
  } catch (error) {
    console.error('Error deleting gallery item:', error);
  }
}
