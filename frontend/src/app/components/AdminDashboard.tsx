import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EventTable, SchoolEvent } from "@/app/components/event-panel";
import { FeeStats } from "@/app/components/fee-stats";
import { StudentTable } from "@/app/components/student-table";
import {
  NotificationPanel,
  Notification,
} from "@/app/components/notification-panel";
import {
  ReceiptFeedbackPanel,
  ReceiptFeedback,
} from "@/app/components/receipt-feedback-panel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { GraduationCap, TrendingUp, AlertCircle, Bell } from "lucide-react";

type DashboardStudent = {
  student_id: string;
  fee_summary?: {
    paidAmount?: number;
    pendingAmount?: number;
    overdueAmount?: number;
  };
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentReceipts, setSentReceipts] = useState<ReceiptFeedback[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/students");
        const data = await response.json();
        if (data.success) {
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/events");
      const data = await response.json();

      if (response.ok && data.success) {
        const formatted = data.events.map((e: any) => {
          const dateObj = new Date(e.eventDateTime);
          return {
            id: e._id,
            title: e.title,
            description: e.description || "",
            location: e.location || "",
            date: dateObj.toISOString().split("T")[0],
            time: dateObj.toTimeString().slice(0, 5),
          };
        });

        setEvents(formatted);
      } else {
        toast.error(data?.message || "Failed to load events");
      }
    } catch (error) {
      toast.error("Failed to load events");
    }
  };

  const handleResendReceipt = (receiptId: string) => {
    const receipt = sentReceipts.find((r) => r.id === receiptId);
    if (receipt) {
      toast.success(`Receipt resent to ${receipt.sentTo}`);
    }
  };

  const handleAddManualReceipt = (
    receipt: Omit<ReceiptFeedback, "id" | "sentAt" | "status">,
  ) => {
    setSentReceipts((prev) => [
      {
        ...receipt,
        id: Date.now().toString(),
        sentAt: new Date().toLocaleString(),
        status: "sent",
      },
      ...prev,
    ]);
  };

  const handleAddEvent = async (event: Omit<SchoolEvent, "id">) => {
    try {
      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          location: event.location,
          eventDateTime: new Date(`${event.date}T${event.time}`),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data?.message || "Failed to add event");
        return false;
      }
      await fetchEvents();
      return true;
    } catch (error) {
      toast.error("Failed to add event");
      return false;
    }
  };

  const handleUpdateEvent = async (updatedEvent: SchoolEvent) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${updatedEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedEvent.title,
          description: updatedEvent.description,
          location: updatedEvent.location,
          eventDateTime: new Date(`${updatedEvent.date}T${updatedEvent.time}`),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data?.message || "Failed to update event");
        return false;
      }
      await fetchEvents();
      return true;
    } catch {
      toast.error("Failed to update event");
      return false;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data?.message || "Failed to delete event");
        return false;
      }
      await fetchEvents();
      return true;
    } catch {
      toast.error("Failed to delete event");
      return false;
    }
  };

  const totalStudents = students.length;
  const totalCollected = students.reduce(
    (sum, s) => sum + Number(s.fee_summary?.paidAmount || 0),
    0,
  );
  const totalPending = students.reduce(
    (sum, s) =>
      sum +
      Number(s.fee_summary?.pendingAmount || 0) +
      Number(s.fee_summary?.overdueAmount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-[#0F2854]" />
            </div>
            <div>
              <h1 className="text-3xl text-white font-bold">Admin Dashboard</h1>
              <p className="text-[#BDE8F5]">
                Student Fee Management & Notifications
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate("/admin/credentials")}
            >
              Student Credentials
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate("/login")}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                <p className="text-3xl font-bold text-[#0F2854]">{totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-[#1C4D8D]" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fees Collected</p>
                <p className="text-3xl font-bold text-green-600">
                  ₱{totalCollected.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Fees</p>
                <p className="text-3xl font-bold text-red-600">
                  ₱{totalPending.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notifications</p>
                <p className="text-3xl font-bold text-purple-600">
                  {notifications.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger
              value="students"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Students
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="receipts"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Receipts
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentTable />
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <FeeStats />
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationPanel notifications={notifications} />
          </TabsContent>

          <TabsContent value="receipts">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <ReceiptFeedbackPanel
                receipts={sentReceipts}
                onResendReceipt={handleResendReceipt}
                onAddManualReceipt={handleAddManualReceipt}
              />
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <EventTable
                events={events}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
