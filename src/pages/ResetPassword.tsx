import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const type = searchParams.get('type')
    if (type !== 'recovery') {
      navigate('/')
    }
  }, [searchParams, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!password.trim()) {
      setMessage('Please enter a new password.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      setMessage('Error updating password: ' + error.message)
    } else {
      setMessage('Password updated successfully!')
      setTimeout(() => navigate('/operator/login'), 2000)
    }
  }

  return (
    <div>
      <h1>Reset your password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
      <p>{message}</p>
    </div>
  )
}

export default ResetPassword