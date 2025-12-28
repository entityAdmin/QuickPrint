import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { CheckCircle, AlertTriangle } from 'lucide-react'

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

  const handleCreate = async () => {
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
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[#0F1A2B]">Create Your Print Shop</h1>
          <p className="mt-2 text-[#5B6B82]">Join our network of print operators</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[rgba(15,26,43,0.08)] p-8 space-y-6">
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-[#5B6B82]">Shop Name</label><input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" type="text" placeholder="e.g., Speedy Prints" value={shopName} onChange={e => setShopName(e.target.value)} /></div>
            <div><label className="text-sm font-medium text-[#5B6B82]">Email</label><input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="text-sm font-medium text-[#5B6B82]">Password</label><input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} /></div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {isError ? <AlertTriangle className="h-5 w-5"/> : <CheckCircle className="h-5 w-5"/>}
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          <button onClick={handleCreate} disabled={loading} className="w-full text-lg bg-gradient-to-r from-[#0A5CFF] to-[#4DA3FF] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Creating Account...' : 'Create Shop & Account'}
          </button>

          <p className="text-center text-sm text-[#5B6B82]">Already have an account? <a href="/operator/login" className="font-medium text-[#0A5CFF] hover:underline">Log in</a></p>
        </div>
      </div>
    </div>
  )
}

export default CreateShop