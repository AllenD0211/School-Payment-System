import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  GraduationCap,
  User,
  Calendar,
  DollarSign,
  Bell,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  LogOut,
  TrendingUp,
  ChevronDown,
  Users,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

interface StudentInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
  enrollmentDate: string;
}

interface ParentInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  relationship: string;
}

interface PaymentDue {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  description: string;
  studentId: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: "academic" | "sports" | "cultural" | "meeting";
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  type: string;
  method: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
}

interface Student {
  info: StudentInfo;
  paymentDues: PaymentDue[];
  paymentHistory: PaymentHistory[];
}

const parentData: ParentInfo = {
  id: "PAR-2024-001",
  name: "Michael Johnson",
  email: "michael.j@email.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main Street, Springfield, IL 62701",
  relationship: "Father",
};

// All available students in the system (for searching/adding)
const allAvailableStudents: Student[] = [
  {
    info: {
      id: "STU-2024-001",
      name: "Emma Johnson",
      grade: "Grade 10",
      section: "A",
      rollNumber: "10-A-15",
      dateOfBirth: "2010-05-15",
      enrollmentDate: "2024-06-01",
    },
    paymentDues: [
      {
        id: "1",
        type: "Tuition Fee",
        amount: 5000,
        dueDate: "2026-02-15",
        status: "pending",
        description: "Monthly tuition fee for February 2026",
        studentId: "STU-2024-001",
      },
      {
        id: "2",
        type: "Library Fee",
        amount: 150,
        dueDate: "2026-02-01",
        status: "overdue",
        description: "Annual library subscription fee",
        studentId: "STU-2024-001",
      },
      {
        id: "3",
        type: "Activity Fee",
        amount: 300,
        dueDate: "2026-03-01",
        status: "pending",
        description: "Sports and extracurricular activities fee",
        studentId: "STU-2024-001",
      },
    ],
    paymentHistory: [
      {
        id: "PAY-001",
        date: "2026-01-15",
        amount: 5000,
        type: "Tuition Fee",
        method: "Bank Transfer",
        receiptNumber: "RCP-12345678",
        studentId: "STU-2024-001",
        studentName: "Emma Johnson",
      },
      {
        id: "PAY-002",
        date: "2025-12-10",
        amount: 5000,
        type: "Tuition Fee",
        method: "Cash",
        receiptNumber: "RCP-87654321",
        studentId: "STU-2024-001",
        studentName: "Emma Johnson",
      },
    ],
  },
  {
    info: {
      id: "STU-2024-002",
      name: "James Johnson",
      grade: "Grade 8",
      section: "B",
      rollNumber: "08-B-22",
      dateOfBirth: "2012-03-20",
      enrollmentDate: "2024-06-01",
    },
    paymentDues: [
      {
        id: "4",
        type: "Tuition Fee",
        amount: 4500,
        dueDate: "2026-02-15",
        status: "paid",
        description: "Monthly tuition fee for February 2026",
        studentId: "STU-2024-002",
      },
      {
        id: "5",
        type: "Sports Fee",
        amount: 200,
        dueDate: "2026-02-28",
        status: "pending",
        description: "School sports program fee",
        studentId: "STU-2024-002",
      },
    ],
    paymentHistory: [
      {
        id: "PAY-003",
        date: "2026-01-10",
        amount: 4500,
        type: "Tuition Fee",
        method: "Credit Card",
        receiptNumber: "RCP-45678912",
        studentId: "STU-2024-002",
        studentName: "James Johnson",
      },
    ],
  },
  {
    info: {
      id: "STU-2024-003",
      name: "Sophia Smith",
      grade: "Grade 9",
      section: "C",
      rollNumber: "09-C-10",
      dateOfBirth: "2011-07-10",
      enrollmentDate: "2024-06-01",
    },
    paymentDues: [
      {
        id: "6",
        type: "Tuition Fee",
        amount: 5000,
        dueDate: "2026-02-15",
        status: "pending",
        description: "Monthly tuition fee for February 2026",
        studentId: "STU-2024-003",
      },
    ],
    paymentHistory: [],
  },
];

