import { Card } from "@/app/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

const monthlyData = [
  { month: 'Jan', collected: 45000, pending: 12000, overdue: 5000 },
  { month: 'Feb', collected: 52000, pending: 8000, overdue: 3000 },
  { month: 'Mar', collected: 48000, pending: 15000, overdue: 7000 },
  { month: 'Apr', collected: 55000, pending: 10000, overdue: 4000 },
  { month: 'May', collected: 58000, pending: 7000, overdue: 2000 },
  { month: 'Jun', collected: 50000, pending: 13000, overdue: 6000 },
];

const feeDistribution = [
  { name: 'Collected', value: 308000 },
  { name: 'Pending', value: 53000 },
  { name: 'Overdue', value: 27000 },
];

const feeTypeData = [
  { type: 'Tuition Fee', collected: 200000, pending: 35000, overdue: 18000 },
  { type: 'Library Fee', collected: 45000, pending: 8000, overdue: 5000 },
  { type: 'Activity Fee', collected: 63000, pending: 10000, overdue: 4000 },
];

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const CHART_COLORS = {
  collected: '#22c55e',
  pending: '#f59e0b',
  overdue: '#ef4444',
  line: '#3b82f6',
};

export function FeeStats() {
  // Calculate statistics
  const totalCollected = monthlyData.reduce((sum, item) => sum + item.collected, 0);
  const totalPending = monthlyData.reduce((sum, item) => sum + item.pending, 0);
  const totalOverdue = monthlyData.reduce((sum, item) => sum + item.overdue, 0);
  const totalAmount = totalCollected + totalPending + totalOverdue;
  const collectionRate = ((totalCollected / totalAmount) * 100).toFixed(1);

  // Calculate fee type totals
  const tuitionTotal = feeTypeData[0].collected;
  const libraryTotal = feeTypeData[1].collected;
  const activityTotal = feeTypeData[2].collected;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-transparent border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">₱{(totalCollected / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 mt-1">Collection Rate: {collectionRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-transparent border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Fees</p>
              <p className="text-2xl font-bold text-yellow-600">₱{(totalPending / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 mt-1">{((totalPending / totalAmount) * 100).toFixed(1)}% of Total</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-transparent border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue Fees</p>
              <p className="text-2xl font-bold text-red-600">₱{(totalOverdue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 mt-1">{((totalOverdue / totalAmount) * 100).toFixed(1)}% of Total</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-transparent border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">₱{(totalAmount / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 mt-1">All Months</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Fee Collection Chart */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Monthly Fee Collection</h3>
            <p className="text-xs text-gray-500 mt-1">Collected vs Pending fees by month</p>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="collected" fill={CHART_COLORS.collected} name="Collected" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill={CHART_COLORS.pending} name="Pending" radius={[8, 8, 0, 0]} />
              <Bar dataKey="overdue" fill={CHART_COLORS.overdue} name="Overdue" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Fee Collection Overview Pie Chart */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Overall Fee Distribution</h3>
            <p className="text-xs text-gray-500 mt-1">Total fees breakdown</p>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={feeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {feeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Fee Type Analysis */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Fee Type Analysis</h3>
            <p className="text-xs text-gray-500 mt-1">Revenue by fee type</p>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feeTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="type" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="collected" fill={CHART_COLORS.collected} name="Collected" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill={CHART_COLORS.pending} name="Pending" radius={[8, 8, 0, 0]} />
              <Bar dataKey="overdue" fill={CHART_COLORS.overdue} name="Overdue" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Collection Trend Line Chart */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Collection Trend</h3>
            <p className="text-xs text-gray-500 mt-1">Fee collection trend over time</p>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => `₱${value.toLocaleString()}`}
              />
              <Area 
                type="monotone" 
                dataKey="collected" 
                stroke={CHART_COLORS.collected} 
                fillOpacity={1} 
                fill="url(#colorCollected)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="p-6 bg-white/95 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#0F2854]">Fee Type Summary</h3>
          <p className="text-xs text-gray-500 mt-1">Detailed breakdown by fee type</p>
        </div>
        <Separator className="mb-4" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#BDE8F5]">
                <th className="text-left py-3 px-4 font-semibold text-[#0F2854]">Fee Type</th>
                <th className="text-right py-3 px-4 font-semibold text-green-600">Collected</th>
                <th className="text-right py-3 px-4 font-semibold text-yellow-600">Pending</th>
                <th className="text-right py-3 px-4 font-semibold text-red-600">Overdue</th>
                <th className="text-right py-3 px-4 font-semibold text-blue-600">Total</th>
                <th className="text-right py-3 px-4 font-semibold text-[#1C4D8D]">Collection %</th>
              </tr>
            </thead>
            <tbody>
              {feeTypeData.map((item, index) => {
                const total = item.collected + item.pending + item.overdue;
                const collectionPercent = ((item.collected / total) * 100).toFixed(1);
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-[#F5FAFB]' : 'bg-white'}>
                    <td className="py-3 px-4 text-[#0F2854] font-semibold">{item.type}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-semibold">₱{item.collected.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-yellow-600 font-semibold">₱{item.pending.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-red-600 font-semibold">₱{item.overdue.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-blue-600 font-semibold">₱{total.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">
                      <Badge className="bg-gradient-to-r from-green-400 to-green-500">
                        {collectionPercent}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}