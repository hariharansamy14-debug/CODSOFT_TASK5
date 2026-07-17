import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function Profile() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [form, setForm] = useState({ phone: '', address: '' })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' })

  useEffect(() => {
    if (user?.role === 'student') {
      api.get(`/api/students/${user.id}`).then(({ data }) => {
        setStudent(data)
        setForm({ phone: data.phone, address: data.address })
      })
    }
  }, [user])

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/api/students/${user.id}`, form)
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/auth/change-password', pwForm)
      toast.success('Password changed')
      setPwForm({ old_password: '', new_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    }
  }

  if (!student) return <div>Loading profile...</div>

  return (
    <div className="row">
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm p-3">
          <h6>My Profile</h6>
          <p className="mb-1"><strong>Student ID:</strong> {student.student_id}</p>
          <p className="mb-1"><strong>Name:</strong> {student.name}</p>
          <p className="mb-1"><strong>Email:</strong> {student.email}</p>
          <p className="mb-3"><strong>Semester:</strong> {student.semester}</p>
          <form onSubmit={handleUpdate}>
            <div className="mb-2">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card shadow-sm p-3">
          <h6>Change Password</h6>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-2">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" value={pwForm.old_password}
                onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={pwForm.new_password} minLength={8}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required />
            </div>
            <button className="btn btn-outline-primary" type="submit">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  )
}
