/* ==========================================================================
   CAMPUS 360 - ADMIN REPORTS & METRICS JAVASCRIPT
   Fetches institutional report aggregations via /api/admin/reports
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminReports();
});

async function fetchAdminReports() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/admin/reports', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Failed to load institutional reports:', result.message);
      return;
    }

    const { totalStudents, totalFaculty, totalCourses, courseDistribution, deptDistribution, leaveStatusBreakdown } = result.data;

    // Top Summary Cards
    const stCount = document.getElementById('reportTotalStudents');
    const facCount = document.getElementById('reportTotalFaculty');
    const crsCount = document.getElementById('reportTotalCourses');

    if (stCount) stCount.textContent = totalStudents;
    if (facCount) facCount.textContent = totalFaculty;
    if (crsCount) crsCount.textContent = totalCourses;

    // Course Distribution Breakdown
    const courseWidget = document.getElementById('reportCourseDistribution');
    if (courseWidget) {
      const courseEntries = Object.entries(courseDistribution || {});
      if (courseEntries.length === 0) {
        courseWidget.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No student course distribution data available.</p>`;
      } else {
        courseWidget.innerHTML = courseEntries.map(([course, count]) => {
          const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
          return `
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
                <strong style="color: var(--dark-maroon);">${course}</strong>
                <span style="color: var(--muted);">${count} Students (${percentage}%)</span>
              </div>
              <div style="background: var(--blush); height: 10px; border-radius: var(--radius-full); overflow: hidden;">
                <div style="background: var(--maroon); width: ${percentage}%; height: 100%; transition: width 0.4s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Department Distribution Breakdown
    const deptWidget = document.getElementById('reportDeptDistribution');
    if (deptWidget) {
      const deptEntries = Object.entries(deptDistribution || {});
      if (deptEntries.length === 0) {
        deptWidget.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">No department faculty distribution data available.</p>`;
      } else {
        deptWidget.innerHTML = deptEntries.map(([dept, count]) => {
          const percentage = totalFaculty > 0 ? Math.round((count / totalFaculty) * 100) : 0;
          return `
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
                <strong style="color: var(--dark-maroon);">${dept}</strong>
                <span style="color: var(--muted);">${count} Faculty (${percentage}%)</span>
              </div>
              <div style="background: var(--blush); height: 10px; border-radius: var(--radius-full); overflow: hidden;">
                <div style="background: var(--soft-rose); width: ${percentage}%; height: 100%; transition: width 0.4s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Leave Status Breakdown
    const leavesWidget = document.getElementById('reportLeaveBreakdown');
    if (leavesWidget) {
      const pending = leaveStatusBreakdown?.Pending || 0;
      const approved = leaveStatusBreakdown?.Approved || 0;
      const rejected = leaveStatusBreakdown?.Rejected || 0;
      const totalLeaves = pending + approved + rejected;

      leavesWidget.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
          <div style="background: #fff3cd; color: #664d03; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 1.6rem; font-weight: 700;">${pending}</div>
            <div style="font-size: 0.85rem; font-weight: 600;">Pending Applications</div>
          </div>
          <div style="background: #d1e7dd; color: #0f5132; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 1.6rem; font-weight: 700;">${approved}</div>
            <div style="font-size: 0.85rem; font-weight: 600;">Approved Leaves</div>
          </div>
          <div style="background: #f8d7da; color: #842029; padding: 1rem; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 1.6rem; font-weight: 700;">${rejected}</div>
            <div style="font-size: 0.85rem; font-weight: 600;">Rejected Leaves</div>
          </div>
        </div>
        <p style="color: var(--muted); font-size: 0.85rem; margin-top: 1rem; text-align: center;">
          Total Processed Leave Requests: <strong>${totalLeaves}</strong>
        </p>
      `;
    }

  } catch (error) {
    console.error('Error fetching admin reports:', error);
  }
}
