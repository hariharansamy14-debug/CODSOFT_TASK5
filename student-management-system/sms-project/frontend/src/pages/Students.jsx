import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const emptyForm = {
  student_id: '', name: '', email: '', phone: '', department_id: '',
  semester: 1, date_of_birth: '', gender: 'male', address: '', password: '',
}

export default function Students() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const isAdmin = user?.role === 'admin'

  const fetchStudents = useCallback(async () => {
    const { data } = await api.get('/api/students', { params: { page, limit: 10, search } })
    setRows(data.items)
    setPages(data.pages)
    setTotal(data.total)
  }, [page, search])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => {
    api.get('/api/departments', { params: { limit: 100 } }).then(({ data }) => setDepartments(data.items))
  }, [])

  const deptName = (id) => departments.find((d) => d.id === id)?.name || id

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }
  const openEdit = (row) => {
    setForm({ ...row, password: '' })
    setEditingId(row.id)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { password, student_id, email, ...rest } = form
        await api.put(`/api/students/${editingId}`, rest)
        toast.success('Student updated')
      } else {
        await api.post('/api/students', form)
        toast.success('Student created')
      }
      setShowModal(false)
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.detail?.toString() || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return
    await api.delete(`/api/students/${id}`)
    toast.success('Student deleted')
    fetchStudents()
  }

  const columns = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department_id', label: 'Department', render: (r) => deptName(r.department_id) },
    { key: 'semester', label: 'Semester' },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge bg-${r.status === 'active' ? 'success' : 'secondary'}`}>{r.status}</span> },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Students</h4>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Add Student</button>}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        pages={pages}
        total={total}
        onPageChange={setPage}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        searchValue={search}
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
                  <h5 className="modal-title">{editingId ? 'Edit Student' : 'Add Student'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Student ID</label>
                    <input className="form-control" value={form.student_id} disabled={!!editingId}
                      onChange={(e) => setForm({ ...form, student_id: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Name</label>
                    <input className="form-control" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} disabled={!!editingId}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })} required>
                      <option value="">Select...</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Semester</label>
                    <input type="number" min={1} max={12} className="form-control" value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-control" value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  </div>
                  {!editingId && (
                    <div className="col-md-6">
                      <label className="form-label">Initial Password</label>
                      <input type="password" className="form-control" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                    </div>
                  )}
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
