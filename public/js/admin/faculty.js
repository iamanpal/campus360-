/* ==========================================================================
   CAMPUS 360 - ADMIN FACULTY MANAGEMENT JAVASCRIPT
   Creates, updates & deactivates faculty accounts via /api/admin/faculty
   ========================================================================== */

let allFaculty = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminFaculty();
  initCreateFacultyForm();
});

async function fetchAdminFaculty() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('adminFacultyTableBody');

  try {
    const response = await fetch('/api/admin/faculty', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted);">Failed to load faculty directory.</td></tr>`;
      return;
    }

    allFaculty = result.data;
    renderFacultyTable(allFaculty);

  } catch (error) {
    console.error('Error fetching admin faculty:', error);
  }
}

function renderFacultyTable(list) {
  const tableBody = document.getElementById('adminFacultyTableBody');
  if (!tableBody) return;

  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 2rem;">No faculty records found. Use form above to add a faculty member.</td></tr>`;
    return;
  }

  tableBody.innerHTML = list.map(f => {
    const isActive = f.user ? f.user.active !== false : true;
    const subjectsStr = Array.isArray(f.assignedSubjects) ? f.assignedSubjects.join(', ') : '';

    return `
      <tr>
        <td><strong style="color: var(--dark-maroon);">${f.facultyId}</strong></td>
        <td>${f.name}</td>
        <td>${f.email}</td>
        <td>Dept of ${f.departmentName || 'CS'} (${f.designation || 'Faculty'})</td>
        <td><span style="font-size: 0.85rem; color: var(--charcoal);">${subjectsStr}</span></td>
        <td>
          <button onclick="deactivateFaculty('${f._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.35rem 0.75rem;">
            ${isActive ? '⛔ Deactivate' : '✅ Re-activate'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function initCreateFacultyForm() {
  const form = document.getElementById('createFacultyForm');
  const alertBox = document.getElementById('facultyAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const name = document.getElementById('newFacultyName')?.value.trim();
      const email = document.getElementById('newFacultyEmail')?.value.trim();
      const password = document.getElementById('newFacultyPassword')?.value;
      const departmentName = document.getElementById('newFacultyDept')?.value;
      const designation = document.getElementById('newFacultyDesignation')?.value.trim();
      const assignedSubjects = document.getElementById('newFacultySubjects')?.value.trim();

      if (!name || !email || !password || !departmentName) {
        showAlert('Please fill out all required fields (Name, Email, Password, Department).', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/faculty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, email, password, departmentName, designation, assignedSubjects })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminFaculty();
        } else {
          showAlert(result.message || 'Error creating faculty account.', 'error');
        }
      } catch (error) {
        console.error('Error creating faculty account:', error);
        showAlert('Network or server error creating faculty account.', 'error');
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

async function deactivateFaculty(id) {
  const token = getAuthToken();
  if (!confirm('Are you sure you want to toggle deactivation status for this faculty user account?')) return;

  try {
    const response = await fetch(`/api/admin/faculty/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminFaculty();
    } else {
      alert(result.message || 'Error deactivating faculty account.');
    }
  } catch (error) {
    console.error('Error deactivating faculty:', error);
  }
}
