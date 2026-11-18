/* ==========================================================================
   CAMPUS 360 - CLIENT AUTHENTICATION & PORTAL PROTECTOR
   Verifies JWT token, renders shared responsive portal sidebar, & handles Logout
   ========================================================================== */

/**
 * Validates authentication & role authorization for protected portal pages
 * @param {string} requiredRole Expected role ('student', 'faculty', 'admin')
 * @param {string} activePage Active menu item name ('dashboard', 'students', etc.)
 */
async function protectPortal(requiredRole, activePage = '') {
  const token = localStorage.getItem('campus360_token');

  if (!token) {
    console.warn('No authentication token found. Redirecting to login...');
    window.location.href = '/login.html';
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.user) {
      console.warn('Token verification failed:', result.message);
      localStorage.removeItem('campus360_token');
      window.location.href = '/login.html';
      return;
    }

    const user = result.user;

    // Verify role match
    if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
      console.warn(`Role mismatch: Account is '${user.role}', but page requires '${requiredRole}'. Redirecting...`);
      redirectToUserDashboard(user.role);
      return;
    }

    // Render Portal Layout Component (Sidebar & Topbar)
    renderPortalLayout(user, activePage);

  } catch (error) {
    console.error('Error verifying portal authentication:', error);
    localStorage.removeItem('campus360_token');
    window.location.href = '/login.html';
  }
}

/**
 * Renders consistent portal sidebar and top header bar
 */
function renderPortalLayout(user, activePage) {
  const role = (user.role || '').toLowerCase();
  
  if (role === 'student') {
    renderStudentLayout(user, activePage);
  } else if (role === 'faculty') {
    renderFacultyLayout(user, activePage);
  } else if (role === 'admin') {
    renderAdminLayout(user, activePage);
  } else {
    populateBasicUserInfo(user);
  }
}

/**
 * Renders Student Portal Sidebar & Header
 */
function renderStudentLayout(user, activePage) {
  const sidebarContainer = document.getElementById('portalSidebar');
  const topbarContainer = document.getElementById('portalTopbar');

  if (sidebarContainer) {
    const menuItems = [
      { key: 'dashboard', label: '📊 Dashboard', href: '/pages/student/dashboard.html' },
      { key: 'attendance', label: '📅 Attendance', href: '/pages/student/attendance.html' },
      { key: 'timetable', label: '🕒 Timetable', href: '/pages/student/timetable.html' },
      { key: 'assignments', label: '📝 Assignments', href: '/pages/student/assignments.html' },
      { key: 'results', label: '🎓 Exam Results', href: '/pages/student/results.html' },
      { key: 'materials', label: '📚 Study Material', href: '/pages/student/materials.html' },
      { key: 'leave', label: '✉️ Leave Requests', href: '/pages/student/leave.html' },
      { key: 'notices', label: '📢 Notice Board', href: '/pages/student/notices.html' },
      { key: 'profile', label: '👤 My Profile', href: '/pages/student/profile.html' }
    ];

    sidebarContainer.innerHTML = buildSidebarHTML('👨‍🎓 Student Portal', menuItems, activePage);
  }

  if (topbarContainer) {
    topbarContainer.innerHTML = buildTopbarHTML('Student', user);
    initPortalHamburger(sidebarContainer);
  }

  populateBasicUserInfo(user);
}

/**
 * Renders Faculty Portal Sidebar & Header
 */
function renderFacultyLayout(user, activePage) {
  const sidebarContainer = document.getElementById('portalSidebar');
  const topbarContainer = document.getElementById('portalTopbar');

  if (sidebarContainer) {
    const menuItems = [
      { key: 'dashboard', label: '📊 Dashboard', href: '/pages/faculty/dashboard.html' },
      { key: 'classes', label: '🏫 My Classes', href: '/pages/faculty/classes.html' },
      { key: 'attendance', label: '📅 Mark Attendance', href: '/pages/faculty/attendance.html' },
      { key: 'assignments', label: '📝 Manage Assignments', href: '/pages/faculty/assignments.html' },
      { key: 'submissions', label: '📥 Student Submissions', href: '/pages/faculty/submissions.html' },
      { key: 'marks', label: '🎓 Exam Marks Entry', href: '/pages/faculty/marks.html' },
      { key: 'materials', label: '📚 Upload Materials', href: '/pages/faculty/materials.html' },
      { key: 'leaves', label: '✉️ Review Leave Requests', href: '/pages/faculty/leaves.html' },
      { key: 'notices', label: '📢 Notice Board', href: '/pages/faculty/notices.html' },
      { key: 'profile', label: '👤 My Profile', href: '/pages/faculty/profile.html' }
    ];

    sidebarContainer.innerHTML = buildSidebarHTML('👨‍🏫 Faculty Portal', menuItems, activePage);
  }

  if (topbarContainer) {
    topbarContainer.innerHTML = buildTopbarHTML('Faculty', user);
    initPortalHamburger(sidebarContainer);
  }

  populateBasicUserInfo(user);
}

/**
 * Renders Admin Control Panel Sidebar & Header
 */
