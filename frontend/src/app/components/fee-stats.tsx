import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

type FeeStatus = "paid" | "pending" | "overdue";

type FeeRow = {
  fee_id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  status: FeeStatus;
  student: {
    student_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    gradeSection?: string;
  } | null;
};

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];
const CHART_COLORS = {
  collected: "#22c55e",
  pending: "#f59e0b",
  overdue: "#ef4444",
};

const toDateValue = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const monthLabel = (date: Date) =>
  date.toLocaleString("en-US", { month: "short" });

export function FeeStats() {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFees = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(apiUrl("/api/fees"));
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load fee analytics");
        }
        const rows = Array.isArray(data.fees) ? data.fees : [];
        setFees(
          rows.map((row: any) => ({
            fee_id: String(row.fee_id || row._id || ""),
            fee_type: String(row.fee_type || row.feeType || "Fee"),
            amount: Number(row.amount || 0),
            due_date: String(row.due_date || row.dueDate || ""),
            status: String(row.status || "pending").toLowerCase() as FeeStatus,
            student: row.student
              ? {
                  student_id: String(row.student.student_id || ""),
                  first_name: String(row.student.first_name || ""),
                  middle_name: String(row.student.middle_name || ""),
                  last_name: String(row.student.last_name || ""),
                  gradeSection: String(row.student.gradeSection || ""),
                }
              : null,
          })),
        );
      } catch (error: any) {
        toast.error(error?.message || "Failed to load fee analytics");
      } finally {
        setIsLoading(false);
      }
    };

    loadFees();
  }, []);

  const totalCollected = useMemo(
    () =>
      fees
        .filter((item) => item.status === "paid")
        .reduce((sum, item) => sum + item.amount, 0),
    [fees],
  );

  const totalPending = useMemo(
    () =>
      fees
        .filter((item) => item.status === "pending")
        .reduce((sum, item) => sum + item.amount, 0),
    [fees],
  );

  const totalOverdue = useMemo(
    () =>
      fees
        .filter((item) => item.status === "overdue")
        .reduce((sum, item) => sum + item.amount, 0),
    [fees],
  );

  const totalAmount = totalCollected + totalPending + totalOverdue;
  const collectionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;

  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }).map((_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        month: monthLabel(d),
        collected: 0,
        pending: 0,
        overdue: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    fees.forEach((fee) => {
      const dueDate = toDateValue(fee.due_date);
      if (!dueDate) return;
      const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;
      if (fee.status === "paid") bucket.collected += fee.amount;
      if (fee.status === "pending") bucket.pending += fee.amount;
      if (fee.status === "overdue") bucket.overdue += fee.amount;
    });

    return buckets;
  }, [fees]);

  const feeDistribution = useMemo(
    () => [
      { name: "Collected", value: totalCollected },
      { name: "Pending", value: totalPending },
      { name: "Overdue", value: totalOverdue },
    ],
    [totalCollected, totalPending, totalOverdue],
  );

  const feeTypeData = useMemo(() => {
    const map = new Map<
      string,
      { type: string; collected: number; pending: number; overdue: number }
    >();

    fees.forEach((fee) => {
      const key = fee.fee_type || "Fee";
      const current = map.get(key) || {
        type: key,
        collected: 0,
        pending: 0,
        overdue: 0,
      };

      if (fee.status === "paid") current.collected += fee.amount;
      if (fee.status === "pending") current.pending += fee.amount;
      if (fee.status === "overdue") current.overdue += fee.amount;
      map.set(key, current);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        b.collected + b.pending + b.overdue - (a.collected + a.pending + a.overdue),
    );
  }, [fees]);

  const feeRows = useMemo(
    () =>
      [...fees]
        .sort((a, b) => {
          const aDate = toDateValue(a.due_date)?.getTime() || 0;
          const bDate = toDateValue(b.due_date)?.getTime() || 0;
          return bDate - aDate;
        })
        .slice(0, 20),
    [fees],
  );

  const statusBadge = (status: FeeStatus) => {
    if (status === "paid") return <Badge className="bg-green-600">Paid</Badge>;
    if (status === "overdue") return <Badge className="bg-red-600">Overdue</Badge>;
    return <Badge className="bg-yellow-500">Pending</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-white/95 backdrop-blur-sm">
        <p className="text-[#0F2854] font-semibold">Loading fee analytics...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-transparent border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">
                ₱{totalCollected.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Collection Rate: {collectionRate.toFixed(1)}%
              </p>
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
              <p className="text-2xl font-bold text-yellow-600">
                ₱{totalPending.toLocaleString()}
              </p>
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
              <p className="text-2xl font-bold text-red-600">
                ₱{totalOverdue.toLocaleString()}
              </p>
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
              <p className="text-2xl font-bold text-blue-600">
                ₱{totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Monthly Fee Collection</h3>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="collected" fill={CHART_COLORS.collected} name="Collected" />
              <Bar dataKey="pending" fill={CHART_COLORS.pending} name="Pending" />
              <Bar dataKey="overdue" fill={CHART_COLORS.overdue} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Overall Fee Distribution</h3>
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
                dataKey="value"
              >
                {feeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Fee Type Analysis</h3>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feeTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="collected" fill={CHART_COLORS.collected} name="Collected" />
              <Bar dataKey="pending" fill={CHART_COLORS.pending} name="Pending" />
              <Bar dataKey="overdue" fill={CHART_COLORS.overdue} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#0F2854]">Collection Trend</h3>
          </div>
          <Separator className="mb-4" />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
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

      <Card className="p-6 bg-white/95 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#0F2854]">Student Fee Records</h3>
          <p className="text-xs text-gray-500 mt-1">Live data from MongoDB</p>
        </div>
        <Separator className="mb-4" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#BDE8F5]">
                <th className="text-left py-3 px-4 font-semibold text-[#0F2854]">Student ID</th>
                <th className="text-left py-3 px-4 font-semibold text-[#0F2854]">Student Name</th>
                <th className="text-left py-3 px-4 font-semibold text-[#0F2854]">Fee Type</th>
                <th className="text-right py-3 px-4 font-semibold text-blue-600">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-[#0F2854]">Due Date</th>
                <th className="text-left py-3 px-4 font-semibold text-[#0F2854]">Status</th>
              </tr>
            </thead>
            <tbody>
              {feeRows.length === 0 && (
                <tr>
                  <td className="py-4 px-4 text-center text-gray-500" colSpan={6}>
                    No fee records available
                  </td>
                </tr>
              )}
              {feeRows.map((item, index) => {
                const studentName = item.student
                  ? [item.student.first_name, item.student.middle_name, item.student.last_name]
                      .filter(Boolean)
                      .join(" ")
                  : "Unlinked Student";
                return (
                  <tr key={item.fee_id} className={index % 2 === 0 ? "bg-[#F5FAFB]" : "bg-white"}>
                    <td className="py-3 px-4 text-[#0F2854]">{item.student?.student_id || "-"}</td>
                    <td className="py-3 px-4 text-[#0F2854]">{studentName}</td>
                    <td className="py-3 px-4 text-[#0F2854]">{item.fee_type}</td>
                    <td className="text-right py-3 px-4 text-blue-600 font-semibold">
                      ₱{item.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#0F2854]">
                      {toDateValue(item.due_date)?.toISOString().split("T")[0] || "-"}
                    </td>
                    <td className="py-3 px-4">{statusBadge(item.status)}</td>
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
