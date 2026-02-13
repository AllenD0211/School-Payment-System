import { Card } from "@/app/components/ui/card";
import { Users, DollarSign, AlertTriangle, Bell } from "lucide-react";

interface StatsOverviewProps {
  totalStudents: number;
  totalCollected: number;
  totalPending: number;
  notificationsSent: number;
}

export function StatsOverview({ totalStudents, totalCollected, totalPending, notificationsSent }: StatsOverviewProps) {
  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Fees Collected",
      value: `$${totalCollected.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Fees",
      value: `$${totalPending.toLocaleString()}`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Notifications Sent",
      value: notificationsSent,
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
