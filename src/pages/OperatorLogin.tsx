import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { AlertTriangle } from 'lucide-react'

function OperatorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from('shops').select('id').eq('operator_user_id', user.id).single()
        if (data && !error) navigate('/operator')
      }
    }
    checkAuth()
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
      setIsError(true)
    } else if (data.user) {
      const { data: shopData, error: shopError } = await supabase.from('shops').select('id').eq('operator_user_id', data.user.id).single()
      if (shopError || !shopData) {
        setMessage('No shop found for this account. Please create a shop first.')
        setIsError(true)
        await supabase.auth.signOut()
      } else {
        navigate('/operator')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[#0F1A2B]">Operator Login</h1>
          <p className="mt-2 text-[#5B6B82]">Access your shop dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[rgba(15,26,43,0.08)] p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-sm font-medium text-[#5B6B82]">Email</label><input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="text-sm font-medium text-[#5B6B82]">Password</label><input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            
            {message && (
              <div className={`p-4 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle className="h-5 w-5"/>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full text-lg bg-gradient-to-r from-[#0A5CFF] to-[#4DA3FF] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-[#5B6B82]">Don't have an account? <a href="/create-shop" className="font-medium text-[#0A5CFF] hover:underline">Create one</a></p>
        </div>
      </div>
    </div>
  )
}

export default OperatorLogin