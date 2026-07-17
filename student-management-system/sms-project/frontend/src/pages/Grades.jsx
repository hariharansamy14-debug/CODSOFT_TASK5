import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function Grades() {
  const { user } = useAuth()
  const canUpload = user?.role === 'admin' || user?.role === 'teacher'

  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({
    student_id: '', course_id: '', semester: 1,
    assignment_marks: 0, internal_marks: 0, lab_marks: 0, semester_marks: 0,
  })

  const [myGrades, setMyGrades] = useState(null)
  const [rankList, setRankList] = useState([])

  useEffect(() => {
    if (canUpload) {
      api.get('/api/courses', { params: { limit: 100 } }).then(({ data }) => setCourses(data.items))
      api.get('/api/students', { params: { limit: 100 } }).then(({ data }) => setStudents(data.items))
    }
    if (user?.role === 'student') {
      api.get(`/api/grades/student/${user.id}`).then(({ data }) => setMyGrades(data))
    }
    if (user?.role === 'admin') {
      api.get('/api/grades/rank-list').then(({ data }) => setRankList(data.rank_list))
    }
  }, [canUpload, user])

  const handleUpload = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/api/grades/upload', form)
      toast.success(`Saved — Final: ${data.final_marks}, Grade: ${data.grade}`)
    } catch (err) {
      toast.error(err.response?.data?.detail?.toString() || 'Failed to save grade')
    }
  }

  return (
    <div>
      <h4 className="mb-3">Grades</h4>

      {canUpload && (
        <div className="card shadow-sm mb-4 p-3">
          <h6>Upload / Update Grade</h6>
          <form onSubmit={handleUpload} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Student</label>
              <select className="form-select" value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
                <option value="">Select...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Course</label>
              <select className="form-select" value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })} required>
                <option value="">Select...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Semester</label>
              <input type="number" min={1} max={12} className="form-control" value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Assignment (10%)</label>
              <input type="number" min={0} max={100} className="form-control" value={form.assignment_marks}
                onChange={(e) => setForm({ ...form, assignment_marks: Number(e.target.value) })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Internal (20%)</label>
              <input type="number" min={0} max={100} className="form-control" value={form.internal_marks}
                onChange={(e) => setForm({ ...form, internal_marks: Number(e.target.value) })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Lab (20%)</label>
              <input type="number" min={0} max={100} className="form-control" value={form.lab_marks}
                onChange={(e) => setForm({ ...form, lab_marks: Number(e.target.value) })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Semester Exam (50%)</label>
              <input type="number" min={0} max={100} className="form-control" value={form.semester_marks}
                onChange={(e) => setForm({ ...form, semester_marks: Number(e.target.value) })} />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary">Save Grade</button>
            </div>
          </form>
        </div>
      )}

      {user?.role === 'student' && myGrades && (
        <div className="card shadow-sm p-3 mb-4">
          <h6>My Grades — GPA: <span className="badge bg-success">{myGrades.gpa}</span></h6>
          <table className="table table-sm mt-2">
            <thead><tr><th>Course</th><th>Final Marks</th><th>Grade</th></tr></thead>
            <tbody>
              {myGrades.grades.map((g) => (
                <tr key={g.id}>
                  <td>{g.course_id}</td>
                  <td>{g.final_marks}</td>
                  <td><span className="badge bg-primary">{g.grade_letter}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user?.role === 'admin' && rankList.length > 0 && (
        <div className="card shadow-sm p-3">
          <h6>Rank List (by CGPA)</h6>
          <table className="table table-sm mt-2">
            <thead><tr><th>Rank</th><th>Student</th><th>CGPA</th></tr></thead>
            <tbody>
              {rankList.slice(0, 20).map((r) => (
                <tr key={r.student_id}>
                  <td>{r.rank}</td>
                  <td>{r.student_name}</td>
                  <td>{r.cgpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
