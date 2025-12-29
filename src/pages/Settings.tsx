import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}

const InputField = ({ label, name, type = 'text', value, onChange, isDisabled = false }: InputFieldProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-text-secondary mb-1 leading-helper">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={isDisabled}
      className="w-full px-4 py-3 border border-primary-200 rounded-input focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:bg-primary-50"
    />
  </div>
);

function Settings() {
  interface Shop {
    id: number;
    shop_name: string;
    shop_code: string;
    operator_user_id?: string;
    owner_name?: string;
    email?: string;
    phone_number?: string;
    location?: string;
    price_bw?: string;
    price_color?: string;
    price_a3?: string;
    discount_doublesided?: string;
    price_staples?: string;
    price_spiral?: string;
    price_lamination?: string;
    retention_period?: string;
    auto_delete?: boolean;
  }
  const [shop, setShop] = useState<Shop | null>(null)
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
        setShop({
          ...data,
          price_bw: data.price_bw?.toString() || '',
          price_color: data.price_color?.toString() || '',
          price_a3: data.price_a3?.toString() || '',
          discount_doublesided: data.discount_doublesided?.toString() || '',
          price_staples: data.price_staples?.toString() || '',
          price_spiral: data.price_spiral?.toString() || '',
          price_lamination: data.price_lamination?.toString() || '',
          retention_period: data.retention_period?.toString() || '',
        })
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
    setShop(shop ? { ...shop, [name]: finalValue } as Shop : null);
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true)
    setMessage('')
    setIsError(false)

    const updates = {
        shop_name: shop.shop_name,
        owner_name: shop.owner_name,
        phone_number: shop.phone_number,
        location: shop.location,
        price_bw: shop.price_bw ? parseFloat(shop.price_bw) : null,
        price_color: shop.price_color ? parseFloat(shop.price_color) : null,
        price_a3: shop.price_a3 ? parseFloat(shop.price_a3) : null,
        discount_doublesided: shop.discount_doublesided ? parseFloat(shop.discount_doublesided) : null,
        price_staples: shop.price_staples ? parseFloat(shop.price_staples) : null,
        price_spiral: shop.price_spiral ? parseFloat(shop.price_spiral) : null,
        price_lamination: shop.price_lamination ? parseFloat(shop.price_lamination) : null,
        retention_period: shop.retention_period ? parseInt(shop.retention_period) : null,
        auto_delete: shop.auto_delete,
    };

    const { error } = await supabase.from('shops').update(updates).eq('id', shop.id)

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
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header style={{ background: 'linear-gradient(135deg, #0A5CFF 0%, #3B8CFF 100%)' }} className="text-white sticky top-0 z-20 shadow-card">
        <div className="max-w-4xl mx-auto p-4 flex items-center">
          <Link to="/operator" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        <div className="bg-surface rounded-card shadow-card p-8">
          <h1 className="text-2xl font-semibold text-text-primary leading-heading">Shop Settings</h1>
          <p className="text-text-secondary mt-1 leading-body">Configure your shop profile and pricing.</p>

          {message && (
            <div className={`mt-6 p-4 rounded-card flex items-center space-x-3 text-sm font-medium ${isError ? 'bg-red-50 text-error' : 'bg-green-50 text-success'}`}>
              {isError ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
              <span>{message}</span>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-lg font-medium text-text-primary border-b border-primary-200 pb-3 mb-6 leading-section">Shop Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Shop Name" name="shop_name" value={shop?.shop_name || ''} onChange={handleInputChange} />
              <InputField label="Owner Name" name="owner_name" value={shop?.owner_name || ''} onChange={handleInputChange} />
              <InputField label="Email" name="email" type="email" value={shop?.email || ''} onChange={handleInputChange} isDisabled={true} />
              <InputField label="Phone Number" name="phone_number" value={shop?.phone_number || ''} onChange={handleInputChange} />
              <div className="md:col-span-2">
                <InputField label="Location" name="location" value={shop?.location || ''} onChange={handleInputChange} />
              </div>
            </div>

            <h2 className="text-lg font-medium text-text-primary border-b border-primary-200 pb-3 my-8 leading-section">Pricing (KES)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <InputField label="Black & White (per page)" name="price_bw" type="number" value={shop?.price_bw || ''} onChange={handleInputChange} />
              <InputField label="Colour (per page)" name="price_color" type="number" value={shop?.price_color || ''} onChange={handleInputChange} />
              <InputField label="A3 (per page)" name="price_a3" type="number" value={shop?.price_a3 || ''} onChange={handleInputChange} />
              <InputField label="Double-sided Discount (%)" name="discount_doublesided" type="number" value={shop?.discount_doublesided || ''} onChange={handleInputChange} />
            </div>

            <h2 className="text-lg font-medium text-text-primary border-b border-primary-200 pb-3 my-8 leading-section">Binding & Extras</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InputField label="Staples" name="price_staples" type="number" value={shop?.price_staples || ''} onChange={handleInputChange} />
                <InputField label="Spiral Binding" name="price_spiral" type="number" value={shop?.price_spiral || ''} onChange={handleInputChange} />
                <InputField label="Lamination" name="price_lamination" type="number" value={shop?.price_lamination || ''} onChange={handleInputChange} />
            </div>

            <h2 className="text-lg font-medium text-text-primary border-b border-primary-200 pb-3 my-8 leading-section">Data Retention</h2>
            <div className="max-w-sm">
                <InputField label="Auto-delete Files after (hours)" name="retention_period" type="number" value={shop?.retention_period || 24} onChange={handleInputChange} />
                <p className="text-xs text-text-muted mt-1 leading-helper">Completed orders will have their files automatically be deleted after this period.</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-text-primary leading-section">Enable Auto-delete</h3>
                    <p className="text-sm text-text-secondary leading-body">Automatically delete files when retention period expires.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="auto_delete" checked={shop?.auto_delete || false} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-primary-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                </label>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-primary-200 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-primary-blue text-white font-medium py-3 px-6 rounded-button shadow-card hover:bg-primary-600 transform transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20}/>}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings
