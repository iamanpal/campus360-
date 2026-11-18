/* ==========================================================================
   CAMPUS 360 - STUDENT ASSIGNMENTS JAVASCRIPT
   Fetches assignments from /api/student/assignments & handles online submission
   Supports Photo (auto-compressed) and PDF document attachments
   ========================================================================== */

let currentAssignments = [];
let activeAssignmentId = null;
let currentFileDataUrl = null;
let currentFileName = '';
let currentFileType = '';

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentAssignments();
  initSubmissionForm();
});

async function fetchStudentAssignments() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('assignmentsContainer');

  try {
    const response = await fetch('/api/student/assignments', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No assignments available.</p>`;
      return;
    }

    currentAssignments = result.data;
    renderAssignments(currentAssignments);

  } catch (error) {
    console.error('Error fetching student assignments:', error);
  }
}

function renderAssignments(list) {
  const container = document.getElementById('assignmentsContainer');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No assignments found.</p>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const dueFormatted = item.dueDate
      ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';

    let badgeClass = 'badge-warning';
    if (item.status === 'Submitted') badgeClass = 'badge-success';
    if (item.status === 'Late') badgeClass = 'badge-danger';

    const sub = item.submission;
    let submissionContentHtml = '';

    if (sub) {
      const isPdf = sub.fileType === 'pdf' || (sub.attachmentUrl && (sub.attachmentUrl.startsWith('data:application/pdf') || (sub.fileName && sub.fileName.toLowerCase().endsWith('.pdf'))));
      const isImage = sub.fileType === 'image' || (sub.attachmentUrl && (sub.attachmentUrl.startsWith('data:image/') || sub.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif)/i)));

      let fileSnippet = '';
      if (isPdf && sub.attachmentUrl) {
        fileSnippet = `
          <div style="margin-top: 0.75rem; padding: 0.85rem 1.25rem; background: #fff5f7; border: 1px solid var(--soft-rose); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.8rem;">📄</span>
              <div>
                <strong style="color: var(--dark-maroon); font-size: 0.95rem; display: block;">${sub.fileName || 'Assignment-Solution.pdf'}</strong>
                <span style="color: var(--muted); font-size: 0.8rem;">PDF Document Solution Attached</span>
              </div>
            </div>
            <a href="${sub.attachmentUrl}" target="_blank" download="${sub.fileName || 'Solution.pdf'}" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.45rem 1rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
              👁️ View / Download PDF
            </a>
          </div>
        `;
      } else if (isImage && sub.attachmentUrl) {
        fileSnippet = `
          <div style="margin-top: 0.75rem; padding: 0.85rem; background: #fff; border: 1px solid var(--soft-rose); border-radius: 8px; text-align: center;">
            <strong style="color: var(--dark-maroon); font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">📷 Attached Solution Photo: ${sub.fileName || ''}</strong>
            <a href="${sub.attachmentUrl}" target="_blank" title="Click to view full photo">
              <img src="${sub.attachmentUrl}" alt="Solution Photo" style="max-width: 100%; max-height: 250px; border-radius: 6px; border: 1px solid #eee; object-fit: contain; cursor: pointer; box-shadow: var(--shadow-sm);">
            </a>
            <small style="color: var(--muted); font-size: 0.8rem; display: block; margin-top: 0.35rem;">🔍 Click photo to open full resolution image in new tab</small>
          </div>
        `;
      } else if (sub.attachmentUrl && !sub.content) {
        fileSnippet = `
          <div class="submitted-work-content" style="margin-top: 0.5rem;">
            <a href="${sub.attachmentUrl}" target="_blank" style="color: var(--maroon); word-break: break-all;">🔗 ${sub.attachmentUrl}</a>
          </div>
        `;
      }

      let textSnippet = '';
      if (sub.content) {
        textSnippet = `
          <div class="submitted-work-content" style="margin-top: 0.6rem; white-space: pre-line; line-height: 1.6;">
            ${sub.content}
          </div>
        `;
      }

      submissionContentHtml = `
        <div class="submitted-work-card">
          <div class="submitted-work-label">
            <span>✅ Your Submitted Work</span>
            <span style="font-size: 0.8rem; font-weight: normal; color: var(--muted); margin-left: auto;">Submitted on: ${new Date(sub.submissionDate).toLocaleString()}</span>
          </div>

          ${fileSnippet}
          ${textSnippet}

          ${sub.marksObtained !== null && sub.marksObtained !== undefined ? `
            <div style="margin-top: 0.85rem; padding: 0.75rem 1rem; background: var(--warm-white); border-radius: var(--radius-sm); border: 1px solid var(--soft-rose); font-weight: 700; color: var(--dark-maroon); display: flex; align-items: center; justify-content: space-between;">
              <span>🎓 Evaluated Score:</span>
              <span class="badge badge-success" style="font-size: 0.95rem; padding: 0.4rem 0.85rem;">${sub.marksObtained} / ${item.totalMarks} Marks</span>
            </div>
            ${sub.feedback ? `
              <p style="font-size: 0.88rem; color: var(--muted); margin-top: 0.5rem; margin-bottom: 0;"><em>Feedback: "${sub.feedback}"</em></p>
            ` : ''}
          ` : `
            <span class="badge badge-warning" style="font-size: 0.82rem; margin-top: 0.75rem; display: inline-block;">⏳ Awaiting Faculty Evaluation</span>
          `}
        </div>
      `;
    }

    return `
      <div class="assignment-card">
        <div class="assignment-header">
          <div>
            <span class="badge badge-info" style="margin-bottom: 0.65rem; font-size: 0.82rem; padding: 0.35rem 0.85rem;">${item.subject}</span>
            <h3 class="assignment-title">${item.title}</h3>
            <div class="assignment-meta-row">
              <span class="assignment-meta-item">👨‍🏫 <strong>Faculty:</strong> ${item.facultyName}</span>
              <span class="assignment-meta-item">🎯 <strong>Max Score:</strong> ${item.totalMarks} Marks</span>
              <span class="assignment-meta-item">⏰ <strong>Deadline:</strong> ${dueFormatted}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge ${badgeClass}" style="font-size: 0.9rem; padding: 0.4rem 1rem;">${item.status}</span>
          </div>
        </div>

        <div class="assignment-description-box">
          <strong style="color: var(--dark-maroon); font-size: 0.92rem; display: block; margin-bottom: 0.4rem;">Assignment Instructions:</strong>
          <p style="margin: 0; line-height: 1.65; white-space: pre-line;">${item.description}</p>
        </div>

        ${item.imageUrl ? `
          <div class="assignment-photo-box">
            <strong style="color: var(--dark-maroon); font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              📷 Question Paper / Assignment Photo:
            </strong>
            <a href="${item.imageUrl}" target="_blank" title="Click to view full photo in high resolution">
              <img src="${item.imageUrl}" alt="Assignment Photo" class="assignment-photo-img">
            </a>
            <small style="font-size: 0.82rem; color: var(--muted); margin-top: 0.5rem; display: block;">🔍 Click photo to open full-resolution question sheet</small>
          </div>
        ` : ''}

        ${submissionContentHtml}

        <div style="margin-top: 1.75rem; text-align: right; padding-top: 1rem; border-top: 1px solid #f6eaf0;">
          <button onclick="openSubmitModal('${item._id}', '${encodeURIComponent(item.title)}')" class="btn btn-primary" style="font-size: 0.92rem; padding: 0.65rem 1.5rem; font-weight: 600; border-radius: 8px;">
            ${item.submission ? '🔄 Re-submit Assignment' : '📤 Submit Assignment Solution'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openSubmitModal(id, titleDecoded) {
  activeAssignmentId = id;
  const modal = document.getElementById('submitModal');
  const titleEl = document.getElementById('modalAssignmentTitle');
  const contentInput = document.getElementById('submissionContent');
  const alertBox = document.getElementById('modalAlert');

  if (titleEl) titleEl.textContent = decodeURIComponent(titleDecoded);
  if (contentInput) contentInput.value = '';
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  resetFileUpload();

  if (modal) modal.style.display = 'flex';
}

function closeSubmitModal() {
  activeAssignmentId = null;
  resetFileUpload();
  const modal = document.getElementById('submitModal');
  if (modal) modal.style.display = 'none';
}

function resetFileUpload() {
  currentFileDataUrl = null;
  currentFileName = '';
  currentFileType = '';

  const fileInput = document.getElementById('submissionFileInput');
  if (fileInput) fileInput.value = '';

  const previewContainer = document.getElementById('filePreviewContainer');
  const previewImg = document.getElementById('filePreviewImg');
  const previewPdf = document.getElementById('filePreviewPdf');

  if (previewContainer) previewContainer.style.display = 'none';
  if (previewImg) {
    previewImg.src = '';
    previewImg.style.display = 'none';
  }
  if (previewPdf) previewPdf.style.display = 'none';
}

function showFilePreview(type, url, name) {
  const container = document.getElementById('filePreviewContainer');
  const previewImg = document.getElementById('filePreviewImg');
  const previewPdf = document.getElementById('filePreviewPdf');
  const pdfName = document.getElementById('filePreviewPdfName');

  if (!container) return;
  container.style.display = 'block';

  if (type === 'image' && previewImg) {
    previewImg.src = url;
    previewImg.style.display = 'block';
    if (previewPdf) previewPdf.style.display = 'none';
  } else if (type === 'pdf' && previewPdf) {
    if (pdfName) pdfName.textContent = name;
    previewPdf.style.display = 'block';
    if (previewImg) previewImg.style.display = 'none';
  }
}

function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      callback(compressedDataUrl);
    };
    img.onerror = () => {
      alert('Failed to read image file.');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initSubmissionForm() {
  const form = document.getElementById('submissionForm');
  const alertBox = document.getElementById('modalAlert');
  const fileInput = document.getElementById('submissionFileInput');
  const removeBtn = document.getElementById('removeFileBtn');

  // Handle file selection
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        resetFileUpload();
        return;
      }

      if (file.type.startsWith('image/')) {
        compressImage(file, (dataUrl) => {
          currentFileDataUrl = dataUrl;
          currentFileName = file.name;
          currentFileType = 'image';
          showFilePreview('image', dataUrl, file.name);
        });
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (file.size > 12 * 1024 * 1024) {
          alert('PDF document size exceeds 12MB limit. Please upload a smaller document.');
          fileInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          currentFileDataUrl = ev.target.result;
          currentFileName = file.name;
          currentFileType = 'pdf';
          showFilePreview('pdf', null, file.name);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Unsupported file type. Please upload a photo (JPG/PNG) or a PDF document.');
        resetFileUpload();
      }
    });
  }

  // Handle file removal
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      resetFileUpload();
    });
  }

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeAssignmentId) return;

      const token = getAuthToken();
      const content = document.getElementById('submissionContent')?.value.trim() || '';

      if (!content && !currentFileDataUrl) {
        if (alertBox) {
          alertBox.className = 'alert alert-error';
          alertBox.textContent = 'Please provide written notes/answers or attach a photo or PDF document.';
          alertBox.style.display = 'block';
        }
        return;
      }

      if (alertBox) {
        alertBox.className = 'alert alert-info';
        alertBox.textContent = 'Uploading submission... please wait.';
        alertBox.style.display = 'block';
      }

      try {
        const payload = {
          content,
          attachmentUrl: currentFileDataUrl || '',
          fileName: currentFileName || '',
          fileType: currentFileType || ''
        };

        const response = await fetch(`/api/student/assignments/${activeAssignmentId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (alertBox) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = result.message;
            alertBox.style.display = 'block';
          }
          setTimeout(() => {
            closeSubmitModal();
            fetchStudentAssignments();
          }, 900);
        } else {
          if (alertBox) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = result.message || 'Error submitting assignment.';
            alertBox.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Error submitting assignment:', error);
        if (alertBox) {
          alertBox.className = 'alert alert-error';
          alertBox.textContent = 'Network error submitting assignment response.';
          alertBox.style.display = 'block';
        }
      }
    });
  }
}

