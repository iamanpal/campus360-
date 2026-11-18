/* ==========================================================================
   CAMPUS 360 - ADMIN COMPLAINTS & GRIEVANCES JAVASCRIPT
   Fetches & manages grievances via /api/admin/complaints
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminComplaints();
});

async function fetchAdminComplaints() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('adminComplaintsContainer');

  try {
    const response = await fetch('/api/admin/complaints', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load complaints list.</p>`;
      return;
    }

    const complaints = result.data;

    if (complaints.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No student or faculty complaints registered in the portal.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = complaints.map(c => {
        const badgeClass = c.status === 'Resolved' ? 'badge-success' : (c.status === 'In Progress' ? 'badge-warning' : 'badge-danger');
        const submittedBy = c.submittedBy || c.name || 'Anonymous User';
        const role = c.userRole || c.role || 'Campus User';
        const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A';

        return `
          <div class="card" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              <div>
                <span class="badge badge-info" style="margin-bottom: 0.35rem;">${c.category || 'General'}</span>
                <h3 style="color: var(--dark-maroon); font-size: 1.15rem; margin-bottom: 0.25rem;">${c.subject || c.title || 'Complaint Ticket'}</h3>
                <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0;">
                  👤 Submitted by: <strong>${submittedBy}</strong> (${role}) | 📅 Date: ${dateStr}
                </p>
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <span class="badge ${badgeClass}" style="font-size: 0.85rem;">${c.status || 'Open'}</span>

                <select onchange="updateComplaintStatus('${c._id}', this.value)" class="form-control" style="padding: 0.35rem 0.6rem; font-size: 0.85rem; width: auto;">
                  <option value="Open" ${c.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
              </div>
            </div>

            <div style="background: var(--warm-white); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.95rem; color: var(--charcoal); line-height: 1.5;">
              ${c.description || c.details || c.message || 'No description provided.'}
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching admin complaints:', error);
  }
}

async function updateComplaintStatus(id, newStatus) {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`/api/admin/complaints/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminComplaints();
    } else {
      alert(result.message || 'Error updating complaint status.');
    }
  } catch (error) {
    console.error('Error updating complaint status:', error);
    alert('Network error updating complaint status.');
  }
}
