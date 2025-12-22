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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Print</h1>
          <p className="text-gray-600">Enter the shop code from the QR code or poster to upload your documents</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Code
              </label>
              <input
                type="text"
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl ${message.includes('Invalid') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Continue to Upload
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact your local print shop
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShopCodeEntry