import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EventTable, SchoolEvent } from "@/app/components/event-panel";
import { StatsOverview } from "@/app/components/stats-overview";
import { FeeStats } from "@/app/components/fee-stats";
import { StudentTable, Student } from "@/app/components/student-table";
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

/* -------------------- Component -------------------- */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentReceipts, setSentReceipts] = useState<ReceiptFeedback[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/students",
        );

        const data = await response.json();

        if (data.success) {
          // Transform backend data to match Student interface
          const formattedStudents = data.students.map((student: any) => ({
            id: student.studentId,
            name: `${student.userId.firstName} ${student.userId.lastName}`,
            grade: student.gradeLevel || "N/A",
            parentName: student.parentName || "N/A",
            parentContact: student.notificationContact || "",
            parentEmail: student.email || "",
            feeAmount: student.feeAmount || 0,
            feeStatus: student.feeStatus || "pending",
            dueDate: student.dueDate || "",
            type: student.type || "Tuition Fee",
            notificationMethod: student.notificationMethod || "email",
          }));

          setStudents(formattedStudents);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStudents();
  }, []);

  /* -------------------- Load Events from localStorage -------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("school_events");
    if (saved) {
      setEvents(JSON.parse(saved));
    }
  }, []);

  /* -------------------- Student Handlers -------------------- */
  const handleRecordPayment = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, feeStatus: "paid" } : s))
    );
    toast.success(`Payment recorded for ${student?.name}`);
  };

  const handleAddFee = (studentId: string, fee: Omit<Student, "id">) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              feeAmount: fee.feeAmount,
              dueDate: fee.dueDate,
              feeStatus: fee.feeStatus,
              type: fee.type || s.type,
            }
          : s
      )
    );
    toast.success("Fee added successfully");
  };

  const handleEditStudent = (
    studentId: string,
    updatedStudent: Omit<Student, "id">
  ) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updatedStudent } : s))
    );
    toast.success("Student updated successfully");
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    toast.success("Student deleted successfully");
  };

  /* -------------------- Notification Handler with Method -------------------- */
  const handleNotifyParent = (studentId: string, method: "sms" | "email") => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Validate contact info
    if (method === "sms" && !student.parentContact) {
      toast.error("Phone number not available for SMS");
      return;
    }
    if (method === "email" && !student.parentEmail) {
      toast.error("Email not available for email");
      return;
    }

    const methodText = method === "sms" ? "SMS" : "Email";
    const recipient =
      method === "sms" ? student.parentContact : student.parentEmail;

    const newNotification: Notification = {
      id: Date.now().toString(),
      recipient: recipient || "",
      message: `[${methodText}] Reminder: School fee payment for ${student.name} is ${student.feeStatus}. Amount: ₱${student.feeAmount}. Type: ${
        student.type || "Tuition Fee"
      }`,
      timestamp: new Date().toLocaleString(),
      status: "sent",
    };

    setNotifications((prev) => [newNotification, ...prev]);
    toast.success(
      `${methodText} notification sent to ${student.parentName}`
    );
  };

  const handleSendNotification = (recipient: string, message: string) => {
    setNotifications((prev) => [
      {
        id: Date.now().toString(),
        recipient,
        message,
        timestamp: new Date().toLocaleString(),
        status: "sent",
      },
      ...prev,
    ]);

    toast.success("Notification sent");
  };

  /* -------------------- Receipts Handlers -------------------- */
  const handleResendReceipt = (receiptId: string) => {
    const receipt = sentReceipts.find((r) => r.id === receiptId);
    if (receipt) {
      toast.success(`Receipt resent to ${receipt.sentTo}`);
    }
  };

  const handleAddManualReceipt = (
    receipt: Omit<ReceiptFeedback, "id" | "sentAt" | "status">
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

  /* -------------------- Event Handlers -------------------- */
  const handleAddEvent = (event: Omit<SchoolEvent, "id">) => {
    const newEvent = { ...event, id: Date.now().toString() };
    const updatedEvents = [newEvent, ...events];
    setEvents(updatedEvents);
    localStorage.setItem("school_events", JSON.stringify(updatedEvents));
    toast.success("New school event added");
  };

  const handleUpdateEvent = (updatedEvent: SchoolEvent) => {
    const updatedEvents = events.map((e) =>
      e.id === updatedEvent.id ? updatedEvent : e
    );
    setEvents(updatedEvents);
    localStorage.setItem("school_events", JSON.stringify(updatedEvents));
    toast.success("Event updated");
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = events.filter((e) => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem("school_events", JSON.stringify(updatedEvents));
    toast.success("Event deleted");
  };

  /* -------------------- Stats -------------------- */
  const totalStudents = students.length;
  const totalCollected = students
    .filter((s) => s.feeStatus === "paid")
    .reduce((sum, s) => sum + s.feeAmount, 0);
  const totalPending = students
    .filter((s) => s.feeStatus !== "paid")
    .reduce((sum, s) => sum + s.feeAmount, 0);

  /* -------------------- UI -------------------- */
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
        {/* Header */}
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

        {/* Stats Cards */}
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

        {/* Tabs */}
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

          {/* Students Tab */}
          <TabsContent value="students">

            <StudentTable
              students={students}
              onNotifyParent={handleNotifyParent}
              onRecordPayment={handleRecordPayment}
              onAddFee={handleAddFee}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
            />

          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <FeeStats />
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationPanel notifications={notifications} />
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <ReceiptFeedbackPanel
                receipts={sentReceipts}
                onResendReceipt={handleResendReceipt}
                onAddManualReceipt={handleAddManualReceipt}
              />
            </Card>
          </TabsContent>

          {/* Events Tab */}
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