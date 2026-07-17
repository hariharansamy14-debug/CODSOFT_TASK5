import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function Notifications() {
  const { user } = useAuth()
  const canSend = user?.role === 'admin' || user?.role === 'teacher'
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', message: '', target_role: '' })

  const fetchNotifications = () => {
    api.get('/api/notifications', { params: { limit: 50 } }).then(({ data }) => setItems(data.items))
  }

  useEffect(() => { fetchNotifications() }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/notifications', { ...form, target_role: form.target_role || null })
      toast.success('Notification sent')
      setForm({ title: '', message: '', target_role: '' })
      fetchNotifications()
    } catch (err) {
      toast.error('Failed to send notification')
    }
  }

  const markRead = async (id) => {
    await api.post(`/api/notifications/${id}/read`)
    fetchNotifications()
  }

  return (
    <div>
      <h4 className="mb-3">Notifications</h4>

      {canSend && (
        <div className="card shadow-sm p-3 mb-4">
          <h6>Send Notification</h6>
          <form onSubmit={handleSend} className="row g-2">
            <div className="col-md-4">
              <input className="form-control" placeholder="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="col-md-5">
              <input className="form-control" placeholder="Message" value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}>
                <option value="">Everyone</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
            </div>
            <div className="col-md-1">
              <button className="btn btn-primary w-100" type="submit">Send</button>
            </div>
          </form>
        </div>
      )}

      <div className="list-group">
        {items.length === 0 && <div className="text-muted">No notifications yet.</div>}
        {items.map((n) => {
          const isRead = (n.read_by || []).includes(user?.id)
          return (
            <div key={n.id} className={`list-group-item ${isRead ? '' : 'list-group-item-warning'}`}>
              <div className="d-flex justify-content-between">
                <h6 className="mb-1">{n.title}</h6>
                {!isRead && <button className="btn btn-sm btn-outline-secondary" onClick={() => markRead(n.id)}>Mark read</button>}
              </div>
              <p className="mb-1">{n.message}</p>
              <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}
