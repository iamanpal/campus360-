/* ==========================================================================
   CAMPUS 360 - ADMIN DASHBOARD JAVASCRIPT
   Fetches system counts from /api/admin/dashboard & renders UI
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminDashboard();
});

async function fetchAdminDashboard() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/admin/dashboard', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load admin dashboard:', result.message);
      return;
    }

    const { counts, recentStudents, recentFaculty } = result.data;

    // Metric Cards
    const stCountEl = document.getElementById('countStudents');
    const facCountEl = document.getElementById('countFaculty');
    const crsCountEl = document.getElementById('countCourses');
    const deptCountEl = document.getElementById('countDepartments');
    const leavesCountEl = document.getElementById('countLeaves');
    const noticesCountEl = document.getElementById('countNotices');

    if (stCountEl) stCountEl.textContent = counts.totalStudents;
    if (facCountEl) facCountEl.textContent = counts.totalFaculty;
    if (crsCountEl) crsCountEl.textContent = counts.totalCourses;
    if (deptCountEl) deptCountEl.textContent = counts.totalDepartments;
    if (leavesCountEl) leavesCountEl.textContent = counts.pendingLeaves;
    if (noticesCountEl) noticesCountEl.textContent = counts.activeNotices;

    // Recent Students Widget
    const studentWidget = document.getElementById('recentStudentsWidget');
    if (studentWidget) {
      if (!recentStudents || recentStudents.length === 0) {
        studentWidget.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No student accounts created yet.</p>`;
      } else {
        studentWidget.innerHTML = recentStudents.map(st => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px dashed var(--soft-rose);">
            <div>
              <strong style="color: var(--dark-maroon); font-size: 0.95rem;">${st.name}</strong>
              <span style="display: block; font-size: 0.8rem; color: var(--muted);">${st.studentId} | ${st.courseName || 'B.Tech CS'}</span>
            </div>
            <span class="badge badge-info">Sem ${st.semester || 1}</span>
          </div>
        `).join('');
      }
    }

    // Recent Faculty Widget
    const facultyWidget = document.getElementById('recentFacultyWidget');
    if (facultyWidget) {
      if (!recentFaculty || recentFaculty.length === 0) {
        facultyWidget.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No faculty accounts created yet.</p>`;
      } else {
        facultyWidget.innerHTML = recentFaculty.map(f => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px dashed var(--soft-rose);">
            <div>
              <strong style="color: var(--dark-maroon); font-size: 0.95rem;">${f.name}</strong>
              <span style="display: block; font-size: 0.8rem; color: var(--muted);">${f.facultyId} | Dept of ${f.departmentName || 'CS'}</span>
            </div>
            <span class="badge badge-info">${f.designation || 'Faculty'}</span>
          </div>
        `).join('');
      }
    }

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
  }
}
