/* ==========================================================================
   CAMPUS 360 - STUDENT DASHBOARD JAVASCRIPT
   Fetches summary metrics from /api/student/dashboard & renders UI
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchStudentDashboard();
});

async function fetchStudentDashboard() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/student/dashboard', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load dashboard:', result.message);
      return;
    }

    const { student, metrics, recentNotices, recentAssignments } = result.data;

    // 1. Populate Header & Student Details
    const nameDisplay = document.getElementById('studentNameHeader');
    const courseDisplay = document.getElementById('studentCourseHeader');
    if (nameDisplay) nameDisplay.textContent = student.name;
    if (courseDisplay) courseDisplay.textContent = `${student.courseName} | Semester ${student.semester}`;

    // 2. Populate Metric Cards
    const attPctEl = document.getElementById('metricAttendancePct');
    const attSubEl = document.getElementById('metricAttendanceSub');
    const pendingAssignEl = document.getElementById('metricPendingAssign');
    const semEl = document.getElementById('metricCurrentSem');
    const pendingLeavesEl = document.getElementById('metricPendingLeaves');

    if (attPctEl) attPctEl.textContent = `${metrics.attendancePercentage}%`;
    if (attSubEl) attSubEl.textContent = `${metrics.presentClasses} / ${metrics.totalClasses} Classes Attended`;
    if (pendingAssignEl) pendingAssignEl.textContent = metrics.pendingAssignmentsCount;
    if (semEl) semEl.textContent = `Sem ${student.semester}`;
    if (pendingLeavesEl) pendingLeavesEl.textContent = metrics.pendingLeavesCount;

    // 3. Populate Recent Assignments Widget (Anti-Congestion Layout)
    const assignmentsContainer = document.getElementById('recentAssignmentsWidget');
    if (assignmentsContainer) {
      if (!recentAssignments || recentAssignments.length === 0) {
        assignmentsContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: var(--warm-white); border-radius: var(--radius-sm);">
            <p style="color: var(--muted); font-size: 0.95rem; margin: 0;">🎉 No pending assignments! You're all caught up.</p>
          </div>
        `;
      } else {
        assignmentsContainer.innerHTML = recentAssignments.map(assign => {
          const dueStr = assign.dueDate
            ? new Date(assign.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A';

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.15rem 1.25rem; background: var(--warm-white); border: 1px solid #f1dfe7; border-radius: var(--radius-sm); margin-bottom: 0.85rem; flex-wrap: wrap; gap: 1rem;">
              <div style="flex: 1; min-width: 240px;">
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                  <span class="badge badge-info" style="font-size: 0.78rem; padding: 0.2rem 0.65rem;">${assign.subject}</span>
                  ${assign.hasPhoto ? `<span style="font-size: 0.78rem; background: #ffe4ee; color: var(--maroon); padding: 0.2rem 0.6rem; border-radius: 50px; font-weight: 600;">📷 Photo Attached</span>` : ''}
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--dark-maroon); margin-bottom: 0.25rem;">${assign.title}</h4>
                <p style="font-size: 0.85rem; color: var(--muted); margin: 0;">Faculty: ${assign.facultyName} | Max Score: ${assign.totalMarks} Marks | ⏰ Due: ${dueStr}</p>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="badge ${assign.hasSubmitted ? 'badge-success' : 'badge-warning'}" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">
                  ${assign.hasSubmitted ? '✅ Submitted' : '⏳ Pending'}
                </span>
                <a href="assignments.html" class="btn btn-primary" style="font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 6px;">
                  ${assign.hasSubmitted ? 'View Work →' : 'Submit Now →'}
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Populate Recent Notices Widget
    const noticesContainer = document.getElementById('recentNoticesWidget');
    if (noticesContainer) {
      if (!recentNotices || recentNotices.length === 0) {
        noticesContainer.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No recent campus notices.</p>`;
      } else {
        noticesContainer.innerHTML = recentNotices.map(notice => {
          const dateStr = notice.publishedDate
            ? new Date(notice.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Recent';

          return `
            <div class="quick-notice-item" style="padding: 0.85rem 0; border-bottom: 1px solid #f3e5ea;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span class="badge badge-info">${notice.category || 'General'}</span>
                <span style="font-size: 0.8rem; color: var(--muted);">${dateStr}</span>
              </div>
              <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--dark-maroon);">${notice.title}</h4>
              <p style="font-size: 0.85rem; color: var(--charcoal); margin-bottom: 0;">${notice.content.slice(0, 110)}...</p>
            </div>
          `;
        }).join('');
      }
    }
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
  }
}
