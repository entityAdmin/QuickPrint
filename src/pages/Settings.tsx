import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'

function ShopSettings() {
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchShop = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/operator/login')
        return
      }
      const { data, error } = await supabase.from('shops').select('*').eq('operator_user_id', user.id).single()
      if (error) {
        console.error('Error fetching shop:', error)
        setMessage('Failed to load shop settings.')
        setIsError(true)
      } else {
        setShop(data)
      }
      setLoading(false)
    }
    fetchShop()
  }, [navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    setShop({ ...shop, [name]: finalValue });
  };

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setIsError(false)

    const { data, error } = await supabase.from('shops').update(shop).eq('id', shop.id)

    if (error) {
      setMessage('Failed to save settings: ' + error.message)
      setIsError(true)
    } else {
      setMessage('Settings saved successfully!')
      setIsError(false)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <header style={{ background: 'linear-gradient(135deg, #0A5CFF 0%, #4DA3FF 100%)' }} className="text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-4xl mx-auto p-4 flex items-center">
          <Link to="/operator" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-[#0F1A2B]">Shop Settings</h1>
          <p className="text-gray-500 mt-1">Configure your shop profile and pricing.</p>

          {message && (
            <div className={`mt-6 p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {isError ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
              <span>{message}</span>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[#0F1A2B] border-b pb-3 mb-6">Shop Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Shop Name" name="shop_name" value={shop?.shop_name || ''} onChange={handleInputChange} />
              <InputField label="Owner Name" name="owner_name" value={shop?.owner_name || ''} onChange={handleInputChange} />
              <InputField label="Email" name="email" type="email" value={shop?.email || ''} onChange={handleInputChange} isDisabled={true} />
              <InputField label="Phone Number" name="phone_number" value={shop?.phone_number || ''} onChange={handleInputChange} />
              <div className="md:col-span-2">
                <InputField label="Location" name="location" value={shop?.location || ''} onChange={handleInputChange} />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-[#0F1A2B] border-b pb-3 my-8">Pricing (KES)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <InputField label="Black & White (per page)" name="price_bw" type="number" value={shop?.price_bw || ''} onChange={handleInputChange} />
              <InputField label="Colour (per page)" name="price_color" type="number" value={shop?.price_color || ''} onChange={handleInputChange} />
              <InputField label="A3 (per page)" name="price_a3" type="number" value={shop?.price_a3 || ''} onChange={handleInputChange} />
              <InputField label="Double-sided Discount (%)" name="discount_doublesided" type="number" value={shop?.discount_doublesided || ''} onChange={handleInputChange} />
            </div>

            <h2 className="text-lg font-semibold text-[#0F1A2B] border-b pb-3 my-8">Binding & Extras</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InputField label="Staples" name="price_staples" type="number" value={shop?.price_staples || ''} onChange={handleInputChange} />
                <InputField label="Spiral Binding" name="price_spiral" type="number" value={shop?.price_spiral || ''} onChange={handleInputChange} />
                <InputField label="Lamination" name="price_lamination" type="number" value={shop?.price_lamination || ''} onChange={handleInputChange} />
            </div>

            <h2 className="text-lg font-semibold text-[#0F1A2B] border-b pb-3 my-8">Data Retention</h2>
            <div className="max-w-sm">
                <InputField label="Auto-delete Files after (hours)" name="retention_period" type="number" value={shop?.retention_period || 24} onChange={handleInputChange} />
                <p className="text-xs text-gray-500 mt-1">Completed orders will have their files automatically be deleted after this period.</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-gray-800">Enable Auto-delete</h3>
                    <p className="text-sm text-gray-500">Automatically delete files when retention period expires.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="auto_delete" checked={shop?.auto_delete || false} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t flex justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-[#0A5CFF] to-[#4DA3FF] text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:scale-105 transform transition-transform duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20}/>}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const InputField = ({ label, name, type = 'text', value, onChange, isDisabled = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={isDisabled}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100"
    />
  </div>
);

export default ShopSettings
