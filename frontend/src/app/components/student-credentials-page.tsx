import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { PaymentReceiptDialog } from "@/app/components/payment-receipt-dialog";
import { useNavigate } from "react-router-dom"; // ← Add this
import {
  User,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Receipt,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StudentCredential {
  studentId: string;
  name: string;
  grade: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  enrollmentDate: string;
  feeAmount: number;
  feeStatus: "paid" | "pending" | "overdue";
  dueDate: string;
  paymentHistory: {
    id: string;
    date: string;
    amount: number;
    method: string;
    status: string;
  }[];
  manualPaymentNotes: string;
}

const sampleStudent: StudentCredential = {
  studentId: "STU-2024-001",
  name: "Emma Johnson",
  grade: "Grade 10",
  dateOfBirth: "2010-05-15",
  email: "emma.johnson@school.edu",
  phone: "+1 (555) 111-2222",
  parentName: "Michael Johnson",
  parentEmail: "michael.j@email.com",
  parentPhone: "+1 (555) 123-4567",
  enrollmentDate: "2024-09-01",
  feeAmount: 5000,
  feeStatus: "pending",
  dueDate: "2026-02-15",
  paymentHistory: [
    {
      id: "PAY-001",
      date: "2025-12-15",
      amount: 5000,
      method: "Bank Transfer",
      status: "Completed",
    },
    {
      id: "PAY-002",
      date: "2025-09-10",
      amount: 5000,
      method: "Cash",
      status: "Completed",
    },
  ],
  manualPaymentNotes: `Manual Payment Instructions:

1. Bank Transfer:
   Account Name: School Institution
   Account Number: 1234567890
   Routing Number: 987654321
   Reference: Student ID - STU-2024-001

2. Cash Payment:
   Visit the school office during business hours
   Office Hours: Monday - Friday, 9:00 AM - 4:00 PM
   Collect official receipt after payment

3. Check Payment:
   Make check payable to: School Institution
   Write student ID on the check memo
   Submit to the Finance Office

Please ensure to keep all payment receipts for your records.
For any payment-related queries, contact: finance@school.edu or call +1 (555) 999-8888`,
};

const allStudents: StudentCredential[] = [
  sampleStudent,
  {
    studentId: "STU-2024-002",
    name: "Liam Smith",
    grade: "Grade 9",
    dateOfBirth: "2011-03-22",
    email: "liam.smith@school.edu",
    phone: "+1 (555) 222-3333",
    parentName: "Sarah Smith",
    parentEmail: "sarah.smith@email.com",
    parentPhone: "+1 (555) 234-5678",
    enrollmentDate: "2024-09-01",
    feeAmount: 5000,
    feeStatus: "pending",
    dueDate: "2026-01-20",
    paymentHistory: [
      {
        id: "PAY-003",
        date: "2025-11-20",
        amount: 5000,
        method: "Credit Card",
        status: "Completed",
      },
    ],
    manualPaymentNotes: `Manual Payment Instructions:

1. Bank Transfer:
   Account Name: School Institution
   Account Number: 1234567890
   Routing Number: 987654321
   Reference: Student ID - STU-2024-002

2. Cash Payment:
   Visit the school office during business hours
   Office Hours: Monday - Friday, 9:00 AM - 4:00 PM
   Collect official receipt after payment

3. Check Payment:
   Make check payable to: School Institution
   Write student ID on the check memo
   Submit to the Finance Office

Please ensure to keep all payment receipts for your records.
For any payment-related queries, contact: finance@school.edu or call +1 (555) 999-8888`,
  },
  {
    studentId: "STU-2024-003",
    name: "Olivia Williams",
    grade: "Grade 11",
    dateOfBirth: "2009-07-18",
    email: "olivia.williams@school.edu",
    phone: "+1 (555) 333-4444",
    parentName: "David Williams",
    parentEmail: "david.w@email.com",
    parentPhone: "+1 (555) 345-6789",
    enrollmentDate: "2023-09-01",
    feeAmount: 5500,
    feeStatus: "overdue",
    dueDate: "2026-01-10",
    paymentHistory: [
      {
        id: "PAY-004",
        date: "2025-10-15",
        amount: 5500,
        method: "Bank Transfer",
        status: "Completed",
      },
    ],
    manualPaymentNotes: `Manual Payment Instructions:

1. Bank Transfer:
   Account Name: School Institution
   Account Number: 1234567890
   Routing Number: 987654321
   Reference: Student ID - STU-2024-003

2. Cash Payment:
   Visit the school office during business hours
   Office Hours: Monday - Friday, 9:00 AM - 4:00 PM
   Collect official receipt after payment

3. Check Payment:
   Make check payable to: School Institution
   Write student ID on the check memo
   Submit to the Finance Office

Please ensure to keep all payment receipts for your records.
For any payment-related queries, contact: finance@school.edu or call +1 (555) 999-8888`,
  },
];

export function StudentCredentialsPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentCredential>(sampleStudent);
  const [searchQuery, setSearchQuery] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    amount: number;
    date: string;
    method: string;
  } | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a student ID or name");
      return;
    }

    const foundStudent = allStudents.find(
      (s) =>
        s.studentId.toLowerCase() === searchQuery.toLowerCase() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (foundStudent) {
      setStudent(foundStudent);
      toast.success(`Student found: ${foundStudent.name}`);
    } else {
      toast.error("Student not found");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDownloadCredentials = () => {
    toast.success("Student credentials downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleSendReceipt = (
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
  ) => {
    setSelectedPayment({
      amount: paymentAmount,
      date: paymentDate,
      method: paymentMethod,
    });
    setShowReceiptDialog(true);
  };

  const handleReceiptSent = (method: "email" | "sms", contact: string) => {
    toast.success(`Receipt sent via ${method} to ${contact}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
      <PaymentReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        studentName={student.name}
        studentId={student.studentId}
        paymentAmount={selectedPayment?.amount || 0}
        paymentDate={selectedPayment?.date || ""}
        paymentMethod={selectedPayment?.method || ""}
        parentEmail={student.parentEmail}
        parentPhone={student.parentPhone}
        onReceiptSent={handleReceiptSent}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg">
                <GraduationCap className="w-10 h-10 text-[#0F2854]" />
              </div>
              <div>
                <h1 className="text-3xl text-white">Student Credentials</h1>
                <p className="text-[#BDE8F5]">
                  Personal Information & Payment Details
                </p>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => navigate("/admin")}
              >
                ← Back
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="p-4 bg-white/95 backdrop-blur-sm">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4988C4]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by Student ID or Name (e.g., STU-2024-001 or Emma Johnson)"
                  className="pl-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Available students: {allStudents.map((s) => s.name).join(", ")}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl text-[#0F2854]">Student Information</h2>
              </div>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4988C4] text-xs">Student ID</Label>
                  <p className="text-[#0F2854]">{student.studentId}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">Full Name</Label>
                  <p className="text-[#0F2854]">{student.name}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">Grade</Label>
                  <p className="text-[#0F2854]">{student.grade}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">
                    Date of Birth
                  </Label>
                  <p className="text-[#0F2854]">{student.dateOfBirth}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">Email</Label>
                  <p className="text-[#0F2854] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#4988C4]" />
                    {student.email}
                  </p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">Phone</Label>
                  <p className="text-[#0F2854] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#4988C4]" />
                    {student.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">
                    Enrollment Date
                  </Label>
                  <p className="text-[#0F2854] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#4988C4]" />
                    {student.enrollmentDate}
                  </p>
                </div>
              </div>
            </Card>

            {/* Parent/Guardian Information */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl text-[#0F2854]">
                  Parent/Guardian Information
                </h2>
              </div>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4988C4] text-xs">Parent Name</Label>
                  <p className="text-[#0F2854]">{student.parentName}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">Parent Email</Label>
                  <p className="text-[#0F2854] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#4988C4]" />
                    {student.parentEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs">Parent Phone</Label>
                  <p className="text-[#0F2854] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#4988C4]" />
                    {student.parentPhone}
                  </p>
                </div>
              </div>
            </Card>

            {/* Manual Payment Notes */}
            <Card className="p-6 bg-gradient-to-br from-[#BDE8F5]/20 to-white/95 backdrop-blur-sm border-2 border-[#4988C4]">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl text-[#0F2854]">
                  Manual Payment Instructions
                </h2>
              </div>
              <Separator className="mb-4" />

              <div className="bg-white/60 p-4 rounded-lg mb-4">
                <pre className="whitespace-pre-wrap text-sm text-[#0F2854] font-sans">
                  {student.manualPaymentNotes}
                </pre>
              </div>

              <div>
                <Label htmlFor="additionalNotes" className="text-[#0F2854]">
                  Additional Notes
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Add any additional payment notes or special instructions..."
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </div>
            </Card>
          </div>

          {/* Right Column - Fee Status & Payment History */}
          <div className="space-y-6">
            {/* Current Fee Status */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl text-[#0F2854]">Current Fee Status</h2>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-[#4988C4] text-xs">Fee Amount</Label>
                  <p className="text-2xl text-[#0F2854]">
                    ₱{student.feeAmount.toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[#4988C4] text-xs">Status</Label>
                  {getStatusBadge(student.feeStatus)}
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[#4988C4] text-xs">Due Date</Label>
                  <p className="text-[#0F2854]">{student.dueDate}</p>
                </div>
              </div>

              {student.feeStatus !== "paid" && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Payment is {student.feeStatus}. Please submit payment before
                    the due date.
                  </p>
                </div>
              )}
            </Card>

            {/* Payment History */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl text-[#0F2854]">Payment History</h2>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-3">
                {student.paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 bg-gradient-to-r from-[#BDE8F5]/20 to-transparent rounded-lg border border-[#BDE8F5]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-[#0F2854]">
                          {payment.method}
                        </p>
                        <p className="text-xs text-[#4988C4]">{payment.date}</p>
                      </div>
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-lg text-[#1C4D8D] mb-2">
                      ₱{payment.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        ID: {payment.id}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleSendReceipt(
                            payment.amount,
                            payment.date,
                            payment.method,
                          )
                        }
                        className="text-[#1C4D8D] hover:text-[#0F2854] hover:bg-[#BDE8F5]/20"
                      >
                        <Receipt className="w-3 h-3 mr-1" />
                        Send Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#BDE8F5]">
                <div className="flex justify-between items-center">
                  <Label className="text-[#4988C4]">Total Paid</Label>
                  <p className="text-xl text-green-600">
                    ₱
                    {student.paymentHistory
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white">
              <h3 className="mb-3">Need Help?</h3>
              <p className="text-sm text-[#BDE8F5] mb-4">
                Contact the school office for any payment-related questions.
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  finance@school.edu
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +63 917 1234567
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
