/* ==========================================================================
   CAMPUS 360 - FACULTY STUDY MATERIAL MANAGEMENT JAVASCRIPT
   Uploads & deletes study materials via /api/faculty/materials
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchFacultyMaterials();
  initUploadMaterialForm();
});

async function fetchFacultyMaterials() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('facultyMaterialsContainer');

  try {
    const response = await fetch('/api/faculty/materials', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No materials uploaded yet.</p>`;
      return;
    }

    const materials = result.data;

    if (materials.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No study materials uploaded. Use form above to upload notes/PDFs.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = materials.map(mat => `
        <div class="card" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.5rem;">${mat.subject}</span>
              <h3 style="color: var(--dark-maroon); font-size: 1.2rem; margin-bottom: 0.35rem;">${mat.title}</h3>
              <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem;">Uploaded: ${new Date(mat.uploadDate || mat.createdAt).toLocaleDateString()} | Document URL: <a href="${mat.fileUrl}" target="_blank" style="color: var(--maroon); font-weight: 600;">Link</a></p>
            </div>
            <div>
              <button onclick="deleteMaterial('${mat._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.4rem 0.85rem;">
                🗑️ Delete Document
              </button>
            </div>
          </div>
          <p style="color: var(--charcoal); margin-top: 0.5rem; margin-bottom: 0;">${mat.description || ''}</p>
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching faculty materials:', error);
  }
}

function initUploadMaterialForm() {
  const form = document.getElementById('uploadMaterialForm');
  const alertBox = document.getElementById('materialAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const title = document.getElementById('matTitle')?.value.trim();
      const subject = document.getElementById('matSubject')?.value;
      const fileUrl = document.getElementById('matUrl')?.value.trim();
      const description = document.getElementById('matDescription')?.value.trim();

      if (!title || !subject || !fileUrl) {
        showAlert('Please fill out document title, subject, and resource URL.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/faculty/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, subject, fileUrl, description })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchFacultyMaterials();
        } else {
          showAlert(result.message || 'Error publishing study material.', 'error');
        }
      } catch (error) {
        console.error('Error publishing study material:', error);
        showAlert('Network or server error publishing material.', 'error');
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

async function deleteMaterial(id) {
  if (!confirm('Are you sure you want to delete this study material?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/faculty/materials/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchFacultyMaterials();
    } else {
      alert(result.message || 'Error deleting material');
    }
  } catch (error) {
    console.error('Error deleting study material:', error);
  }
}
