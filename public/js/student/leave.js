/* ==========================================================================
   CAMPUS 360 - STUDENT LEAVE REQUESTS JAVASCRIPT
   Submits leave requests & tracks application status
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentLeaves();
  initLeaveForm();
});

async function fetchStudentLeaves() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('leaveHistoryContainer');

  try {
    const response = await fetch('/api/student/leaves', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load leave history.</p>`;
      return;
    }

    const leaves = result.data;

    if (leaves.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No leave applications submitted yet.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = leaves.map(item => {
        let badgeClass = 'badge-warning';
        if (item.status === 'Approved') badgeClass = 'badge-success';
        if (item.status === 'Rejected') badgeClass = 'badge-danger';

        const startStr = new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endStr = new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <div class="card" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
              <div>
                <h3 style="color: var(--dark-maroon); font-size: 1.2rem; margin-bottom: 0.35rem;">${item.reason}</h3>
                <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem;">📅 Period: ${startStr} to ${endStr}</p>
              </div>
              <div>
                <span class="badge ${badgeClass}" style="font-size: 0.85rem;">Status: ${item.status}</span>
              </div>
            </div>
            ${item.description ? `<p style="color: var(--charcoal); margin-top: 0.5rem; margin-bottom: 0;">${item.description}</p>` : ''}
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching leave history:', error);
  }
}

function initLeaveForm() {
  const form = document.getElementById('leaveForm');
  const alertBox = document.getElementById('leaveAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const reason = document.getElementById('leaveReason')?.value.trim();
      const startDate = document.getElementById('leaveStartDate')?.value;
      const endDate = document.getElementById('leaveEndDate')?.value;
      const description = document.getElementById('leaveDescription')?.value.trim();

      if (!reason || !startDate || !endDate) {
        showLeaveAlert('Please fill out all required fields (Reason, Start Date, End Date).', 'error');
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        showLeaveAlert('End date cannot be prior to start date.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/student/leaves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason, startDate, endDate, description })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showLeaveAlert(result.message, 'success');
          form.reset();
          fetchStudentLeaves();
        } else {
          showLeaveAlert(result.message || 'Error submitting leave request.', 'error');
        }
      } catch (error) {
        console.error('Error applying for leave:', error);
        showLeaveAlert('Network or server error. Please try again.', 'error');
      }
    });
  }

  function showLeaveAlert(msg, type) {
    if (alertBox) {
      alertBox.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
    }
  }
}
