import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, FileText, CheckSquare, CreditCard, Download } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, XAxis, YAxis, CartesianGrid, Bar } from 'recharts';
import { supabase } from '../supabaseClient';

interface PieChartData { name: string; value: number; [key: string]: unknown; }
interface BarChartData { name: string; jobs: number; }

interface Upload {
  id: number;
  filename: string;
  customer_name?: string;
  customer_phone?: string;
  status?: string;
  created_at: string;
  copies: number;
  print_type: string;
  double_sided: boolean;
  paper_size: string;
  binding: string;
  payment_method?: string;
}

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  value: string | number;
  color: string;
}

function ReportsAnalytics() {
  const [totalJobs, setTotalJobs] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState<PieChartData[]>([]);
  const [dailyPerformance, setDailyPerformance] = useState<BarChartData[]>([]);
  const [printTypeDistribution, setPrintTypeDistribution] = useState<PieChartData[]>([]);
  const [paymentMethodDistribution, setPaymentMethodDistribution] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const exportToExcel = () => {
    // Create CSV content for Excel with actual upload data
    const headers = ['Date', 'Filename', 'Customer Name', 'Phone', 'Print Type', 'Copies', 'Paper Size', 'Double Sided', 'Binding', 'Payment Method', 'Status'];
    const csvContent = [
      headers.join(','),
      ...uploads.map(upload => [
        new Date(upload.created_at).toLocaleDateString(),
        `"${upload.filename}"`,
        `"${upload.customer_name || ''}"`,
        `"${upload.customer_phone || ''}"`,
        upload.print_type,
        upload.copies,
        upload.paper_size,
        upload.double_sided ? 'Yes' : 'No',
        upload.binding,
        upload.payment_method || '',
        upload.status || 'new'
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quickprint-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get current user to filter by their shop
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get shop ID and pricing for the current user
        const { data: shopData } = await supabase
          .from('shops')
          .select('id, price_bw, price_color, price_a3, discount_doublesided, price_staples, price_spiral, price_lamination')
          .eq('operator_user_id', user.id)
          .single();

        if (!shopData) return;

        const shopId = shopData.id;
        const pricing = {
          price_bw: shopData.price_bw || 10,
          price_color: shopData.price_color || 20,
          price_a3: shopData.price_a3 || 15,
          discount_doublesided: shopData.discount_doublesided || 50,
          price_staples: shopData.price_staples || 5,
          price_spiral: shopData.price_spiral || 20,
          price_lamination: shopData.price_lamination || 10
        };

        // Fetch all uploads for this shop
        const { data: uploads, error } = await supabase
          .from('uploads')
          .select('*')
          .eq('shop_id', shopId);

        if (error) {
          console.error('Error fetching uploads:', error);
          return;
        }

        setUploads(uploads);

        // Calculate total jobs
        setTotalJobs(uploads.length);

        // Calculate completed jobs
        const completedCount = uploads.filter(upload => upload.status === 'completed').length;
        setCompletedJobs(completedCount);

        // Calculate total revenue (only from completed jobs with actual pricing)
        const revenue = uploads
          .filter(upload => upload.status === 'completed')
          .reduce((total, upload) => {
            // Base price per page based on print type
            let basePrice = upload.print_type === 'Color' ? pricing.price_color : pricing.price_bw;

            // Adjust for paper size (A3 costs more)
            if (upload.paper_size === 'A3') {
              basePrice = pricing.price_a3;
            }

            // Adjust for double-sided (apply discount)
            if (upload.double_sided) {
              basePrice = basePrice * (1 - pricing.discount_doublesided / 100);
            }

            // Calculate cost for this upload
            let itemCost = basePrice * (upload.copies || 1);

            // Add binding costs
            if (upload.binding === 'Stapled') {
              itemCost += pricing.price_staples;
            } else if (upload.binding === 'Spiral') {
              itemCost += pricing.price_spiral;
            }

            return total + itemCost;
          }, 0);
        setTotalRevenue(Math.round(revenue));

        // Order status breakdown
        const statusCounts = uploads.reduce((acc, upload) => {
          acc[upload.status] = (acc[upload.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count as number
        }));
        setOrderStatusBreakdown(statusData);

        // Print type distribution
        const printTypeCounts = uploads.reduce((acc, upload) => {
          const type = upload.print_type === 'Color' ? 'Color' : 'B&W';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const printTypeData = Object.entries(printTypeCounts).map(([type, count]) => ({
          name: type,
          value: count as number
        }));
        setPrintTypeDistribution(printTypeData);

        // Payment method distribution
        const paymentCounts = uploads.reduce((acc, upload) => {
          const method = upload.payment_method || 'Not Specified';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const paymentData = Object.entries(paymentCounts).map(([method, count]) => ({
          name: method,
          value: count as number
        }));
        setPaymentMethodDistribution(paymentData);

        // Daily performance (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyCounts = uploads
          .filter(upload => new Date(upload.created_at) >= sevenDaysAgo)
          .reduce((acc, upload) => {
            const date = new Date(upload.created_at).toLocaleDateString('en-US', { weekday: 'short' });
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          name: day,
          jobs: dailyCounts[day] || 0
        }));
        setDailyPerformance(dailyData);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5CFF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF] font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <a href='/operator' className="flex items-center text-sm font-semibold text-[#0A5CFF] hover:text-[#0A5CFF]/80 transition-colors">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Dashboard
                </a>
            </div>
            <h1 className="text-lg font-semibold text-[#0F1A2B]">Reports & Analytics</h1>
            <div className="w-36"></div>{/* Spacer */}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#0F1A2B]">Today's Snapshot</h2>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={exportToExcel}
                    className="flex items-center space-x-2 bg-[#0A5CFF] text-white px-4 py-2 rounded-[12px] hover:bg-blue-700 transition-colors"
                >
                    <Download size={18} />
                    <span>Export to Excel</span>
                </button>
                <div className="flex items-center space-x-2 bg-white p-2 rounded-[12px] border border-gray-200/80">
                    <Calendar size={18} className="text-[#5B6B82]"/>
                    <span className="text-sm font-medium text-[#0F1A2B]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={FileText} title="Total Jobs" value={totalJobs} color="#0A5CFF" />
          <StatCard icon={CheckSquare} title="Completed Jobs" value={completedJobs} color="#22C55E" />
          <StatCard icon={DollarSign} title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} color="#0F1A2B" />
          <StatCard icon={CreditCard} title="Payment Methods" value={paymentMethodDistribution.length} color="#8B5CF6" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChartCard title="Daily Performance">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                    <XAxis dataKey="name" tick={{ fill: '#5B6B82', fontSize: 12 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#5B6B82', fontSize: 12 }} axisLine={false} tickLine={false}/>
                    <Tooltip cursor={{fill: 'rgba(10, 92, 255, 0.1)'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px'}}/>
                    <Bar dataKey="jobs" fill="#0A5CFF" barSize={20} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Order Status">
            <CustomPieChart data={orderStatusBreakdown} />
          </ChartCard>
          <ChartCard title="Print Types">
            <CustomPieChart data={printTypeDistribution} />
          </ChartCard>
          <ChartCard title="Payment Methods">
            <CustomPieChart data={paymentMethodDistribution} />
          </ChartCard>
        </div>

      </main>
    </div>
  );
}

const StatCard = ({ icon: Icon, title, value, color }: StatCardProps) => (
    <div className="bg-white p-6 rounded-[16px] shadow-[0_8px_30px_rgba(15,26,43,0.08)] flex items-center space-x-4 border-t-4" style={{ borderColor: color }}>
        <div className="p-3 rounded-[12px] bg-opacity-10" style={{ backgroundColor: `${color}1A`}}>
            <Icon size={24} style={{ color }} />
        </div>
        <div>
            <h3 className="text-sm font-medium text-[#5B6B82]">{title}</h3>
            <p className="text-2xl font-semibold text-[#0F1A2B] mt-1">{value}</p>
        </div>
    </div>
)

const ChartCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-[16px] shadow-[0_8px_30px_rgba(15,26,43,0.08)]">
        <h2 className="text-lg font-semibold text-[#0F1A2B] mb-4">{title}</h2>
        {children}
    </div>
)

const CustomPieChart = ({ data }: { data: PieChartData[] }) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie 
            data={data} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            innerRadius={60} 
            outerRadius={80} 
            fill="#8884d8" 
            paddingAngle={5}
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                if (midAngle === undefined || percent === undefined) return null;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                    </text>
                );
            }}
        >
          {data.map((_, index) => <Cell key={`cell-${index}`} fill={['#0A5CFF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'][index % 7]} />)}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize: "14px"}}/>
      </PieChart>
    </ResponsiveContainer>
)

export default ReportsAnalytics;
