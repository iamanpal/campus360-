/* ==========================================================================
   CAMPUS 360 - ADMIN EXAM RESULTS JAVASCRIPT
   Fetches & displays student exam results via /api/admin/results
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminResults();
});

async function fetchAdminResults() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('adminResultsTableBody');
  const emptyState = document.getElementById('adminResultsEmptyState');

  try {
    const response = await fetch('/api/admin/results', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (emptyState) {
        emptyState.textContent = 'Failed to load examination results.';
        emptyState.style.display = 'block';
      }
      return;
    }

    const resultsList = result.data;

    if (resultsList.length === 0) {
      if (container) container.innerHTML = '';
      if (emptyState) {
        emptyState.textContent = 'No examination results recorded in the system yet. Faculty members publish results after grade entry.';
        emptyState.style.display = 'block';
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (container) {
      container.innerHTML = resultsList.map(r => {
        const studentName = r.student ? r.student.name : (r.studentName || 'N/A');
        const studentRoll = r.student ? r.student.studentId : (r.studentId || 'N/A');
        const marksObtained = r.marksObtained !== undefined ? r.marksObtained : (r.marks || 'N/A');
        const totalMarks = r.totalMarks || 100;
        const grade = r.grade || 'A';
        const remarks = r.remarks || 'Satisfactory performance';

        return `
          <tr>
            <td>
              <strong style="color: var(--dark-maroon); font-size: 0.95rem;">${studentName}</strong>
              <span style="display: block; font-size: 0.8rem; color: var(--muted);">${studentRoll}</span>
            </td>
            <td>Semester ${r.semester || 1}</td>
            <td><strong style="color: var(--charcoal);">${r.subject || r.subjectName || 'Subject'}</strong></td>
            <td>
              <span style="font-weight: 700; color: var(--maroon);">${marksObtained} / ${totalMarks}</span>
            </td>
            <td>
              <span class="badge badge-success" style="font-weight: 700;">${grade}</span>
            </td>
            <td style="font-size: 0.85rem; color: var(--muted);">${remarks}</td>
          </tr>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching admin exam results:', error);
    if (emptyState) {
      emptyState.textContent = 'Network or server error loading exam results.';
      emptyState.style.display = 'block';
    }
  }
}
