/* ==========================================================================
   CAMPUS 360 - ADMIN COURSES MANAGEMENT JAVASCRIPT
   Creates, updates & deletes courses via /api/admin/courses
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminCourses();
  initCreateCourseForm();
});

async function fetchAdminCourses() {
  const token = getAuthToken();
  if (!token) return;

  const container = document.getElementById('adminCoursesContainer');

  try {
    const response = await fetch('/api/admin/courses', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load degree courses.</p>`;
      return;
    }

    const courses = result.data;

    if (courses.length === 0) {
      if (container) container.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-md);">No degree courses configured. Use form above to add a new course.</p>`;
      return;
    }

    if (container) {
      container.innerHTML = courses.map(c => `
        <div class="card" style="margin-bottom: 1.25rem; border-left: 5px solid var(--maroon);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.35rem;">${c.department}</span>
              <h3 style="color: var(--dark-maroon); font-size: 1.2rem; margin-bottom: 0.35rem;">${c.name}</h3>
              <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 0.5rem;">Duration: ${c.duration} | Seats: ${c.seats || 60} Seats</p>
            </div>
            <div>
              <button onclick="deleteCourse('${c._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.4rem 0.85rem;">
                🗑️ Delete Course
              </button>
            </div>
          </div>
          <p style="color: var(--charcoal); margin-top: 0.5rem; margin-bottom: 0.5rem;">${c.description}</p>
          <div style="font-size: 0.8rem; color: var(--muted);">
            Subjects: ${Array.isArray(c.subjects) ? c.subjects.join(', ') : 'N/A'}
          </div>
        </div>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching admin courses:', error);
  }
}

function initCreateCourseForm() {
  const form = document.getElementById('createCourseForm');
  const alertBox = document.getElementById('courseAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const name = document.getElementById('newCourseName')?.value.trim();
      const department = document.getElementById('newCourseDept')?.value;
      const duration = document.getElementById('newCourseDuration')?.value.trim();
      const seats = document.getElementById('newCourseSeats')?.value;
      const description = document.getElementById('newCourseDesc')?.value.trim();
      const subjects = document.getElementById('newCourseSubjects')?.value.trim();

      if (!name || !department || !duration || !description) {
        showAlert('Please fill out all required fields.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, department, duration, seats, description, subjects })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminCourses();
        } else {
          showAlert(result.message || 'Error creating course.', 'error');
        }
      } catch (error) {
        console.error('Error creating course:', error);
        showAlert('Network or server error creating course.', 'error');
      }
    });
  }

  function showAlert(msg, type) {
    if (alertBox) {
      alertBox.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
    }
  }
}

async function deleteCourse(id) {
  if (!confirm('Are you sure you want to delete this degree course?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/admin/courses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminCourses();
    } else {
      alert(result.message || 'Error deleting course.');
    }
  } catch (error) {
    console.error('Error deleting course:', error);
  }
}
