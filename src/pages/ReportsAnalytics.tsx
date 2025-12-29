import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// Define chart data interfaces
interface PieChartData extends Record<string, any> {
  name: string;
  value: number;
}

// Main component
function ReportsAnalytics() {
  const [totalJobs, setTotalJobs] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState<PieChartData[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PieChartData[]>([]);
  const [popularBindingServices, setPopularBindingServices] = useState<PieChartData[]>([]);
  const [printTypeDistribution, setPrintTypeDistribution] = useState<PieChartData[]>([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    // Mock data based on the previous design
    setTotalJobs(125);
    setCompletedJobs(145);

    const orderStatusData: PieChartData[] = [
      { name: 'New', value: 33 },
      { name: 'Printed', value: 17 },
      { name: 'Completed', value: 33 },
      { name: 'Other Printed', value: 17 },
    ];
    setOrderStatusBreakdown(orderStatusData);

    const paymentData: PieChartData[] = [
      { name: 'Cash', value: 67 },
      { name: 'M-PESA', value: 33 },
    ];
    setPaymentMethod(paymentData);

    const bindingData: PieChartData[] = [
      { name: 'Spiral', value: 33 },
      { name: 'Staples', value: 33 },
      { name: 'Lamination', value: 33 },
    ];
    setPopularBindingServices(bindingData);

    const printTypeData: PieChartData[] = [
      { name: 'B&W', value: 55 },
      { name: 'Colour', value: 45 },
    ];
    setPrintTypeDistribution(printTypeData);
  };

  const COLORS = {
    primary: '#0A5CFF',
    secondary: '#4DA3FF',
    success: '#22C55E',
    muted: '#8A9BB8',
    textPrimary: '#0F1A2B',
    textSecondary: '#5B6B82',
  };

  const chartColors = {
      order: [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.muted],
      payment: [COLORS.primary, COLORS.success],
      binding: [COLORS.primary, COLORS.secondary, COLORS.muted],
      print: [COLORS.textPrimary, COLORS.textSecondary],
  }

  const handleBackToDashboard = () => {
    window.location.href = '/cyber-operator';
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] font-sans" style={{ fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg, #0A5CFF 0%, #4DA3FF 100%)' }} className="py-5 px-6 shadow-md text-white">
        <div className="max-w-7xl mx-auto">
          <button onClick={handleBackToDashboard} className="flex items-center opacity-80 hover:opacity-100 transition-opacity">
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 px-2">
          <h1 className="text-3xl font-semibold text-[#0F1A2B]">Reports & Analytics</h1>
          <p className="text-[#5B6B82] mt-1">Track your shop's performance and sales</p>
        </div>

        <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)] mb-8">
            <h2 className="text-lg font-medium text-[#0F1A2B] mb-4">Date Range</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="from-date" className="block text-sm font-medium text-[#5B6B82] mb-1">From</label>
                    <input type="text" id="from-date" value="16/10/2025" readOnly className="w-full rounded-[12px] border-gray-300 bg-[#F5F9FF] py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="to-date" className="block text-sm font-medium text-[#5B6B82] mb-1">To</label>
                    <input type="text" id="to-date" value="16/11/2025" readOnly className="w-full rounded-[12px] border-gray-300 bg-[#F5F9FF] py-2 px-3" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)]">
            <h3 className="text-base font-medium text-[#5B6B82]">Total Jobs</h3>
            <p className="text-3xl font-semibold text-[#0F1A2B] mt-2">{totalJobs}</p>
          </div>
          <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)]">
            <h3 className="text-base font-medium text-[#5B6B82]">Completed Jobs</h3>
            <p className="text-3xl font-semibold text-[#0F1A2B] mt-2">{completedJobs}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)]">
            <h2 className="text-xl font-medium text-[#0F1A2B] mb-4">Order Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={orderStatusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill={COLORS.primary} label>
                  {orderStatusBreakdown.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors.order[index % chartColors.order.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)]">
            <h2 className="text-xl font-medium text-[#0F1A2B] mb-4">Payment Method</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill={COLORS.primary} label>
                  {paymentMethod.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors.payment[index % chartColors.payment.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)]">
                <h2 className="text-xl font-medium text-[#0F1A2B] mb-4">Popular Binding Services</h2>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={popularBindingServices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill={COLORS.primary} label>
                    {popularBindingServices.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors.binding[index % chartColors.binding.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_16px_rgba(15,26,43,0.08)]">
                <h2 className="text-xl font-medium text-[#0F1A2B] mb-4">Print Type Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={printTypeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill={COLORS.primary} label>
                    {printTypeDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors.print[index % chartColors.print.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

      </main>
    </div>
  );
}

export default ReportsAnalytics;
