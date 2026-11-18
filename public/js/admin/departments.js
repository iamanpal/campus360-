/* ==========================================================================
   CAMPUS 360 - ADMIN DEPARTMENTS MANAGEMENT JAVASCRIPT
   Creates, updates & deletes departments via /api/admin/departments
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminDepartments();
  initCreateDeptForm();
});

async function fetchAdminDepartments() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('adminDeptTableBody');

  try {
    const response = await fetch('/api/admin/departments', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--muted);">Failed to load departments.</td></tr>`;
      return;
    }

    const depts = result.data;

    if (tableBody) {
      if (depts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--muted);">No academic departments configured. Use form above to add a department.</td></tr>`;
        return;
      }

      tableBody.innerHTML = depts.map(d => `
        <tr>
          <td><strong style="color: var(--dark-maroon);">${d.code}</strong></td>
          <td>${d.name}</td>
          <td>${d.headOfDepartment || 'N/A'}</td>
          <td>
            <button onclick="deleteDepartment('${d._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.35rem 0.75rem;">
              🗑️ Delete
            </button>
          </td>
        </tr>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching admin departments:', error);
  }
}

function initCreateDeptForm() {
  const form = document.getElementById('createDeptForm');
  const alertBox = document.getElementById('deptAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const name = document.getElementById('newDeptName')?.value.trim();
      const code = document.getElementById('newDeptCode')?.value.trim();
      const headOfDepartment = document.getElementById('newDeptHOD')?.value.trim();
      const description = document.getElementById('newDeptDesc')?.value.trim();

      if (!name || !code) {
        showAlert('Please provide department name and code.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/departments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, code, headOfDepartment, description })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminDepartments();
        } else {
          showAlert(result.message || 'Error creating department.', 'error');
        }
      } catch (error) {
        console.error('Error creating department:', error);
        showAlert('Network or server error creating department.', 'error');
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

async function deleteDepartment(id) {
  if (!confirm('Are you sure you want to delete this academic department?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/admin/departments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminDepartments();
    } else {
      alert(result.message || 'Error deleting department.');
    }
  } catch (error) {
    console.error('Error deleting department:', error);
  }
}
