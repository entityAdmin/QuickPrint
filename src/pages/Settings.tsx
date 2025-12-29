import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Store, User, Mail, Phone, MapPin, DollarSign, Percent, Clock, Trash2, Settings as SettingsIcon } from 'lucide-react';

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

function Settings() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShop = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/operator/login');
        return;
      }
      const { data, error } = await supabase.from('shops').select('*').eq('operator_user_id', user.id).single();
      if (error) {
        console.error('Error fetching shop:', error);
        setMessage('Failed to load shop settings.');
        setIsError(true);
      } else {
        setShop({
          ...data,
          email: user.email, // Make sure email is from the auth user
          price_bw: data.price_bw?.toString() || '',
          price_color: data.price_color?.toString() || '',
          price_a3: data.price_a3?.toString() || '',
          discount_doublesided: data.discount_doublesided?.toString() || '',
          price_staples: data.price_staples?.toString() || '',
          price_spiral: data.price_spiral?.toString() || '',
          price_lamination: data.price_lamination?.toString() || '',
          retention_period: data.retention_period?.toString() || '',
        });
      }
      setLoading(false);
    };
    fetchShop();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setShop(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } as Shop : null);
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    setMessage('');
    setIsError(false);

    // Exclude non-updatable fields like email, id, shop_code
    const { id, ...updateData } = shop;
    const updates = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (key.startsWith('price') || key === 'discount_doublesided') {
            acc[key] = value ? parseFloat(value as string) : null;
        } else if (key === 'retention_period') {
            acc[key] = value ? parseInt(value as string) : null;
        } else {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string | number | boolean | null>);

    const { error } = await supabase.from('shops').update(updates).eq('id', id);

    if (error) {
      setMessage(`Failed to save settings: ${error.message}`);
      setIsError(true);
    } else {
      setMessage('Settings saved successfully!');
      setIsError(false);
    }
    setSaving(false);
  };

  if (loading || !shop) {
    return (
      <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF] font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
            <a href='/operator' className="flex items-center text-sm font-semibold text-[#0A5CFF] hover:text-[#0A5CFF]/80 transition-colors">
                <ArrowLeft size={18} className="mr-2" />
                Back to Dashboard
            </a>
            <h1 className="text-lg font-semibold text-[#0F1A2B]">Shop Settings</h1>
            <div className="w-36"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
        {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-3 text-sm font-medium ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {isError ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
              <span>{message}</span>
            </div>
        )}
        <Section title="Shop Profile" icon={Store}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField icon={Store} label="Shop Name" name="shop_name" value={shop.shop_name} onChange={handleInputChange} />
              <InputField icon={User} label="Owner Name" name="owner_name" value={shop.owner_name || ''} onChange={handleInputChange} />
              <InputField icon={Mail} label="Email" name="email" type="email" value={shop.email || ''} onChange={() => {}} isDisabled={true} />
              <InputField icon={Phone} label="Phone Number" name="phone_number" value={shop.phone_number || ''} onChange={handleInputChange} />
              <div className="md:col-span-2">
                <InputField icon={MapPin} label="Location" name="location" value={shop.location || ''} onChange={handleInputChange} />
              </div>
            </div>
        </Section>

        <Section title="Pricing (KES)" icon={DollarSign}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <InputField icon={DollarSign} label="B&W (per page)" name="price_bw" type="number" value={shop.price_bw || ''} onChange={handleInputChange} />
              <InputField icon={DollarSign} label="Color (per page)" name="price_color" type="number" value={shop.price_color || ''} onChange={handleInputChange} />
              <InputField icon={DollarSign} label="A3 (per page)" name="price_a3" type="number" value={shop.price_a3 || ''} onChange={handleInputChange} />
              <InputField icon={Percent} label="Double-sided Discount" name="discount_doublesided" type="number" value={shop.discount_doublesided || ''} onChange={handleInputChange} />
            </div>
        </Section>

        <Section title="Binding & Extras" icon={SettingsIcon}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InputField icon={DollarSign} label="Staples" name="price_staples" type="number" value={shop.price_staples || ''} onChange={handleInputChange} />
                <InputField icon={DollarSign} label="Spiral Binding" name="price_spiral" type="number" value={shop.price_spiral || ''} onChange={handleInputChange} />
                <InputField icon={DollarSign} label="Lamination" name="price_lamination" type="number" value={shop.price_lamination || ''} onChange={handleInputChange} />
            </div>
        </Section>

        <Section title="Data Retention" icon={Trash2}>
            <div className="max-w-sm">
                <InputField icon={Clock} label="Auto-delete Files after (hours)" name="retention_period" type="number" value={shop.retention_period || '24'} onChange={handleInputChange} />
                <p className="text-xs text-[#5B6B82] mt-2 ml-1">Completed orders will have their files automatically deleted after this period.</p>
            </div>
            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-[14px]">
                <div>
                    <h3 className="font-medium text-[#0F1A2B]">Enable Auto-delete</h3>
                    <p className="text-sm text-[#5B6B82]">Automatically delete files when retention period expires.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="auto_delete" checked={shop.auto_delete || false} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#0A5CFF]/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A5CFF]"></div>
                </label>
            </div>
        </Section>
        
        <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-[#0A5CFF] text-white font-semibold py-3 px-6 rounded-[14px] hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group">
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20} className="mr-2"/>}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </main>
    </div>
  )
}

const Section = ({ title, icon: Icon, children }: {title: string, icon: React.ElementType, children: React.ReactNode}) => (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)]">
      <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
              <Icon className="text-[#0A5CFF]" size={22} />
              <h2 className="text-xl font-semibold text-[#0F1A2B]">{title}</h2>
          </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
)

interface InputFieldProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}

const InputField = ({ icon: Icon, label, name, type = 'text', value, onChange, isDisabled = false }: InputFieldProps) => (
  <div>
    <label htmlFor={name} className="text-sm font-medium text-[#5B6B82] mb-2 block">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={20}/>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        className="w-full rounded-[12px] border border-gray-200 pl-11 pr-4 py-3 text-base text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF] disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  </div>
);

export default Settings;
