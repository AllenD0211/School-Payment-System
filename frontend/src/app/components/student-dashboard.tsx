import { useCallback, useEffect, useState } from "react";
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
  GraduationCap,
  User,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  LogOut,
  TrendingUp,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const EVENT_SYNC_STORAGE_KEY = "events_last_updated_at";
const EVENT_SYNC_WINDOW_EVENT = "events-updated";
const API_BASE = String(
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000",
).replace(/\/+$/, "");

const apiUrl = (path: string) => `${API_BASE}${path}`;

interface StudentInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
  enrollmentDate: string;
  email: string;
}

interface PaymentDue {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  description: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  type: string;
  method: string;
  receiptNumber: string;
}

interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: "academic" | "sports" | "cultural" | "meeting";
}

type JwtPayload = {
  id?: string;
  userType?: string;
};

type SessionUser = {
  id?: string;
  email?: string;
  userType?: string;
};

const EMPTY_STUDENT_INFO: StudentInfo = {
  id: "",
  name: "",
  grade: "",
  section: "",
  rollNumber: "",
  dateOfBirth: "",
  enrollmentDate: "",
  email: "",
};

const toStringValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toDateInputValue = (value: unknown) => {
  if (!value) return "";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseJwtToken = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(paddedBase64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const parseSessionUser = (raw: string | null): SessionUser | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const inferEventType = (
  title: string,
  description: string,
): DashboardEvent["type"] => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("sport")) return "sports";
  if (text.includes("meeting") || text.includes("parent")) return "meeting";
  if (text.includes("fair") || text.includes("cultural")) return "cultural";
  return "academic";
};

