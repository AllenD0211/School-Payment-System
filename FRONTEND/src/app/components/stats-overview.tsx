import { Card } from "@/app/components/ui/card";
import { Users, DollarSign, AlertTriangle, Bell, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsOverviewProps {
  totalStudents: number;
  totalCollected: number;
  totalPending: number;
  notificationsSent: number;
  previousCollected?: number;
  previousPending?: number;
  previousStudents?: number;
}

export function StatsOverview({
  totalStudents,
  totalCollected,
  totalPending,
  notificationsSent,
  previousCollected = 0,
  previousPending = 0,
  previousStudents = 0,
}: StatsOverviewProps) {
  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const collectedChange = calculateChange(totalCollected, previousCollected);
  const pendingChange = calculateChange(totalPending, previousPending);
  const studentsChange = calculateChange(totalStudents, previousStudents);

  const stats = [
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: studentsChange,
      changeType: studentsChange > 0 ? "increase" : "decrease",
      borderColor: "border-blue-200",
    },
    {
      title: "Fees Collected",
      value: `₱${totalCollected.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: collectedChange,
      changeType: collectedChange > 0 ? "increase" : "decrease",
      borderColor: "border-green-200",
    },
    {
      title: "Pending Fees",
      value: `₱${totalPending.toLocaleString()}`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: Math.abs(pendingChange),
      changeType: pendingChange < 0 ? "decrease" : "increase",
      borderColor: "border-red-200",
    },
    {
      title: "Notifications Sent",
      value: notificationsSent.toLocaleString(),
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: 0,
      changeType: "neutral",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all border-2 ${stat.borderColor}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#4988C4]">{stat.title}</h3>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>

          <div>
            <p className="text-3xl font-bold text-[#0F2854]">{stat.value}</p>

            {/* Change indicator */}
            {stat.change !== 0 && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                  stat.changeType === "increase"
                    ? "text-green-600"
                    : stat.changeType === "decrease"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {stat.changeType === "increase" ? (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    +{stat.change}%
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4" />
                    {stat.change}%
                  </>
                )}
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}