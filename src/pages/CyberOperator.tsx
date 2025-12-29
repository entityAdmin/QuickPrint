import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';
import { Clipboard, QrCode, BarChart2, Settings, Clock, Download, Printer, Copy, Palette, Layers, FileText } from 'lucide-react';


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
  const [shopId, setShopId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTab, setSelectedTab] = useState<'new' | 'printing' | 'printed' | 'completed'>('new');
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
      setUploads(data || []);
    }
  };

  const generateQR = async (code: string) => {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
    const url = `${baseUrl}/?shop=${code}`;
    setQrUrl(url);
    if (qrCanvasRef.current) {
      await QRCode.toCanvas(qrCanvasRef.current, url, { width: 200, margin: 2 });
    }
  };

  const printDocument = (url: string) => {
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
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
    if (qrCanvasRef.current) {
      const link = document.createElement('a');
      link.download = `shop-${shopCode}-qr.png`;
      link.href = qrCanvasRef.current.toDataURL('image/png');
      link.click();
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateOrderStatus = async (uploadId: number, newStatus: string) => {
    const { error } = await supabase
      .from('uploads')
      .update({ status: newStatus })
      .eq('id', uploadId);

    if (error) {
      alert('Error updating order status.');
    } else {
      fetchUploads(shopId!);
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

  const getFilteredUploads = () => {
    return uploads.filter(upload => (upload.status || 'new') === selectedTab);
  };

  const getStats = () => {
    const newOrders = uploads.filter(u => (u.status || 'new') === 'new').length;
    const printing = uploads.filter(u => u.status === 'printing').length;
    const printed = uploads.filter(u => u.status === 'printed').length;
    const completed = uploads.filter(u => u.status === 'completed').length;
    const totalRevenue = uploads.reduce((acc, u) => acc + (u.copies * (u.print_type === 'Color' ? 20 : 10) * (u.double_sided ? 1.5 : 1)), 0)
    const pendingPayment = uploads.filter(u => (u.status || 'new') !== 'completed').reduce((acc, u) => acc + (u.copies * (u.print_type === 'Color' ? 20 : 10) * (u.double_sided ? 1.5 : 1)), 0)

    return { newOrders, printing, printed, completed, totalRevenue, pendingPayment };
  };

  const stats = getStats();
  const filteredUploads = getFilteredUploads();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-surface shadow-card sticky top-0 z-20">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-blue p-2 rounded-button">
                <Printer size={24} className="text-white"/>
            </div>
            <div>
                <h1 className="text-xl font-semibold text-text-primary tracking-tight leading-section">{shopName}</h1>
                <p className="text-sm text-text-muted">Shop Code: {shopCode}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
              <div className="flex items-center bg-primary-50 rounded-input pl-3">
                  <span className="text-sm text-text-secondary truncate">{qrUrl.replace('http://','').replace('https://','')}</span>
                  <button onClick={copyToClipboard} className="p-2 bg-primary-100 rounded-r-input hover:bg-primary-200 transition-colors ml-2">
                      <Clipboard className="w-4 h-4 text-primary-500"/>
                  </button>
              </div>
              <button onClick={downloadQR} className="px-4 py-2 bg-primary-50 rounded-button hover:bg-primary-100 transition-colors flex items-center text-sm font-medium text-primary-600">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
              </button>
              <Link to='/reports-analytics' className='p-2 bg-primary-50 rounded-button hover:bg-primary-100 transition-colors'><BarChart2 className='w-5 h-5 text-primary-500'/></Link>
              <Link to='/settings' className='p-2 bg-primary-50 rounded-button hover:bg-primary-100 transition-colors'><Settings className='w-5 h-5 text-primary-500'/></Link>
              <button onClick={handleLogout} className="px-4 py-2 bg-error text-white rounded-button hover:bg-red-600 transition-colors text-sm font-medium">Logout</button>
          </div>
        </div>
      </header>

      {copied && <div className="fixed top-20 right-6 bg-success text-white py-2 px-4 rounded-card shadow-card">Link Copied!</div>}

      <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm font-medium text-text-secondary leading-helper">New Orders</p>
            <p className="text-3xl font-semibold text-text-primary mt-2 leading-heading">{stats.newOrders}</p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm font-medium text-text-secondary leading-helper">In Progress</p>
            <p className="text-3xl font-semibold text-text-primary mt-2 leading-heading">{stats.printing}</p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm font-medium text-text-secondary leading-helper">Today's Revenue</p>
            <p className="text-3xl font-semibold text-success mt-2 leading-heading">KES {stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm font-medium text-text-secondary leading-helper">Pending Payment</p>
            <p className="text-3xl font-semibold text-error mt-2 leading-heading">KES {stats.pendingPayment.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card">
          <div className="p-6">
            <h2 className="text-xl font-medium text-text-primary leading-section">Order Queue</h2>
            <canvas ref={qrCanvasRef} className="hidden"></canvas>
          </div>

          <div className="px-6">
            <div className="flex space-x-2 bg-primary-50 p-1 rounded-input">
              <button onClick={() => setSelectedTab('new')} className={`flex-1 py-2 px-4 rounded-button font-medium text-sm transition-colors ${selectedTab === 'new' ? 'bg-primary-blue text-white shadow-card' : 'text-text-secondary hover:bg-surface'}`}>New ({stats.newOrders})</button>
              <button onClick={() => setSelectedTab('printing')} className={`flex-1 py-2 px-4 rounded-button font-medium text-sm transition-colors ${selectedTab === 'printing' ? 'bg-primary-blue text-white shadow-card' : 'text-text-secondary hover:bg-surface'}`}>Printing ({stats.printing})</button>
              <button onClick={() => setSelectedTab('printed')} className={`flex-1 py-2 px-4 rounded-button font-medium text-sm transition-colors ${selectedTab === 'printed' ? 'bg-primary-blue text-white shadow-card' : 'text-text-secondary hover:bg-surface'}`}>Printed ({stats.printed})</button>
              <button onClick={() => setSelectedTab('completed')} className={`flex-1 py-2 px-4 rounded-button font-medium text-sm transition-colors ${selectedTab === 'completed' ? 'bg-primary-blue text-white shadow-card' : 'text-text-secondary hover:bg-surface'}`}>Completed ({stats.completed})</button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {filteredUploads.map((upload) => (
              <div key={upload.id} className="bg-primary-50 border border-primary-200 rounded-card shadow-card hover:shadow-card transition-shadow p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg text-text-primary leading-section">{upload.customer_name || 'Unknown Customer'}</h3>
                    <p className="text-sm text-text-secondary leading-body">{upload.customer_phone}</p>
                    <p className="text-xs text-text-muted mt-1 flex items-center leading-helper"><Clock className="w-3 h-3 mr-1" />{new Date(upload.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a href={upload.file_url} download={upload.filename} className="p-2 bg-primary-100 rounded-button hover:bg-primary-200 transition-colors"><Download className="w-4 h-4 text-primary-500" /></a>
                    <button onClick={() => printDocument(upload.file_url)} className="p-2 bg-primary-100 rounded-button hover:bg-primary-200 transition-colors"><Printer className="w-4 h-4 text-primary-500" /></button>
                  </div>
                </div>

                <div className="border-t border-primary-200 pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                      <FileText className="h-5 w-5 text-primary-400"/>
                      <p className="font-medium text-text-primary">{upload.filename}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Copy className="h-4 w-4 text-secondary" />
                      <span className="text-text-secondary">{upload.copies} cop{upload.copies > 1 ? 'ies' : 'y'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Palette className="h-4 w-4 text-secondary" />
                      <span className="text-text-secondary">{upload.print_type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-secondary" />
                      <span className="text-text-secondary">{upload.double_sided ? 'Double-sided' : 'Single-sided'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-secondary" />
                      <span className="text-text-secondary">{upload.paper_size}</span>
                    </div>
                  </div>
                  {upload.special_instructions && (
                    <div className="mt-3">
                      <p className="text-sm text-error bg-red-50 p-2 rounded-card border-l-4 border-error">{upload.special_instructions}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-primary-200">
                  <div>
                    <p className="text-xl font-semibold text-primary-blue">KES {(upload.copies * (upload.print_type === 'Color' ? 20 : 10) * (upload.double_sided ? 1.5 : 1)).toFixed(2)}</p>
                    <p className="text-xs text-text-muted">{upload.payment_method || 'Cash'}</p>
                  </div>
                  <div className="flex space-x-2">
                    {(upload.status || 'new') === 'new' && (
                      <button onClick={() => updateOrderStatus(upload.id, 'printing')} className="px-3 py-2 bg-primary-blue text-white rounded-button text-sm font-medium hover:bg-primary-600 transition-colors">
                        Start Printing
                      </button>
                    )}
                    {upload.status === 'printing' && (
                      <button onClick={() => updateOrderStatus(upload.id, 'printed')} className="px-3 py-2 bg-success text-white rounded-button text-sm font-medium hover:bg-green-600 transition-colors">
                        Mark as Printed
                      </button>
                    )}
                    {upload.status === 'printed' && (
                      <button onClick={() => updateOrderStatus(upload.id, 'completed')} className="px-3 py-2 bg-purple-500 text-white rounded-button text-sm font-medium hover:bg-purple-600 transition-colors">
                        Mark as Completed
                      </button>
                    )}
                    <button onClick={() => handleDelete(upload.id)} className="px-3 py-2 bg-error text-white rounded-button text-sm font-medium hover:bg-red-600 transition-colors">
                      Cancel Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredUploads.length === 0 && <p className="text-center text-text-muted py-12">No orders in this category.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CyberOperator;
