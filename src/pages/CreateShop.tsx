import { useState } from 'react'
import { supabase } from '../supabaseClient'

function CreateShop() {
  const [shopName, setShopName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
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
      return
    }

    setLoading(true)
    setMessage('')

    // Check if user already has an account and shop
    const { data: existingUser } = await supabase.auth.getUser()
    if (existingUser.user) {
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('operator_user_id', existingUser.user.id)
        .single()
      if (existingShop) {
        setMessage('You already have a shop. Please log in instead.')
        return
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setMessage('Failed to create account: ' + authError.message)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setMessage('Account created but user ID missing. Please contact support.')
      return
    }

    let shopCode = generateShopCode()
    // Check uniqueness (simple loop, in prod use better)
    let attempts = 0
    while (attempts < 10) {
      const { data } = await supabase
        .from('shops')
        .select('id')
        .eq('shop_code', shopCode)
        .single()
      if (!data) break
      shopCode = generateShopCode()
      attempts++
    }

    const { error } = await supabase
      .from('shops')
      .insert([{ shop_name: shopName, shop_code: shopCode, operator_user_id: userId }])

    if (error) {
      setMessage('Shop creation failed: ' + error.message)
    } else {
      setMessage(`Shop created! Code: ${shopCode}. You can now log in at /operator/login`)
      setShopName('')
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Shop</h1>
          <p className="text-gray-600">Set up your print shop and get started</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter your shop name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl ${message.includes('failed') || message.includes('already have') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Shop...
                </div>
              ) : (
                'Create Shop & Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/operator/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateShop