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
import { GraduationCap } from "lucide-react";

/* -------------------- Initial Data -------------------- */
const initialStudents: Student[] = [
  {
    id: "1",
    name: "Emma Johnson",
    grade: "Grade 10",
    parentName: "Michael Johnson",
    parentContact: "+1 (555) 123-4567",
    feeAmount: 5000,
    feeStatus: "paid",
    dueDate: "2026-01-15",
  },
  {
    id: "2",
    name: "Liam Smith",
    grade: "Grade 9",
    parentName: "Sarah Smith",
    parentContact: "+1 (555) 234-5678",
    feeAmount: 5000,
    feeStatus: "pending",
    dueDate: "2026-01-20",
  },
];

/* -------------------- Component -------------------- */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentReceipts, setSentReceipts] = useState<ReceiptFeedback[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  /* -------------------- Load Events from localStorage -------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("school_events");
    if (saved) {
      setEvents(JSON.parse(saved));
    }
  }, []);

  /* -------------------- Student Handlers -------------------- */
  const handleRecordPayment = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, feeStatus: "paid" } : s))
    );
    const student = students.find((s) => s.id === studentId);
    toast.success(`Payment recorded for ${student?.name}`);
  };

  const handleAddStudent = (student: Omit<Student, "id">) => {
    setStudents((prev) => [...prev, { ...student, id: Date.now().toString() }]);
  };

  const handleEditStudent = (
    studentId: string,
    updatedStudent: Omit<Student, "id">
  ) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updatedStudent } : s))
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleNotifyParent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const newNotification: Notification = {
      id: Date.now().toString(),
      recipient: student.parentContact,
      message: `Reminder: School fee payment for ${student.name} is ${student.feeStatus}. Amount: ₱${student.feeAmount}`,
      timestamp: new Date().toLocaleString(),
      status: "sent",
    };

    setNotifications((prev) => [newNotification, ...prev]);
    toast.success(`Notification sent to ${student.parentName}`);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-[#0F2854]" />
            </div>
            <div>
              <h1 className="text-3xl text-white">Admin Dashboard</h1>
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
          <Card className="p-6 bg-white">
            <div>
              <p>Total Students</p>
              <p className="text-3xl">{totalStudents}</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div>
              <p>Fees Collected</p>
              <p className="text-3xl text-green-600">
                ₱{totalCollected.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div>
              <p>Pending Fees</p>
              <p className="text-3xl text-red-600">
                ₱{totalPending.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div>
              <p>Notifications</p>
              <p className="text-3xl text-purple-600">{notifications.length}</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card bg="white/95" className="p-6 backdrop-blur-sm">
              <StudentTable
                students={students}
                onNotifyParent={handleNotifyParent}
                onRecordPayment={handleRecordPayment}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card bg="white/95" className="p-6 backdrop-blur-sm">
              <FeeStats />
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card bg="white/95" className="p-6 backdrop-blur-sm">
              <NotificationPanel
                notifications={notifications}
                onSendNotification={handleSendNotification}
              />
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts">
            <Card bg="white/95" className="p-6 backdrop-blur-sm">
              <ReceiptFeedbackPanel
                receipts={sentReceipts}
                onResendReceipt={handleResendReceipt}
                onAddManualReceipt={handleAddManualReceipt}
              />
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card bg="white/95" className="p-6 backdrop-blur-sm">
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

/* -------------------- Reusable Card -------------------- */
function Card({
  children,
  className,
  bg = "white",
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
}) {
  return <div className={`rounded-xl shadow-lg ${bg} ${className}`}>{children}</div>;
}