import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';
import { Clipboard, QrCode, BarChart2, Settings, Clock, Download, Printer, Copy, Palette, Layers, FileText, List, LayoutGrid, LogOut, CheckCircle } from 'lucide-react';

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
  const [selectedTab, setSelectedTab] = useState<'new' | 'completed'>('new');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'card' | 'list'>('card');

  const markAsCompleted = async (uploadId: number) => {
    try {
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
    if (qrCanvasRef.current) {
      const link = document.createElement('a');
      link.download = `shop-${shopCode}-qr.png`;
      link.href = qrCanvasRef.current.toDataURL('image/png');
      link.click();
    }
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
    };

    checkAuthAndLoad();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
  const filteredUploads = uploads.filter(upload => (upload.status || 'new') === selectedTab);

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
            <div className="bg-[#EBF2FF] p-2 rounded-[14px]">
                <Printer size={24} className="text-[#0A5CFF]"/>
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
              <Link to='/reports-analytics' className='p-2 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-colors'><BarChart2 className='w-5 h-5 text-[#0F1A2B]'/></Link>
              <Link to='/settings' className='p-2 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-colors'><Settings className='w-5 h-5 text-[#0F1A2B]'/></Link>
              <button onClick={handleLogout} className="p-2 bg-[#EF4444]/10 text-[#EF4444] rounded-[12px] hover:bg-[#EF4444]/20 transition-colors"><LogOut className='w-5 h-5'/></button>
          </div>
        </div>
      </header>

      {copied && 
        <div className="fixed top-20 right-6 bg-[#22C55E] text-white py-2 px-4 rounded-[12px] shadow-lg z-30 flex items-center space-x-2">
          <CheckCircle size={16}/>
          <span>Link Copied!</span>
        </div>
      }

      <main className="max-w-7xl mx-auto py-8 px-4">

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)]">
          <div className="p-6 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-semibold text-[#0F1A2B]">Order Queue</h2>
                <p className="text-sm text-[#5B6B82] mt-1">Manage all incoming print jobs.</p>
            </div>
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-[12px]">
                <button onClick={() => setView('list')} className={`p-2 rounded-[10px] transition-colors ${view === 'list' ? 'bg-white text-[#0A5CFF] shadow-sm' : 'text-[#5B6B82] hover:bg-white/60'}`}><List size={20}/></button>
                <button onClick={() => setView('card')} className={`p-2 rounded-[10px] transition-colors ${view === 'card' ? 'bg-white text-[#0A5CFF] shadow-sm' : 'text-[#5B6B82] hover:bg-white/60'}`}><LayoutGrid size={20}/></button>
            </div>
          </div>

          <div className="px-6 pb-2">
            <div className="flex border-b border-gray-200">
              <TabButton current={selectedTab} name="new" count={stats.new} label="New" onClick={setSelectedTab} />
              <TabButton current={selectedTab} name="completed" count={stats.completed} label="Completed" onClick={setSelectedTab} />
            </div>
          </div>

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
