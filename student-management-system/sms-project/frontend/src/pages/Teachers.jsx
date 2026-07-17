import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const emptyForm = {
  teacher_id: '', name: '', email: '', department_id: '', qualification: '',
  experience_years: 0, subjects: '', phone: '', password: '',
}

export default function Teachers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const fetchTeachers = useCallback(async () => {
    const { data } = await api.get('/api/teachers', { params: { page, limit: 10, search } })
    setRows(data.items); setPages(data.pages); setTotal(data.total)
  }, [page, search])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])
  useEffect(() => {
    api.get('/api/departments', { params: { limit: 100 } }).then(({ data }) => setDepartments(data.items))
  }, [])

  const deptName = (id) => departments.find((d) => d.id === id)?.name || id

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }
  const openEdit = (row) => { setForm({ ...row, subjects: (row.subjects || []).join(', '), password: '' }); setEditingId(row.id); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean) }
      if (editingId) {
        const { password, teacher_id, email, ...rest } = payload
        await api.put(`/api/teachers/${editingId}`, rest)
        toast.success('Teacher updated')
      } else {
        await api.post('/api/teachers', payload)
        toast.success('Teacher created')
      }
      setShowModal(false)
      fetchTeachers()
    } catch (err) {
      toast.error(err.response?.data?.detail?.toString() || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher?')) return
    await api.delete(`/api/teachers/${id}`)
    toast.success('Teacher deleted')
    fetchTeachers()
  }

  const columns = [
    { key: 'teacher_id', label: 'Teacher ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department_id', label: 'Department', render: (r) => deptName(r.department_id) },
    { key: 'qualification', label: 'Qualification' },
    { key: 'experience_years', label: 'Experience (yrs)' },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Teachers</h4>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Add Teacher</button>}
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
                  <h5 className="modal-title">{editingId ? 'Edit Teacher' : 'Add Teacher'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Teacher ID</label>
                    <input className="form-control" value={form.teacher_id} disabled={!!editingId}
                      onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} required />
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
                    <label className="form-label">Qualification</label>
                    <input className="form-control" value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Experience (years)</label>
                    <input type="number" min={0} className="form-control" value={form.experience_years}
                      onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Subjects (comma separated)</label>
                    <input className="form-control" value={form.subjects}
                      onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
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
