import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ShopCodeEntry() {
  const [shopCode, setShopCode] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const shopParam = searchParams.get('shop')
    if (shopParam) {
      setShopCode(shopParam.toUpperCase())
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopCode.trim()) {
      setMessage('Please enter a shop code.')
      return
    }

    const { data, error } = await supabase
      .from('shops')
      .select('id, shop_name')
      .eq('shop_code', shopCode.toUpperCase())
      .single()

    if (error || !data) {
      setMessage('Invalid shop code. Please check and try again.')
    } else {
      localStorage.setItem('shopId', data.id)
      localStorage.setItem('shopCode', shopCode.toUpperCase())
      localStorage.setItem('shopName', data.shop_name)
      navigate('/upload')
    }
  }

  return (
    <div>
      <h1>Quick Print - Enter Shop Code</h1>
      <p>Enter the shop code from the QR code or poster to upload your documents.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={shopCode}
          onChange={(e) => setShopCode(e.target.value.toUpperCase())}
          placeholder="Shop code (e.g., ABC12)"
          required
        />
        <button type="submit">Continue</button>
      </form>
      <p>{message}</p>
    </div>
  )
}

export default ShopCodeEntry