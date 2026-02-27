import { useEffect, useMemo, useState } from "react";
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
  GraduationCap,
  LogOut,
  MapPin,
  Plus,
  Search,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

const API_BASE = "http://localhost:5000";

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
  return parsed.toISOString().split("T")[0];
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
    const status = String(row.status || "pending").toLowerCase();
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

  const loadDashboardData = async (resolvedParentUserId: string) => {
    try {
      setIsLoading(true);

      const [parentResult, eventsResult] = await Promise.all([
        fetchJsonSafe(`${API_BASE}/api/parents/${resolvedParentUserId}/children`),
        fetchJsonSafe(`${API_BASE}/api/events`),
      ]);

      if (!parentResult.response.ok || !parentResult.data?.success) {
        throw new Error(parentResult.data?.message || "Failed to load parent data");
      }

      const parentRow = parentResult.data.parent || {};
      const childrenRows = Array.isArray(parentResult.data.children)
        ? parentResult.data.children
        : [];

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
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const normalizedEvents: EventItem[] = rows
          .map((row: any) => {
            const eventDateTime = parseDateSafe(row.eventDateTime);
            if (!eventDateTime) return null;
            return {
              id: toStringValue(row._id || row.id),
              title: toStringValue(row.title),
              date: toDateInputValue(eventDateTime),
              time: eventDateTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              location: toStringValue(row.location),
              description: toStringValue(row.description),
            };
          })
          .filter((item: any): item is EventItem => Boolean(item))
          .filter((item: EventItem) => {
            const d = new Date(item.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() >= now.getTime();
          })
          .sort((a: EventItem, b: EventItem) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setEvents(normalizedEvents);
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

  const formatAmount = (amount: number) =>
    hideAmounts ? "****" : `₱${amount.toLocaleString()}`;

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

      toast.success("Child linked successfully.");
      await loadDashboardData(parentUserId);
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-[#0F2854]" />
            </div>
            <div>
              <h1 className="text-3xl text-white font-bold">Parent Dashboard</h1>
              <p className="text-[#BDE8F5]">
                Welcome, {parentProfile?.fullName || "Parent"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
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
            >
              {hideAmounts ? "Show Amounts" : "Hide Amounts"}
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white/95 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Total Children</p>
            <p className="text-3xl font-bold text-[#0F2854]">{children.length}</p>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Family Balance</p>
            <p className="text-3xl font-bold text-red-600">{formatAmount(totalDue)}</p>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-3xl font-bold text-green-600">{formatAmount(totalPaid)}</p>
          </Card>
        </div>

        <Card className="p-4 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <Button
                key={child.userId}
                variant={selectedChildUserId === child.userId ? "default" : "outline"}
                className={
                  selectedChildUserId === child.userId
                    ? "bg-[#1C4D8D]"
                    : "border-[#BDE8F5] text-[#0F2854]"
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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="overview" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="balance" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white">Balance</TabsTrigger>
            <TabsTrigger value="payments" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white">Payments</TabsTrigger>
            <TabsTrigger value="events" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white">Events</TabsTrigger>
            <TabsTrigger value="profile" className="text-[#BDE8F5] data-[state=active]:bg-white/20 data-[state=active]:text-white">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/95 backdrop-blur-sm">
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

              <Card className="p-6 bg-white/95 backdrop-blur-sm">
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
            </div>
          </TabsContent>

          <TabsContent value="balance">
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-semibold text-[#0F2854]">Payment Due Items</h3>
              </div>
              <Separator className="mb-4" />
              {currentChild && currentChild.paymentDues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentChild.paymentDues.map((item) => (
                    <div key={item.id} className="p-4 border border-[#BDE8F5] rounded-lg">
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
                <p className="text-sm text-[#4988C4]">No fee dues for selected child.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-semibold text-[#0F2854]">Payment History</h3>
              </div>
              <Separator className="mb-4" />
              {currentChild && currentChild.paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {currentChild.paymentHistory.map((item) => (
                    <div key={item.id} className="p-4 border border-[#BDE8F5] rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#0F2854]">{item.type}</p>
                          <p className="text-xs text-[#4988C4]">{item.date}</p>
                        </div>
                        <Badge className="bg-green-600">Paid</Badge>
                      </div>
                      <p className="text-lg font-bold text-[#1C4D8D] mt-2">{formatAmount(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">Method: {item.method}</p>
                      <p className="text-xs text-muted-foreground">Receipt: {item.receiptNumber}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#4988C4]">No payment history for selected child.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-semibold text-[#0F2854]">Upcoming School Events</h3>
              </div>
              <Separator className="mb-4" />
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border border-[#BDE8F5] rounded-lg">
                      <h4 className="font-semibold text-[#0F2854] mb-1">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{event.description || "-"}</p>
                      <p className="text-xs text-[#4988C4] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {event.date}
                      </p>
                      <p className="text-xs text-[#4988C4] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {event.time}
                      </p>
                      <p className="text-xs text-[#4988C4] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {event.location || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#4988C4]">No upcoming events found.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-semibold text-[#0F2854]">My Children</h3>
              </div>
              <Separator className="mb-4" />
              {children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {children.map((child) => (
                    <div key={child.userId} className="p-4 border border-[#BDE8F5] rounded-lg">
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
              Search unlinked students and connect them to your parent account.
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
                  Link Child
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
