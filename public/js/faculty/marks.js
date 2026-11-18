/* ==========================================================================
   CAMPUS 360 - FACULTY MARKS ENTRY JAVASCRIPT
   Enters student exam scores & grades via /api/faculty/results
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchFacultyResults();
  fetchStudentsDropdown();
  initMarksForm();
});

async function fetchFacultyResults() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('facultyResultsTableBody');

  try {
    const response = await fetch('/api/faculty/results', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted);">Failed to load results.</td></tr>`;
      return;
    }

    const results = result.data;

    if (tableBody) {
      if (results.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted);">No exam results entered yet. Use form above to record student marks.</td></tr>`;
        return;
      }

      tableBody.innerHTML = results.map(res => {
        const studentName = res.student ? res.student.name : 'Student';
        const studentRoll = res.student ? res.student.studentId : '';

        return `
          <tr>
            <td><strong style="color: var(--dark-maroon);">${studentName} (${studentRoll})</strong></td>
            <td><span class="badge badge-info">Sem ${res.semester}</span></td>
            <td>${res.subject}</td>
            <td>${res.marksObtained}</td>
            <td>${res.maxMarks}</td>
            <td><span class="badge badge-success">${res.grade || 'A'}</span></td>
          </tr>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching faculty results:', error);
  }
}

async function fetchStudentsDropdown() {
  const token = getAuthToken();
  if (!token) return;

  const selectEl = document.getElementById('marksStudentSelect');

  try {
    const response = await fetch('/api/faculty/attendance/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success && Array.isArray(result.data)) {
      if (selectEl) {
        selectEl.innerHTML = '<option value="">-- Select Enrolled Student --</option>' +
          result.data.map(st => `<option value="${st._id}">${st.name} (${st.studentId})</option>`).join('');
      }
    }
  } catch (error) {
    console.error('Error fetching students dropdown:', error);
  }
}

function initMarksForm() {
  const form = document.getElementById('marksEntryForm');
  const alertBox = document.getElementById('marksAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const studentId = document.getElementById('marksStudentSelect')?.value;
      const semester = document.getElementById('marksSemester')?.value;
      const subject = document.getElementById('marksSubject')?.value;
      const marksObtained = document.getElementById('marksObtained')?.value;
      const maxMarks = document.getElementById('marksMax')?.value;
      const grade = document.getElementById('marksGrade')?.value.trim();

      if (!studentId || !semester || !subject || marksObtained === '') {
        showAlert('Please fill out student, semester, subject, and marks obtained.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/faculty/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId,
            semester,
            subject,
            marksObtained,
            maxMarks,
            grade
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchFacultyResults();
        } else {
          showAlert(result.message || 'Error entering student result.', 'error');
        }
      } catch (error) {
        console.error('Error recording student marks:', error);
        showAlert('Network or server error submitting result.', 'error');
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
