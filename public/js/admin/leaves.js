/* ==========================================================================
   CAMPUS 360 - ADMIN LEAVE REQUESTS JAVASCRIPT
   Fetches & manages student leave applications via /api/admin/leaves
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminLeaves();
});

async function fetchAdminLeaves() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('adminLeavesContainer');

  try {
    const response = await fetch('/api/admin/leaves', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load leave applications.</p>`;
      return;
    }

    const leaves = result.data;

    if (leaves.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No leave applications submitted by students yet.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = leaves.map(l => {
        const studentName = l.student ? l.student.name : (l.studentName || 'Student');
        const studentId = l.student ? l.student.studentId : (l.studentId || 'N/A');
        const statusBadgeClass = l.status === 'Approved' ? 'badge-success' : (l.status === 'Rejected' ? 'badge-danger' : 'badge-warning');
        
        const fromDateStr = l.fromDate ? new Date(l.fromDate).toLocaleDateString() : (l.startDate ? new Date(l.startDate).toLocaleDateString() : 'N/A');
        const toDateStr = l.toDate ? new Date(l.toDate).toLocaleDateString() : (l.endDate ? new Date(l.endDate).toLocaleDateString() : 'N/A');

        return `
          <div class="card" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              <div>
                <strong style="color: var(--dark-maroon); font-size: 1.1rem;">${studentName}</strong>
                <span style="font-size: 0.85rem; color: var(--muted); margin-left: 0.5rem;">(${studentId})</span>
                <p style="color: var(--charcoal); font-weight: 600; margin-top: 0.25rem; margin-bottom: 0.25rem;">
                  Subject: ${l.reason || l.subject || 'Leave Application'}
                </p>
                <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0;">
                  📅 Duration: <strong>${fromDateStr}</strong> to <strong>${toDateStr}</strong>
                </p>
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <span class="badge ${statusBadgeClass}" style="font-size: 0.85rem;">${l.status || 'Pending'}</span>

                ${l.status === 'Pending' ? `
                  <button onclick="updateAdminLeaveStatus('${l._id}', 'Approved')" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: #198754; border-color: #198754;">
                    ✓ Approve
                  </button>
                  <button onclick="updateAdminLeaveStatus('${l._id}', 'Rejected')" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; color: #dc3545; border-color: #dc3545;">
                    ✕ Reject
                  </button>
                ` : ''}
              </div>
            </div>

            ${l.description || l.details ? `
              <div style="background: var(--warm-white); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--charcoal);">
                <strong>Details / Reason:</strong> ${l.description || l.details}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching admin leaves:', error);
  }
}

async function updateAdminLeaveStatus(id, newStatus) {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`/api/admin/leaves/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminLeaves();
    } else {
      alert(result.message || 'Error updating leave application status.');
    }
  } catch (error) {
    console.error('Error updating leave status:', error);
    alert('Network error updating leave status.');
  }
}
