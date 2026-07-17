import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function Attendance() {
  const { user } = useAuth()
  const canMark = user?.role === 'admin' || user?.role === 'teacher'

  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [entries, setEntries] = useState({})

  const [records, setRecords] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [percentage, setPercentage] = useState(null)

  useEffect(() => {
    if (canMark) {
      const params = user.role === 'teacher' ? { teacher_id: user.id, limit: 100 } : { limit: 100 }
      api.get('/api/courses', { params }).then(({ data }) => setCourses(data.items))
      api.get('/api/students', { params: { limit: 100 } }).then(({ data }) => setStudents(data.items))
    }
  }, [canMark, user])

  const fetchRecords = useCallback(async () => {
    const params = { page, limit: 10 }
    if (user?.role === 'student') params.student_id = user.id
    const { data } = await api.get('/api/attendance', { params })
    setRecords(data.items); setPages(data.pages); setTotal(data.total)
  }, [page, user])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  useEffect(() => {
    if (user?.role === 'student') {
      api.get(`/api/attendance/percentage/${user.id}`).then(({ data }) => setPercentage(data))
    }
  }, [user])

  const handleMark = async () => {
    if (!selectedCourse) return toast.error('Select a course first')
    const entryList = students.map((s) => ({
      student_id: s.id,
      status: entries[s.id] || 'present',
    }))
    try {
      await api.post('/api/attendance/mark', { course_id: selectedCourse, date, entries: entryList })
      toast.success('Attendance marked')
      fetchRecords()
    } catch (err) {
      toast.error('Failed to mark attendance')
    }
  }

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'course_id', label: 'Course' },
    { key: 'student_id', label: 'Student', render: (r) => (user?.role === 'student' ? undefined : r.student_id) },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`badge bg-${r.status === 'present' ? 'success' : r.status === 'absent' ? 'danger' : 'warning'}`}>{r.status}</span>
    ) },
  ]

  return (
    <div>
      <h4 className="mb-3">Attendance</h4>

      {user?.role === 'student' && percentage && (
        <div className="alert alert-info">
          Overall attendance: <strong>{percentage.percentage}%</strong> ({percentage.present_days}/{percentage.total_days} days)
        </div>
      )}

      {canMark && (
        <div className="card shadow-sm mb-4 p-3">
          <h6>Mark Attendance</h6>
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <select className="form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                <option value="">Select course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary" onClick={handleMark}>Save Attendance</button>
            </div>
          </div>

          {selectedCourse && (
            <div className="table-responsive" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table table-sm">
                <thead><tr><th>Student</th><th>Status</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name} ({s.student_id})</td>
                      <td>
                        <select className="form-select form-select-sm" value={entries[s.id] || 'present'}
                          onChange={(e) => setEntries({ ...entries, [s.id]: e.target.value })}>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Leave</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <DataTable
        columns={columns.filter((c) => user?.role !== 'student' || c.key !== 'student_id')}
        rows={records} page={page} pages={pages} total={total}
        onPageChange={setPage} onSearch={() => {}} searchValue={search}
      />
    </div>
  )
}
