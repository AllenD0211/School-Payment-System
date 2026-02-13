import { Card } from "@/app/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
  { month: 'Jan', collected: 45000, pending: 12000 },
  { month: 'Feb', collected: 52000, pending: 8000 },
  { month: 'Mar', collected: 48000, pending: 15000 },
  { month: 'Apr', collected: 55000, pending: 10000 },
  { month: 'May', collected: 58000, pending: 7000 },
  { month: 'Jun', collected: 50000, pending: 13000 },
];

const feeDistribution = [
  { name: 'Collected', value: 308000 },
  { name: 'Pending', value: 65000 },
];

const COLORS = ['#22c55e', '#ef4444'];

export function FeeStats() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="mb-4">Monthly Fee Collection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="collected" fill="#22c55e" name="Collected" />
            <Bar dataKey="pending" fill="#ef4444" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Fee Collection Overview</h3>
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
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
