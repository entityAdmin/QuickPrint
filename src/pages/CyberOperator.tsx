import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import QRCode from 'qrcode'
import { Printer, Clock, CheckCircle, Package, AlertCircle, DollarSign, FileText, User, Phone, CheckSquare, Square, Download, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Upload {
  id: number
  filename: string
  file_url: string
  customer_name?: string
  customer_phone?: string
  status?: string
  created_at: string
  expires_at: string
}

function CyberOperator() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [shopCode, setShopCode] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedTab, setSelectedTab] = useState<'new' | 'printing' | 'printed' | 'completed'>('new')
  const [loading, setLoading] = useState(true)

  const fetchUploads = async (id: string) => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('shop_id', id)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching uploads:', error)
    } else {
      setUploads(data || [])
    }
  }

  const generateQR = async (code: string) => {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173'
    const url = `${baseUrl}/?shop=${code}`
    setQrUrl(url)
    if (qrCanvasRef.current) {
      await QRCode.toCanvas(qrCanvasRef.current, url)
    }
  }

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        window.location.href = '/operator/login'
        return
      }

      // Get shop for this operator
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_code, shop_name')
        .eq('operator_user_id', user.id)
        .single()

      if (shopError || !shopData) {
        alert('No shop found for your account.')
        await supabase.auth.signOut()
        window.location.href = '/operator/login'
        return
      }

      setShopId(shopData.id)
      setShopCode(shopData.shop_code)
      fetchUploads(shopData.id)
      generateQR(shopData.shop_code)
      setLoading(false)
    }

    checkAuthAndLoad()
  }, [])

  const downloadQR = () => {
    if (qrCanvasRef.current) {
      const link = document.createElement('a')
      link.download = `shop-${shopCode}-qr.png`
      link.href = qrCanvasRef.current.toDataURL()
      link.click()
    }
  }

  const updateOrderStatus = async (uploadId: number, newStatus: string) => {
    const { error } = await supabase
      .from('uploads')
      .update({ status: newStatus })
      .eq('id', uploadId)

    if (error) {
      alert('Error updating order status.')
    } else {
      fetchUploads(shopId!) // Refresh
    }
  }

  const handleDelete = async (uploadId: number) => {
    if (window.confirm('Are you sure you want to delete this file? It will no longer be accessible.')) {
      const { error } = await supabase
        .from('uploads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', uploadId)

      if (error) {
        alert('Error deleting file.')
      } else {
        fetchUploads(shopId!) // Refresh
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/operator/login'
  }

  const getFilteredUploads = () => {
    return uploads.filter(upload => (upload.status || 'new') === selectedTab)
  }

  const getStats = () => {
    const newOrders = uploads.filter(u => (u.status || 'new') === 'new').length
    const printing = uploads.filter(u => u.status === 'printing').length
    const printed = uploads.filter(u => u.status === 'printed').length
    const completed = uploads.filter(u => u.status === 'completed').length
    const totalRevenue = uploads.length * 100 // Mock calculation
    const pendingPayment = uploads.filter(u => (u.status || 'new') !== 'completed').length * 100

    return { newOrders, printing, printed, completed, totalRevenue, pendingPayment }
  }

  const stats = getStats()
  const filteredUploads = getFilteredUploads()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight">Operator Dashboard</h1>
              <p className="text-blue-100 text-sm mt-1">Manage print orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full absolute -top-1 -right-1"></div>
                <button className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  Notifications
                </button>
              </div>
              <button onClick={downloadQR} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center">
                <QrCode className="w-4 h-4 mr-2" />
                Download QR
              </button>
              <Link to="/reports-analytics" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                Reports
              </Link>
              <button onClick={handleLogout} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                Logout
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold">OP</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.newOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-green-600 font-medium">Active orders</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.printing}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Printer className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-600">Currently printing</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">KES {stats.totalRevenue}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-green-600 font-medium">From completed orders</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Payment</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">KES {stats.pendingPayment}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-red-600 font-medium">{uploads.filter(u => (u.status || 'new') !== 'completed').length} orders unpaid</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Queue Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Queue</h2>

              {/* Queue Tabs */}
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTab('new')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${selectedTab === 'new' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-blue-600 mr-3" />
                    <span className={`font-semibold ${selectedTab === 'new' ? 'text-gray-900' : 'text-gray-700'}`}>New</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`font-bold mr-2 ${selectedTab === 'new' ? 'text-blue-600' : 'text-gray-600'}`}>{stats.newOrders}</span>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab('printing')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${selectedTab === 'printing' ? 'bg-amber-50 border-amber-200' : 'hover:bg-gray-50 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <Printer className="w-5 h-5 text-amber-600 mr-3" />
                    <span className={`font-medium ${selectedTab === 'printing' ? 'text-gray-900' : 'text-gray-700'}`}>Printing</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 ${selectedTab === 'printing' ? 'text-amber-600' : 'text-gray-600'}`}>{stats.printing}</span>
                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab('printed')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${selectedTab === 'printed' ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className={`font-medium ${selectedTab === 'printed' ? 'text-gray-900' : 'text-gray-700'}`}>Printed</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 ${selectedTab === 'printed' ? 'text-green-600' : 'text-gray-600'}`}>{stats.printed}</span>
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTab('completed')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${selectedTab === 'completed' ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-purple-600 mr-3" />
                    <span className={`font-medium ${selectedTab === 'completed' ? 'text-gray-900' : 'text-gray-700'}`}>Completed</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 ${selectedTab === 'completed' ? 'text-purple-600' : 'text-gray-600'}`}>{stats.completed}</span>
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                </button>
              </div>

              {/* QR Code Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Customer Access</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-center mb-4">
                    <canvas ref={qrCanvasRef} className="border border-gray-200 rounded-lg"></canvas>
                  </div>
                  <p className="text-xs text-gray-600 text-center mb-3">Shop Code: {shopCode}</p>
                  <p className="text-xs text-gray-500 text-center break-all">{qrUrl}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                    Add New Order
                  </button>
                  <button className="w-full py-3 bg-white text-blue-600 border border-blue-600 rounded-xl font-medium hover:bg-blue-50">
                    Manage Printers
                  </button>
                  <button onClick={() => window.location.href = '/reports-analytics'} className="w-full py-3 bg-white text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order List */}
          <div className="lg:col-span-2 space-y-6">
            {filteredUploads.map((upload) => (
              <div key={upload.id} className="bg-white rounded-2xl shadow-sm border p-6">
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${(upload.status || 'new') === 'new' ? 'bg-blue-100' : (upload.status || 'new') === 'printing' ? 'bg-amber-100' : (upload.status || 'new') === 'printed' ? 'bg-green-100' : 'bg-purple-100'}`}>
                        <User className={`w-5 h-5 ${(upload.status || 'new') === 'new' ? 'text-blue-600' : (upload.status || 'new') === 'printing' ? 'text-amber-600' : (upload.status || 'new') === 'printed' ? 'text-green-600' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{upload.customer_name || 'Unknown Customer'}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            <span>{upload.customer_phone || 'N/A'}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="font-mono">#{upload.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${(upload.status || 'new') === 'new' ? 'bg-blue-100' : (upload.status || 'new') === 'printing' ? 'bg-amber-100' : (upload.status || 'new') === 'printed' ? 'bg-green-100' : 'bg-purple-100'}`}>
                      <Clock className={`w-4 h-4 ${(upload.status || 'new') === 'new' ? 'text-blue-600' : (upload.status || 'new') === 'printing' ? 'text-amber-600' : (upload.status || 'new') === 'printed' ? 'text-green-600' : (upload.status || 'new') === 'purple-600'}`} />
                    </div>
                    <span className={`text-sm font-medium uppercase ${(upload.status || 'new') === 'new' ? 'text-blue-600' : (upload.status || 'new') === 'printing' ? 'text-amber-600' : (upload.status || 'new') === 'printed' ? 'text-green-600' : 'text-purple-600'}`}>
                      {upload.status || 'new'}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="mb-4">
                  <div className="flex items-start mb-3">
                    {(upload.status || 'new') === 'completed' ? (
                      <CheckSquare className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">1 file • 1 print</p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{upload.filename}</p>
                            <p className="text-sm text-gray-600">Uploaded • Ready to print</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">KES 100</p>
                  </div>
                  <div className="space-x-3">
                    {(upload.status || 'new') === 'new' && (
                      <button
                        onClick={() => updateOrderStatus(upload.id, 'printing')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                      >
                        Start Printing
                      </button>
                    )}
                    {upload.status === 'printing' && (
                      <button
                        onClick={() => updateOrderStatus(upload.id, 'printed')}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                      >
                        Mark as Printed
                      </button>
                    )}
                    {upload.status === 'printed' && (
                      <button
                        onClick={() => updateOrderStatus(upload.id, 'completed')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                      >
                        Mark Complete
                      </button>
                    )}
                    <button onClick={() => handleDelete(upload.id)} className="px-6 py-3 bg-white text-red-600 border border-red-600 rounded-xl font-semibold hover:bg-red-50">
                      Delete
                    </button>
                    <a href={upload.file_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-xl font-semibold hover:bg-blue-50 inline-block">
                      <Download className="w-4 h-4 inline mr-2" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {filteredUploads.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders in this category</h3>
                <p className="text-gray-600">Orders will appear here when they match this status.</p>
              </div>
            )}

            {/* Order Summary Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <p className="text-sm text-gray-600">Showing {filteredUploads.length} of {uploads.length} orders</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.newOrders} new orders pending</p>
                </div>
                <div className="space-x-3">
                  <button onClick={() => fetchUploads(shopId!)} className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
                    Refresh
                  </button>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                    Mark All as Seen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CyberOperator