const upcomingEvents: Event[] = [
  {
    id: "1",
    title: "Parent-Teacher Meeting",
    date: "2026-01-25",
    time: "10:00 AM",
    location: "School Auditorium",
    description: "Discuss student progress and academic performance",
    type: "meeting",
  },
  {
    id: "3",
    title: "Mid-Term Examinations",
    date: "2026-02-10",
    time: "9:00 AM",
    location: "Examination Halls",
    description: "Mid-term examinations for all subjects",
    type: "academic",
  },
  {
    id: "4",
    title: "Annual Sports Day",
    date: "2026-02-20",
    time: "8:00 AM",
    location: "School Sports Ground",
    description: "Annual inter-house sports competition",
    type: "sports",
  },
];

// Professional PDF Receipt Generation
const generateProfessionalReceipt = (
  payment: PaymentHistory,
  studentInfo: StudentInfo,
  parentInfo: ParentInfo
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Header
  doc.setFillColor(15, 40, 84);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("GREENFIELD PUBLIC SCHOOL", margin, 15);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Excellence in Education", margin, 22);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 40, 84);
  doc.text("OFFICIAL RECEIPT", pageWidth - margin - 50, 18);

  yPosition = 45;

  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(50, 50, 50);

  const receiptInfoStartY = yPosition;
  doc.text(`Receipt #: ${payment.receiptNumber}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Date Issued: ${payment.date}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Payment Method: ${payment.method}`, margin, yPosition);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(0, 128, 0);
  doc.text("STATUS: PAID", pageWidth - margin - 50, receiptInfoStartY);

  yPosition += 12;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 40, 84);
  doc.text("PAYMENT INFORMATION", margin, yPosition);

  yPosition += 8;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition - 3, contentWidth / 2 - 2, 28, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition - 3, contentWidth / 2 - 2, 28);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("STUDENT DETAILS", margin + 3, yPosition + 2);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  let studentBoxY = yPosition + 8;
  doc.text(`Name: ${studentInfo.name}`, margin + 3, studentBoxY);
  doc.text(`Student ID: ${studentInfo.id}`, margin + 3, studentBoxY + 5);
  doc.text(
    `Grade: ${studentInfo.grade} - Section ${studentInfo.section}`,
    margin + 3,
    studentBoxY + 10
  );
  doc.text(`Roll Number: ${studentInfo.rollNumber}`, margin + 3, studentBoxY + 15);

  doc.setFillColor(245, 245, 245);
  doc.rect(
    margin + contentWidth / 2,
    yPosition - 3,
    contentWidth / 2 - 2,
    28,
    "F"
  );
  doc.setDrawColor(200, 200, 200);
  doc.rect(
    margin + contentWidth / 2,
    yPosition - 3,
    contentWidth / 2 - 2,
    28
  );

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    "PAYER DETAILS",
    margin + contentWidth / 2 + 3,
    yPosition + 2
  );

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  let payerBoxY = yPosition + 8;
  doc.text(
    `Name: ${parentInfo.name}`,
    margin + contentWidth / 2 + 3,
    payerBoxY
  );
  doc.text(
    `Relationship: ${parentInfo.relationship}`,
    margin + contentWidth / 2 + 3,
    payerBoxY + 5
  );
  doc.text(
    `Contact: ${parentInfo.phone}`,
    margin + contentWidth / 2 + 3,
    payerBoxY + 10
  );
  doc.text(
    `Email: ${parentInfo.email}`,
    margin + contentWidth / 2 + 3,
    payerBoxY + 15
  );

  yPosition += 32;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 40, 84);
  doc.text("PAYMENT DETAILS", margin, yPosition);

  yPosition += 8;

  doc.setFillColor(15, 40, 84);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);

  const tableTop = yPosition;
  const col1X = margin;
  const col3X = margin + 140;

  doc.rect(col1X, tableTop, 135, 7, "F");
  doc.text("Description", col1X + 2, tableTop + 5);
  doc.text("Amount", col3X + 2, tableTop + 5);

  doc.setTextColor(50, 50, 50);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);

  yPosition += 10;
  doc.text(payment.type, col1X + 2, yPosition);
  doc.setFont("Helvetica", "bold");
  doc.text(`₱${payment.amount.toLocaleString()}`, col3X + 2, yPosition);

  yPosition += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 7;

  doc.setFillColor(230, 244, 255);
  doc.rect(col3X - 10, yPosition, 50, 15, "F");
  doc.setDrawColor(15, 40, 84);
  doc.rect(col3X - 10, yPosition, 50, 15);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Total Amount Paid:", col3X - 8, yPosition + 5);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 40, 84);
  doc.text(`₱${payment.amount.toLocaleString()}`, col3X - 8, yPosition + 12);

  yPosition += 22;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 40, 84);
  doc.text("TRANSACTION DETAILS", margin, yPosition);

  yPosition += 7;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  const noteText = [
    `• Payment Type: ${payment.type}`,
    `• Payment Method: ${payment.method}`,
    `• Transaction Date: ${payment.date}`,
    `• Academic Year: 2025-2026`,
    `• This is an official receipt from the Finance Department`,
  ];

  noteText.forEach((note) => {
    doc.text(note, margin + 3, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  doc.setDrawColor(15, 40, 84);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 8;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  const footerText = [
    "Finance Office: finance@school.edu | Phone: +1 (555) 999-8888",
    `Generated on: ${new Date().toLocaleString()}`,
    "This receipt is valid and should be retained for record purposes.",
  ];

  footerText.forEach((text) => {
    doc.text(text, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 4;
  });

  doc.setTextColor(220, 220, 220);
  doc.setFontSize(80);
  doc.setFont("Helvetica", "bold");
  doc.text("PAID", pageWidth / 2, pageHeight / 2, { align: "center" });

  return doc;
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<string>("STU-2024-001");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(
    "STU-2024-001"
  );
  const [hideAmounts, setHideAmounts] = useState(false);
  const [myStudents, setMyStudents] = useState<Student[]>([
    allAvailableStudents[0],
    allAvailableStudents[1],
  ]);

  // Add Child Dialog States
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchType, setSearchType] = useState<"studentId" | "birthdate">(
    "studentId"
  );
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const currentStudent = myStudents.find((s) => s.info.id === selectedStudent);

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center p-6">
        <Card className="p-8 bg-white/95">
          <p className="text-[#0F2854] font-bold text-lg">Student not found</p>
        </Card>
      </div>
    );
  }

  const handleSearchStudent = () => {
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    // Simulate API call
    setTimeout(() => {
      const results = allAvailableStudents.filter((student) => {
        // Check if already added
        const alreadyAdded = myStudents.some(
          (s) => s.info.id === student.info.id
        );
        if (alreadyAdded) return false;

        if (searchType === "studentId") {
          return student.info.id
            .toLowerCase()
            .includes(searchInput.toLowerCase());
        } else {
          return student.info.dateOfBirth
            .toLowerCase()
            .includes(searchInput.toLowerCase());
        }
      });

      if (results.length === 0) {
        setSearchError(
          `No students found with ${
            searchType === "studentId" ? "Student ID" : "Birthdate"
          } "${searchInput}"`
        );
      } else {
        setSearchResults(results);
      }
      setIsSearching(false);
    }, 500);
  };

  const handleAddChild = (student: Student) => {
    const alreadyAdded = myStudents.some(
      (s) => s.info.id === student.info.id
    );

    if (alreadyAdded) {
      toast.error("This student is already added to your account");
      return;
    }

    setMyStudents([...myStudents, student]);
    setSelectedStudent(student.info.id);
    setSearchInput("");
    setSearchResults([]);
    setSearchError("");
    setIsAddChildOpen(false);
    toast.success(`${student.info.name} has been added successfully!`);
  };

  const handleRemoveChild = (studentId: string) => {
    if (myStudents.length === 1) {
      toast.error("You must have at least one child linked to your account");
      return;
    }

    const removedStudent = myStudents.find((s) => s.info.id === studentId);
    setMyStudents(myStudents.filter((s) => s.info.id !== studentId));

    if (selectedStudent === studentId) {
      setSelectedStudent(myStudents[0].info.id);
    }

    toast.success(
      `${removedStudent?.info.name} has been removed from your account`
    );
  };

  const handleDownloadReceipt = (payment: PaymentHistory) => {
    try {
      const doc = generateProfessionalReceipt(
        payment,
        currentStudent.info,
        parentData
      );
      doc.save(`Receipt-${payment.receiptNumber}.pdf`);
      toast.success(`Receipt ${payment.receiptNumber} downloaded successfully!`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download receipt");
    }
  };

  const handlePayNow = (paymentId: string) => {
    toast.info("Redirecting to payment gateway...");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getPaymentStatusBadge = (status: string) => {
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
            <Clock className="w-3 h-3 mr-1" />
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

  const getEventTypeBadge = (type: string) => {
    const colors = {
      academic: "bg-blue-500 hover:bg-blue-600",
      sports: "bg-green-500 hover:bg-green-600",
      cultural: "bg-purple-500 hover:bg-purple-600",
      meeting: "bg-orange-500 hover:bg-orange-600",
    };
    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount: number) => {
    return hideAmounts ? "****" : `₱${amount.toLocaleString()}`;
  };

  const totalDue = currentStudent.paymentDues
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = currentStudent.paymentHistory.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const allTotalDue = myStudents
    .flatMap((s) => s.paymentDues)
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const allTotalPaid = myStudents
    .flatMap((s) => s.paymentHistory)
    .reduce((sum, p) => sum + p.amount, 0);

  const allPendingCount = myStudents
    .flatMap((s) => s.paymentDues)
    .filter((p) => p.status === "pending").length;

  const allOverdueCount = myStudents
    .flatMap((s) => s.paymentDues)
    .filter((p) => p.status === "overdue").length;

  const pendingCount = currentStudent.paymentDues.filter(
    (p) => p.status === "pending"
  ).length;

  const overdueCount = currentStudent.paymentDues.filter(
    (p) => p.status === "overdue"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <GraduationCap className="w-10 h-10 text-[#0F2854]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Parent Dashboard
              </h1>
              <p className="text-[#BDE8F5] mt-1">
                Welcome back, {parentData.name} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setHideAmounts(!hideAmounts)}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              title={hideAmounts ? "Show amounts" : "Hide amounts"}
            >
              {hideAmounts ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Student Selector */}
        <Card className="mb-8 p-6 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1C4D8D]" />
              <h2 className="text-xl font-semibold text-[#0F2854]">
                My Children
              </h2>
            </div>
            <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-[#0F2854]">Add Child</DialogTitle>
                  <DialogDescription className="text-[#4988C4]">
                    Search and link your child's account by Student ID or
                    Birthdate
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Search Type Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSearchType("studentId");
                        setSearchInput("");
                        setSearchResults([]);
                        setSearchError("");
                      }}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        searchType === "studentId"
                          ? "border-[#1C4D8D] bg-[#BDE8F5]/20"
                          : "border-[#BDE8F5] hover:border-[#4988C4]"
                      }`}
                    >
                      <p className="text-[#0F2854] font-bold text-sm">
                        Student ID
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        setSearchType("birthdate");
                        setSearchInput("");
                        setSearchResults([]);
                        setSearchError("");
                      }}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        searchType === "birthdate"
                          ? "border-[#1C4D8D] bg-[#BDE8F5]/20"
                          : "border-[#BDE8F5] hover:border-[#4988C4]"
                      }`}
                    >
                      <p className="text-[#0F2854] font-bold text-sm">
                        Birthdate
                      </p>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="space-y-2">
                    <Label className="text-[#0F2854]">
                      {searchType === "studentId" ? "Student ID" : "Birthdate"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={
                          searchType === "studentId"
                            ? "e.g., STU-2024-001"
                            : "YYYY-MM-DD"
                        }
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleSearchStudent();
                        }}
                        className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                      />
                      <Button
                        onClick={handleSearchStudent}
                        disabled={!searchInput || isSearching}
                        className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-sm font-bold text-[#0F2854]">
                        Found {searchResults.length} student(s):
                      </p>
                      {searchResults.map((student) => (
                        <div
                          key={student.info.id}
                          className="p-3 bg-gradient-to-r from-[#BDE8F5]/20 to-transparent rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-bold text-[#0F2854]">
                                {student.info.name}
                              </p>
                              <p className="text-xs text-[#4988C4] mt-1">
                                ID: {student.info.id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                DOB: {student.info.dateOfBirth}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.info.grade} - {student.info.section}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddChild(student)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Error */}
                  {searchError && (
                    <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
                      <p className="text-sm text-red-700">{searchError}</p>
                    </div>
                  )}

                  {/* No Results Message */}
                  {!isSearching &&
                    searchResults.length === 0 &&
                    !searchError &&
                    searchInput && (
                      <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <p className="text-sm text-yellow-700">
                          Enter a{" "}
                          {searchType === "studentId"
                            ? "Student ID"
                            : "Birthdate"}{" "}
                          and click search
                        </p>
                      </div>
                    )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Separator className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {myStudents.map((student) => (
              <div key={student.info.id} className="relative">
                <button
                  onClick={() => setSelectedStudent(student.info.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                    selectedStudent === student.info.id
                      ? "border-[#1C4D8D] bg-[#BDE8F5]/20"
                      : "border-[#BDE8F5] hover:border-[#4988C4]"
                  }`}
                >
                  <p className="font-bold text-[#0F2854]">{student.info.name}</p>
                  <p className="text-sm text-[#4988C4]">
                    {student.info.grade} - {student.info.section}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {student.info.id}
                  </p>
                </button>

                {myStudents.length > 1 && (
                  <button
                    onClick={() => handleRemoveChild(student.info.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all opacity-0 hover:opacity-100"
                    title="Remove child"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {currentStudent.info.name}'s Total Due
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {formatAmount(totalDue)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Pending Payments
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Overdue Payments
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {overdueCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Total Paid
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {formatAmount(totalPaid)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Info */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Student Information
                  </h2>
                </div>
                <Separator className="mb-4" />

                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="w-20 h-20 border-4 border-[#BDE8F5]">
                    <AvatarFallback className="bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white text-2xl font-bold">
                      {currentStudent.info.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F2854]">
                      {currentStudent.info.name}
                    </h3>
                    <p className="text-sm text-[#4988C4] font-medium">
                      {currentStudent.info.id}
                    </p>
                    <Badge className="mt-2 bg-blue-500">
                      {currentStudent.info.grade}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Section
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {currentStudent.info.section}
                    </p>
                  </div>
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Roll Number
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {currentStudent.info.rollNumber}
                    </p>
                  </div>
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5] col-span-2">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Date of Birth
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {currentStudent.info.dateOfBirth}
                    </p>
                  </div>
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5] col-span-2">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Enrollment Date
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {currentStudent.info.enrollmentDate}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Fee Summary */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Fee Summary - {currentStudent.info.name}
                  </h2>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors">
                    <p className="text-sm text-green-600 font-medium mb-1">
                      Total Paid
                    </p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatAmount(totalPaid)}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg border-2 border-red-200 hover:border-red-300 transition-colors">
                    <p className="text-sm text-red-600 font-medium mb-1">
                      Outstanding Balance
                    </p>
                    <p className="text-3xl font-bold text-red-700">
                      {formatAmount(totalDue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {currentStudent.paymentDues.filter((p) => p.status !== "paid")
                        .length}{" "}
                      unpaid items
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700 font-semibold mb-1">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {pendingCount}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 font-semibold mb-1">
                        Overdue
                      </p>
                      <p className="text-2xl font-bold text-red-700">
                        {overdueCount}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Dues */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Payment Due Items - {currentStudent.info.name}
                  </h2>
                </div>
                <Separator className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentStudent.paymentDues.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 border-2 border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-[#0F2854] font-bold text-sm">
                            {payment.type}
                          </p>
                          <p className="text-xs text-[#4988C4] mt-1">
                            Due: {payment.dueDate}
                          </p>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      <p className="text-2xl font-bold text-[#1C4D8D] mb-2">
                        {formatAmount(payment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.description}
                      </p>
                      {/* {payment.status !== "paid" && (
                        <Button
                          size="sm"
                          className="w-full mt-3 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] transition-all group-hover:shadow-lg"
                          onClick={() => handlePayNow(payment.id)}
                        >
                          Pay Now
                        </Button>
                      )} */}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment History */}
              <div className="lg:col-span-2">
                <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                  <h2 className="text-xl font-semibold text-[#0F2854] mb-4">
                    Payment History - {currentStudent.info.name}
                  </h2>
                  <Separator className="mb-4" />

                  <div className="space-y-3">
                    {currentStudent.paymentHistory.length > 0 ? (
                      currentStudent.paymentHistory.map((payment) => (
                        <div
                          key={payment.id}
                          className="p-4 border border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="text-[#0F2854] font-bold">
                                {payment.type}
                              </p>
                              <p className="text-xs text-[#4988C4] mt-1">
                                {payment.date}
                              </p>
                            </div>
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          </div>

                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-2xl font-bold text-[#1C4D8D]">
                                {formatAmount(payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Method: {payment.method}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Receipt: {payment.receiptNumber}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] transition-all whitespace-nowrap"
                              onClick={() => handleDownloadReceipt(payment)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Receipt
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No payment history yet
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Outstanding Payments */}
                <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-[#0F2854] mb-4">
                    Pending Payments
                  </h3>
                  {currentStudent.paymentDues.filter((p) => p.status !== "paid")
                    .length > 0 ? (
                    <div className="space-y-3">
                      {currentStudent.paymentDues
                        .filter((p) => p.status !== "paid")
                        .map((payment) => (
                          <div
                            key={payment.id}
                            className="p-3 bg-gradient-to-r from-[#BDE8F5]/20 to-transparent rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-all"
                          >
                            <p className="text-sm text-[#0F2854] font-bold mb-1">
                              {payment.type}
                            </p>
                            <p className="text-xl font-bold text-[#1C4D8D] mb-2">
                              {formatAmount(payment.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Due: {payment.dueDate}
                            </p>
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-600 font-semibold">
                        All paid up!
                      </p>
                    </div>
                  )}
                </Card>

                {/* Payment Help */}
                <Card className="p-6 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold mb-3">
                    📞 Payment Support
                  </h3>
                  <p className="text-sm text-[#BDE8F5] mb-4">
                    Need help with payments? Contact us.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      finance@school.edu
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      +1 (555) 999-8888
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <h2 className="text-xl font-semibold text-[#0F2854] mb-4">
                Upcoming Events & Activities
              </h2>
              <Separator className="mb-6" />

              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-5 border-2 border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h3 className="text-[#0F2854] font-bold text-sm flex-1 group-hover:text-[#1C4D8D]">
                          {event.title}
                        </h3>
                        {getEventTypeBadge(event.type)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-[#4988C4] font-medium">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </p>
                        <p className="flex items-center gap-2 text-[#4988C4] font-medium">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </p>
                        <p className="flex items-center gap-2 text-[#4988C4] font-medium">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Guardian Profile
                  </h2>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Full Name
                    </p>
                    <p className="text-[#0F2854] font-bold">{parentData.name}</p>
                  </div>

                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Guardian ID
                    </p>
                    <p className="text-[#0F2854] font-bold">{parentData.id}</p>
                  </div>

                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Relationship
                    </p>
                    <Badge className="bg-blue-500">
                      {parentData.relationship}
                    </Badge>
                  </div>

                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </p>
                    <p className="text-[#0F2854] font-medium break-all">
                      {parentData.email}
                    </p>
                  </div>

                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </p>
                    <p className="text-[#0F2854] font-medium">{parentData.phone}</p>
                  </div>

                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Address
                    </p>
                    <p className="text-[#0F2854] font-medium text-sm">
                      {parentData.address}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Children Summary
                  </h2>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      Total Children Enrolled
                    </p>
                    <p className="text-3xl font-bold text-blue-700">
                      {myStudents.length}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-transparent rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-600 font-medium mb-1">
                      Total Pending Payments
                    </p>
                    <p className="text-3xl font-bold text-yellow-700">
                      {allPendingCount}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-1">
                      Total Overdue Payments
                    </p>
                    <p className="text-3xl font-bold text-red-700">
                      {allOverdueCount}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">
                      Total Amount Paid (All)
                    </p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatAmount(allTotalPaid)}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-1">
                      Total Outstanding (All)
                    </p>
                    <p className="text-3xl font-bold text-red-700">
                      {formatAmount(allTotalDue)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}