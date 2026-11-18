/* ==========================================================================
   CAMPUS 360 - ADMIN STUDENT MANAGEMENT JAVASCRIPT
   Creates, searches, updates & deactivates student accounts via /api/admin/students
   ========================================================================== */

let allStudents = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchRegistrationRequests();
  fetchAdminStudents();
  initCreateStudentForm();
  initStudentSearch();
});

async function fetchAdminStudents() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('adminStudentsTableBody');

  try {
    const response = await fetch('/api/admin/students', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted);">Failed to load student directory.</td></tr>`;
      return;
    }

    allStudents = result.data;
    renderStudentsTable(allStudents);

  } catch (error) {
    console.error('Error fetching admin students:', error);
  }
}

function renderStudentsTable(list) {
  const tableBody = document.getElementById('adminStudentsTableBody');
  if (!tableBody) return;

  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 2rem;">No student records found. Use form above to add a student.</td></tr>`;
    return;
  }

  tableBody.innerHTML = list.map(st => {
    const isActive = st.user ? st.user.active !== false : true;

    return `
      <tr>
        <td><strong style="color: var(--dark-maroon);">${st.studentId}</strong></td>
        <td>${st.name}</td>
        <td>${st.email}</td>
        <td>${st.courseName || 'B.Tech CS'} (Sem ${st.semester})</td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
            ${isActive ? 'Active' : 'Deactivated'}
          </span>
        </td>
        <td>
          <button onclick="deactivateStudent('${st._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.35rem 0.75rem;">
            ${isActive ? '⛔ Deactivate' : '✅ Re-activate'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function initStudentSearch() {
  const searchInput = document.getElementById('studentSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = allStudents.filter(st =>
        st.name.toLowerCase().includes(q) ||
        st.studentId.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q) ||
        (st.courseName || '').toLowerCase().includes(q)
      );
      renderStudentsTable(filtered);
    });
  }
}

function initCreateStudentForm() {
  const form = document.getElementById('createStudentForm');
  const alertBox = document.getElementById('studentAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const name = document.getElementById('newStudentName')?.value.trim();
      const email = document.getElementById('newStudentEmail')?.value.trim();
      const password = document.getElementById('newStudentPassword')?.value;
      const courseName = document.getElementById('newStudentCourse')?.value;
      const semester = document.getElementById('newStudentSemester')?.value;
      const phone = document.getElementById('newStudentPhone')?.value.trim();

      if (!name || !email || !password || !courseName) {
        showAlert('Please fill out all required fields (Name, Email, Password, Course).', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, email, password, courseName, semester, phone })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminStudents();
        } else {
          showAlert(result.message || 'Error creating student account.', 'error');
        }
      } catch (error) {
        console.error('Error creating student account:', error);
        showAlert('Network or server error creating student account.', 'error');
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

async function deactivateStudent(id) {
  const token = getAuthToken();
  if (!confirm('Are you sure you want to toggle deactivation status for this student user account?')) return;

  try {
    const response = await fetch(`/api/admin/students/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminStudents();
    } else {
      alert(result.message || 'Error deactivating student account.');
    }
  } catch (error) {
    console.error('Error deactivating student:', error);
  }
}

/* ==========================================================================
   STUDENT REGISTRATION REQUESTS QUEUE (Admin Verification)
   ========================================================================== */
async function fetchRegistrationRequests() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('registrationRequestsTableBody');
  const badge = document.getElementById('pendingRequestsBadge');

  try {
    const response = await fetch('/api/admin/registrations', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted);">Failed to load registration queue.</td></tr>`;
      return;
    }

    const requests = result.data;
    const pendingCount = requests.filter(r => r.status === 'Pending').length;

    if (badge) {
      badge.textContent = `${pendingCount} Pending`;
      badge.className = pendingCount > 0 ? 'badge badge-warning' : 'badge badge-success';
    }

    renderRegistrationRequestsTable(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted);">Error loading registration requests.</td></tr>`;
  }
}

function renderRegistrationRequestsTable(list) {
  const tableBody = document.getElementById('registrationRequestsTableBody');
  if (!tableBody) return;

  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 1.5rem;">No student registration requests received yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = list.map(req => {
    const dateStr = req.requestedAt ? new Date(req.requestedAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : '—';

    let statusBadge = '';
    let actionButtons = '';

    if (req.status === 'Approved') {
      statusBadge = '<span class="badge badge-success">Approved</span>';
      actionButtons = '<span style="color: #16a34a; font-weight: 600; font-size: 0.85rem;">✅ Accepted</span>';
    } else if (req.status === 'Rejected') {
      statusBadge = '<span class="badge badge-danger">Rejected</span>';
      actionButtons = `
        <button onclick="approveRegistration('${req._id}')" class="btn btn-sm" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.3rem 0.65rem; font-size: 0.75rem; border-radius: 4px; cursor: pointer;">
          Re-Approve
        </button>
      `;
    } else {
      statusBadge = '<span class="badge badge-warning">⏳ Pending</span>';
      actionButtons = `
        <div style="display: flex; gap: 0.4rem; justify-content: center;">
          <button onclick="approveRegistration('${req._id}')" class="btn btn-sm" style="background: #16a34a; color: white; padding: 0.35rem 0.75rem; border: none; font-size: 0.8rem; font-weight: 600; border-radius: 4px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
            ✅ Accept
          </button>
          <button onclick="rejectRegistration('${req._id}')" class="btn btn-sm" style="background: #dc2626; color: white; padding: 0.35rem 0.75rem; border: none; font-size: 0.8rem; font-weight: 600; border-radius: 4px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
            ❌ Reject
          </button>
        </div>
      `;
    }

    return `
      <tr>
        <td style="color: var(--muted); font-size: 0.85rem;">${dateStr}</td>
        <td><strong style="color: var(--dark-maroon);">${req.name}</strong></td>
        <td>${req.email}</td>
        <td>${req.courseName || 'B.Tech CS'} (Sem ${req.semester || 1})</td>
        <td>${req.phone || '—'}</td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">${actionButtons}</td>
      </tr>
    `;
  }).join('');
}

async function approveRegistration(id) {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`/api/admin/registrations/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showRegAlert(result.message || 'Student registration approved successfully!', 'success');
      fetchRegistrationRequests();
      fetchAdminStudents();
    } else {
      showRegAlert(result.message || 'Error approving student registration.', 'error');
    }
  } catch (error) {
    console.error('Error approving registration:', error);
    showRegAlert('Network error while approving registration.', 'error');
  }
}

async function rejectRegistration(id) {
  if (!confirm('Are you sure you want to REJECT this student registration request?')) return;

  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`/api/admin/registrations/${id}/reject`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showRegAlert(result.message || 'Student registration rejected.', 'success');
      fetchRegistrationRequests();
      fetchAdminStudents();
    } else {
      showRegAlert(result.message || 'Error rejecting student registration.', 'error');
    }
  } catch (error) {
    console.error('Error rejecting registration:', error);
    showRegAlert('Network error while rejecting registration.', 'error');
  }
}

function showRegAlert(msg, type) {
  const alertBox = document.getElementById('registrationAlert');
  if (alertBox) {
    alertBox.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }
}
