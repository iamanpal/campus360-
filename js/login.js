/* ==========================================================================
   CAMPUS 360 - PORTAL LOGIN JAVASCRIPT (PHASE 3 AUTHENTICATION INTEGRATED)
   Submits credentials to POST /api/auth/login & handles JWT role redirection
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const roleTabs = document.querySelectorAll('.role-tab');
  const roleIndicator = document.getElementById('roleIndicator');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const emailLabel = document.getElementById('emailLabel');
  const emailInput = document.getElementById('loginEmail');

  let currentRole = 'Student';

  const roleConfig = {
    Student: {
      badge: '👨‍🎓 Student Role Selected',
      idLabel: 'Student Email / ID',
      placeholder: 'student@campus360.edu'
    },
    Faculty: {
      badge: '👨‍🏫 Faculty Role Selected',
      idLabel: 'Faculty Email / ID',
      placeholder: 'faculty@campus360.edu'
    },
    Admin: {
      badge: '⚙️ Administrator Role Selected',
      idLabel: 'Admin Email / System ID',
      placeholder: 'admin@campus360.edu'
    }
  };

  // If user is already logged in with valid token, offer auto-redirection
  checkExistingSession();

  // Handle Mode Switch (Sign In vs Student Registration)
  const tabModeLogin = document.getElementById('tabModeLogin');
  const tabModeRegister = document.getElementById('tabModeRegister');
  const loginPanel = document.getElementById('loginPanel');
  const registerPanel = document.getElementById('registerPanel');
  const linkSwitchToRegister = document.getElementById('linkSwitchToRegister');
  const linkSwitchToLogin = document.getElementById('linkSwitchToLogin');
  const registerForm = document.getElementById('registerForm');
  const registerAlert = document.getElementById('registerAlert');

  function showLoginMode() {
    if (tabModeLogin) {
      tabModeLogin.classList.add('active');
      tabModeLogin.style.borderBottom = '3px solid var(--maroon)';
      tabModeLogin.style.background = 'var(--white)';
    }
    if (tabModeRegister) {
      tabModeRegister.classList.remove('active');
      tabModeRegister.style.borderBottom = '3px solid transparent';
      tabModeRegister.style.background = 'var(--warm-white)';
    }
    if (loginPanel) loginPanel.style.display = 'block';
    if (registerPanel) registerPanel.style.display = 'none';
  }

  function showRegisterMode() {
    if (tabModeRegister) {
      tabModeRegister.classList.add('active');
      tabModeRegister.style.borderBottom = '3px solid var(--maroon)';
      tabModeRegister.style.background = 'var(--white)';
    }
    if (tabModeLogin) {
      tabModeLogin.classList.remove('active');
      tabModeLogin.style.borderBottom = '3px solid transparent';
      tabModeLogin.style.background = 'var(--warm-white)';
    }
    if (loginPanel) loginPanel.style.display = 'none';
    if (registerPanel) registerPanel.style.display = 'block';
  }

  if (tabModeLogin) tabModeLogin.addEventListener('click', showLoginMode);
  if (tabModeRegister) tabModeRegister.addEventListener('click', showRegisterMode);
  if (linkSwitchToRegister) linkSwitchToRegister.addEventListener('click', (e) => { e.preventDefault(); showRegisterMode(); });
  if (linkSwitchToLogin) linkSwitchToLogin.addEventListener('click', (e) => { e.preventDefault(); showLoginMode(); });

  // Handle Student Registration Form
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (registerAlert) {
        registerAlert.style.display = 'none';
        registerAlert.className = 'alert';
      }

      const name = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const password = document.getElementById('regPassword')?.value;
      const courseName = document.getElementById('regCourse')?.value;
      const semester = document.getElementById('regSemester')?.value;
      const phone = document.getElementById('regPhone')?.value.trim();

      if (!name || !email || !password) {
        showRegisterError('Please enter full name, email, and password.');
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, courseName, semester, phone })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          registerForm.reset();

          if (registerAlert) {
            registerAlert.className = 'alert alert-success';
            registerAlert.innerHTML = `
              <strong>✅ Request Submitted for Admin Approval!</strong><br>
              ${result.message || 'Your registration request has been queued.'}<br>
              <small style="margin-top: 6px; display:inline-block; color: #166534;">
                Once approved by College Administration, you can log in with your email and password.
              </small>
            `;
            registerAlert.style.display = 'block';
          }

          setTimeout(() => {
            showLoginMode();
            if (loginAlert) {
              loginAlert.className = 'alert alert-success';
              loginAlert.innerHTML = '<strong>Request Sent:</strong> Your student account registration is awaiting Admin verification. Once accepted, you can log in.';
              loginAlert.style.display = 'block';
            }
          }, 3500);
        } else {
          showRegisterError(result.message || 'Registration failed. Please try again.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showRegisterError('Server or network connection error. Please try again.');
      }
    });
  }

  function showRegisterError(msg) {
    if (registerAlert) {
      registerAlert.className = 'alert alert-error';
      registerAlert.textContent = msg;
      registerAlert.style.display = 'block';
    }
  }

  // Handle Role Tab Switching
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentRole = tab.getAttribute('data-role');
      const config = roleConfig[currentRole];

      if (roleIndicator) {
        roleIndicator.textContent = config.badge;
      }
      if (emailLabel) {
        emailLabel.textContent = config.idLabel;
      }
      if (emailInput) {
        emailInput.placeholder = config.placeholder;
      }
      if (loginAlert) {
        loginAlert.style.display = 'none';
      }
    });
  });

  // Handle Login Form Submission to Backend API
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset alert states
      if (loginAlert) {
        loginAlert.style.display = 'none';
        loginAlert.className = 'alert';
      }

      const email = emailInput?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password) {
        showError('Please enter both your email/credential and password.');
        return;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            role: currentRole
          })
        });

        const result = await response.json();

        if (response.ok && result.success && result.token) {
          // Store JWT token securely in LocalStorage
          localStorage.setItem('campus360_token', result.token);

          // Show success inline feedback
          if (loginAlert) {
            loginAlert.className = 'alert alert-success';
            loginAlert.innerHTML = `<strong>Login Successful!</strong> Redirecting to ${currentRole} Portal...`;
            loginAlert.style.display = 'block';
          }

          // Redirect to appropriate dashboard
          setTimeout(() => {
            const role = (result.user.role || currentRole).toLowerCase();
            if (role === 'student') {
              window.location.href = '/pages/student/dashboard.html';
            } else if (role === 'faculty') {
              window.location.href = '/pages/faculty/dashboard.html';
            } else if (role === 'admin') {
              window.location.href = '/pages/admin/dashboard.html';
            } else {
              window.location.href = '/index.html';
            }
          }, 800);

        } else {
          showError(result.message || 'Authentication failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Login request error:', error);
        showError('Network or server connection error. Please try again later.');
      }
    });
  }

  function showError(msg) {
    if (loginAlert) {
      loginAlert.className = 'alert alert-error';
      loginAlert.textContent = msg;
      loginAlert.style.display = 'block';
    }
  }

  async function checkExistingSession() {
    const token = localStorage.getItem('campus360_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        // User is already authenticated
        if (loginAlert) {
          loginAlert.className = 'alert alert-success';
          loginAlert.innerHTML = `
            Already logged in as <strong>${data.user.name}</strong> (${data.user.role.toUpperCase()}).
            <br><a href="#" onclick="redirectToDashboard('${data.user.role}')" style="color: var(--maroon); font-weight:700;">Click here to go to your dashboard →</a>
          `;
          loginAlert.style.display = 'block';
        }
      }
    } catch (e) {
      // Ignore token check error
    }
  }
});

function redirectToDashboard(role) {
  const norm = (role || '').toLowerCase();
  if (norm === 'student') window.location.href = '/pages/student/dashboard.html';
  else if (norm === 'faculty') window.location.href = '/pages/faculty/dashboard.html';
  else if (norm === 'admin') window.location.href = '/pages/admin/dashboard.html';
}
