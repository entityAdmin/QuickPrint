import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'

function CreateShop() {
  const [shopName, setShopName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const generateShopCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !email.trim() || !password.trim()) {
      setMessage('Please fill all fields.')
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage('')
    setIsError(false)

    const { data: { user }, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      setMessage(authError.message)
      setIsError(true)
      setLoading(false)
      return
    }

    if (!user) {
        setMessage('Account created but user ID missing. Please contact support.')
        setIsError(true)
        setLoading(false)
        return
    }

    let shopCode = generateShopCode()
    let attempts = 0
    while (attempts < 10) {
      const { data } = await supabase.from('shops').select('id').eq('shop_code', shopCode).single()
      if (!data) break
      shopCode = generateShopCode()
      attempts++
    }

    const { error: insertError } = await supabase
      .from('shops')
      .insert([{ shop_name: shopName, shop_code: shopCode, operator_user_id: user.id }])

    if (insertError) {
      setMessage(insertError.message)
      setIsError(true)
    } else {
      setMessage(`Shop created successfully! Your Shop Code is ${shopCode}. You can now log in.`)
      setIsError(false)
      setShopName('')
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Create Your Print Shop</h1>
          <p className="mt-2 text-gray-600">Join our network of print operators.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Shop Name</label>
              <input className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" type="text" placeholder="e.g., Speedy Prints" value={shopName} onChange={e => setShopName(e.target.value)} required/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <input className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Password</label>
              <input className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required/>
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {isError ? <AlertTriangle className="h-5 w-5 mt-0.5"/> : <CheckCircle className="h-5 w-5 mt-0.5"/>}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full text-lg bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><span>Create Account</span><ArrowRight className="h-5 w-5"/></>}
            </button>
          </form>
        </div>
        <div className="text-center">
            <p className="text-sm text-gray-500">Already have an account? <a href="/operator/login" className="font-medium text-blue-600 hover:underline">Log In</a></p>
        </div>
      </div>
    </div>
  )
}

export default CreateShop
