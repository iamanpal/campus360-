/* ==========================================================================
   CAMPUS 360 - FACULTY PROFILE JAVASCRIPT
   Fetches profile details from /api/faculty/profile & updates safe info
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchFacultyProfile();
  initFacultyProfileForm();
});

async function fetchFacultyProfile() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/faculty/profile', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load faculty profile:', result.message);
      return;
    }

    const p = result.data;

    // Populate Read-Only Fields
    const idEl = document.getElementById('profileFacultyId');
    const nameEl = document.getElementById('profileFacultyName');
    const emailEl = document.getElementById('profileFacultyEmail');
    const deptEl = document.getElementById('profileFacultyDept');
    const subjectsEl = document.getElementById('profileFacultySubjects');
    const phoneInput = document.getElementById('profileFacultyPhone');
    const designationInput = document.getElementById('profileFacultyDesignation');

    if (idEl) idEl.textContent = p.facultyId;
    if (nameEl) nameEl.textContent = p.name;
    if (emailEl) emailEl.textContent = p.email;
    if (deptEl) deptEl.textContent = `Department of ${p.departmentName}`;
    if (subjectsEl) subjectsEl.textContent = Array.isArray(p.assignedSubjects) ? p.assignedSubjects.join(', ') : 'None';

    if (phoneInput) phoneInput.value = p.phone || '';
    if (designationInput) designationInput.value = p.designation || 'Assistant Professor';

  } catch (error) {
    console.error('Error fetching faculty profile:', error);
  }
}

function initFacultyProfileForm() {
  const form = document.getElementById('facultyProfileForm');
  const alertBox = document.getElementById('facultyProfileAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const phone = document.getElementById('profileFacultyPhone')?.value.trim();
      const designation = document.getElementById('profileFacultyDesignation')?.value.trim();

      try {
        const response = await fetch('/api/faculty/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ phone, designation })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (alertBox) {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = result.message;
            alertBox.style.display = 'block';
          }
        } else {
          if (alertBox) {
            alertBox.className = 'alert alert-error';
            alertBox.textContent = result.message || 'Error updating profile.';
            alertBox.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Error updating faculty profile:', error);
      }
    });
  }
}