const parseEventDateTime = (eventRow: any) => {
  const directDateTime =
    eventRow.eventDateTime ??
    eventRow.dateTime ??
    eventRow.event_datetime ??
    eventRow.date ??
    eventRow.event_date;

  const parsedDirect = new Date(String(directDateTime));
  if (directDateTime && !Number.isNaN(parsedDirect.getTime())) {
    return parsedDirect;
  }

  const datePart = toStringValue(eventRow.date ?? eventRow.event_date);
  const timePart = toStringValue(eventRow.time ?? eventRow.event_time);
  if (datePart) {
    const combined = new Date(`${datePart}T${timePart || "00:00:00"}`);
    if (!Number.isNaN(combined.getTime())) return combined;

    const dateOnly = new Date(datePart);
    if (!Number.isNaN(dateOnly.getTime())) return dateOnly;
  }

  const fallback = new Date(String(eventRow.createdAt));
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const normalizeEventRows = (rows: any[]): DashboardEvent[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const normalized = rows
    .map((eventRow: any) => {
      const dateTime = parseEventDateTime(eventRow);
      if (!dateTime) return null;
      const eventDay = new Date(
        dateTime.getFullYear(),
        dateTime.getMonth(),
        dateTime.getDate(),
      ).getTime();

      return {
        id: toStringValue(eventRow._id ?? eventRow.id),
        title: toStringValue(eventRow.title),
        date: toDateInputValue(dateTime),
        time: dateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        location: toStringValue(eventRow.location),
        description: toStringValue(eventRow.description),
        type: inferEventType(
          toStringValue(eventRow.title),
          toStringValue(eventRow.description),
        ),
        __timestamp: dateTime.getTime(),
        __eventDay: eventDay,
      };
    })
    .filter(
      (
        eventRow,
      ): eventRow is DashboardEvent & { __timestamp: number; __eventDay: number } =>
        Boolean(eventRow),
    );

  return normalized
    .sort((a, b) => {
      const aUpcoming = a.__eventDay >= todayTime;
      const bUpcoming = b.__eventDay >= todayTime;

      if (aUpcoming !== bUpcoming) {
        return aUpcoming ? -1 : 1;
      }

      return aUpcoming
        ? a.__timestamp - b.__timestamp
        : b.__timestamp - a.__timestamp;
    })
    .map(({ __timestamp, __eventDay, ...eventRow }) => eventRow);
};

const fetchJsonSafe = async (url: string, init?: RequestInit) => {
  try {
    const response = await fetch(url, init);
    const rawText = await response.text();
    try {
      return { response, data: rawText ? JSON.parse(rawText) : null };
    } catch {
      return {
        response,
        data: {
          success: false,
          message:
            rawText?.slice?.(0, 160) ||
            `Invalid JSON response from ${url} (status ${response.status})`,
        },
      };
    }
  } catch (error: any) {
    return {
      response: { ok: false, status: 0 } as Response,
      data: {
        success: false,
        message: error?.message || "Network error",
      },
    };
  }
};

const resolveStudentFromList = (
  rows: any[],
  userId: string,
  email: string,
) => {
  return rows.find((row) => {
    const rowUserId =
      typeof row?.userId === "object"
        ? toStringValue(row?.userId?._id)
        : toStringValue(row?.userId);
    const rowEmail =
      typeof row?.userId === "object"
        ? toStringValue(row?.userId?.email).toLowerCase()
        : toStringValue(row?.email).toLowerCase();
    return rowUserId === userId || (email && rowEmail === email.toLowerCase());
  });
};

// Professional PDF Receipt Generation
const generateProfessionalReceipt = (
  payment: PaymentHistory,
  studentInfo: StudentInfo
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

  // ========== HEADER SECTION ==========
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

  // ========== RECEIPT INFO HEADER ==========
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

  // ========== DIVIDER ==========
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // ========== STUDENT INFORMATION ==========
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 40, 84);
  doc.text("PAYMENT INFORMATION", margin, yPosition);

  yPosition += 8;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  // Student Info Box
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition - 3, contentWidth, 28, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition - 3, contentWidth, 28);

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

  yPosition += 32;

  // ========== DIVIDER ==========
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // ========== PAYMENT DETAILS TABLE ==========
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 40, 84);
  doc.text("PAYMENT DETAILS", margin, yPosition);

  yPosition += 8;

  // Table Header
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

  // Table Content
  doc.setTextColor(50, 50, 50);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);

  yPosition += 10;
  doc.text(payment.type, col1X + 2, yPosition);
  doc.setFont("Helvetica", "bold");
  doc.text(`₱${payment.amount.toLocaleString()}`, col3X + 2, yPosition);

  yPosition += 8;

  // ========== TOTAL AMOUNT ==========
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 7;

  // Amount box
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

  // ========== DIVIDER ==========
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;

  // ========== TRANSACTION NOTES ==========
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

  // ========== FOOTER ==========
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

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [hideAmounts, setHideAmounts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentInfo>(EMPTY_STUDENT_INFO);
  const [paymentDues, setPaymentDues] = useState<PaymentDue[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);

  const loadStudentEvents = useCallback(async () => {
    const eventsResult = await fetchJsonSafe(apiUrl("/api/events"));
    if (eventsResult.response.ok && eventsResult.data?.success) {
      const eventRows = Array.isArray(eventsResult.data.events)
        ? eventsResult.data.events
        : [];
      setUpcomingEvents(normalizeEventRows(eventRows));
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem("token");
      const storedUser = parseSessionUser(localStorage.getItem("user"));
      if (!token) {
        toast.error("Please login first.");
        navigate("/login");
        return;
      }

      const payload = parseJwtToken(token);
      const userId = storedUser?.id
        ? String(storedUser.id)
        : payload?.id
          ? String(payload.id)
          : "";
      const sessionEmail = storedUser?.email
        ? String(storedUser.email)
        : "";
      const tokenEmail = payload && "email" in payload && (payload as any).email
        ? String((payload as any).email)
        : "";
      const accountEmail = sessionEmail || tokenEmail;
      const userType = storedUser?.userType || payload?.userType;

      if (!userId) {
        toast.error("Invalid session. Please login again.");
        navigate("/login");
        return;
      }

      if (userType && userType !== "student") {
        toast.error("Unauthorized dashboard access.");
        navigate("/login");
        return;
      }

      try {
        setIsLoading(true);

        const [studentResult, feesResult, eventsResult] = await Promise.all([
          fetchJsonSafe(apiUrl(`/api/students/${userId}`)),
          fetchJsonSafe(apiUrl(`/api/fees/student/${userId}`)),
          fetchJsonSafe(apiUrl("/api/events")),
        ]);

        let studentRow = studentResult.data?.student || null;
        if (!studentResult.response.ok || !studentRow) {
          const studentsFallback = await fetchJsonSafe(apiUrl("/api/students"));
          const rows = Array.isArray(studentsFallback.data)
            ? studentsFallback.data
            : Array.isArray(studentsFallback.data?.students)
              ? studentsFallback.data.students
              : [];
          studentRow = resolveStudentFromList(rows, userId, accountEmail);
        }

        if (!studentRow) {
          throw new Error("No student record linked to this login account.");
        }

        const firstName = toStringValue(studentRow.firstName ?? studentRow.first_name);
        const middleName = toStringValue(studentRow.middleName ?? studentRow.middle_name);
        const lastName = toStringValue(studentRow.lastName ?? studentRow.last_name);
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        const studentId = toStringValue(studentRow.studentId ?? studentRow.student_id);
        const gradeSection = toStringValue(studentRow.gradeSection);
        const [gradePart, ...sectionParts] = gradeSection.split(" - ");

        setStudentData({
          id: studentId,
          name: fullName || "Student",
          grade: gradePart || gradeSection || "Not Provided",
          section: sectionParts.join(" - ") || "Not Provided",
          rollNumber: studentId || "Not Provided",
          dateOfBirth: toDateInputValue(studentRow.birthdate ?? studentRow.birth_date),
          enrollmentDate: toDateInputValue(studentRow.createdAt ?? studentRow.created_at),
          email:
            toStringValue(
              studentRow.email ??
                studentRow.user?.email ??
                studentRow.userId?.email ??
                accountEmail,
            ) || "Not Provided",
        });

        const feeRows = Array.isArray(feesResult.data?.fees) ? feesResult.data.fees : [];
        const normalizedDues: PaymentDue[] = feeRows
          .map((fee: any) => {
            const status = String(fee.status || "pending").toLowerCase();
            const normalizedStatus: PaymentDue["status"] =
              status === "paid" || status === "overdue" ? status : "pending";
            const feeType = toStringValue(fee.fee_type ?? fee.feeType);
            return {
              id: toStringValue(fee.fee_id ?? fee._id ?? fee.id),
              type: feeType || "Fee",
              amount: Number(fee.amount || 0),
              dueDate: toDateInputValue(fee.due_date ?? fee.dueDate),
              status: normalizedStatus,
              description: `${feeType || "Fee"} record`,
            };
          })
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        setPaymentDues(normalizedDues);

        const normalizedHistory: PaymentHistory[] = normalizedDues
          .filter((fee) => fee.status === "paid")
          .map((fee) => ({
            id: fee.id,
            date: fee.dueDate,
            amount: fee.amount,
            type: fee.type,
            method: "Recorded",
            receiptNumber: `RCP-${fee.id.slice(-8).toUpperCase()}`,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setPaymentHistory(normalizedHistory);

        const eventRows = Array.isArray(eventsResult.data?.events) ? eventsResult.data.events : [];
        setUpcomingEvents(normalizeEventRows(eventRows));
      } catch (error: any) {
        toast.error(error?.message || "Failed to load student dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    const syncEvents = () => {
      loadStudentEvents();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === EVENT_SYNC_STORAGE_KEY) {
        syncEvents();
      }
    };

    window.addEventListener(EVENT_SYNC_WINDOW_EVENT, syncEvents);
    window.addEventListener("storage", handleStorage);
    syncEvents();
    const intervalId = window.setInterval(syncEvents, 30000);

    return () => {
      window.removeEventListener(EVENT_SYNC_WINDOW_EVENT, syncEvents);
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(intervalId);
    };
  }, [loadStudentEvents]);

  const handleDownloadReceipt = (payment: PaymentHistory) => {
    try {
      const doc = generateProfessionalReceipt(payment, studentData);
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
    localStorage.removeItem("user");
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

  const totalDue = paymentDues
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = paymentDues.filter((p) => p.status === "pending").length;
  const overdueCount = paymentDues.filter((p) => p.status === "overdue").length;
  const displayName = studentData.name || "Student";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg text-center">
            <p className="text-[#0F2854] font-semibold">Loading student dashboard...</p>
          </Card>
        </div>
      </div>
    );
  }

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
                Student Dashboard
              </h1>
              <p className="text-[#BDE8F5] mt-1">
                Welcome back, {displayName} 👋
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Your Total Balance
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
              value="balance"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Balance & Due Dates
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Payment History
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5] transition-all"
            >
              Profile
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
                        {displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F2854]">
                      {studentData.name}
                    </h3>
                    <p className="text-sm text-[#4988C4] font-medium">
                      {studentData.id}
                    </p>
                    <Badge className="mt-2 bg-blue-500">
                      {studentData.grade}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Section
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {studentData.section}
                    </p>
                  </div>
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Roll Number
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {studentData.rollNumber}
                    </p>
                  </div>
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5] col-span-2">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Date of Birth
                    </p>
                    <p className="text-[#0F2854] font-bold">
                      {studentData.dateOfBirth}
                    </p>
                  </div>
                  <div className="p-3 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5] col-span-2">
                    <p className="text-[#4988C4] text-xs font-semibold mb-1">
                      Email Address
                    </p>
                    <p className="text-[#0F2854] font-bold break-all text-sm">
                      {studentData.email}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Fee Summary */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Your Fee Summary
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
                      {paymentDues.filter((p) => p.status !== "paid").length}{" "}
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

              {/* Upcoming Events Preview */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Upcoming Events
                  </h2>
                </div>
                <Separator className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcomingEvents
                    .filter((event) => {
                      const eventDate = new Date(event.date);
                      if (Number.isNaN(eventDate.getTime())) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      eventDate.setHours(0, 0, 0, 0);
                      return eventDate.getTime() >= today.getTime();
                    })
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="p-4 border-2 border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="text-[#0F2854] font-bold text-sm">
                            {event.title}
                          </h3>
                          {getEventTypeBadge(event.type)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-[#4988C4] font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event.date}
                          </p>
                          <p className="text-xs text-[#4988C4] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Balance & Due Dates Tab */}
          <TabsContent value="balance" className="space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-semibold text-[#0F2854]">
                  Payment Due Items & Due Dates
                </h2>
              </div>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentDues.map((payment) => (
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
                    <p className="text-xs text-muted-foreground mb-3">
                      {payment.description}
                    </p>
                    {/* {payment.status !== "paid" && (
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] transition-all group-hover:shadow-lg"
                        onClick={() => handlePayNow(payment.id)}
                      >
                        Pay Now
                      </Button>
                    )} */}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-semibold text-[#0F2854]">
                  Payment History & Download Receipts
                </h2>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-3">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => (
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
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-semibold text-[#0F2854]">
                  Upcoming Events & Activities
                </h2>
              </div>
              <Separator className="mb-4" />

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
                  <p className="text-muted-foreground">No events found</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-semibold text-[#0F2854]">
                  My Profile
                </h2>
              </div>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Full Name
                  </p>
                  <p className="text-[#0F2854] font-bold text-lg">
                    {studentData.name}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Student ID
                  </p>
                  <p className="text-[#0F2854] font-bold text-lg">
                    {studentData.id}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Grade
                  </p>
                  <p className="text-[#0F2854] font-bold text-lg">
                    {studentData.grade}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Section
                  </p>
                  <p className="text-[#0F2854] font-bold text-lg">
                    {studentData.section}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Roll Number
                  </p>
                  <p className="text-[#0F2854] font-bold text-lg">
                    {studentData.rollNumber}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5]">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Date of Birth
                  </p>
                  <p className="text-[#0F2854] font-bold text-lg">
                    {studentData.dateOfBirth}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5] md:col-span-2">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Email Address
                  </p>
                  <p className="text-[#0F2854] font-bold break-all">
                    {studentData.email}
                  </p>
                </div>

                <div className="p-4 bg-[#BDE8F5]/10 rounded-lg border border-[#BDE8F5] md:col-span-2">
                  <p className="text-[#4988C4] text-xs font-semibold mb-2">
                    Enrollment Date
                  </p>
                  <p className="text-[#0F2854] font-bold">
                    {studentData.enrollmentDate}
                  </p>
                </div>
              </div>
            </Card>
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
