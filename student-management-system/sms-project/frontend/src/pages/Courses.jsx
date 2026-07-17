import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const emptyForm = { code: '', title: '', credits: 3, semester: 1, department_id: '', teacher_id: '', description: '' }

export default function Courses() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const fetchCourses = useCallback(async () => {
    const params = { page, limit: 10, search }
    if (user?.role === 'teacher') params.teacher_id = user.id
    const { data } = await api.get('/api/courses', { params })
    setRows(data.items); setPages(data.pages); setTotal(data.total)
  }, [page, search, user])

  useEffect(() => { fetchCourses() }, [fetchCourses])
  useEffect(() => {
    api.get('/api/departments', { params: { limit: 100 } }).then(({ data }) => setDepartments(data.items))
    api.get('/api/teachers', { params: { limit: 100 } }).then(({ data }) => setTeachers(data.items))
  }, [])

  const deptName = (id) => departments.find((d) => d.id === id)?.name || id
  const teacherName = (id) => teachers.find((t) => t.id === id)?.name || '— Unassigned —'

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }
  const openEdit = (row) => { setForm(row); setEditingId(row.id); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { code, department_id, ...rest } = form
        await api.put(`/api/courses/${editingId}`, rest)
        toast.success('Course updated')
      } else {
        await api.post('/api/courses', form)
        toast.success('Course created')
      }
      setShowModal(false)
      fetchCourses()
    } catch (err) {
      toast.error(err.response?.data?.detail?.toString() || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return
    await api.delete(`/api/courses/${id}`)
    toast.success('Course deleted')
    fetchCourses()
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'title', label: 'Title' },
    { key: 'credits', label: 'Credits' },
    { key: 'semester', label: 'Semester' },
    { key: 'department_id', label: 'Department', render: (r) => deptName(r.department_id) },
    { key: 'teacher_id', label: 'Teacher', render: (r) => teacherName(r.teacher_id) },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{user?.role === 'teacher' ? 'My Courses' : 'Courses'}</h4>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Add Course</button>}
      </div>

      <DataTable
        columns={columns} rows={rows} page={page} pages={pages} total={total}
        onPageChange={setPage} onSearch={(v) => { setSearch(v); setPage(1) }} searchValue={search}
        actions={isAdmin ? (row) => (
          <>
            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(row)}>Edit</button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.id)}>Delete</button>
          </>
        ) : null}
      />

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingId ? 'Edit Course' : 'Add Course'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Code</label>
                    <input className="form-control" value={form.code} disabled={!!editingId}
                      onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title</label>
                    <input className="form-control" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Credits</label>
                    <input type="number" min={1} max={10} className="form-control" value={form.credits}
                      onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Semester</label>
                    <input type="number" min={1} max={12} className="form-control" value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={form.department_id} disabled={!!editingId}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })} required>
                      <option value="">Select...</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assigned Teacher</label>
                    <select className="form-select" value={form.teacher_id || ''}
                      onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
                      <option value="">Unassigned</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
