/* ==========================================================================
   CAMPUS 360 - FACULTY DASHBOARD JAVASCRIPT
   Fetches summary metrics from /api/faculty/dashboard & renders UI
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchFacultyDashboard();
});

async function fetchFacultyDashboard() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/faculty/dashboard', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load faculty dashboard:', result.message);
      return;
    }

    const { faculty, metrics, assignedSubjects, recentNotices } = result.data;

    // Populate Header
    const nameDisplay = document.getElementById('facultyNameHeader');
    const deptDisplay = document.getElementById('facultyDeptHeader');
    if (nameDisplay) nameDisplay.textContent = faculty.name;
    if (deptDisplay) deptDisplay.textContent = `${faculty.designation} | Department of ${faculty.department}`;

    // Populate Metric Cards
    const classesCountEl = document.getElementById('metricClassesCount');
    const studentsCountEl = document.getElementById('metricStudentsCount');
    const pendingSubmissionsEl = document.getElementById('metricPendingSubmissions');
    const pendingLeavesEl = document.getElementById('metricPendingLeaves');

    if (classesCountEl) classesCountEl.textContent = metrics.assignedClassesCount;
    if (studentsCountEl) studentsCountEl.textContent = metrics.totalStudentsCount;
    if (pendingSubmissionsEl) pendingSubmissionsEl.textContent = metrics.pendingSubmissionsCount;
    if (pendingLeavesEl) pendingLeavesEl.textContent = metrics.pendingLeavesCount;

    // Populate Assigned Subjects List Widget
    const subjectsContainer = document.getElementById('assignedSubjectsWidget');
    if (subjectsContainer) {
      if (!assignedSubjects || assignedSubjects.length === 0) {
        subjectsContainer.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No subjects currently assigned.</p>`;
      } else {
        subjectsContainer.innerHTML = assignedSubjects.map(sub => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px dashed var(--soft-rose);">
            <strong style="color: var(--dark-maroon);">${sub}</strong>
            <span class="badge badge-info">B.Tech CS / Sem 4</span>
          </div>
        `).join('');
      }
    }

    // Populate Recent Notices Widget
    const noticesContainer = document.getElementById('facultyNoticesWidget');
    if (noticesContainer) {
      if (!recentNotices || recentNotices.length === 0) {
        noticesContainer.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No recent campus circulars.</p>`;
      } else {
        noticesContainer.innerHTML = recentNotices.map(notice => `
          <div style="padding: 0.75rem 0; border-bottom: 1px solid #f3e5ea;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <span class="badge badge-info">${notice.category || 'General'}</span>
              <span style="font-size: 0.8rem; color: var(--muted);">${new Date(notice.publishedDate || notice.createdAt).toLocaleDateString()}</span>
            </div>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--dark-maroon);">${notice.title}</h4>
            <p style="font-size: 0.85rem; color: var(--charcoal); margin-bottom: 0;">${notice.content.slice(0, 100)}...</p>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error fetching faculty dashboard:', error);
  }
}
