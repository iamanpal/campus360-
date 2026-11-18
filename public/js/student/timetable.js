/* ==========================================================================
   CAMPUS 360 - STUDENT TIMETABLE JAVASCRIPT
   Fetches weekly class schedule from /api/student/timetable
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentTimetable();
});

async function fetchStudentTimetable() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('timetableContainer');

  try {
    const response = await fetch('/api/student/timetable', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No timetable schedule available for your semester.</p>`;
      return;
    }

    const schedule = result.data;

    if (schedule.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">No timetable schedule published yet.</p>`;
      return;
    }

    // Group by Day
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};

    daysOrder.forEach(day => { grouped[day] = []; });
    schedule.forEach(slot => {
      if (grouped[slot.day]) {
        grouped[slot.day].push(slot);
      }
    });

    if (container) {
      container.innerHTML = daysOrder.map(day => {
        const slots = grouped[day];
        if (!slots || slots.length === 0) return '';

        return `
          <div style="background: var(--white); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #f3e5ea; box-shadow: var(--shadow-sm);">
            <h3 style="color: var(--maroon); font-size: 1.25rem; margin-bottom: 1rem; border-bottom: 2px solid var(--blush); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
              📅 ${day}
            </h3>
            <div class="table-responsive">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Time Slot</th>
                    <th>Subject</th>
                    <th>Faculty Instructor</th>
                    <th>Classroom / Lab</th>
                  </tr>
                </thead>
                <tbody>
                  ${slots.map(slot => `
                    <tr>
                      <td><span class="badge badge-info">${slot.startTime} - ${slot.endTime}</span></td>
                      <td><strong style="color: var(--dark-maroon);">${slot.subject}</strong></td>
                      <td>${slot.facultyName || 'Faculty Instructor'}</td>
                      <td>🏫 ${slot.room}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (error) {
    console.error('Error fetching student timetable:', error);
  }
}
