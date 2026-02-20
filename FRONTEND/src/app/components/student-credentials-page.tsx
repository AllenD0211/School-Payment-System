import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { PaymentReceiptDialog } from "@/app/components/payment-receipt-dialog";
import { useNavigate } from "react-router-dom";
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
  Receipt,
  Search,
  Copy,
  ArrowLeft,
  Smartphone,
  MapPin,
  Clock,
  Building2,
  CreditCard,
  Banknote,
  BookOpen,
  Send,
  Edit,
  Printer,
  Download,
  Loader,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  },
];

export function StudentCredentialsPage() {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [student, setStudent] = useState<StudentCredential>(sampleStudent);
  const [searchQuery, setSearchQuery] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showSendNotesDialog, setShowSendNotesDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    amount: number;
    date: string;
    method: string;
  } | null>(null);
  const [editedPaymentInstructions, setEditedPaymentInstructions] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "image">("pdf");

  const defaultPaymentInstructions = `BANK TRANSFER
Account Name: School Institution
Account Number: 1234-567-890
Routing Number: 987-654-321
Bank Name: National Bank Corporation
Reference: ${student.studentId}

CASH PAYMENT
Location: Main Building, Ground Floor
Hours: Monday - Friday, 9:00 AM - 4:00 PM
Bring: Student ID ${student.studentId}

CHECK PAYMENT
Make Payable To: School Institution
Memo: ${student.studentId}
Submit To: Finance Office, Main Building, Ground Floor
Processing: 3-5 business days

MOBILE PAYMENT
GCash: +63 917 1234 567
PayMaya: +63 917 5678 901
Reference: ${student.studentId}

IMPORTANT NOTES
• Payment Deadline: ${student.dueDate}
• Late Payment Penalty: 5% per month
• Keep all payment receipts
• Contact: finance@school.edu`;

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
      setAdditionalNotes("");
      setEditedPaymentInstructions("");
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

  const handleCopyStudentId = () => {
    navigator.clipboard.writeText(student.studentId);
    toast.success("Student ID copied to clipboard!");
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

  const handleSendAdditionalNotes = () => {
    if (!additionalNotes.trim()) {
      toast.error("Please enter additional notes before sending");
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      const recipientEmail =
        sendMethod === "email" ? student.parentEmail : student.parentPhone;
      toast.success(
        `Additional notes sent via ${sendMethod === "email" ? "Email" : "SMS"} to ${recipientEmail}`
      );
      setIsSending(false);
      setShowSendNotesDialog(false);
      setAdditionalNotes("");
    }, 1500);
  };

  const handleSavePaymentInstructions = () => {
    if (!editedPaymentInstructions.trim()) {
      toast.error("Please enter payment instructions");
      return;
    }

    toast.success("Payment instructions updated successfully!");
    setShowEditPaymentDialog(false);
  };

  const handleResetPaymentInstructions = () => {
    setEditedPaymentInstructions("");
    toast.info("Payment instructions reset to default");
  };

  const handlePrint = () => {
    if (!contentRef.current) {
      toast.error("Unable to access content");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    const content = contentRef.current.innerHTML;
    const styles = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 20px;
          line-height: 1.6;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0F2854;
          padding-bottom: 15px;
        }
        .print-header h1 {
          margin: 0;
          color: #0F2854;
          font-size: 24px;
        }
        .print-header p {
          margin: 5px 0;
          color: #4988C4;
          font-size: 14px;
        }
        .grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          color: #0F2854;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #BDE8F5;
          padding-bottom: 5px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .info-label {
          color: #4988C4;
          font-weight: bold;
        }
        .info-value {
          color: #0F2854;
        }
        .payment-method {
          background-color: #f5f5f5;
          border-left: 4px solid #1C4D8D;
          padding: 10px;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          background-color: #4988C4;
        }
        .badge.paid {
          background-color: #22c55e;
        }
        .badge.pending {
          background-color: #eab308;
          color: #333;
        }
        .badge.overdue {
          background-color: #ef4444;
        }
        .total-box {
          background-color: #f0f9ff;
          border: 1px solid #4988C4;
          padding: 12px;
          border-radius: 6px;
          font-weight: bold;
          color: #0F2854;
        }
        @media print {
          body {
            margin: 0;
            padding: 10mm;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    `;

    const header = `
      <div class="print-header">
        <h1>GREENFIELD PUBLIC SCHOOL</h1>
        <p>Student Credentials Report</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Student Credentials - ${student.name}</title>
        ${styles}
      </head>
      <body>
        ${header}
        ${content}
        <script>
          window.print();
          window.onafterprint = () => window.close();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();

    toast.success("Print preview opened");
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      toast.error("Unable to access content");
      return;
    }

    setIsExporting(true);
    try {
      // Create canvas from HTML
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Calculate dimensions for PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF, handling multiple pages if needed
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Student_Credentials_${student.studentId}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadScreenshot = async () => {
    if (!contentRef.current) {
      toast.error("Unable to access content");
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Student_Credentials_${student.studentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Screenshot downloaded successfully!");
    } catch (error) {
      console.error("Error generating screenshot:", error);
      toast.error("Failed to generate screenshot");
    } finally {
      setIsExporting(false);
    }
  };

  const totalPaid = student.paymentHistory.reduce((sum, p) => sum + p.amount, 0);

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

      {/* Payment Receipt Dialog */}
      <PaymentReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        studentName={student.name}
        studentId={student.studentId}
        paymentAmount={selectedPayment?.amount || 0}
        paymentDate={selectedPayment?.date || ""}
        paymentMethod={selectedPayment?.method || ""}
        paymentType="Tuition Fee"
        parentEmail={student.parentEmail}
        parentPhone={student.parentPhone}
        parentName={student.parentName}
        onReceiptSent={handleReceiptSent}
      />

      {/* Edit Payment Instructions Dialog */}
      <Dialog open={showEditPaymentDialog} onOpenChange={setShowEditPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F2854]">
              <Edit className="w-5 h-5" />
              Edit Payment Instructions
            </DialogTitle>
            <DialogDescription>
              Customize payment instructions for student {student.studentId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-[#0F2854] font-semibold mb-2 block">
                Payment Instructions
              </Label>
              <Textarea
                value={editedPaymentInstructions || defaultPaymentInstructions}
                onChange={(e) => setEditedPaymentInstructions(e.target.value)}
                rows={15}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {(editedPaymentInstructions || defaultPaymentInstructions).length}/2000 characters
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can include any custom information relevant to this student's payment process.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleResetPaymentInstructions}
              className="border-[#4988C4] text-[#1C4D8D]"
            >
              Reset to Default
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditPaymentDialog(false)}
              className="border-[#4988C4] text-[#1C4D8D]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePaymentInstructions}
              className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Additional Notes Dialog */}
      <Dialog open={showSendNotesDialog} onOpenChange={setShowSendNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F2854]">
              <Send className="w-5 h-5" />
              Send Additional Notes
            </DialogTitle>
            <DialogDescription>
              Send payment notes to {student.parentName} via email or SMS
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Info Summary */}
            <Card className="p-4 bg-gradient-to-br from-[#BDE8F5]/10 to-white border-[#4988C4]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[#4988C4] mb-1">Student</p>
                  <p className="text-[#0F2854] font-bold">{student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4988C4] mb-1">Student ID</p>
                  <p className="text-[#0F2854] font-bold">{student.studentId}</p>
                </div>
              </div>
            </Card>

            {/* Delivery Method */}
            <div>
              <Label className="text-[#0F2854] font-semibold mb-3 block">
                📤 Send Via
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSendMethod("email")}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    sendMethod === "email"
                      ? "border-[#1C4D8D] bg-[#BDE8F5]/20"
                      : "border-[#BDE8F5] hover:border-[#4988C4]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-[#4988C4]" />
                    <span className="font-semibold text-[#0F2854] text-sm">Email</span>
                  </div>
                  <p className="text-xs text-[#4988C4]">{student.parentEmail}</p>
                </button>

                <button
                  onClick={() => setSendMethod("sms")}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    sendMethod === "sms"
                      ? "border-[#1C4D8D] bg-[#BDE8F5]/20"
                      : "border-[#BDE8F5] hover:border-[#4988C4]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4 text-[#4988C4]" />
                    <span className="font-semibold text-[#0F2854] text-sm">SMS</span>
                  </div>
                  <p className="text-xs text-[#4988C4]">{student.parentPhone}</p>
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <Label className="text-[#0F2854] font-semibold mb-2 block">
                📝 Message Preview
              </Label>
              <Card className="p-4 bg-white border-[#4988C4] max-h-[200px] overflow-y-auto">
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Dear {student.parentName},</strong>
                  </p>
                  <p>
                    We have attached additional payment notes and instructions for {student.name} (ID: {student.studentId}).
                  </p>
                  <p className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded border border-gray-200">
                    {additionalNotes}
                  </p>
                  <p>
                    If you have any questions, please contact our Finance Office.
                  </p>
                  <p>
                    <strong>Best regards,</strong>
                    <br />
                    School Finance Department
                  </p>
                </div>
              </Card>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSendNotesDialog(false)}
              disabled={isSending}
              className="border-[#4988C4] text-[#1C4D8D]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendAdditionalNotes}
              disabled={isSending}
              className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white"
            >
              {isSending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send via {sendMethod === "email" ? "Email" : "SMS"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg">
                <GraduationCap className="w-10 h-10 text-[#0F2854]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Student Credentials</h1>
                <p className="text-[#BDE8F5]">
                  Personal Information & Payment Details
                </p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handlePrint}
                disabled={isExporting}
                title="Print the student credentials"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                title="Download as PDF"
              >
                {isExporting && exportFormat === "pdf" ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleDownloadScreenshot}
                disabled={isExporting}
                title="Download as image"
              >
                {isExporting && exportFormat === "image" ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Screenshot
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
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
                className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Available students: <span className="font-semibold">{allStudents.map((s) => s.name).join(", ")}</span>
            </p>
          </Card>
        </div>

        {/* Main Content - Wrapped in ref for export */}
        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-bold text-[#0F2854]">Student Information</h2>
              </div>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4988C4] text-xs font-semibold">Student ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[#0F2854] font-mono">{student.studentId}</p>
                    <button
                      onClick={handleCopyStudentId}
                      className="text-[#4988C4] hover:text-[#1C4D8D]"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs font-semibold">Full Name</Label>
                  <p className="text-[#0F2854] mt-1">{student.name}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs font-semibold">Grade</Label>
                  <p className="text-[#0F2854] mt-1">{student.grade}</p>
                </div>
                <div>
                  <Label className="text-[#4988C4] text-xs font-semibold">
                    Date of Birth
                  </Label>
                  <p className="text-[#0F2854] mt-1">{student.dateOfBirth}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#4988C4] text-xs font-semibold">Email</Label>
                  <p className="text-[#0F2854] flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-[#4988C4]" />
                    {student.email}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#4988C4] text-xs font-semibold">Phone</Label>
                  <p className="text-[#0F2854] flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-[#4988C4]" />
                    {student.phone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#4988C4] text-xs font-semibold">
                    Enrollment Date
                  </Label>
                  <p className="text-[#0F2854] flex items-center gap-2 mt-1">
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
                <h2 className="text-xl font-bold text-[#0F2854]">
                  Parent/Guardian Information
                </h2>
              </div>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4988C4] text-xs font-semibold">Parent Name</Label>
                  <p className="text-[#0F2854] mt-1">{student.parentName}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#4988C4] text-xs font-semibold">Parent Email</Label>
                  <p className="text-[#0F2854] flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-[#4988C4]" />
                    {student.parentEmail}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[#4988C4] text-xs font-semibold">Parent Phone</Label>
                  <p className="text-[#0F2854] flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-[#4988C4]" />
                    {student.parentPhone}
                  </p>
                </div>
              </div>
            </Card>

            {/* Enhanced Manual Payment Instructions */}
            <Card className="p-6 bg-gradient-to-br from-[#BDE8F5]/20 to-white/95 backdrop-blur-sm border-2 border-[#4988C4]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-bold text-[#0F2854]">
                    Payment Methods & Instructions
                  </h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditPaymentDialog(true)}
                  className="border-[#4988C4] text-[#1C4D8D] hover:bg-[#BDE8F5]"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              <Separator className="mb-4" />

              {/* Bank Transfer */}
              <div className="mb-5 p-4 bg-white rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-[#0F2854] text-lg">Bank Transfer</h3>
                </div>
                <div className="space-y-2 text-sm text-[#0F2854]">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[#4988C4]">Account Name:</span>
                    <span className="text-right">School Institution</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[#4988C4]">Account Number:</span>
                    <span className="font-mono text-right">1234-567-890</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[#4988C4]">Routing Number:</span>
                    <span className="font-mono text-right">987-654-321</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[#4988C4]">Bank Name:</span>
                    <span className="text-right">National Bank Corporation</span>
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700 font-semibold">
                      ⓘ Use reference: {student.studentId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Payment */}
              <div className="mb-5 p-4 bg-white rounded-lg border-l-4 border-green-500 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-[#0F2854] text-lg">Cash Payment</h3>
                </div>
                <div className="space-y-2 text-sm text-[#0F2854]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span>Visit the school finance office</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>Main Building, Ground Floor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span>Monday - Friday, 9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-700 font-semibold">
                      ⓘ Bring Student ID: {student.studentId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Check Payment */}
              <div className="mb-5 p-4 bg-white rounded-lg border-l-4 border-purple-500 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-[#0F2854] text-lg">Check Payment</h3>
                </div>
                <div className="space-y-2 text-sm text-[#0F2854]">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#4988C4] min-w-fit">Make Payable To:</span>
                    <span>School Institution</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#4988C4] min-w-fit">Write on Memo:</span>
                    <span className="font-mono">{student.studentId}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#4988C4] min-w-fit">Submit To:</span>
                    <span>Finance Office, Main Building, Ground Floor</span>
                  </div>
                  <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-200">
                    <p className="text-xs text-purple-700 font-semibold">
                      ⓘ Allow 3-5 business days for processing
                    </p>
                  </div>
                </div>
              </div>

              {/* SMS/Mobile Payment */}
              <div className="p-4 bg-white rounded-lg border-l-4 border-orange-500 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-[#0F2854] text-lg">Mobile Payment</h3>
                </div>
                <div className="space-y-2 text-sm text-[#0F2854]">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#4988C4] min-w-fit">GCash:</span>
                    <span>+63 917 1234 567</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#4988C4] min-w-fit">PayMaya:</span>
                    <span>+63 917 5678 901</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#4988C4] min-w-fit">Reference:</span>
                    <span className="font-mono">{student.studentId}</span>
                  </div>
                  <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs text-orange-700 font-semibold">
                      ⓘ Instant confirmation • Screenshot proof required
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Important Notes */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ Important:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>✓ Always keep payment receipts for verification</li>
                  <li>✓ Include student ID in all payments</li>
                  <li>✓ Payment deadline: {student.dueDate}</li>
                  <li>✓ Late payment penalty: 5% per month after due date</li>
                </ul>
              </div>

              {/* Additional Notes Section with Send Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="additionalNotes" className="text-[#0F2854] font-semibold">
                    📝 Additional Notes
                  </Label>
                  {additionalNotes && (
                    <Button
                      size="sm"
                      onClick={() => setShowSendNotesDialog(true)}
                      className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send
                    </Button>
                  )}
                </div>
                <Textarea
                  id="additionalNotes"
                  placeholder="Add any additional payment notes or special instructions..."
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setAdditionalNotes(e.target.value);
                    }
                  }}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-[#4988C4]">
                    {additionalNotes.length}/500 characters
                  </p>
                  {additionalNotes.length > 450 && (
                    <p className="text-xs text-orange-500">Approaching limit</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Fee Status & Payment History */}
          <div className="space-y-6">
            {/* Current Fee Status */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-bold text-[#0F2854]">Current Fee Status</h2>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-[#BDE8F5]/20 to-transparent rounded-lg border-2 border-[#BDE8F5]">
                  <Label className="text-[#4988C4] text-xs font-semibold">Fee Amount</Label>
                  <p className="text-3xl font-bold text-[#0F2854] mt-2">
                    ₱{student.feeAmount.toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <Label className="text-[#4988C4] text-xs font-semibold">Status</Label>
                  {getStatusBadge(student.feeStatus)}
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <Label className="text-[#4988C4] text-xs font-semibold">Due Date</Label>
                  <p className="text-[#0F2854] font-semibold">{student.dueDate}</p>
                </div>

                {student.feeStatus !== "paid" && (
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Payment is {student.feeStatus}. Please submit payment before the due date to avoid penalties.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment History */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-bold text-[#0F2854]">Payment History</h2>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {student.paymentHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No payment history</p>
                ) : (
                  student.paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3 bg-gradient-to-r from-[#BDE8F5]/20 to-transparent rounded-lg border border-[#BDE8F5] hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-[#0F2854]">
                            {payment.method}
                          </p>
                          <p className="text-xs text-[#4988C4]">{payment.date}</p>
                        </div>
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-[#1C4D8D] mb-2">
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
                          className="text-[#1C4D8D] hover:text-[#0F2854] hover:bg-[#BDE8F5]/20 text-xs"
                        >
                          <Receipt className="w-3 h-3 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200">
                <Label className="text-green-700 font-semibold">Total Paid</Label>
                <p className="text-xl font-bold text-green-600">
                  ₱{totalPaid.toLocaleString()}
                </p>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="p-6 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white rounded-xl shadow-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Need Help?
              </h3>
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
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Mon-Fri: 9:00 AM - 4:00 PM
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}