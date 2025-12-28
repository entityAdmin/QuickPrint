import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { AlertTriangle } from 'lucide-react'

function ShopCodeEntry() {
  const [shopCode, setShopCode] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
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
      setIsError(true)
      return
    }

    const { data, error } = await supabase
      .from('shops')
      .select('id, shop_name')
      .eq('shop_code', shopCode.toUpperCase())
      .single()

    if (error || !data) {
      setMessage('Invalid shop code. Please check and try again.')
      setIsError(true)
    } else {
      localStorage.setItem('shopId', data.id)
      localStorage.setItem('shopCode', shopCode.toUpperCase())
      localStorage.setItem('shopName', data.shop_name)
      navigate('/upload')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[#0F1A2B]">Quick Print</h1>
          <p className="mt-2 text-[#5B6B82]">Enter the shop code to upload your documents</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[rgba(15,26,43,0.08)] p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium text-[#5B6B82]">Shop Code</label>
                <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                    type="text" 
                    placeholder="e.g., ABC12" 
                    value={shopCode} 
                    onChange={e => setShopCode(e.target.value.toUpperCase())} 
                    required 
                />
            </div>
            
            {message && (
              <div className={`p-4 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle className="h-5 w-5"/>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <button type="submit" className="w-full text-lg bg-gradient-to-r from-[#0A5CFF] to-[#4DA3FF] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
              Continue to Upload
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ShopCodeEntry