import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, FileText, CheckSquare, Layers, Palette } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, XAxis, YAxis, CartesianGrid, Bar } from 'recharts';

interface PieChartData { name: string; value: number; }
interface BarChartData { name: string; jobs: number; }

function ReportsAnalytics() {
  const [totalJobs, setTotalJobs] = useState(158);
  const [totalRevenue, setTotalRevenue] = useState(12450);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState<PieChartData[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PieChartData[]>([]);
  const [dailyPerformance, setDailyPerformance] = useState<BarChartData[]>([]);
  const [printTypeDistribution, setPrintTypeDistribution] = useState<PieChartData[]>([]);

  useEffect(() => {
    setOrderStatusBreakdown([
      { name: 'New', value: 33 },
      { name: 'Printing', value: 17 },
      { name: 'Printed', value: 33 },
      { name: 'Completed', value: 17 },
    ]);

    setPaymentMethod([
      { name: 'Cash', value: 67 },
      { name: 'M-PESA', value: 33 },
    ]);

    setPrintTypeDistribution([
      { name: 'B&W', value: 55 },
      { name: 'Color', value: 45 },
    ]);

    setDailyPerformance([
        { name: 'Mon', jobs: 20 },
        { name: 'Tue', jobs: 35 },
        { name: 'Wed', jobs: 40 },
        { name: 'Thu', jobs: 28 },
        { name: 'Fri', jobs: 50 },
        { name: 'Sat', jobs: 15 },
        { name: 'Sun', jobs: 5 },
    ]);
  }, []);

  const COLORS = ['#0A5CFF', '#4DA3FF', '#22C55E', '#8A9BB8', '#F59E0B'];

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
            <div className="flex items-center space-x-2 bg-white p-2 rounded-[12px] border border-gray-200/80">
                <Calendar size={18} className="text-[#5B6B82]"/>
                <span className="text-sm font-medium text-[#0F1A2B]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={FileText} title="Total Jobs" value={totalJobs} color="#0A5CFF" />
          <StatCard icon={CheckSquare} title="Completed Jobs" value={145} color="#22C55E" />
          <StatCard icon={DollarSign} title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} color="#0F1A2B" />
          <StatCard icon={Layers} title="Pending Orders" value={totalJobs - 145} color="#F59E0B" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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
        </div>

      </main>
    </div>
  );
}

const StatCard = ({ icon: Icon, title, value, color } : any) => (
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
          {data.map((_, index) => <Cell key={`cell-${index}`} fill={['#0A5CFF', '#4DA3FF', '#22C55E', '#8A9BB8'][index % 4]} />)}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize: "14px"}}/>
      </PieChart>
    </ResponsiveContainer>
)

export default ReportsAnalytics;
