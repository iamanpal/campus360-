/* ==========================================================================
   CAMPUS 360 - FACULTY CLASSES JAVASCRIPT
   Fetches assigned subjects & teaching schedule from /api/faculty/classes
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchFacultyClasses();
});

async function fetchFacultyClasses() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('classesContainer');

  try {
    const response = await fetch('/api/faculty/classes', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load assigned classes.</p>`;
      return;
    }

    const { assignedSubjects, schedule } = result.data;

    if (container) {
      if (!schedule || schedule.length === 0) {
        container.innerHTML = `
          <div class="card">
            <h3 style="color: var(--dark-maroon); margin-bottom: 1rem;">Assigned Subjects</h3>
            <ul>${assignedSubjects.map(s => `<li><strong>${s}</strong> - B.Tech CS</li>`).join('')}</ul>
            <p style="color: var(--muted); margin-top: 1rem;">No specific time slots scheduled in timetable repository.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="card">
          <h3 style="color: var(--dark-maroon); font-size: 1.25rem; margin-bottom: 1rem;">My Teaching Schedule</h3>
          <div class="table-responsive">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time Slot</th>
                  <th>Subject</th>
                  <th>Course / Semester</th>
                  <th>Classroom</th>
                </tr>
              </thead>
              <tbody>
                ${schedule.map(slot => `
                  <tr>
                    <td><strong style="color: var(--maroon);">${slot.day}</strong></td>
                    <td><span class="badge badge-info">${slot.startTime} - ${slot.endTime}</span></td>
                    <td><strong style="color: var(--dark-maroon);">${slot.subject}</strong></td>
                    <td>${slot.courseName || 'B.Tech CS'} (Sem ${slot.semester})</td>
                    <td>🏫 ${slot.room}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

  } catch (error) {
    console.error('Error fetching faculty classes:', error);
  }
}