function renderAdminLayout(user, activePage) {
  const sidebarContainer = document.getElementById('portalSidebar');
  const topbarContainer = document.getElementById('portalTopbar');

  if (sidebarContainer) {
    const menuItems = [
      { key: 'dashboard', label: '📊 Dashboard', href: '/pages/admin/dashboard.html' },
      { key: 'students', label: '👨‍🎓 Manage Students', href: '/pages/admin/students.html' },
      { key: 'faculty', label: '👨‍🏫 Manage Faculty', href: '/pages/admin/faculty.html' },
      { key: 'courses', label: '📖 Degree Courses', href: '/pages/admin/courses.html' },
      { key: 'departments', label: '🏫 Departments', href: '/pages/admin/departments.html' },
      { key: 'timetable', label: '🕒 Master Timetable', href: '/pages/admin/timetable.html' },
      { key: 'notices', label: '📢 Publish Notices', href: '/pages/admin/notices.html' },
      { key: 'results', label: '🎓 Exam Results', href: '/pages/admin/results.html' },
      { key: 'leaves', label: '✉️ Leave Requests', href: '/pages/admin/leaves.html' },
      { key: 'complaints', label: '📑 Complaints', href: '/pages/admin/complaints.html' },
      { key: 'gallery', label: '🖼️ Campus Gallery', href: '/pages/admin/gallery.html' },
      { key: 'reports', label: '📈 Reports & Metrics', href: '/pages/admin/reports.html' },
      { key: 'settings', label: '⚙️ Settings', href: '/pages/admin/settings.html' }
    ];

    sidebarContainer.innerHTML = buildSidebarHTML('⚙️ Admin Panel', menuItems, activePage);
  }

  if (topbarContainer) {
    topbarContainer.innerHTML = buildTopbarHTML('Admin', user);
    initPortalHamburger(sidebarContainer);
  }

  populateBasicUserInfo(user);
}

function buildSidebarHTML(title, menuItems, activePage) {
  return `
    <div class="sidebar-header">
      <a href="/index.html" class="sidebar-brand">
        <div class="nav-brand-icon">C</div>
        Campus <span>360</span>
      </a>
    </div>
    <div class="sidebar-role-tag">${title}</div>
    <ul class="sidebar-menu">
      ${menuItems.map(item => `
        <li>
          <a href="${item.href}" class="sidebar-link ${activePage === item.key ? 'active' : ''}">
            ${item.label}
          </a>
        </li>
      `).join('')}
    </ul>
    <div class="sidebar-footer">
      <span class="sidebar-version-badge">Campus 360 System</span>
    </div>
  `;
}

function buildTopbarHTML(roleName, user) {
  return `
    <div class="topbar-left">
      <button class="hamburger-portal" id="portalHamburger" aria-label="Toggle Navigation Drawer">
        <span></span><span></span><span></span>
      </button>
      <div class="topbar-branding">
        <h3 class="topbar-title">Campus 360 <span class="topbar-role-sub">${roleName}</span></h3>
      </div>
    </div>
    <div class="portal-user-info">
      <span class="role-badge role-${roleName.toLowerCase()}">${roleName.toUpperCase()}</span>
      <span class="user-display-name" id="userNameDisplay" title="${user.name || roleName}">${user.name || roleName}</span>
      <button onclick="logout()" class="btn-topbar-logout" title="Sign out of your account" aria-label="Logout">
        <span class="logout-icon">🚪</span>
        <span class="logout-label">Logout</span>
      </button>
    </div>
  `;
}

function initPortalHamburger(sidebarContainer) {
  const portalHamburger = document.getElementById('portalHamburger');
  if (portalHamburger && sidebarContainer) {
    let backdrop = document.querySelector('.portal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'portal-backdrop';
      document.body.appendChild(backdrop);
    }

    const toggleDrawer = () => {
      sidebarContainer.classList.toggle('active');
      portalHamburger.classList.toggle('active');
      backdrop.classList.toggle('active');
      document.body.classList.toggle('portal-drawer-open');
    };

    const closeDrawer = () => {
      sidebarContainer.classList.remove('active');
      portalHamburger.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('portal-drawer-open');
    };

    portalHamburger.onclick = toggleDrawer;
    backdrop.onclick = closeDrawer;

    // Auto-close on mobile link click
    const menuLinks = sidebarContainer.querySelectorAll('.sidebar-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
          closeDrawer();
        }
      });
    });
  }
}

function populateBasicUserInfo(user) {
  const nameEl = document.getElementById('userNameDisplay');
  const emailEl = document.getElementById('userEmailDisplay');
  const roleEl = document.getElementById('userRoleDisplay');

  if (nameEl) nameEl.textContent = user.name || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (roleEl) roleEl.textContent = (user.role || '').toUpperCase();
}

/**
 * Redirects user to their role-specific dashboard URL
 */
function redirectToUserDashboard(role) {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'student') {
    window.location.href = '/pages/student/dashboard.html';
  } else if (normalized === 'faculty') {
    window.location.href = '/pages/faculty/dashboard.html';
  } else if (normalized === 'admin') {
    window.location.href = '/pages/admin/dashboard.html';
  } else {
    window.location.href = '/login.html';
  }
}

/**
 * Clears authentication token and redirects user to Portal Login
 */
function logout() {
  localStorage.removeItem('campus360_token');
  window.location.href = '/login.html';
}

/**
 * Helper to get Auth Token for Fetch API requests
 */
function getAuthToken() {
  return localStorage.getItem('campus360_token');
}
