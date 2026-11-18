/* ==========================================================================
   CAMPUS 360 - FACULTY ATTENDANCE JAVASCRIPT
   Fetches student list & submits attendance records to /api/faculty/attendance
   ========================================================================== */

let enrolledStudents = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchEnrolledStudents();
  initAttendanceForm();
});

async function fetchEnrolledStudents() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('attendanceMarkingTableBody');

  try {
    const response = await fetch('/api/faculty/attendance/students', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--muted);">Failed to load student list.</td></tr>`;
      return;
    }

    enrolledStudents = result.data;

    if (tableBody) {
      if (enrolledStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--muted);">No enrolled students found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = enrolledStudents.map(st => `
        <tr>
          <td><strong style="color: var(--dark-maroon);">${st.studentId}</strong></td>
          <td>${st.name}</td>
          <td>${st.courseName || 'B.Tech CS'} (Sem ${st.semester})</td>
          <td>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <label style="cursor: pointer; color: var(--maroon); font-weight: 600;">
                <input type="radio" name="status_${st._id}" value="Present" checked style="accent-color: var(--maroon);"> Present
              </label>
              <label style="cursor: pointer; color: var(--muted); font-weight: 600;">
                <input type="radio" name="status_${st._id}" value="Absent" style="accent-color: var(--maroon);"> Absent
              </label>
            </div>
          </td>
        </tr>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching students for attendance:', error);
  }
}

function initAttendanceForm() {
  const form = document.getElementById('attendanceMarkingForm');
  const alertBox = document.getElementById('attendanceAlert');
  const dateInput = document.getElementById('attendanceDate');

  // Set default date to today
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const subject = document.getElementById('attendanceSubject')?.value;
      const date = dateInput?.value;

      if (!subject || !date) {
        showAlert('Please select a subject and date.', 'error');
        return;
      }

      // Collect records
      const records = enrolledStudents.map(st => {
        const radios = document.getElementsByName(`status_${st._id}`);
        let status = 'Present';
        for (const r of radios) {
          if (r.checked) status = r.value;
        }
        return {
          studentId: st._id,
          status
        };
      });

      try {
        const response = await fetch('/api/faculty/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subject, date, records })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
        } else {
          showAlert(result.message || 'Error marking attendance.', 'error');
        }
      } catch (error) {
        console.error('Error submitting attendance:', error);
        showAlert('Network or server error submitting attendance.', 'error');
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
