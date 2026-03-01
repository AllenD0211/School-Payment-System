import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  Plus,
  Search,
  TrendingUp,
  User,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import jsPDF from "jspdf";

const API_BASE = "http://localhost:5000";
const EVENT_SYNC_STORAGE_KEY = "events_last_updated_at";
const EVENT_SYNC_WINDOW_EVENT = "events-updated";

type JwtPayload = {
  id?: string;
  _id?: string;
  email?: string;
  userType?: string;
};

type SessionUser = {
  id?: string;
  _id?: string;
  email?: string;
  userType?: string;
};

type ParentProfile = {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
};

type PaymentDue = {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  description: string;
};

type PaymentHistory = {
  id: string;
  date: string;
  amount: number;
  type: string;
  method: string;
  receiptNumber: string;
};

type Child = {
  userId: string;
  studentId: string;
  fullName: string;
  gradeSection: string;
  gender: string;
  birthdate: string;
  paymentDues: PaymentDue[];
  paymentHistory: PaymentHistory[];
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: "academic" | "sports" | "cultural" | "meeting";
};

type UnlinkedStudent = {
  userId: string;
  studentId: string;
  fullName: string;
  gradeSection: string;
};

const toStringValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDateSafe = (value: unknown) => {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (value: unknown) => {
  const parsed = parseDateSafe(value);
  if (!parsed) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const normalizeFeeRows = (rows: any[]): PaymentDue[] =>
  rows.map((row) => {
    const status = String(row.status || "pending").trim().toLowerCase();
    const normalizedStatus: PaymentDue["status"] =
      status === "paid" || status === "overdue" ? status : "pending";
    const feeType = toStringValue(row.fee_type ?? row.feeType);
    return {
      id: toStringValue(row.fee_id ?? row._id ?? row.id),
      type: feeType || "Fee",
      amount: toSafeNumber(row.amount),
      dueDate: toDateInputValue(row.due_date ?? row.dueDate),
      status: normalizedStatus,
      description: `${feeType || "Fee"} record`,
    };
  });

const inferEventType = (
  title: string,
  description: string,
): EventItem["type"] => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("sport")) return "sports";
  if (text.includes("meeting") || text.includes("parent")) return "meeting";
  if (text.includes("fair") || text.includes("cultural")) return "cultural";
  return "academic";
};

const normalizeEventRows = (rows: any[]): EventItem[] =>
  (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const normalized = rows
      .map((row: any) => {
        const eventDateTime = parseDateSafe(
          row.eventDateTime ?? row.date ?? row.event_date ?? row.createdAt,
        );
        if (!eventDateTime) return null;
        const eventDay = new Date(
          eventDateTime.getFullYear(),
          eventDateTime.getMonth(),
          eventDateTime.getDate(),
        ).getTime();
        const title = toStringValue(row.title);
        const description = toStringValue(row.description);
        return {
          id: toStringValue(row._id || row.id),
          title,
          date: toDateInputValue(eventDateTime),
          time: eventDateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          location: toStringValue(row.location),
          description,
          type: inferEventType(title, description),
          __timestamp: eventDateTime.getTime(),
          __eventDay: eventDay,
        };
      })
      .filter(
        (
          item,
        ): item is EventItem & { __timestamp: number; __eventDay: number } =>
          Boolean(item),
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
      .map(({ __timestamp, __eventDay, ...item }) => item);
  })();

const splitGradeSection = (gradeSection: string) => {
  const cleaned = toStringValue(gradeSection).trim();
  if (!cleaned) {
    return { grade: "Not Provided", section: "Not Provided" };
  }

  const separators = [" - ", "-", " / ", "/", "|"];
  for (const separator of separators) {
    if (!cleaned.includes(separator)) continue;
    const [gradePart, sectionPart] = cleaned
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean);
    return {
      grade: gradePart || cleaned,
      section: sectionPart || "Not Provided",
    };
  }

  return {
    grade: cleaned,
    section: "Not Provided",
  };
};

