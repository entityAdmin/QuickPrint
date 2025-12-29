import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { AlertTriangle, LogIn } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Operator Login</h1>
          <p className="mt-2 text-gray-600">Access your shop dashboard.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-600">Email Address</label>
                <input 
                    id="email"
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                />
            </div>
            <div>
                <label htmlFor="password"className="text-sm font-medium text-gray-600">Password</label>
                <input 
                    id="password"
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    type="password" 
                    placeholder="Enter your password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                />
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <AlertTriangle className="h-5 w-5 mt-0.5"/>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full text-lg bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><LogIn className="h-5 w-5"/><span>Login</span></>}
            </button>
          </form>
        </div>

        <div className="text-center">
            <p className="text-sm text-gray-500">Don't have an account? <a href="/create-shop" className="font-medium text-blue-600 hover:underline">Create a Shop</a></p>
        </div>
      </div>
    </div>
  )
}

export default OperatorLogin
