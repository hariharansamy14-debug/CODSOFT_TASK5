import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const NAV_ITEMS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/students', label: 'Students', icon: 'bi-people' },
    { to: '/teachers', label: 'Teachers', icon: 'bi-person-workspace' },
    { to: '/departments', label: 'Departments', icon: 'bi-building' },
    { to: '/courses', label: 'Courses', icon: 'bi-book' },
    { to: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { to: '/grades', label: 'Grades', icon: 'bi-award' },
    { to: '/analytics', label: 'Analytics', icon: 'bi-graph-up' },
    { to: '/notifications', label: 'Notifications', icon: 'bi-bell' },
    { to: '/admin/users', label: 'User Management', icon: 'bi-shield-lock' },
  ],
  teacher: [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/courses', label: 'My Courses', icon: 'bi-book' },
    { to: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { to: '/grades', label: 'Grades', icon: 'bi-award' },
    { to: '/notifications', label: 'Notifications', icon: 'bi-bell' },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/profile', label: 'My Profile', icon: 'bi-person' },
    { to: '/courses', label: 'My Courses', icon: 'bi-book' },
    { to: '/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
    { to: '/grades', label: 'My Grades', icon: 'bi-award' },
    { to: '/notifications', label: 'Notifications', icon: 'bi-bell' },
  ],
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const items = NAV_ITEMS[user?.role] || []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={darkMode ? 'bg-dark text-light min-vh-100' : 'bg-light min-vh-100'}>
      <nav className="navbar navbar-expand navbar-dark bg-primary px-3 shadow-sm">
        <button className="btn btn-outline-light btn-sm me-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <i className="bi bi-list"></i> Menu
        </button>
        <span className="navbar-brand mb-0 h5">Student Management System</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <button className="btn btn-sm btn-outline-light" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <span className="text-white small">{user?.name} ({user?.role})</span>
          <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="d-flex">
        {sidebarOpen && (
          <aside className="bg-white border-end p-3" style={{ width: 240, minHeight: 'calc(100vh - 56px)' }}>
            <ul className="nav nav-pills flex-column gap-1">
              {items.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      'nav-link d-flex align-items-center gap-2 ' + (isActive ? 'active' : 'text-dark')
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
