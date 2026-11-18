/* ==========================================================================
   CAMPUS 360 - ADMIN MASTER TIMETABLE MANAGEMENT JAVASCRIPT
   Creates & deletes master timetable slots via /api/admin/timetable
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminTimetable();
  initCreateTimetableForm();
});

async function fetchAdminTimetable() {
  const token = getAuthToken();
  if (!token) return;

  const tableBody = document.getElementById('adminTimetableTableBody');

  try {
    const response = await fetch('/api/admin/timetable', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted);">Failed to load master timetable.</td></tr>`;
      return;
    }

    const slots = result.data;

    if (tableBody) {
      if (slots.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted);">No timetable slots created yet. Use form above to schedule a class.</td></tr>`;
        return;
      }

      tableBody.innerHTML = slots.map(s => `
        <tr>
          <td><strong style="color: var(--maroon);">${s.day}</strong></td>
          <td><span class="badge badge-info">${s.startTime} - ${s.endTime}</span></td>
          <td><strong style="color: var(--dark-maroon);">${s.subject}</strong></td>
          <td>${s.courseName || 'B.Tech CS'} (Sem ${s.semester})</td>
          <td>${s.facultyName || 'Faculty'} (Room: ${s.room})</td>
          <td>
            <button onclick="deleteTimetableSlot('${s._id}')" class="btn btn-secondary" style="font-size: 0.8rem; color: #842029; border-color: #f5c2c7; padding: 0.35rem 0.75rem;">
              🗑️ Delete
            </button>
          </td>
        </tr>
      `).join('');
    }

  } catch (error) {
    console.error('Error fetching admin timetable:', error);
  }
}

function initCreateTimetableForm() {
  const form = document.getElementById('createTimetableForm');
  const alertBox = document.getElementById('timetableAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const courseName = document.getElementById('slotCourse')?.value;
      const semester = document.getElementById('slotSemester')?.value;
      const day = document.getElementById('slotDay')?.value;
      const startTime = document.getElementById('slotStart')?.value.trim();
      const endTime = document.getElementById('slotEnd')?.value.trim();
      const subject = document.getElementById('slotSubject')?.value;
      const facultyName = document.getElementById('slotFaculty')?.value.trim();
      const room = document.getElementById('slotRoom')?.value.trim();

      if (!semester || !day || !startTime || !endTime || !subject || !room) {
        showAlert('Please fill out all required timetable slot fields.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/timetable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ courseName, semester, day, startTime, endTime, subject, facultyName, room })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          form.reset();
          fetchAdminTimetable();
        } else {
          showAlert(result.message || 'Error creating timetable slot.', 'error');
        }
      } catch (error) {
        console.error('Error creating timetable slot:', error);
        showAlert('Network or server error creating timetable slot.', 'error');
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

async function deleteTimetableSlot(id) {
  if (!confirm('Are you sure you want to delete this timetable slot?')) return;

  const token = getAuthToken();
  try {
    const response = await fetch(`/api/admin/timetable/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      fetchAdminTimetable();
    } else {
      alert(result.message || 'Error deleting timetable slot.');
    }
  } catch (error) {
    console.error('Error deleting timetable slot:', error);
  }
}
