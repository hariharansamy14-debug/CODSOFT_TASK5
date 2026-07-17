import { useEffect, useState } from 'react'
import api from '../api/client'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function Analytics() {
  const [deptPerf, setDeptPerf] = useState([])
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    api.get('/api/analytics/overview').then(({ data }) => setOverview(data))
    api.get('/api/analytics/department-performance').then(({ data }) => setDeptPerf(data.departments))
  }, [])

  return (
    <div>
      <h4 className="mb-3">Analytics Dashboard</h4>

      {overview && (
        <div className="row mb-4">
          <div className="col-md-3"><div className="card p-3 shadow-sm"><small className="text-muted">Pass</small><h3>{overview.pass_count}</h3></div></div>
          <div className="col-md-3"><div className="card p-3 shadow-sm"><small className="text-muted">Fail</small><h3>{overview.fail_count}</h3></div></div>
          <div className="col-md-3"><div className="card p-3 shadow-sm"><small className="text-muted">Attendance %</small><h3>{overview.attendance_percentage}%</h3></div></div>
          <div className="col-md-3"><div className="card p-3 shadow-sm"><small className="text-muted">Courses</small><h3>{overview.total_courses}</h3></div></div>
        </div>
      )}

      <div className="card shadow-sm p-3">
        <h6>Department Performance (Average GPA)</h6>
        {deptPerf.length > 0 && (
          <Bar
            data={{
              labels: deptPerf.map((d) => d.code),
              datasets: [{ label: 'Avg GPA', data: deptPerf.map((d) => d.avg_gpa), backgroundColor: '#6610f2' }],
            }}
            options={{ scales: { y: { beginAtZero: true, max: 10 } } }}
          />
        )}
      </div>
    </div>
  )
}
