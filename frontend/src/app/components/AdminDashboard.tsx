import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { StatsOverview } from "@/app/components/stats-overview";
import { FeeStats } from "@/app/components/fee-stats";
import { StudentTable, Student } from "@/app/components/student-table";
import { NotificationPanel, Notification } from "@/app/components/notification-panel";
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
import { toast } from "sonner";

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

  /* -------------------- Handlers -------------------- */

  const handleRecordPayment = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, feeStatus: "paid" } : s
      )
    );

    const student = students.find((s) => s.id === studentId);
    toast.success(`Payment recorded for ${student?.name}`);
  };

  const handleAddStudent = (student: Omit<Student, "id">) => {
    setStudents((prev) => [
      ...prev,
      { ...student, id: Date.now().toString() },
    ]);
  };

  const handleEditStudent = (
    studentId: string,
    updatedStudent: Omit<Student, "id">
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, ...updatedStudent } : s
      )
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
      message: `Reminder: School fee payment for ${student.name} is ${student.feeStatus}. Amount: $${student.feeAmount}`,
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl">Student Information System</h1>
            <p className="text-muted-foreground">
              Fee Collection & Parent Notification Dashboard
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/credentials")}
          >
            Student Credentials
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsOverview
        totalStudents={totalStudents}
        totalCollected={totalCollected}
        totalPending={totalPending}
        notificationsSent={notifications.length}
      />

      {/* Tabs */}
      <Tabs defaultValue="students" className="mt-6 space-y-6">
        <TabsList>
          <TabsTrigger value="students">Student Records</TabsTrigger>
          <TabsTrigger value="analytics">Fee Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="receipts">Receipt Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <StudentTable
            students={students}
            onNotifyParent={handleNotifyParent}
            onRecordPayment={handleRecordPayment}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <FeeStats />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPanel
            notifications={notifications}
            onSendNotification={handleSendNotification}
          />
        </TabsContent>

        <TabsContent value="receipts">
          <ReceiptFeedbackPanel
            receipts={sentReceipts}
            onResendReceipt={handleResendReceipt}
            onAddManualReceipt={handleAddManualReceipt}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
