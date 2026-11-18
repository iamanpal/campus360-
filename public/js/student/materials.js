/* ==========================================================================
   CAMPUS 360 - STUDENT STUDY MATERIALS JAVASCRIPT
   Fetches study materials & resources from /api/student/materials
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentMaterials();
});

async function fetchStudentMaterials() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('materialsContainer');

  try {
    const response = await fetch('/api/student/materials', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No study materials available.</p>`;
      return;
    }

    const materials = result.data;

    if (materials.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No study materials uploaded for your course yet.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = materials.map(mat => `
        <div class="card" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.5rem;">${mat.subject}</span>
              <h3 style="color: var(--dark-maroon); font-size: 1.25rem; margin-bottom: 0.35rem;">${mat.title}</h3>
              <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem;">Uploaded by: ${mat.facultyName || 'Faculty'} | ${new Date(mat.uploadDate || mat.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <a href="${mat.fileUrl || '#'}" target="_blank" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                📥 View / Download Material
              </a>
            </div>
          </div>
          <p style="color: var(--charcoal); margin-top: 0.75rem; margin-bottom: 0;">${mat.description || 'Reference lecture notes and study slides.'}</p>
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching study materials:', error);
  }
}
