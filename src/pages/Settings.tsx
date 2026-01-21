import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Store, User, Mail, Phone, MapPin, DollarSign, Percent, Clock, Trash2, Settings as SettingsIcon, Printer, TestTube, Clipboard } from 'lucide-react';
import PaymentBilling from '../components/payments/PaymentBilling';

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

interface PrinterSettings {
  connectionMethod: 'browser' | 'network' | 'usb'
  paperSize: 'A4' | 'A3' | 'Letter'
  color: 'B&W' | 'Color'
  duplex: boolean
}

function Settings() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'shop' | 'pricing' | 'account' | 'printer' | 'guide'>(() => {
    const tab = searchParams.get('tab');
    return (tab === 'printer' || tab === 'pricing' || tab === 'account' || tab === 'guide') ? tab : 'shop';
  });
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('printerSettings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error loading printer settings:', e)
      }
    }
    return {
      connectionMethod: 'browser',
      paperSize: 'A4',
      color: 'B&W',
      duplex: false
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/operator-login');
          return;
        }

        const { data: shopData, error } = await supabase
          .from('shops')
          .select('*')
          .eq('operator_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching shop:', error);
          setMessage('Failed to load shop settings');
          setIsError(true);
        } else {
          setShop(shopData);
        }
      } catch (error) {
        console.error('Error:', error);
        setMessage('An error occurred while loading settings');
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [navigate]);

  useEffect(() => {
    const handleTabSwitch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) setActiveTab(detail.tab);
    };
    window.addEventListener('tab:switch', handleTabSwitch);
    return () => window.removeEventListener('tab:switch', handleTabSwitch);
  }, []);

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

  const savePrinterSettings = () => {
    localStorage.setItem('printerSettings', JSON.stringify(printerSettings))
    setMessage('Printer settings saved successfully!')
    setIsError(false)
  }

  const testPrint = () => {
    // Create a test print content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Test Print - QuickPrint</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .test-content { border: 1px solid #ccc; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>QuickPrint Test Page</h1>
              <p>Printer Settings Test</p>
            </div>
            <div class="test-content">
              <p><strong>Connection Method:</strong> ${printerSettings.connectionMethod}</p>
              <p><strong>Paper Size:</strong> ${printerSettings.paperSize}</p>
              <p><strong>Print Type:</strong> ${printerSettings.color}</p>
              <p><strong>Duplex:</strong> ${printerSettings.duplex ? 'Yes' : 'No'}</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <p>This is a test print to verify your printer configuration.</p>
              <p>If you can see this page, your browser print settings are working correctly.</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const updatePrinterSetting = (key: keyof PrinterSettings, value: PrinterSettings[keyof PrinterSettings]) => {
    setPrinterSettings(prev => ({ ...prev, [key]: value }))
  }

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

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)]">
          <div className="flex border-b border-gray-200">
            <TabButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')}>Shop Profile</TabButton>
            <TabButton active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')}>Pricing</TabButton>
            <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')}>Account Details</TabButton>
            <TabButton active={activeTab === 'printer'} onClick={() => setActiveTab('printer')}>Printer Setup</TabButton>
            <TabButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')}>Guide</TabButton>
          </div>
          <div className="p-6">
            {activeTab === 'shop' && (
              <div className="space-y-8">
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
                        <InputField icon={DollarSign} label="Stapled" name="price_staples" type="number" value={shop.price_staples || ''} onChange={handleInputChange} />
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
              </div>
            )}

            {activeTab === 'pricing' && (
              <div>
                <div className="grid md:grid-cols-3 gap-6">
                  <PlanCard title="Normal" price="KES 1,000/mo" features={["Document uploads","Operator dashboard","Customer notifications"]} />
                  <PlanCard title="Advanced" price="KES 2,500/mo" features={["Everything in Normal","AI checks","Smart recommendations"]} />
                  <PlanCard title="Enterprise" price="Custom" features={["Custom integrations","Priority support","SLA"]} />
                </div>

                <section className="mt-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h2 className="text-lg font-semibold">How billing works</h2>
                  <ul className="list-disc ml-6 mt-3 text-sm text-[#5B6B82] space-y-2">
                    <li>Pricing is billed monthly in KES unless otherwise specified.</li>
                    <li>Clicking "Choose plan" takes you to Account Details to complete payment.</li>
                    <li>No payment form is shown here — all payments occur in the Account Details view.</li>
                  </ul>
                </section>
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <PaymentBilling />
              </div>
            )}

            {activeTab === 'printer' && (
              <div className="space-y-8">
                <Section title="Printer Setup" icon={Printer}>
                  <p className="text-gray-500 mb-6">Configure your printing preferences and test your setup.</p>

                  <div className="space-y-8">
                    {/* Connection Method */}
                    <section>
                      <h3 className="text-lg font-semibold text-[#0F1A2B] mb-4">Printer Connection</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => updatePrinterSetting('connectionMethod', 'browser')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            printerSettings.connectionMethod === 'browser'
                              ? 'border-[#0A5CFF] bg-blue-50 text-[#0A5CFF]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Printer className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">Browser Print</div>
                          <div className="text-xs text-gray-500">Use browser's print dialog</div>
                        </button>
                        <button
                          onClick={() => updatePrinterSetting('connectionMethod', 'network')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            printerSettings.connectionMethod === 'network'
                              ? 'border-[#0A5CFF] bg-blue-50 text-[#0A5CFF]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <SettingsIcon className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">Network Printer</div>
                          <div className="text-xs text-gray-500">IP-based network printer</div>
                        </button>
                        <button
                          onClick={() => updatePrinterSetting('connectionMethod', 'usb')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            printerSettings.connectionMethod === 'usb'
                              ? 'border-[#0A5CFF] bg-blue-50 text-[#0A5CFF]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Printer className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">USB Printer</div>
                          <div className="text-xs text-gray-500">Direct USB connection</div>
                        </button>
                      </div>
                    </section>

                    {/* Default Print Settings */}
                    <section>
                      <h3 className="text-lg font-semibold text-[#0F1A2B] mb-4">Default Print Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Paper Size</label>
                          <select
                            value={printerSettings.paperSize}
                            onChange={(e) => updatePrinterSetting('paperSize', e.target.value as PrinterSettings['paperSize'])}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="A4">A4</option>
                            <option value="A3">A3</option>
                            <option value="Letter">Letter</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Print Type</label>
                          <select
                            value={printerSettings.color}
                            onChange={(e) => updatePrinterSetting('color', e.target.value as PrinterSettings['color'])}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="B&W">Black & White</option>
                            <option value="Color">Color</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={printerSettings.duplex}
                            onChange={(e) => updatePrinterSetting('duplex', e.target.checked)}
                            className="h-4 w-4 rounded text-[#0A5CFF] focus:ring-[#4DA3FF]"
                          />
                          <span className="text-sm font-medium text-gray-600">Double-sided printing</span>
                        </label>
                      </div>
                    </section>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                      <button
                        onClick={savePrinterSettings}
                        className="flex-1 bg-gradient-to-r from-[#0A5CFF] to-[#4DA3FF] text-white font-semibold py-3 px-6 rounded-xl hover:from-[#0948CC] hover:to-[#3B8CFF] transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Save Settings
                      </button>
                      <button
                        onClick={testPrint}
                        className="flex-1 bg-white border-2 border-[#0A5CFF] text-[#0A5CFF] font-semibold py-3 px-6 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <TestTube className="w-5 h-5" />
                        <span>Test Print</span>
                      </button>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
                  <h2 className="text-xl font-semibold text-[#0F1A2B] mb-4">How QuickPrint Works</h2>
                  <div className="space-y-4 text-[#5B6B82]">
                    <div>
                      <h3 className="font-semibold text-[#0F1A2B]">1. Customer scans QR code or enters Shop Code</h3>
                      <p>Customer scans the shop QR code or enters the shop code to access the cyber instantly and upload documents.</p>
                      <img src="/Sample Poster.png" alt="Sample Poster" className="mt-2 w-full max-w-sm h-auto rounded-md shadow"/>

                      <h4 className="font-semibold text-[#0F1A2B] mt-4">How to Get the Poster and QR Code</h4>
                      <p>The poster and QR code are downloaded by clicking the QR Code icon on the top task bar, then printing and placing it inside or outside the cyber.</p>
                      <img src="/PosterDownload.png" alt="DownloadPoster" className="mt-2 max-w-full h-auto" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F1A2B]">2. Customer Uploads Documents</h3>
                      <p>Customer uploads documents in original quality and selects print options before submitting.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F1A2B]">3. Operator Receives and Prints Files</h3>
                      <p>Operator receives the job instantly on the dashboard and prints according to the selected options.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F1A2B]">4. Operator Marks Job as Completed</h3>
                      <p>When the operator clicks Complete, the customer is notified immediately that their documents are ready for pickup.</p>

                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
                  <h2 className="text-xl font-semibold text-[#0F1A2B] mb-4">Payment & Packages</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-[#0F1A2B]">Normal Package – KES 1,000 per Month</h3>
                      <ul className="list-disc list-inside space-y-1 text-[#5B6B82] ml-4">
                        <li>Document uploads</li>
                        <li>Automatic pricing based on settings</li>
                        <li>Operator dashboard</li>
                        <li>Customer notifications</li>
                        <li>Job tracking and completion flow</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F1A2B]">Advanced Package – KES 2,500 per Month</h3>
                      <p className="text-[#5B6B82]">Everything in Normal</p>
                      <ul className="list-disc list-inside space-y-1 text-[#5B6B82] ml-4">
                        <li>AI-powered document checks</li>
                        <li>Smart print recommendations</li>
                        <li>Error detection and quality warnings</li>
                        <li>Future advanced automation features</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
                  <h2 className="text-xl font-semibold text-[#0F1A2B] mb-4">Example subscription timeline (mock preview)</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                      <span className="text-[#5B6B82]">Subscription Start: Jan 1, 2026</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                      <span className="text-[#5B6B82]">Active Period</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-4"></div>
                      <span className="text-[#5B6B82]">Expiry: Dec 31, 2026</span>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '50%'}}></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
                  <h2 className="text-xl font-semibold text-[#0F1A2B] mb-4">Contact Support</h2>
                  <p className="text-[#5B6B82] mb-4">If you experience any issue, contact support and be sure to mention QuickPrint.</p>
                  <a href="https://www.theeentityke.com/" target="_blank" className="inline-block bg-[#0A5CFF] text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-4">
                    Contact Support
                  </a>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#5B6B82]">Email:</span>
                      <span className="text-[#0F1A2B] font-mono">info@quickprint.top</span>
                      <button onClick={() => navigator.clipboard.writeText('info@quickprint.top').then(() => setMessage('Email copied!'))} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                        <Clipboard className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#5B6B82]">Phone:</span>
                      <span className="text-[#0F1A2B] font-mono">0708889016</span>
                      <button onClick={() => navigator.clipboard.writeText('0708889016').then(() => setMessage('Phone copied!'))} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                        <Clipboard className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
      active ? 'border-[#0A5CFF] text-[#0A5CFF]' : 'border-transparent text-[#5B6B82] hover:border-gray-300 hover:text-[#0F1A2B]'
    }`}
  >
    {children}
  </button>
);

const PlanCard = ({ title, price, features }: { title: string; price: string; features: string[] }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgba(15,26,43,0.04)]">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="text-sm text-[#5B6B82]">{price}</div>
    </div>
    <ul className="mt-4 text-sm text-[#5B6B82] list-disc ml-4 space-y-2">
      {features.map((f) => <li key={f}>{f}</li>)}
    </ul>
    <div className="mt-6">
      <button onClick={() => window.dispatchEvent(new CustomEvent('tab:switch', { detail: { tab: 'account' } }))} className="w-full bg-[#0A5CFF] text-white py-2 rounded-lg">
        Choose plan
      </button>
    </div>
  </div>
);

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
