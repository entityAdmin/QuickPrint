import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Package, CheckCircle, CreditCard, PieChart, Calendar, Download } from 'lucide-react'

interface ReportData {
  totalJobs: number
  totalRevenue: number
  avgJobValue: number
  completedJobs: number
  revenueByDay: number[]
  printTypeDistribution: { bAndW: number; color: number }
  orderStatusBreakdown: { new: number; printed: number; processing: number; completed: number }
  paymentMethods: { mpesa: number; cash: number }
  bindingServices: { lamination: number; spiral: number; staples: number }
}

function ReportsAnalytics() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '16/10/2025', to: '16/11/2025' })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      // Fetch uploads data for the current shop
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('operator_user_id', user.id)
        .single()

      if (!shopData) return

      const { data: uploads, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('shop_id', shopData.id)
        .is('deleted_at', null)

      if (error) throw error

      // Calculate report data
      const totalJobs = uploads?.length || 0
      const totalRevenue = totalJobs * 100 // Mock calculation
      const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0
      const completedJobs = uploads?.filter(u => u.status === 'completed').length || 0

      // Mock revenue by day (last 7 days)
      const revenueByDay = [450, 720, 980, 820, 1200, 900, 600]

      // Mock distributions
      const printTypeDistribution = { bAndW: 55, color: 45 }
      const orderStatusBreakdown = {
        new: uploads?.filter(u => (u.status || 'new') === 'new').length || 0,
        printed: uploads?.filter(u => u.status === 'printed').length || 0,
        processing: uploads?.filter(u => u.status === 'printing').length || 0,
        completed: uploads?.filter(u => u.status === 'completed').length || 0
      }
      const paymentMethods = { mpesa: 33, cash: 67 }
      const bindingServices = { lamination: 33, spiral: 33, staples: 33 }

      setReportData({
        totalJobs,
        totalRevenue,
        avgJobValue,
        completedJobs,
        revenueByDay,
        printTypeDistribution,
        orderStatusBreakdown,
        paymentMethods,
        bindingServices
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    window.location.href = '/cyber-operator'
  }

  const handleExportReport = () => {
    // Mock export functionality
    alert('Report export feature coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Unable to load report data. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <button onClick={handleBackToDashboard} className="flex items-center text-blue-100 hover:text-white mr-6">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                <p className="text-blue-100 text-sm mt-1">Track your shop's performance and sales</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleExportReport} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Date Range Filter */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">Date Range</h2>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">Today</button>
              <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Last 7 Days</button>
              <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">This Month</button>
              <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Custom Range</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="relative">
                <input
                  type="text"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="relative">
                <input
                  type="text"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Jobs */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">6%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{reportData.totalJobs}</p>
            <p className="text-sm text-gray-500">from last period</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">12%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">KES {reportData.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">from last period</p>
          </div>

          {/* Average Job Value */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">8%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Avg. Job Value</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">KES {Math.round(reportData.avgJobValue)}</p>
            <p className="text-sm text-gray-500">from last period</p>
          </div>

          {/* Completed Jobs */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">{Math.round((reportData.completedJobs / reportData.totalJobs) * 100) || 0}%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Completed Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{reportData.completedJobs}</p>
            <p className="text-sm text-gray-500">completion rate</p>
          </div>
        </div>

        {/* Charts & Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Revenue Over Time Chart */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Revenue Over Time</h2>
                  <p className="text-gray-600">Last 7 days</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 text-blue-600 hover:text-blue-800">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="h-64 flex items-end space-x-4 mt-8">
                {reportData.revenueByDay.map((revenue, index) => {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  const maxRevenue = Math.max(...reportData.revenueByDay)
                  const height = (revenue / maxRevenue) * 100

                  return (
                    <div key={index} className="flex-1">
                      <div className="text-center text-xs text-gray-500 mb-2">{days[index]}</div>
                      <div
                        className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg relative"
                        style={{ height: `${height}%`, minHeight: '20px' }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900">
                          KES {revenue}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Y-axis Labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>KES 0</span>
                <span>KES {Math.round(Math.max(...reportData.revenueByDay) * 0.25)}</span>
                <span>KES {Math.round(Math.max(...reportData.revenueByDay) * 0.5)}</span>
                <span>KES {Math.round(Math.max(...reportData.revenueByDay) * 0.75)}</span>
                <span>KES {Math.max(...reportData.revenueByDay)}</span>
              </div>
            </div>

            {/* Print Type Distribution */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Print Type Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Black & White */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-800 rounded mr-3"></div>
                      <span className="font-medium text-gray-900">Black & White</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{reportData.printTypeDistribution.bAndW}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-800 rounded-full"
                      style={{ width: `${reportData.printTypeDistribution.bAndW}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Most popular for documents</p>
                </div>

                {/* Color */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded mr-3"></div>
                      <span className="font-medium text-gray-900">Colour</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{reportData.printTypeDistribution.color}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${reportData.printTypeDistribution.color}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Preferred for marketing materials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pie Charts & Breakdowns */}
          <div className="space-y-8">
            {/* Order Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center mb-6">
                <PieChart className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Order Status Breakdown</h2>
              </div>

              {/* Pie Chart Visualization */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-amber-500"
                  style={{
                    background: `conic-gradient(#3b82f6 0% ${((reportData.orderStatusBreakdown.new / reportData.totalJobs) * 100) || 0}%, #10b981 ${((reportData.orderStatusBreakdown.new / reportData.totalJobs) * 100) || 0}% ${(((reportData.orderStatusBreakdown.new + reportData.orderStatusBreakdown.printed) / reportData.totalJobs) * 100) || 0}%, #f59e0b ${(((reportData.orderStatusBreakdown.new + reportData.orderStatusBreakdown.printed) / reportData.totalJobs) * 100) || 0}% ${(((reportData.orderStatusBreakdown.new + reportData.orderStatusBreakdown.printed + reportData.orderStatusBreakdown.processing) / reportData.totalJobs) * 100) || 0}%, #8b5cf6 ${(((reportData.orderStatusBreakdown.new + reportData.orderStatusBreakdown.printed + reportData.orderStatusBreakdown.processing) / reportData.totalJobs) * 100) || 0}% 100%)`
                  }}
                ></div>
                <div className="absolute inset-8 rounded-full bg-white"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{reportData.totalJobs}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">New</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{Math.round((reportData.orderStatusBreakdown.new / reportData.totalJobs) * 100) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">Printed</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{Math.round((reportData.orderStatusBreakdown.printed / reportData.totalJobs) * 100) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-amber-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">Processing</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{Math.round((reportData.orderStatusBreakdown.processing / reportData.totalJobs) * 100) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                    <span className="font-medium text-gray-900">Completed</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{Math.round((reportData.orderStatusBreakdown.completed / reportData.totalJobs) * 100) || 0}%</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

              {/* M-PESA */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-green-600 font-bold">M</span>
                    </div>
                    <span className="font-medium text-gray-900">M-PESA</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{reportData.paymentMethods.mpesa}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                    style={{ width: `${reportData.paymentMethods.mpesa}%` }}
                  ></div>
                </div>
              </div>

              {/* Cash */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">Cash</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{reportData.paymentMethods.cash}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    style={{ width: `${reportData.paymentMethods.cash}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Popular Binding Services */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Binding Services</h2>

              <div className="space-y-6">
                {/* Lamination */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-amber-600 font-bold">🛡️</span>
                      </div>
                      <span className="font-medium text-gray-900">Lamination</span>
                    </div>
                    <span className="text-lg font-bold text-amber-600">{reportData.bindingServices.lamination}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${reportData.bindingServices.lamination}%` }}
                    ></div>
                  </div>
                </div>

                {/* Spiral */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-bold">🌀</span>
                      </div>
                      <span className="font-medium text-gray-900">Spiral</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{reportData.bindingServices.spiral}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${reportData.bindingServices.spiral}%` }}
                    ></div>
                  </div>
                </div>

                {/* Staples */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">📎</span>
                      </div>
                      <span className="font-medium text-gray-900">Staples</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{reportData.bindingServices.staples}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${reportData.bindingServices.staples}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Performance Summary</h3>
              <p className="text-blue-100">Overall growth: <span className="font-bold">+9%</span> compared to last period</p>
            </div>
            <button onClick={handleExportReport} className="mt-4 md:mt-0 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Download Full Report
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ReportsAnalytics