import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { toast } from 'react-toastify'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [devToken, setDevToken] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email })
      toast.info(data.message)
      if (data.reset_token_dev_only) setDevToken(data.reset_token_dev_only)
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-primary bg-gradient">
      <div className="card shadow-lg p-4" style={{ width: 400 }}>
        <h4 className="text-center mb-4">Forgot Password</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {devToken && (
          <div className="alert alert-warning mt-3 small">
            No email provider configured. Dev-only reset token:<br />
            <code className="text-break">{devToken}</code><br />
            <Link to={`/reset-password?token=${devToken}`}>Click here to reset now</Link>
          </div>
        )}
        <p className="text-center mt-3 mb-0 small">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
