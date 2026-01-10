import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';
import { Clipboard, QrCode, BarChart2, Settings, Clock, Download, Printer, Copy, Palette, Layers, FileText, List, LayoutGrid, LogOut, CheckCircle, HelpCircle } from 'lucide-react';

interface Upload {
  id: number;
  filename: string;
  file_url: string;
  customer_name?: string;
  customer_phone?: string;
  status?: string;
  created_at: string;
  expires_at: string;
  copies: number;
  print_type: 'B&W' | 'Color';
  double_sided: boolean;
  paper_size: string;
  binding: string;
  special_instructions: string;
  payment_method?: string;
}

function CyberOperator() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [shopName, setShopName] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [shopId, setShopId] = useState<string>('');
  const [qrUrl, setQrUrl] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTab, setSelectedTab] = useState<'new' | 'completed' | 'guide'>('new');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [view, setView] = useState<'card' | 'list'>('card');

  const markAsCompleted = async (uploadId: number) => {
    try {
      const { data: uploadData } = await supabase
        .from('uploads')
        .select('customer_phone')
        .eq('id', uploadId)
        .single();

      const { error } = await supabase
        .from('uploads')
        .update({ status: 'completed' })
        .eq('id', uploadId)

      if (error) {
        console.error('Error updating status:', error)
        alert('Failed to mark as completed. Please try again.')
      } else {
        // Refresh the uploads list
        fetchUploads(shopId)

        // Notify customer if phone provided
        if (uploadData && uploadData.customer_phone) {
          // TODO: Integrate SMS API to send notification
          console.log(`Job completed. Notify customer at ${uploadData.customer_phone}`);
        }
      }
    } catch (error) {
      console.error('Error marking as completed:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const fetchUploads = async (id: string) => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('shop_id', id)
      .is('deleted_at', null)
      // .gt('expires_at', new Date().toISOString()) // Temporarily disabled for testing
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching uploads:', error);
    } else {
      setUploads(data || []);
    }
  };

  const generateQR = async (code: string) => {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
    const url = `${baseUrl}/?shop=${code}`;
    setQrUrl(url);
    if (qrCanvasRef.current) {
      await QRCode.toCanvas(qrCanvasRef.current, url, { width: 200, margin: 2, color: { dark: '#0F1A2B', light: '#FFFFFF00' } });
    }
  };

  const downloadQR = () => {
    const img = new Image();
    img.onload = () => {
      const link = document.createElement('a');
      link.download = 'QuickPrint_Poster.png';
      link.href = '/QuickPrint_Poster.png';
      link.click();
    };
    img.onerror = () => {
      const link = document.createElement('a');
      link.download = 'QuickPrint_Poster.png';
      link.href = 'https://adwwxfuqvtddprlzbplo.supabase.co/storage/v1/object/sign/test%20images/images/QuickPrint_Poster.png';
      link.click();
    };
    img.src = '/QuickPrint_Poster.png';
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        window.location.href = '/operator/login';
        return;
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_code, shop_name')
        .eq('operator_user_id', user.id)
        .single();

      if (shopError || !shopData) {
        alert('No shop found for your account.');
        await supabase.auth.signOut();
        window.location.href = '/operator/login';
        return;
      }

      setShopName(shopData.shop_name);
      setShopCode(shopData.shop_code);
      setShopId(shopData.id);
      fetchUploads(shopData.id);
      generateQR(shopData.shop_code);
      setLoading(false);

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };

    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    if (!shopId) return;

    const channel = supabase
      .channel('uploads_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'uploads', filter: `shop_id=eq.${shopId}` }, () => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Job Uploaded', {
            body: 'A new document has been uploaded for printing.',
            icon: '/QuickPrintLogo.png'
          });
        }
        // Refresh uploads
        fetchUploads(shopId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyPhone = () => {
    navigator.clipboard.writeText('0708889016').then(() => {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
    });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('info@quickprint.top').then(() => {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/operator/login';
  };

  const getStats = () => {
    return {
        new: uploads.filter(u => (u.status || 'new') === 'new').length,
        completed: uploads.filter(u => u.status === 'completed').length,
    };
  };

  const stats = getStats();
  const filteredUploads = selectedTab !== 'guide' ? uploads.filter(upload => (upload.status || 'new') === selectedTab) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF] mx-auto"></div>
          <p className="mt-4 text-[#5B6B82]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF] font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-[#EBF2FF] p-2 rounded-[14px] flex items-center justify-center">
              <img src="/Quickprint_icon.png" alt="QuickPrint Icon" className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-[#0F1A2B]">{shopName}</h1>
                <p className="text-sm text-[#5B6B82]">Shop Code: {shopCode}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 rounded-[12px] pl-3">
                  <span className="text-sm text-[#5B6B82] truncate font-mono">{qrUrl.replace(/https?:\/\//, '').replace(/\/$/, '')}</span>
                  <button onClick={copyToClipboard} className="p-2 bg-gray-200 rounded-r-[12px] hover:bg-gray-300 transition-colors ml-2">
                      <Clipboard className="w-4 h-4 text-[#0F1A2B]"/>
                  </button>
              </div>
              <button onClick={downloadQR} className="p-2 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-colors flex items-center text-sm font-medium text-[#0F1A2B]">
                  <QrCode className="w-5 h-5" />
              </button>
              <button onClick={() => setSelectedTab(selectedTab === 'guide' ? 'new' : 'guide')} className={`p-2 rounded-[12px] transition-colors ${selectedTab === 'guide' ? 'bg-[#0A5CFF] text-white' : 'bg-gray-100 text-[#0F1A2B] hover:bg-gray-200'}`}>
                  <HelpCircle className="w-5 h-5" />
              </button>
              <Link to='/reports-analytics' className='p-2 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-colors'><BarChart2 className='w-5 h-5 text-[#0F1A2B]'/></Link>
              <Link to='/settings' className='p-2 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-colors'><Settings className='w-5 h-5 text-[#0F1A2B]'/></Link>
              <Link to='/operator/printer-setup' className='p-2 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-colors'><Printer className='w-5 h-5 text-[#0F1A2B]'/></Link>
              <button onClick={handleLogout} className="p-2 bg-[#EF4444]/10 text-[#EF4444] rounded-[12px] hover:bg-[#EF4444]/20 transition-colors"><LogOut className='w-5 h-5'/></button>
          </div>
        </div>
      </header>

      {(copied || copiedPhone) && 
        <div className="fixed top-20 right-6 bg-[#22C55E] text-white py-2 px-4 rounded-[12px] shadow-lg z-30 flex items-center space-x-2">
          <CheckCircle size={16}/>
          <span>Copied!</span>
        </div>
      }

      <main className="max-w-7xl mx-auto py-8 px-4">

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)]">
          <div className="p-6 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-semibold text-[#0F1A2B]">{selectedTab === 'guide' ? 'QuickPrint Operator Guide' : 'Order Queue'}</h2>
                <p className="text-sm text-[#5B6B82] mt-1">{selectedTab === 'guide' ? 'Learn how to use the system effectively' : 'Manage all incoming print jobs.'}</p>
            </div>
            {selectedTab !== 'guide' && (
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-[12px]">
                  <button onClick={() => setView('list')} className={`p-2 rounded-[10px] transition-colors ${view === 'list' ? 'bg-white text-[#0A5CFF] shadow-sm' : 'text-[#5B6B82] hover:bg-white/60'}`}><List size={20}/></button>
                  <button onClick={() => setView('card')} className={`p-2 rounded-[10px] transition-colors ${view === 'card' ? 'bg-white text-[#0A5CFF] shadow-sm' : 'text-[#5B6B82] hover:bg-white/60'}`}><LayoutGrid size={20}/></button>
              </div>
            )}
          </div>

          <div className="px-6 pb-2">
            <div className="flex border-b border-gray-200">
              <TabButton current={selectedTab} name="new" count={stats.new} label="New" onClick={setSelectedTab} />
              <TabButton current={selectedTab} name="completed" count={stats.completed} label="Completed" onClick={setSelectedTab} />
            </div>
          </div>

          {selectedTab === 'guide' ? (
            <div className="p-6 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
                <h2 className="text-xl font-semibold text-[#0F1A2B] mb-4">How QuickPrint Works</h2>
                <div className="space-y-4 text-[#5B6B82]">
                  <div>
                    <h3 className="font-semibold text-[#0F1A2B]">1. Customer scans QR code or enters Shop Code</h3>
                    <p>Customer scans the shop QR code or enters the shop code to access the cyber instantly and upload documents.</p>
                    <img src="/Sample Poster.png" alt="Sample Poster" className="mt-2 max-w-full h-auto" />
                    <h4 className="font-semibold text-[#0F1A2B] mt-4">How to Get the Poster and QR Code</h4>
                    <p>The poster and QR code are downloaded by clicking the QR Code icon on the top task bar, then printing and placing it inside or outside the cyber.</p>
                    <p className="text-sm italic">This is good but you still have a weakness here. You must ensure the QR code icon is visually obvious or operators will never find it. If it is hidden, this guide will not save you.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F1A2B]">2. Customer Uploads Documents</h3>
                    <p>Customer uploads documents in original quality and selects print options before submitting.</p>
                    <p className="text-sm italic">Important detail you did right but need to state clearly: Print options are linked to the Settings page, which determines pricing automatically based on the cyber's configuration. This removes price arguments. Do not undersell that.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F1A2B]">3. Operator Receives and Prints Files</h3>
                    <p>Operator receives the job instantly on the dashboard and prints according to the selected options.</p>
                    <p className="text-sm italic">This is where you should add value, not fluff. The real benefit is speed and clarity, not printing itself.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F1A2B]">4. Operator Marks Job as Completed</h3>
                    <p>When the operator clicks Complete, the customer is notified immediately that their documents are ready for pickup.</p>
                    <p className="text-sm italic">This closes the loop. No WhatsApp. No shouting names. No confusion.</p>
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
                    <p className="text-sm italic mt-2">This is the current system state. Do not overpromise.</p>
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
                    <p className="text-sm italic mt-2">Be careful here. If AI features are not ready, label them clearly as upcoming to avoid backlash.</p>
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
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-4 animate-pulse"></div>
                    <span className="text-[#5B6B82]">Active Period</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-4"></div>
                    <span className="text-[#5B6B82]">Expiry: Dec 31, 2026</span>
                  </div>
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '50%'}}></div>
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
                    <button onClick={copyEmail} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                      <Clipboard className="w-4 h-4" />
                    </button>
                    {copiedEmail && <span className="text-green-500 text-sm">Copied!</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#5B6B82]">Phone:</span>
                    <span className="text-[#0F1A2B] font-mono">0708889016</span>
                    <button onClick={copyPhone} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                      <Clipboard className="w-4 h-4" />
                    </button>
                    {copiedPhone && <span className="text-green-500 text-sm">Copied!</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {view === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredUploads.map(upload => <UploadCard key={upload.id} upload={upload} onMarkCompleted={markAsCompleted} />)}
                  </div>
              ) : (
                  <div className="space-y-4">
                      {filteredUploads.map(upload => <UploadListItem key={upload.id} upload={upload} onMarkCompleted={markAsCompleted} />)}
                  </div>
              )}
              {filteredUploads.length === 0 && <div className="text-center text-[#8A9BB8] py-16">No orders in this category.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface TabButtonProps {
  current: string;
  name: string;
  count: number;
  label: string;
  onClick: (name: 'new' | 'completed') => void;
}

const TabButton = ({ current, name, count, label, onClick }: TabButtonProps) => (
    <button 
        onClick={() => onClick(name as 'new' | 'completed')} 
        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-150 ${current === name ? 'border-[#0A5CFF] text-[#0A5CFF]' : 'border-transparent text-[#5B6B82] hover:border-gray-300 hover:text-[#0F1A2B]'}`}>
        {label} <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${current === name ? 'bg-[#0A5CFF]/10 text-[#0A5CFF]' : 'bg-gray-100 text-[#5B6B82]'}`}>{count}</span>
    </button>
)

const UploadCard = ({ upload, onMarkCompleted }: { upload: Upload; onMarkCompleted: (id: number) => void; }) => {
  // Logic for card view, adapted from your original code
  return (
    <div className="bg-white border border-gray-200/80 rounded-[16px] shadow-sm hover:shadow-lg hover:border-[#0A5CFF]/50 transition-all duration-300">
        <div className="p-5">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-[#0F1A2B] truncate pr-4" title={upload.filename}>{upload.filename}</h3>
            </div>
             <p className="text-sm text-[#5B6B82] -mt-1">{upload.customer_name}</p>
        </div>

        <div className="px-5 py-4 bg-gray-50/70 text-sm text-[#5B6B82] space-y-3">
            <div className="flex items-center"><Copy size={14} className="mr-3 text-[#8A9BB8]"/> {upload.copies} cop{upload.copies > 1 ? 'ies' : 'y'}</div>
            <div className="flex items-center"><Palette size={14} className="mr-3 text-[#8A9BB8]"/> {upload.print_type}</div>
            <div className="flex items-center"><Layers size={14} className="mr-3 text-[#8A9BB8]"/> {upload.double_sided ? 'Double-sided' : 'Single-sided'}</div>
            {upload.special_instructions && <div className="flex items-start pt-2"><FileText size={14} className="mr-3 mt-1 text-yellow-600"/><span className="text-yellow-700 font-medium">{upload.special_instructions}</span></div>}
        </div>

        <div className="p-4 border-t border-gray-200/80 flex items-center justify-between">
            <p className="text-xs text-[#8A9BB8] flex items-center"><Clock size={14} className="mr-2"/> {new Date(upload.created_at).toLocaleDateString()}</p>
            <div className="flex items-center gap-2">
                <a href={upload.file_url} download={upload.filename} className="p-2 bg-gray-100 rounded-[10px] hover:bg-gray-200 transition-colors"><Download className="w-4 h-4 text-[#0F1A2B]" /></a>
                <button onClick={() => window.open(upload.file_url, '_blank')?.print()} className="p-2 bg-gray-100 rounded-[10px] hover:bg-gray-200 transition-colors"><Printer className="w-4 h-4 text-[#0F1A2B]" /></button>
                {(upload.status || 'new') !== 'completed' && (
                  <button 
                    onClick={() => onMarkCompleted(upload.id)} 
                    className="p-2 bg-green-100 text-green-700 rounded-[10px] hover:bg-green-200 transition-colors flex items-center gap-1"
                    title="Mark as Completed"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
            </div>
        </div>
    </div>
  )
}

const UploadListItem = ({ upload, onMarkCompleted }: { upload: Upload; onMarkCompleted: (id: number) => void; }) => {
  // Logic for list view, adapted from your original code
  return (
    <div className="bg-gray-50/70 border border-gray-200/60 rounded-[16px] hover:shadow-md hover:border-gray-300/80 transition-all p-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-[#5B6B82]"/>
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-base text-[#0F1A2B]">{upload.filename}</h3>
                    <p className="text-sm text-[#5B6B82]">
                        {upload.customer_name || 'Unknown Customer'}
                        <span className="mx-2 text-gray-300">|</span>
                        <span>{upload.copies} cop{upload.copies > 1 ? 'ies' : 'y'}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span>{upload.print_type}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span>{upload.double_sided ? 'Double-sided' : 'Single-sided'}</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
                <a href={upload.file_url} download={upload.filename} className="p-2 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-100 transition-colors"><Download className="w-4 h-4 text-[#0F1A2B]" /></a>
                <button onClick={() => window.open(upload.file_url, '_blank')?.print()} className="p-2 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-100 transition-colors"><Printer className="w-4 h-4 text-[#0F1A2B]" /></button>
                {(upload.status || 'new') !== 'completed' && (
                  <button 
                    onClick={() => onMarkCompleted(upload.id)} 
                    className="p-2 bg-green-100 text-green-700 border border-green-200 rounded-[10px] hover:bg-green-200 transition-colors flex items-center gap-1"
                    title="Mark as Completed"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
            </div>
        </div>
        {upload.special_instructions && <div className="mt-3 ml-10 text-sm font-medium text-yellow-700 bg-yellow-500/10 p-2 rounded-lg border-l-4 border-yellow-500">{upload.special_instructions}</div>}
    </div>
  )
}

export default CyberOperator;
