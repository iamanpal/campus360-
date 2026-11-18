/* ==========================================================================
   CAMPUS 360 - FACULTY LEAVE REVIEW JAVASCRIPT
   Reviews student leave applications & toggles Approval/Rejection status
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentLeaveRequests();
});

async function fetchStudentLeaveRequests() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('facultyLeavesContainer');

  try {
    const response = await fetch('/api/faculty/leaves', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load leave requests.</p>`;
      return;
    }

    const leaves = result.data;

    if (leaves.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No student leave requests submitted.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = leaves.map(item => {
        const studentName = item.student ? item.student.name : (item.studentName || 'Student');
        const studentId = item.student ? item.student.studentId : '';
        let badgeClass = 'badge-warning';
        if (item.status === 'Approved') badgeClass = 'badge-success';
        if (item.status === 'Rejected') badgeClass = 'badge-danger';

        const startStr = new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endStr = new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <div class="card" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
              <div>
                <span class="badge ${badgeClass}" style="margin-bottom: 0.35rem;">Status: ${item.status}</span>
                <h3 style="color: var(--dark-maroon); font-size: 1.2rem; margin-bottom: 0.25rem;">${studentName} (${studentId})</h3>
                <p style="color: var(--maroon); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.35rem;">Reason: ${item.reason}</p>
                <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem;">📅 Period: ${startStr} to ${endStr}</p>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="updateLeaveStatus('${item._id}', 'Approved')" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">
                  ✅ Approve
                </button>
                <button onclick="updateLeaveStatus('${item._id}', 'Rejected')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.4rem 0.85rem;">
                  ❌ Reject
                </button>
              </div>
            </div>
            ${item.description ? `<p style="color: var(--charcoal); margin-top: 0.5rem; margin-bottom: 0; background: var(--warm-white); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid #f3e5ea;">${item.description}</p>` : ''}
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching student leave requests:', error);
  }
}

async function updateLeaveStatus(id, newStatus) {
  const token = getAuthToken();
  if (!confirm(`Are you sure you want to set this leave application to '${newStatus}'?`)) return;

  try {
    const response = await fetch(`/api/faculty/leaves/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchStudentLeaveRequests();
    } else {
      alert(result.message || 'Error updating leave status.');
    }
  } catch (error) {
    console.error('Error updating leave status:', error);
  }
}
