import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const emptyForm = { code: '', name: '', description: '' }

export default function Departments() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const fetchDepartments = useCallback(async () => {
    const { data } = await api.get('/api/departments', { params: { page, limit: 10, search } })
    setRows(data.items); setPages(data.pages); setTotal(data.total)
  }, [page, search])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true) }
  const openEdit = (row) => { setForm(row); setEditingId(row.id); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { code, ...rest } = form
        await api.put(`/api/departments/${editingId}`, rest)
        toast.success('Department updated')
      } else {
        await api.post('/api/departments', form)
        toast.success('Department created')
      }
      setShowModal(false)
      fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.detail?.toString() || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return
    await api.delete(`/api/departments/${id}`)
    toast.success('Department deleted')
    fetchDepartments()
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Departments</h4>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Add Department</button>}
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
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingId ? 'Edit Department' : 'Add Department'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Code</label>
                    <input className="form-control" value={form.code} disabled={!!editingId}
                      onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input className="form-control" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
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
