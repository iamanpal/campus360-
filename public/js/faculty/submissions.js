/* ==========================================================================
   CAMPUS 360 - FACULTY STUDENT SUBMISSIONS EVALUATION JAVASCRIPT
   Fetches student submissions from /api/faculty/submissions & evaluates marks
   Supports Photo & PDF viewing directly on the portal
   ========================================================================== */

let activeSubmissionId = null;
let currentSubmissionsList = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentSubmissions();
  initEvaluationForm();
});

async function fetchStudentSubmissions() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('submissionsContainer');

  try {
    const response = await fetch('/api/faculty/submissions', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No student submissions found.</p>`;
      return;
    }

    currentSubmissionsList = result.data;

    if (currentSubmissionsList.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No student submissions uploaded yet.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = currentSubmissionsList.map(sub => {
        const studentName = sub.student ? sub.student.name : (sub.studentName || 'Student');
        const studentId = sub.student ? sub.student.studentId : '';
        const assignmentTitle = sub.assignment ? sub.assignment.title : 'Assignment';
        const maxMarks = sub.assignment ? sub.assignment.totalMarks : 100;
        const isEvaluated = sub.marksObtained !== null && sub.marksObtained !== undefined;

        const isPdf = sub.fileType === 'pdf' || (sub.attachmentUrl && (sub.attachmentUrl.startsWith('data:application/pdf') || (sub.fileName && sub.fileName.toLowerCase().endsWith('.pdf'))));
        const isImage = sub.fileType === 'image' || (sub.attachmentUrl && (sub.attachmentUrl.startsWith('data:image/') || sub.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif)/i)));

        let fileSnippet = '';
        if (isPdf && sub.attachmentUrl) {
          fileSnippet = `
            <div style="margin-top: 0.75rem; padding: 0.85rem 1.25rem; background: #fff5f7; border: 1px solid var(--soft-rose); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <span style="font-size: 1.8rem;">📄</span>
                <div>
                  <strong style="color: var(--dark-maroon); font-size: 0.95rem; display: block;">${sub.fileName || 'Student-Assignment-Solution.pdf'}</strong>
                  <span style="color: var(--muted); font-size: 0.8rem;">PDF Document Submission</span>
                </div>
              </div>
              <a href="${sub.attachmentUrl}" target="_blank" download="${sub.fileName || 'submission.pdf'}" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.45rem 1.1rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
                👁️ View / Download PDF
              </a>
            </div>
          `;
        } else if (isImage && sub.attachmentUrl) {
          fileSnippet = `
            <div style="margin-top: 0.75rem; padding: 0.85rem; background: #fff; border: 1px solid var(--soft-rose); border-radius: 8px; text-align: center;">
              <strong style="color: var(--dark-maroon); font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">📷 Student Solution Photo: ${sub.fileName || ''}</strong>
              <a href="${sub.attachmentUrl}" target="_blank" title="Click to view full photo">
                <img src="${sub.attachmentUrl}" alt="Student Solution Photo" style="max-width: 100%; max-height: 280px; border-radius: 6px; border: 1px solid #ddd; object-fit: contain; cursor: pointer; box-shadow: var(--shadow-sm);">
              </a>
              <small style="display: block; margin-top: 0.35rem; color: var(--muted); font-size: 0.8rem;">🔍 Click photo to open full-resolution in new tab</small>
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

        return `
          <div class="assignment-card">
            <div class="assignment-header">
              <div>
                <span class="badge ${sub.status === 'Submitted' ? 'badge-success' : 'badge-danger'}" style="margin-bottom: 0.5rem; font-size: 0.85rem; padding: 0.35rem 0.85rem;">${sub.status}</span>
                <h3 class="assignment-title">${studentName} ${studentId ? `(${studentId})` : ''}</h3>
                <div class="assignment-meta-row" style="margin-bottom: 0;">
                  <span class="assignment-meta-item">📝 <strong>Assignment:</strong> ${assignmentTitle}</span>
                  <span class="assignment-meta-item">🎯 <strong>Max Marks:</strong> ${maxMarks}</span>
                </div>
              </div>
              <div>
                ${isEvaluated ? `
                  <span class="badge badge-success" style="font-size: 0.95rem; padding: 0.45rem 1rem;">Evaluated: ${sub.marksObtained} / ${maxMarks}</span>
                ` : `
                  <span class="badge badge-warning" style="font-size: 0.9rem; padding: 0.45rem 0.9rem;">Pending Evaluation</span>
                `}
              </div>
            </div>

            <div class="submitted-work-card" style="margin-top: 1rem;">
              <div class="submitted-work-label">
                <span>📂 Student Work Content / Submitted Resource:</span>
                <span style="font-size: 0.82rem; font-weight: normal; color: var(--muted); margin-left: auto;">Submitted: ${new Date(sub.submissionDate).toLocaleString()}</span>
              </div>

              ${fileSnippet}
              ${textSnippet}

              ${sub.feedback ? `
                <div style="margin-top: 0.85rem; padding: 0.75rem 1rem; background: var(--warm-white); border-radius: var(--radius-sm); border: 1px solid var(--soft-rose);">
                  <strong style="color: var(--dark-maroon); font-size: 0.88rem;">Current Feedback:</strong>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: var(--charcoal);"><em>"${sub.feedback}"</em></p>
                </div>
              ` : ''}
            </div>

            <div style="text-align: right; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f6eaf0;">
              <button onclick="openEvaluateModal('${sub._id}')" class="btn btn-primary" style="font-size: 0.92rem; padding: 0.65rem 1.4rem; font-weight: 600; border-radius: 8px;">
                ✏️ ${isEvaluated ? 'Edit Evaluation Score' : 'Grade & Record Marks'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching student submissions:', error);
  }
}

function openEvaluateModal(id) {
  activeSubmissionId = id;
  const sub = currentSubmissionsList.find(s => s._id === id);
  if (!sub) return;

  const modal = document.getElementById('evalModal');
  const nameEl = document.getElementById('evalStudentName');
  const scoreInput = document.getElementById('evalMarks');
  const feedbackInput = document.getElementById('evalFeedback');
  const maxEl = document.getElementById('evalMaxMarks');
  const previewBox = document.getElementById('evalSubmissionPreview');
  const alertBox = document.getElementById('evalAlert');

  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  const studentName = sub.student ? sub.student.name : (sub.studentName || 'Student');
  const maxMarks = sub.assignment ? sub.assignment.totalMarks : 100;

  if (nameEl) nameEl.textContent = `${studentName} ${sub.student?.studentId ? `(${sub.student.studentId})` : ''}`;
  if (scoreInput) scoreInput.value = sub.marksObtained !== null && sub.marksObtained !== undefined ? sub.marksObtained : '';
  if (feedbackInput) feedbackInput.value = sub.feedback || '';
  if (maxEl) maxEl.textContent = maxMarks;

  if (previewBox) {
    const isPdf = sub.fileType === 'pdf' || (sub.attachmentUrl && (sub.attachmentUrl.startsWith('data:application/pdf') || (sub.fileName && sub.fileName.toLowerCase().endsWith('.pdf'))));
    const isImage = sub.fileType === 'image' || (sub.attachmentUrl && (sub.attachmentUrl.startsWith('data:image/') || sub.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif)/i)));

    let previewContent = '';
    if (isPdf && sub.attachmentUrl) {
      previewContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">📄</span>
            <strong style="color: var(--dark-maroon); font-size: 0.9rem;">${sub.fileName || 'Solution-Document.pdf'}</strong>
          </div>
          <a href="${sub.attachmentUrl}" target="_blank" download="${sub.fileName || 'submission.pdf'}" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.85rem; text-decoration: none;">
            👁️ Open PDF Document
          </a>
        </div>
      `;
    } else if (isImage && sub.attachmentUrl) {
      previewContent = `
        <div style="text-align: center;">
          <a href="${sub.attachmentUrl}" target="_blank" title="Click to view full photo">
            <img src="${sub.attachmentUrl}" alt="Solution Photo" style="max-height: 140px; max-width: 100%; border-radius: 4px; object-fit: contain;">
          </a>
          <small style="display: block; color: var(--muted); font-size: 0.75rem; margin-top: 0.2rem;">🔍 Click to view full image in new tab</small>
        </div>
      `;
    }

    if (sub.content) {
      previewContent += `
        <div style="font-size: 0.88rem; color: var(--charcoal); margin-top: ${previewContent ? '0.5rem' : '0'}; line-height: 1.5; white-space: pre-line;">
          <strong>Written Response:</strong> ${sub.content}
        </div>
      `;
    }

    previewBox.innerHTML = previewContent || '<p style="margin: 0; color: var(--muted); font-size: 0.85rem;">No text or attachment provided.</p>';
  }

  if (modal) modal.style.display = 'flex';
}

function closeEvaluateModal() {
  activeSubmissionId = null;
  const modal = document.getElementById('evalModal');
  if (modal) modal.style.display = 'none';
}

function initEvaluationForm() {
  const form = document.getElementById('evalForm');
  const alertBox = document.getElementById('evalAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeSubmissionId) return;

      const token = getAuthToken();
      const marksObtained = document.getElementById('evalMarks')?.value;
      const feedback = document.getElementById('evalFeedback')?.value.trim();

      if (marksObtained === '' || marksObtained === null) {
        if (alertBox) {
          alertBox.className = 'alert alert-error';
          alertBox.textContent = 'Please enter evaluated marks score.';
          alertBox.style.display = 'block';
        }
        return;
      }

      try {
        const response = await fetch(`/api/faculty/submissions/${activeSubmissionId}/evaluate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ marksObtained: Number(marksObtained), feedback })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (alertBox) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = result.message;
            alertBox.style.display = 'block';
          }
          setTimeout(() => {
            closeEvaluateModal();
            fetchStudentSubmissions();
          }, 800);
        } else {
          if (alertBox) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = result.message || 'Error evaluating submission.';
            alertBox.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Error evaluating submission:', error);
      }
    });
  }
}

