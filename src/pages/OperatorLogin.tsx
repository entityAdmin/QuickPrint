import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function OperatorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user has a shop
        const { data, error } = await supabase
          .from('shops')
          .select('id')
          .eq('operator_user_id', user.id)
          .single()
        if (data && !error) {
          navigate('/operator')
        }
      }
    }
    checkAuth()
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Login failed: ' + error.message)
    } else if (data.user) {
      // Check if user has a shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('operator_user_id', data.user.id)
        .single()

      if (shopError || !shopData) {
        setMessage('No shop found for this account. Please create a shop first.')
        await supabase.auth.signOut()
      } else {
        navigate('/operator')
      }
    }
    setLoading(false)
  }

  return (
    <div>
      <h1>Operator Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>{message}</p>
      <p>Don't have an account? <a href="/create-shop">Create Shop</a></p>
    </div>
  )
}

export default OperatorLogin