const generateProfessionalReceipt = (payment: PaymentHistory, child: Child) => {
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
  const { grade, section } = splitGradeSection(child.gradeSection);

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
  doc.rect(margin, yPosition - 3, contentWidth, 28, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition - 3, contentWidth, 28);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("STUDENT DETAILS", margin + 3, yPosition + 2);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  const studentBoxY = yPosition + 8;
  doc.text(`Name: ${child.fullName}`, margin + 3, studentBoxY);
  doc.text(`Student ID: ${child.studentId}`, margin + 3, studentBoxY + 5);
  doc.text(`Grade: ${grade}`, margin + 3, studentBoxY + 10);
  doc.text(`Section: ${section}`, margin + 3, studentBoxY + 15);

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
    `• Student: ${child.fullName}`,
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
  const [isLoading, setIsLoading] = useState(true);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [parentUserId, setParentUserId] = useState("");
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUserId, setSelectedChildUserId] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);

  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnlinkedStudent[]>([]);

  const loadUnlinkedStudents = async (query: string) => {
    try {
      setIsSearching(true);
      const { response, data } = await fetchJsonSafe(
        `${API_BASE}/api/parents/unlinked-students?q=${encodeURIComponent(query.trim())}`,
      );
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to search unlinked students");
      }
      const rows = Array.isArray(data.students) ? data.students : [];
      setSearchResults(
        rows.map((row: any) => ({
          userId: toStringValue(row.userId),
          studentId: toStringValue(row.studentId),
          fullName: toStringValue(row.fullName),
          gradeSection: toStringValue(row.gradeSection),
        })),
      );
    } catch (error: any) {
      toast.error(error?.message || "Failed to search students");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadEvents = useCallback(async () => {
    const eventsResult = await fetchJsonSafe(`${API_BASE}/api/events`);
    if (eventsResult.response.ok && eventsResult.data?.success) {
      const rows = Array.isArray(eventsResult.data.events)
        ? eventsResult.data.events
        : [];
      setEvents(normalizeEventRows(rows));
      return;
    }
    setEvents([]);
  }, []);

  const loadDashboardData = async (resolvedParentUserId: string) => {
    try {
      setIsLoading(true);

      const [parentResult, eventsResult] = await Promise.all([
        fetchJsonSafe(`${API_BASE}/api/parents/${resolvedParentUserId}/children`),
        fetchJsonSafe(`${API_BASE}/api/events`),
      ]);

      const sessionEmail = toStringValue(parseSessionUser(localStorage.getItem("user"))?.email);
      let parentRow: any = {};
      let childrenRows: any[] = [];

      if (parentResult.response.ok && parentResult.data?.success) {
        parentRow = parentResult.data.parent || {};
        childrenRows = Array.isArray(parentResult.data.children)
          ? parentResult.data.children
          : [];
      } else {
        parentRow = { userId: resolvedParentUserId, email: sessionEmail };
        childrenRows = [];
      }

      setParentProfile({
        userId: toStringValue(parentRow.userId),
        fullName: toStringValue(parentRow.fullName),
        email: toStringValue(parentRow.email) || "Not Provided",
        phoneNumber: toStringValue(parentRow.phoneNumber) || "Not Provided",
        gender: toStringValue(parentRow.gender) || "Not Provided",
      });

      const feesPerChild = await Promise.all(
        childrenRows.map(async (child: any) => {
          const childUserId = toStringValue(child.userId);
          const feeResult = await fetchJsonSafe(
            `${API_BASE}/api/fees/student/${childUserId}`,
          );
          const feeRows = Array.isArray(feeResult.data?.fees)
            ? feeResult.data.fees
            : [];
          return {
            childUserId,
            dues: normalizeFeeRows(feeRows),
          };
        }),
      );

      const duesMap = new Map(
        feesPerChild.map((entry) => [entry.childUserId, entry.dues]),
      );

      const normalizedChildren: Child[] = childrenRows.map((child: any) => {
        const childUserId = toStringValue(child.userId);
        const dues = duesMap.get(childUserId) || [];
        const history: PaymentHistory[] = dues
          .filter((item: PaymentDue) => item.status === "paid")
          .map((item: PaymentDue) => ({
            id: item.id,
            date: item.dueDate,
            amount: item.amount,
            type: item.type,
            method: "Recorded",
            receiptNumber: `RCP-${item.id.slice(-8).toUpperCase()}`,
          }))
          .sort((a: PaymentHistory, b: PaymentHistory) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          userId: childUserId,
          studentId: toStringValue(child.studentId),
          fullName: toStringValue(child.fullName),
          gradeSection: toStringValue(child.gradeSection),
          gender: toStringValue(child.gender),
          birthdate: toDateInputValue(child.birthdate),
          paymentDues: dues,
          paymentHistory: history,
        };
      });

      setChildren(normalizedChildren);
      setSelectedChildUserId((prev) =>
        prev && normalizedChildren.some((child) => child.userId === prev)
          ? prev
          : normalizedChildren[0]?.userId || "",
      );

      if (eventsResult.response.ok && eventsResult.data?.success) {
        const rows = Array.isArray(eventsResult.data.events)
          ? eventsResult.data.events
          : [];
        setEvents(normalizeEventRows(rows));
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load parent dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = parseSessionUser(localStorage.getItem("user"));
    if (!token) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    const payload = parseJwtToken(token);
    const resolvedUserId = storedUser?.id
      ? String(storedUser.id)
      : storedUser?._id
        ? String(storedUser._id)
        : payload?.id
          ? String(payload.id)
          : payload?._id
            ? String(payload._id)
            : "";
    const resolvedUserType = String(storedUser?.userType || payload?.userType || "")
      .trim()
      .toLowerCase();

    if (!resolvedUserId) {
      toast.error("Invalid session. Please login again.");
      navigate("/login");
      return;
    }

    if (resolvedUserType && resolvedUserType !== "parent") {
      toast.error("Unauthorized dashboard access.");
      navigate("/login");
      return;
    }

    setParentUserId(resolvedUserId);
    loadDashboardData(resolvedUserId);
  }, [navigate]);

  useEffect(() => {
    if (!parentUserId) return;

    const syncEvents = () => {
      loadEvents();
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
  }, [parentUserId, loadEvents]);

  const currentChild = useMemo(
    () => children.find((child) => child.userId === selectedChildUserId) || null,
    [children, selectedChildUserId],
  );

  const familyDues = useMemo(
    () =>
      children
        .flatMap((child) => child.paymentDues)
        .filter((item) => item.status !== "paid"),
    [children],
  );

  const familyHistory = useMemo(
    () => children.flatMap((child) => child.paymentHistory),
    [children],
  );

  const totalDue = familyDues.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = familyHistory.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = familyDues.filter((item) => item.status === "pending").length;
  const overdueCount = familyDues.filter((item) => item.status === "overdue").length;

  const currentChildPending = currentChild
    ? currentChild.paymentDues.filter((item) => item.status === "pending").length
    : 0;
  const currentChildOverdue = currentChild
    ? currentChild.paymentDues.filter((item) => item.status === "overdue").length
    : 0;
  const currentChildOutstandingDues = currentChild
    ? currentChild.paymentDues.filter(
        (item) => item.status === "pending" || item.status === "overdue",
      )
    : [];
  const upcomingEventsPreview = useMemo(
    () =>
      events
        .filter((event) => {
          const eventDate = new Date(event.date);
          if (Number.isNaN(eventDate.getTime())) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() >= today.getTime();
        })
        .slice(0, 3),
    [events],
  );

  const formatAmount = (amount: number) =>
    hideAmounts ? "****" : `₱${amount.toLocaleString()}`;
  const displayName = parentProfile?.fullName || "Parent";

  const getPaymentStatusBadge = (status: string) => {
    if (status === "paid") {
      return (
        <Badge className="bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    }
    if (status === "overdue") {
      return (
        <Badge className="bg-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getEventTypeBadge = (type: EventItem["type"]) => {
    const colors = {
      academic: "bg-blue-500 hover:bg-blue-600",
      sports: "bg-green-500 hover:bg-green-600",
      cultural: "bg-purple-500 hover:bg-purple-600",
      meeting: "bg-orange-500 hover:bg-orange-600",
    };
    return (
      <Badge className={colors[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const handleAddChild = async (studentUserId: string) => {
    if (!parentUserId) return;
    try {
      const { response, data } = await fetchJsonSafe(
        `${API_BASE}/api/parents/${parentUserId}/children`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentUserId }),
        },
      );

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to add child");
      }

      toast.success(data?.message || "Link request sent.");
      await loadUnlinkedStudents(searchInput);
    } catch (error: any) {
      toast.error(error?.message || "Failed to add child");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleDownloadReceipt = (payment: PaymentHistory) => {
    if (!currentChild) {
      toast.error("Select a child first to download a receipt.");
      return;
    }

    try {
      const doc = generateProfessionalReceipt(payment, currentChild);
      const receiptId = payment.receiptNumber || `RCP-${payment.id}`;
      doc.save(`receipt-${receiptId}.pdf`);
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate receipt");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg text-center">
            <p className="text-[#0F2854] font-semibold">Loading parent dashboard...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <GraduationCap className="w-10 h-10 text-[#0F2854]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Parent Dashboard</h1>
              <p className="text-[#BDE8F5] mt-1">Welcome back, {displayName} 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => {
                setIsAddChildOpen(true);
                loadUnlinkedStudents(searchInput);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => setHideAmounts((prev) => !prev)}
              title={hideAmounts ? "Show amounts" : "Hide amounts"}
            >
              {hideAmounts ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Children</p>
                <p className="text-3xl font-bold text-[#0F2854]">{children.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-8 h-8 text-[#1C4D8D]" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Family Balance</p>
                <p className="text-3xl font-bold text-red-600">{formatAmount(totalDue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">{formatAmount(totalPaid)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all mb-6">
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <Button
                key={child.userId}
                variant={selectedChildUserId === child.userId ? "default" : "outline"}
                className={
                  selectedChildUserId === child.userId
                    ? "bg-[#1C4D8D] hover:bg-[#0F2854]"
                    : "border-[#BDE8F5] text-[#0F2854] hover:border-[#4988C4] hover:bg-[#F5FAFB]"
                }
                onClick={() => setSelectedChildUserId(child.userId)}
              >
                {child.fullName} ({child.studentId})
              </Button>
            ))}
            {children.length === 0 && (
              <p className="text-sm text-[#4988C4]">No children linked yet.</p>
            )}
          </div>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <TabsTrigger value="overview" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Overview</TabsTrigger>
            <TabsTrigger value="balance" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Balance</TabsTrigger>
            <TabsTrigger value="payments" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Payments</TabsTrigger>
            <TabsTrigger value="events" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Events</TabsTrigger>
            <TabsTrigger value="profile" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-[#1C4D8D]" />
                  <h3 className="text-xl font-semibold text-[#0F2854]">Parent Info</h3>
                </div>
                <Separator className="mb-4" />
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-[#0F2854]">Name:</span> {parentProfile?.fullName || "-"}</p>
                  <p><span className="font-semibold text-[#0F2854]">Email:</span> {parentProfile?.email || "-"}</p>
                  <p><span className="font-semibold text-[#0F2854]">Phone:</span> {parentProfile?.phoneNumber || "-"}</p>
                  <p><span className="font-semibold text-[#0F2854]">Gender:</span> {parentProfile?.gender || "-"}</p>
                </div>
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[#1C4D8D]" />
                  <h3 className="text-xl font-semibold text-[#0F2854]">Selected Child</h3>
                </div>
                <Separator className="mb-4" />
                {currentChild ? (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold text-[#0F2854]">Name:</span> {currentChild.fullName}</p>
                    <p><span className="font-semibold text-[#0F2854]">Student ID:</span> {currentChild.studentId}</p>
                    <p><span className="font-semibold text-[#0F2854]">Grade & Section:</span> {currentChild.gradeSection || "-"}</p>
                    <p><span className="font-semibold text-[#0F2854]">Pending:</span> {currentChildPending}</p>
                    <p><span className="font-semibold text-[#0F2854]">Overdue:</span> {currentChildOverdue}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#4988C4]">Select a child to view details.</p>
                )}
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl font-semibold text-[#0F2854]">
                    Upcoming Events
                  </h2>
                </div>
                <Separator className="mb-4" />

                {upcomingEventsPreview.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {upcomingEventsPreview.map((event) => (
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming events found</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-semibold text-[#0F2854]">Payment Due Items</h3>
              </div>
              <Separator className="mb-4" />
              {currentChild && currentChildOutstandingDues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentChildOutstandingDues.map((item) => (
                    <div key={item.id} className="p-4 border-2 border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="font-semibold text-[#0F2854]">{item.type}</p>
                        {getPaymentStatusBadge(item.status)}
                      </div>
                      <p className="text-xl font-bold text-[#1C4D8D]">{formatAmount(item.amount)}</p>
                      <p className="text-xs text-[#4988C4] mt-1">Due: {item.dueDate || "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#4988C4]">
                  No pending or overdue fees for selected child.
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-semibold text-[#0F2854]">
                  Payment History & Download Receipts
                </h2>
              </div>
              <Separator className="mb-4" />
              {currentChild && currentChild.paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {currentChild.paymentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-[#0F2854] font-bold">{item.type}</p>
                          <p className="text-xs text-[#4988C4] mt-1">
                            {item.date}
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
                            {formatAmount(item.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Method: {item.method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Receipt: {item.receiptNumber}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] transition-all whitespace-nowrap"
                          onClick={() => handleDownloadReceipt(item)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No payment history for selected child.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#1C4D8D]" />
                <h2 className="text-xl font-semibold text-[#0F2854]">
                  Upcoming Events & Activities
                </h2>
              </div>
              <Separator className="mb-4" />
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
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

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-semibold text-[#0F2854]">My Children</h3>
              </div>
              <Separator className="mb-4" />
              {children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {children.map((child) => (
                    <div key={child.userId} className="p-4 border-2 border-[#BDE8F5] rounded-lg hover:border-[#4988C4] hover:shadow-md transition-all">
                      <p className="font-semibold text-[#0F2854]">{child.fullName}</p>
                      <p className="text-sm text-[#4988C4]">{child.studentId}</p>
                      <p className="text-sm text-[#0F2854] mt-1">{child.gradeSection || "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Birthdate: {child.birthdate || "-"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#4988C4]">No children linked yet.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#0F2854]">Add Child</DialogTitle>
            <DialogDescription>
              Search unlinked students and send a link request for student confirmation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by student ID, name, or grade section"
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => loadUnlinkedStudents(searchInput)}
              disabled={isSearching}
              className="bg-[#1C4D8D] hover:bg-[#0F2854]"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="max-h-80 overflow-auto border border-[#BDE8F5] rounded-lg p-3 space-y-2">
            {searchResults.length === 0 && (
              <p className="text-sm text-[#4988C4]">No unlinked students found.</p>
            )}
            {searchResults.map((row) => (
              <div
                key={row.userId}
                className="flex items-center justify-between border border-[#BDE8F5] rounded-md px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-[#0F2854]">{row.fullName}</p>
                  <p className="text-xs text-[#4988C4]">
                    {row.studentId} • {row.gradeSection || "-"}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddChild(row.userId)}
                  className="bg-[#1C4D8D] hover:bg-[#0F2854]"
                >
                  Request Link
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
