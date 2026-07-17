import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

function StatCard({ label, value, color }) {
  return (
    <div className="col-md-3 col-sm-6 mb-3">
      <div className={`card text-white bg-${color} shadow-sm`}>
        <div className="card-body">
          <h6 className="card-title text-uppercase small">{label}</h6>
          <h2 className="mb-0">{value}</h2>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [gpa, setGpa] = useState(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/api/analytics/overview').then(({ data }) => setStats(data)).catch(() => {})
    }
    if (user?.role === 'student') {
      // student_ref isn't directly on user object from /me; this assumes backend links it.
      api.get(`/api/grades/student/${user.id}`).then(({ data }) => setGpa(data)).catch(() => {})
    }
  }, [user])

  return (
    <div>
      <h3 className="mb-4">Welcome, {user?.name} 👋</h3>

      {user?.role === 'admin' && stats && (
        <>
          <div className="row">
            <StatCard label="Students" value={stats.total_students} color="primary" />
            <StatCard label="Teachers" value={stats.total_teachers} color="success" />
            <StatCard label="Courses" value={stats.total_courses} color="warning" />
            <StatCard label="Departments" value={stats.total_departments} color="info" />
          </div>
          <div className="row mt-3">
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm p-3">
                <h6>Attendance Percentage</h6>
                <Doughnut
                  data={{
                    labels: ['Present', 'Absent/Leave'],
                    datasets: [{
                      data: [stats.attendance_percentage, 100 - stats.attendance_percentage],
                      backgroundColor: ['#198754', '#dc3545'],
                    }],
                  }}
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm p-3">
                <h6>Grade Distribution</h6>
                <Bar
                  data={{
                    labels: Object.keys(stats.grade_distribution || {}),
                    datasets: [{
                      label: 'Students',
                      data: Object.values(stats.grade_distribution || {}),
                      backgroundColor: '#0d6efd',
                    }],
                  }}
                  options={{ plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {user?.role === 'teacher' && (
        <div className="alert alert-info">
          Use the sidebar to manage your assigned courses, take attendance, and upload grades.
        </div>
      )}

      {user?.role === 'student' && (
        <div className="row">
          <div className="col-md-4">
            <StatCard label="Current GPA" value={gpa?.gpa ?? '-'} color="success" />
          </div>
          <div className="col-md-8">
            <div className="alert alert-info">
              Use the sidebar to view your profile, courses, attendance, and grades.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
