import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import { toast } from 'react-toastify'

export default function AdminUsers() {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get('/api/admin/users', { params: { page, limit: 10 } })
    setRows(data.items); setPages(data.pages); setTotal(data.total)
  }, [page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const toggleActive = async (row) => {
    const action = row.is_active ? 'deactivate' : 'activate'
    await api.patch(`/api/admin/users/${row.id}/${action}`)
    toast.success(`User ${action}d`)
    fetchUsers()
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <span className="badge bg-secondary">{r.role}</span> },
    { key: 'is_active', label: 'Status', render: (r) => (
      <span className={`badge bg-${r.is_active ? 'success' : 'danger'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
    ) },
  ]

  return (
    <div>
      <h4 className="mb-3">User Management</h4>
      <DataTable
        columns={columns} rows={rows} page={page} pages={pages} total={total}
        onPageChange={setPage} onSearch={() => {}} searchValue=""
        actions={(row) => (
          <button className="btn btn-sm btn-outline-warning" onClick={() => toggleActive(row)}>
            {row.is_active ? 'Deactivate' : 'Activate'}
          </button>
        )}
      />
    </div>
  )
}
