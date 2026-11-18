/* ==========================================================================
   CAMPUS 360 - STUDENT ATTENDANCE JAVASCRIPT
   Fetches attendance breakdown from /api/student/attendance
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentAttendance();
});

async function fetchStudentAttendance() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('attendanceTableBody');
  const alertContainer = document.getElementById('lowAttendanceAlert');

  try {
    const response = await fetch('/api/student/attendance', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted);">Failed to load attendance records.</td></tr>`;
      return;
    }

    const { overallPercentage, totalClasses, presentClasses, absentClasses, isLowOverall, subjectBreakdown } = result.data;

    // Populate Overview Numbers
    const overallPctEl = document.getElementById('overallPctDisplay');
    const presentEl = document.getElementById('totalPresentDisplay');
    const absentEl = document.getElementById('totalAbsentDisplay');
    const totalEl = document.getElementById('totalClassesDisplay');

    if (overallPctEl) overallPctEl.textContent = `${overallPercentage}%`;
    if (presentEl) presentEl.textContent = presentClasses;
    if (absentEl) absentEl.textContent = absentClasses;
    if (totalEl) totalEl.textContent = totalClasses;

    // Show Low Attendance Warning Alert (<75%)
    if (alertContainer) {
      if (isLowOverall || subjectBreakdown.some(s => s.isLow)) {
        alertContainer.style.display = 'block';
        alertContainer.innerHTML = `
          <strong>⚠️ Low Attendance Warning (<75%):</strong> 
          Your current attendance is below the mandatory 75% college requirement in one or more subjects. Please attend upcoming lectures to avoid exam debarment.
        `;
      } else {
        alertContainer.style.display = 'none';
      }
    }

    // Populate Subject Breakdown Table
    if (tableBody) {
      if (!subjectBreakdown || subjectBreakdown.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted);">No attendance records found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = subjectBreakdown.map(sub => `
        <tr>
          <td><strong style="color: var(--dark-maroon);">${sub.subject}</strong></td>
          <td>${sub.present}</td>
          <td>${sub.absent}</td>
          <td>${sub.total}</td>
          <td>
            <span class="badge ${sub.percentage >= 75 ? 'badge-success' : 'badge-danger'}">
              ${sub.percentage}% ${sub.percentage < 75 ? '(Low)' : ''}
            </span>
          </td>
        </tr>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching student attendance:', error);
  }
}
