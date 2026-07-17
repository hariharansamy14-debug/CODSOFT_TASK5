import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-dark bg-primary px-4">
        <span className="navbar-brand h4 mb-0">🎓 Student Management System</span>
        <div>
          <Link to="/login" className="btn btn-outline-light me-2">Login</Link>
          <Link to="/register" className="btn btn-light">Register</Link>
        </div>
      </nav>

      <div className="flex-grow-1 d-flex align-items-center bg-light">
        <div className="container text-center py-5">
          <h1 className="display-4 fw-bold mb-3">Manage Your Institution, Effortlessly</h1>
          <p className="lead text-muted mb-4">
            Students, teachers, attendance, grades, and analytics — all in one cloud-based platform.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg me-2">Get Started</Link>
          <Link to="/login" className="btn btn-outline-primary btn-lg">Sign In</Link>

          <div className="row mt-5 g-4">
            <div className="col-md-4">
              <div className="card h-100 shadow-sm p-3">
                <h5>📊 Analytics Dashboard</h5>
                <p className="text-muted small">Real-time insights into attendance, grades, and performance.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm p-3">
                <h5>🔐 Role-Based Access</h5>
                <p className="text-muted small">Separate portals for admins, teachers, and students.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm p-3">
                <h5>📁 Reports & Exports</h5>
                <p className="text-muted small">Download student, attendance, and grade reports as PDF or Excel.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
