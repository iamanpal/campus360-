/* ==========================================================================
   CAMPUS 360 - ADMIN ACCOUNT SETTINGS JAVASCRIPT
   Updates administrator profile & credentials via /api/admin/settings
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminSettings();
  initUpdateSettingsForm();
});

async function fetchAdminSettings() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/admin/settings', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.data) {
      console.error('Failed to load admin settings:', result.message);
      return;
    }

    const admin = result.data;
    const nameInput = document.getElementById('adminNameInput');
    const emailInput = document.getElementById('adminEmailInput');

    if (nameInput) nameInput.value = admin.name || '';
    if (emailInput) emailInput.value = admin.email || '';

  } catch (error) {
    console.error('Error fetching admin settings:', error);
  }
}

function initUpdateSettingsForm() {
  const form = document.getElementById('adminSettingsForm');
  const alertBox = document.getElementById('settingsAlert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = getAuthToken();
      const name = document.getElementById('adminNameInput')?.value.trim();
      const password = document.getElementById('adminPasswordInput')?.value.trim();

      if (!name) {
        showAlert('Admin name cannot be empty.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(result.message, 'success');
          document.getElementById('adminPasswordInput').value = '';
          
          // Update displayed username in topbar
          const userNameDisplay = document.getElementById('userNameDisplay');
          if (userNameDisplay) userNameDisplay.textContent = name;
        } else {
          showAlert(result.message || 'Error updating settings.', 'error');
        }
      } catch (error) {
        console.error('Error updating admin settings:', error);
        showAlert('Network or server error updating account settings.', 'error');
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
