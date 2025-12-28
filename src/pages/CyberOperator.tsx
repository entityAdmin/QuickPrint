import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';
import { Clock, QrCode, Settings, Clipboard, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

function CyberOperator() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [newJobs, setNewJobs] = useState<Upload[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Upload[]>([]);
  const [shopName, setShopName] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [shopId, setShopId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchUploads = async (id: string) => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('shop_id', id)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching uploads:', error);
    } else {
      const fetchedUploads = data || [];
      setUploads(fetchedUploads);
      setNewJobs(fetchedUploads.filter(u => (u.status || 'new') === 'new'));
      setCompletedJobs(fetchedUploads.filter(u => u.status === 'completed'));
    }
  };

  const generateQR = async (code: string) => {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
    const url = `${baseUrl}/?shop=${code}`;
    setQrUrl(url);
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
    setQrDataUrl(dataUrl);
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

      setShopId(shopData.id);
      setShopName(shopData.shop_name);
      setShopCode(shopData.shop_code);
      fetchUploads(shopData.id);
      generateQR(shopData.shop_code);
      setLoading(false);
    };

    checkAuthAndLoad();
  }, []);

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `shop-${shopCode}-qr.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateOrderStatus = async (uploadId: number) => {
    const { error } = await supabase
      .from('uploads')
      .update({ status: 'completed' })
      .eq('id', uploadId);

    if (error) {
      alert('Error updating order status.');
    } else {
      // Move from newJobs to completedJobs
      const jobToMove = newJobs.find(job => job.id === uploadId);
      if (jobToMove) {
        setNewJobs(prev => prev.filter(job => job.id !== uploadId));
        setCompletedJobs(prev => [{ ...jobToMove, status: 'completed' }, ...prev]);
      }
    }
  };

  const handleDelete = async (uploadId: number) => {
    if (window.confirm('Are you sure you want to delete this file? It will no longer be accessible.')) {
      const { error } = await supabase
        .from('uploads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', uploadId);

      if (error) {
        alert('Error deleting file.');
      } else {
        fetchUploads(shopId!);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/operator/login';
  };

  const getStats = () => {
    const newOrders = newJobs.length;
    const completedJobsCount = completedJobs.length;
    const totalRevenue = uploads.filter(u => u.status === 'completed').reduce((acc, u) => acc + (u.copies * (u.print_type === 'Color' ? 20 : 10) * (u.double_sided ? 1.5 : 1)), 0)
    const pendingPayment = newJobs.reduce((acc, u) => acc + (u.copies * (u.print_type === 'Color' ? 20 : 10) * (u.double_sided ? 1.5 : 1)), 0)

    return { newOrders, completedJobsCount, totalRevenue, pendingPayment };
  };

  const stats = getStats();

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
        <header style={{ background: 'linear-gradient(135deg, #0A5CFF 0%, #4DA3FF 100%)' }} className="text-white py-5 px-6 shadow-md">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0 text-center md:text-left">
                        <h1 className="text-3xl font-semibold tracking-tight">{shopName}</h1>
                        <p className="text-white/80 text-sm mt-1">Shop Code: {shopCode}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center bg-white/10 rounded-lg pl-3">
                            <span className="text-sm text-white/80 truncate">{qrUrl.replace('http://','').replace('https://','')}</span>
                            <button onClick={copyToClipboard} className="p-2 bg-white/20 rounded-r-lg hover:bg-white/30 transition-colors ml-2">
                                <Clipboard className="w-4 h-4"/>
                            </button>
                        </div>
                        <button onClick={downloadQR} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center">
                            <QrCode className="w-4 h-4 mr-2" />
                            QR
                        </button>
                        <Link to='/settings' className='p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors'><Settings className='w-5 h-5'/></Link>
                        <Link to='/printer-setup' className='p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors'><Printer className='w-5 h-5'/></Link>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors">Logout</button>
                    </div>
                </div>
            </div>
        </header>

        {copied && <div className="fixed top-24 right-6 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg">Link Copied!</div>}

      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-[rgba(15,26,43,0.08)]">
            <p className="text-sm font-medium text-[#5B6B82]">New Jobs</p>
            <p className="text-3xl font-semibold text-[#0F1A2B] mt-2">{stats.newOrders}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-[rgba(15,26,43,0.08)]">
            <p className="text-sm font-medium text-[#5B6B82]">Completed Jobs</p>
            <p className="text-3xl font-semibold text-[#0F1A2B] mt-2">{stats.completedJobsCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-[rgba(15,26,43,0.08)] border border-green-200">
            <p className="text-sm font-medium text-[#5B6B82]">Total Revenue</p>
            <p className="text-3xl font-semibold text-green-500 mt-2">KES {stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-[rgba(15,26,43,0.08)] border border-red-200">
            <p className="text-sm font-medium text-[#5B6B82]">Pending Payment</p>
            <p className="text-3xl font-semibold text-red-500 mt-2">KES {stats.pendingPayment.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[rgba(15,26,43,0.08)] mb-8">
          <div className="flex justify-center items-center mb-6">
            <h2 className="text-xl font-semibold text-[#0F1A2B]">New Jobs</h2>
          </div>

          <div className="space-y-6">
            {newJobs.map((upload) => (
              <div key={upload.id} className="border border-gray-200 rounded-xl p-6 shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-[#0F1A2B]">{upload.customer_name || 'Unknown Customer'}</h3>
                    <div className="flex items-center space-x-4 text-sm text-[#5B6B82] mt-1">
                      <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /><span>{new Date(upload.created_at).toLocaleTimeString()}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <a href={upload.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#0A5CFF] hover:underline">View Document</a>
                    <a href={upload.file_url} download className="text-sm font-medium text-[#0A5CFF] hover:underline">Download</a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center"><p className="text-[#0F1A2B]">{upload.filename}</p></div>
                  <p className="text-sm text-[#5B6B82] mt-1">Note: <span className="text-red-500">{upload.special_instructions || 'None'}</span></p>
                  <div className="flex justify-between items-center mt-4">
                    <p className="font-semibold text-lg text-[#0A5CFF]">KES {(upload.copies * (upload.print_type === 'Color' ? 20 : 10) * (upload.double_sided ? 1.5 : 1)).toFixed(2)}</p>
                    <div className="flex space-x-2">
                      <button onClick={() => updateOrderStatus(upload.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">Mark as Completed</button>
                      <button onClick={() => handleDelete(upload.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {newJobs.length === 0 && <p className="text-center text-[#5B6B82] py-12">No new jobs.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[rgba(15,26,43,0.08)]">
          <div className="flex justify-center items-center mb-6">
            <h2 className="text-xl font-semibold text-[#0F1A2B]">Completed Jobs</h2>
          </div>

          <div className="space-y-6">
            {completedJobs.map((upload) => (
              <div key={upload.id} className="border border-gray-200 rounded-xl p-6 shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-[#0F1A2B]">{upload.customer_name || 'Unknown Customer'}</h3>
                    <div className="flex items-center space-x-4 text-sm text-[#5B6B82] mt-1">
                      <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /><span>{new Date(upload.created_at).toLocaleTimeString()}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <a href={upload.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#0A5CFF] hover:underline">View Document</a>
                    <a href={upload.file_url} download className="text-sm font-medium text-[#0A5CFF] hover:underline">Download</a>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center"><p className="text-[#0F1A2B]">{upload.filename}</p></div>
                  <p className="text-sm text-[#5B6B82] mt-1">Note: <span className="text-red-500">{upload.special_instructions || 'None'}</span></p>
                  <div className="flex justify-between items-center mt-4">
                    <p className="font-semibold text-lg text-[#0A5CFF]">KES {(upload.copies * (upload.print_type === 'Color' ? 20 : 10) * (upload.double_sided ? 1.5 : 1)).toFixed(2)}</p>
                    <div className="flex space-x-2">
                      <button onClick={() => handleDelete(upload.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {completedJobs.length === 0 && <p className="text-center text-[#5B6B82] py-12">No completed jobs.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CyberOperator;
