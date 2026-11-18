/* ==========================================================================
   CAMPUS 360 - STUDENT RESULTS JAVASCRIPT
   Fetches exam marks & gradebook from /api/student/results
   ========================================================================== */

let allResults = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentResults();
});

async function fetchStudentResults() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('resultsTableBody');

  try {
    const response = await fetch('/api/student/results', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted);">No results published yet.</td></tr>`;
      return;
    }

    allResults = result.data;
    renderResults(allResults);
    initSemesterFilter();

  } catch (error) {
    console.error('Error fetching student results:', error);
  }
}

function renderResults(resultsToRender) {
  const tableBody = document.getElementById('resultsTableBody');
  const gpaDisplay = document.getElementById('calculatedGpaDisplay');
  if (!tableBody) return;

  if (resultsToRender.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 2rem;">No results found for selected semester.</td></tr>`;
    if (gpaDisplay) gpaDisplay.textContent = 'N/A';
    return;
  }

  // Calculate Average Percentage
  const totalMarksObtained = resultsToRender.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMaxMarks = resultsToRender.reduce((sum, r) => sum + r.maxMarks, 0);
  const avgPct = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks * 100).toFixed(1) : 0;
  
  if (gpaDisplay) gpaDisplay.textContent = `${avgPct}% Average`;

  tableBody.innerHTML = resultsToRender.map(res => `
    <tr>
      <td><span class="badge badge-info">Semester ${res.semester}</span></td>
      <td><strong style="color: var(--dark-maroon);">${res.subject}</strong></td>
      <td>${res.marksObtained}</td>
      <td>${res.maxMarks}</td>
      <td>
        <span class="badge badge-success" style="font-size: 0.85rem;">Grade ${res.grade || 'A'}</span>
      </td>
    </tr>
  `).join('');
}

function initSemesterFilter() {
  const filterBtns = document.querySelectorAll('.sem-filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const semVal = btn.getAttribute('data-sem');
      if (semVal === 'All') {
        renderResults(allResults);
      } else {
        const filtered = allResults.filter(r => r.semester.toString() === semVal);
        renderResults(filtered);
      }
    });
  });
}
