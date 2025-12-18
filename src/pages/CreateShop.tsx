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
    <div>
      <h1>Create Shop & Account</h1>
      <input
        type="text"
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        placeholder="Shop name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Operator email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create Shop & Account'}
      </button>
      <p>{message}</p>
    </div>
  )
}

export default CreateShop