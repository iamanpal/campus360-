/* ==========================================================================
   CAMPUS 360 - FACULTY ASSIGNMENTS MANAGEMENT JAVASCRIPT
   Creates, edits & deletes assignments via /api/faculty/assignments
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchFacultyAssignments();
  initCreateAssignmentForm();
});

async function fetchFacultyAssignments() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('facultyAssignmentsContainer');

  try {
    const response = await fetch('/api/faculty/assignments', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No assignments created yet.</p>`;
      return;
    }

    const assignments = result.data;

    if (assignments.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No assignments created. Use the form above to publish a new assignment.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = assignments.map(item => `
        <div class="assignment-card">
          <div class="assignment-header">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.65rem; font-size: 0.82rem; padding: 0.35rem 0.85rem;">${item.subject}</span>
              <h3 class="assignment-title">${item.title}</h3>
              <div class="assignment-meta-row">
                <span class="assignment-meta-item">🎯 <strong>Total Marks:</strong> ${item.totalMarks || 100}</span>
                <span class="assignment-meta-item">⏰ <strong>Deadline:</strong> ${new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span class="assignment-meta-item">📅 <strong>Posted:</strong> ${new Date(item.createdAt || item.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <button onclick="deleteAssignment('${item._id}')" class="btn btn-secondary" style="font-size: 0.85rem; color: #842029; border-color: #f5c2c7; padding: 0.5rem 1.15rem; font-weight: 600;">
                🗑️ Delete Assignment
              </button>
            </div>
          </div>

          <div class="assignment-description-box">
            <strong style="color: var(--dark-maroon); font-size: 0.92rem; display: block; margin-bottom: 0.4rem;">Instructions & Details:</strong>
            <p style="margin: 0; line-height: 1.65; white-space: pre-line;">${item.description}</p>
          </div>

          ${item.imageUrl ? `
            <div class="assignment-photo-box">
              <span style="font-size: 0.9rem; font-weight: 700; color: var(--maroon); display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                📷 Attached Question Paper / Reference Photo
              </span>
              <a href="${item.imageUrl}" target="_blank" title="Click to view full image in high resolution">
                <img src="${item.imageUrl}" alt="Assignment Photo" class="assignment-photo-img">
              </a>
              <small style="font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; display: block;">🔍 Click photo to view high-resolution image in new tab</small>
            </div>
          ` : ''}
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
  }
}

/**
 * Client-Side Image Compression Helper
 * Resizes large camera photos (e.g. 8MB) to ~200KB to ensure fast, 100% reliable uploads.
 */
function compressImage(file, maxDimension = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function initCreateAssignmentForm() {
  const form = document.getElementById('createAssignmentForm');
  const alertBox = document.getElementById('assignmentAlert');

  let selectedImageBase64 = '';
  const fileInput = document.getElementById('assignPhotoFile');
  const urlInput = document.getElementById('assignPhotoUrl');
  const previewContainer = document.getElementById('assignPhotoPreviewContainer');
  const previewImg = document.getElementById('assignPhotoPreview');
  const removeBtn = document.getElementById('removePhotoBtn');

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          if (previewContainer) {
            previewContainer.style.display = 'block';
            if (previewImg) previewImg.alt = 'Compressing image...';
          }
          // Fast client-side canvas compression
          selectedImageBase64 = await compressImage(file);
          if (previewImg) {
            previewImg.src = selectedImageBase64;
            previewImg.alt = 'Photo Preview';
          }
          if (urlInput) urlInput.value = '';
        } catch (err) {
          console.error('Image compression failed, using direct reader:', err);
          const reader = new FileReader();
          reader.onload = (event) => {
            selectedImageBase64 = event.target.result;
            if (previewImg) previewImg.src = selectedImageBase64;
            if (previewContainer) previewContainer.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        selectedImageBase64 = val;
        if (previewImg) previewImg.src = val;
        if (previewContainer) previewContainer.style.display = 'block';
        if (fileInput) fileInput.value = '';
      } else if (!fileInput || !fileInput.files[0]) {
        selectedImageBase64 = '';
        if (previewContainer) previewContainer.style.display = 'none';
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      selectedImageBase64 = '';
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      if (previewContainer) previewContainer.style.display = 'none';
      if (previewImg) previewImg.src = '';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const title = document.getElementById('assignTitle')?.value.trim();
      const subject = document.getElementById('assignSubject')?.value?.trim();
      const dueDate = document.getElementById('assignDueDate')?.value;
      const totalMarks = document.getElementById('assignTotalMarks')?.value;
      const description = document.getElementById('assignDescription')?.value.trim();
      const imageUrl = selectedImageBase64 || urlInput?.value.trim() || '';

      if (!title || !subject || !dueDate || !description) {
        showAlert('Please fill out all required fields.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/faculty/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, subject, dueDate, totalMarks, description, imageUrl })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          selectedImageBase64 = '';
          if (previewContainer) previewContainer.style.display = 'none';
          if (previewImg) previewImg.src = '';
          fetchFacultyAssignments();
        } else {
          showAlert(result.message || 'Error creating assignment.', 'error');
        }
      } catch (error) {
        console.error('Error creating assignment:', error);
        showAlert('Network or server error creating assignment.', 'error');
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

async function deleteAssignment(id) {
  if (!confirm('Are you sure you want to delete this assignment and its student submissions?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/faculty/assignments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchFacultyAssignments();
    } else {
      alert(result.message || 'Error deleting assignment');
    }
  } catch (error) {
    console.error('Error deleting assignment:', error);
  }
}
