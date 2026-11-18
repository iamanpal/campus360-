/* ==========================================================================
   CAMPUS 360 - STUDENT PROFILE JAVASCRIPT
   Fetches profile details from /api/student/profile & updates safe contact info
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentProfile();
  initProfileForm();
});

async function fetchStudentProfile() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/student/profile', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load profile:', result.message);
      return;
    }

    const p = result.data;

    // Populate Read-Only Academic Fields
    const idEl = document.getElementById('profileStudentId');
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const courseEl = document.getElementById('profileCourse');
    const semEl = document.getElementById('profileSemester');
    const phoneInput = document.getElementById('profilePhone');
    const guardianInput = document.getElementById('profileGuardian');

    if (idEl) idEl.textContent = p.studentId;
    if (nameEl) nameEl.textContent = p.name;
    if (emailEl) emailEl.textContent = p.email;
    if (courseEl) courseEl.textContent = p.courseName;
    if (semEl) semEl.textContent = `Semester ${p.semester}`;

    if (phoneInput) phoneInput.value = p.phone || '';
    if (guardianInput) guardianInput.value = p.guardianName || '';

  } catch (error) {
    console.error('Error fetching student profile:', error);
  }
}

function initProfileForm() {
  const form = document.getElementById('profileForm');
  const alertBox = document.getElementById('profileAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const phone = document.getElementById('profilePhone')?.value.trim();
      const guardianName = document.getElementById('profileGuardian')?.value.trim();

      try {
        const response = await fetch('/api/student/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ phone, guardianName })
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
        console.error('Error updating profile:', error);
      }
    });
  }
}
