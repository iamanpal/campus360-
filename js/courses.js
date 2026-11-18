/* ==========================================================================
   CAMPUS 360 - COURSES PAGE JAVASCRIPT (PHASE 2 BACKEND CONNECTED)
   Fetches dynamic course data from MongoDB (/api/courses) with offline fallback.
   ========================================================================== */

let coursesData = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchCoursesFromAPI();
  initCourseFilters();
});

/**
 * Fetches course records from MongoDB REST API
 */
async function fetchCoursesFromAPI() {
  const container = document.getElementById('coursesContainer');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--muted); font-size: 1.1rem;">⏳ Loading courses from database...</p>
      </div>
    `;
  }

  try {
    const response = await fetch('/api/courses');
    const result = await response.json();

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      coursesData = result.data;
    } else {
      // Empty database state
      coursesData = [];
    }
  } catch (error) {
    console.warn('Backend API connection warning. Showing empty database state:', error);
    coursesData = [];
  }

  renderCourses(coursesData);
}

/**
 * Renders list of courses to grid container
 */
function renderCourses(coursesToRender) {
  const container = document.getElementById('coursesContainer');
  if (!container) return;

  if (!coursesToRender || coursesToRender.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: var(--radius-md); border: 1px dashed var(--soft-rose);">
        <h3 style="color: var(--muted); margin-bottom: 0.5rem;">No courses available.</h3>
        <p style="color: var(--muted); font-size: 0.9rem;">Course listings will appear here once added by the administration.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = coursesToRender.map(course => `
    <div class="course-card">
      <div class="course-header">
        <span class="course-dept-badge">${course.department || 'General'}</span>
        <h3>${course.name}</h3>
      </div>
      <div class="course-body">
        <p>${course.description || ''}</p>
        <div class="course-details-list">
          <div class="course-details-item">
            <span>Duration:</span>
            <span>${course.duration || 'N/A'}</span>
          </div>
          <div class="course-details-item">
            <span>Available Seats:</span>
            <span>${course.seats || 0} Seats</span>
          </div>
        </div>
        <div style="margin-top: auto; padding-top: 1rem; border-top: 1px dashed var(--soft-rose);">
          <strong style="font-size: 0.85rem; color: var(--muted); display: block; margin-bottom: 0.35rem;">Major Subjects:</strong>
          <div class="subject-tags">
            ${Array.isArray(course.subjects) && course.subjects.length > 0
              ? course.subjects.map(subj => `<span class="subject-tag">${subj}</span>`).join('')
              : '<span class="subject-tag">General Modules</span>'}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Initializes live search and department filter buttons
 */
function initCourseFilters() {
  const searchInput = document.getElementById('courseSearchInput');
  const filterBtns = document.querySelectorAll('.dept-filter-btns .filter-btn');

  let activeDepartment = 'All';
  let searchQuery = '';

  function applyFilters() {
    const filtered = coursesData.filter(course => {
      const matchesDept = activeDepartment === 'All' || course.department === activeDepartment;
      const nameMatch = (course.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const subjMatch = Array.isArray(course.subjects) && course.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesDept && (nameMatch || descMatch || subjMatch);
    });

    renderCourses(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDepartment = btn.getAttribute('data-dept');
      applyFilters();
    });
  });
}
