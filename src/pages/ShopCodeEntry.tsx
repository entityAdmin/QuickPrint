import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { AlertTriangle, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800">QuickPrint</h1>
            <p className="mt-2 text-gray-600">Enter the shop code to begin.</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="shop-code" className="text-sm font-medium text-gray-600">Shop Code</label>
                <input 
                    id="shop-code"
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition uppercase tracking-widest text-center font-semibold text-lg" 
                    type="text" 
                    placeholder="ABC12"
                    value={shopCode} 
                    onChange={e => setShopCode(e.target.value.toUpperCase())} 
                    required 
                />
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                <AlertTriangle className="h-5 w-5 mt-0.5"/>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <button type="submit" className="w-full text-lg bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
              <span>Continue</span>
              <ArrowRight className="h-5 w-5"/>
            </button>
          </form>
        </div>

        <div className="text-center">
            <p className="text-sm text-gray-500">Don't have a code? <a href="/create-shop" className="font-medium text-blue-600 hover:underline">Create a Shop</a></p>
        </div>
      </div>
    </div>
  )
}

export default ShopCodeEntry
