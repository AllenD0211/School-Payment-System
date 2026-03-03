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
import { apiUrl } from "@/lib/api";

const EVENT_SYNC_STORAGE_KEY = "events_last_updated_at";
const EVENT_SYNC_WINDOW_EVENT = "events-updated";

type DashboardStudent = {
  student_id: string;
  fee_summary?: {
    paidAmount?: number;
    pendingAmount?: number;
    overdueAmount?: number;
  };
};

const toStringValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toLocalDateTime = (value: unknown) => {
  if (!value) return "-";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const normalizeReceiptStatus = (
  value: unknown,
): ReceiptFeedback["status"] => {
  const normalized = toStringValue(value).toLowerCase();
  if (
    normalized === "sent" ||
    normalized === "pending" ||
    normalized === "delivered" ||
    normalized === "read" ||
    normalized === "acknowledged"
  ) {
    return normalized;
  }
  return "sent";
};

const normalizeSentVia = (value: unknown): ReceiptFeedback["sentVia"] => {
  const normalized = toStringValue(value).toLowerCase();
  return normalized === "sms" ? "sms" : "email";
};

const mapReceiptToFeedback = (row: any): ReceiptFeedback => ({
  id: toStringValue(row?._id || row?.id || row?.receiptNumber),
  receiptNumber: toStringValue(row?.receiptNumber),
  studentName: toStringValue(row?.studentName),
  amount: toSafeNumber(row?.amount),
  sentVia: normalizeSentVia(row?.sentVia),
  sentTo: toStringValue(row?.sentTo),
  sentAt: toLocalDateTime(row?.paymentDate || row?.createdAt),
  status: normalizeReceiptStatus(row?.status),
  paymentDescription: toStringValue(row?.paymentDescription),
  parentFeedback: toStringValue(row?.parentFeedback) || undefined,
  feedbackAt: toStringValue(row?.feedbackAt) || undefined,
});

const normalizeNotificationStatus = (
  value: unknown,
): Notification["status"] => {
  const normalized = toStringValue(value).toLowerCase();
  return normalized === "sent" ? "sent" : "pending";
};

const normalizeNotificationMethod = (
  value: unknown,
): NonNullable<Notification["method"]> => {
  const normalized = toStringValue(value).toLowerCase();
  return normalized === "sms" ? "sms" : "email";
};

const mapNotificationRow = (row: any): Notification => ({
  id: toStringValue(row?.id || row?._id),
  recipient: toStringValue(row?.recipient),
  message: toStringValue(row?.message),
  timestamp: toLocalDateTime(row?.timestamp || row?.sentAt || row?.createdAt),
  status: normalizeNotificationStatus(row?.status),
  method: normalizeNotificationMethod(row?.method),
});

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentReceipts, setSentReceipts] = useState<ReceiptFeedback[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  const buildAuthHeaders = (includeJson = false): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      ...(includeJson ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handleAuthFailure = (status: number) => {
    if (status !== 401 && status !== 403) return false;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.error("Session expired. Please login again.");
    navigate("/login", { replace: true });
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const loadStudentsSummary = async () => {
    const { response, data } = await fetchJsonSafe(apiUrl("/api/admin/students"), {
      headers: buildAuthHeaders()
    });
    if (!response.ok) {
      if (handleAuthFailure(response.status)) return;
      toast.error(data?.message || "Failed to load students");
      return;
    }

    if (data?.success) {
      setStudents(data.students || []);
    } else {
      toast.error(data?.message || "Failed to load students");
    }
  };

  const loadNotifications = async () => {
    const { response, data } = await fetchJsonSafe(apiUrl("/api/notifications"), {
      headers: buildAuthHeaders()
    });
    if (!response.ok) {
      if (handleAuthFailure(response.status)) return;
      toast.error(data?.message || "Failed to load notifications");
      return;
    }
    if (!data?.success) {
      toast.error(data?.message || "Failed to load notifications");
      return;
    }

    const rows = Array.isArray(data.notifications) ? data.notifications : [];
    setNotifications(rows.map(mapNotificationRow));
  };

  const loadReceipts = async () => {
    const { response, data } = await fetchJsonSafe(apiUrl("/api/receipts"), {
      headers: buildAuthHeaders()
    });
    if (!response.ok) {
      if (handleAuthFailure(response.status)) return;
      toast.error(data?.message || "Failed to load receipts");
      return;
    }
    if (!data?.success) {
      toast.error(data?.message || "Failed to load receipts");
      return;
    }

    const rows = Array.isArray(data.receipts) ? data.receipts : [];
    setSentReceipts(rows.map(mapReceiptToFeedback));
  };

  useEffect(() => {
    loadStudentsSummary();
  }, []);

  useEffect(() => {
    fetchEvents();
    loadNotifications();
    loadReceipts();
  }, []);

  const notifyEventSync = () => {
    const timestamp = String(Date.now());
    localStorage.setItem(EVENT_SYNC_STORAGE_KEY, timestamp);
    window.dispatchEvent(new Event(EVENT_SYNC_WINDOW_EVENT));
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(apiUrl("/api/events"), {
        headers: buildAuthHeaders()
      });
      const data = await response.json();

      if (handleAuthFailure(response.status)) return;

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

  const handleResendReceipt = async (receiptId: string) => {
    const target = sentReceipts.find((item) => item.id === receiptId);
    if (!target) {
      toast.error("Receipt not found");
      return;
    }

    const { response, data } = await fetchJsonSafe(apiUrl(`/api/receipts/${receiptId}/resend`), {
      method: "POST",
      headers: buildAuthHeaders()
    });

    if (!response.ok || !data?.success) {
      if (handleAuthFailure(response.status)) return;
      toast.error(data?.message || "Failed to resend receipt");
      return;
    }

    if (data?.receipt) {
      const refreshed = mapReceiptToFeedback(data.receipt);
      setSentReceipts((prev) =>
        prev.map((item) => (item.id === refreshed.id ? refreshed : item))
      );
    }

    toast.success(data?.message || `Receipt resent to ${target.sentTo}`);
  };

  const handleNotificationSent = (notification: Notification) => {
    setNotifications((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== notification.id);
      return [notification, ...withoutCurrent];
    });
  };

  const handleClearAllNotifications = async () => {
    const { response, data } = await fetchJsonSafe(apiUrl("/api/notifications"), {
      method: "DELETE",
      headers: buildAuthHeaders()
    });

    if (!response.ok || !data?.success) {
      if (handleAuthFailure(response.status)) return false;
      toast.error(data?.message || "Failed to clear notifications");
      return false;
    }

    setNotifications([]);
    return true;
  };

  const handleClearAllReceipts = async () => {
    const { response, data } = await fetchJsonSafe(apiUrl("/api/receipts"), {
      method: "DELETE",
      headers: buildAuthHeaders()
    });

    if (!response.ok || !data?.success) {
      if (handleAuthFailure(response.status)) return false;
      toast.error(data?.message || "Failed to clear receipts");
      return false;
    }

    setSentReceipts([]);
    return true;
  };

  const handleAddManualReceipt = async (
    receipt: Omit<ReceiptFeedback, "id" | "sentAt" | "status">,
  ) => {
    const { response, data } = await fetchJsonSafe(apiUrl("/api/receipts/manual"), {
      method: "POST",
      headers: buildAuthHeaders(true),
      body: JSON.stringify({
        receiptNumber: receipt.receiptNumber,
        studentName: receipt.studentName,
        amount: receipt.amount,
        sentVia: receipt.sentVia,
        sentTo: receipt.sentTo,
        paymentDescription: receipt.paymentDescription,
      }),
    });

    if (!response.ok || !data?.success) {
      if (handleAuthFailure(response.status)) return false;
      toast.error(data?.message || "Failed to add manual receipt");
      return false;
    }

    if (data.receipt) {
      const createdReceipt = mapReceiptToFeedback(data.receipt);
      setSentReceipts((prev) => [createdReceipt, ...prev]);
    } else {
      await loadReceipts();
    }

    return true;
  };

  const handleAddEvent = async (event: Omit<SchoolEvent, "id">) => {
    try {
      const response = await fetch(apiUrl("/api/events"), {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          location: event.location,
          eventDateTime: new Date(`${event.date}T${event.time}`),
        }),
      });

      const data = await response.json();
      if (handleAuthFailure(response.status)) return false;
      if (!response.ok || !data.success) {
        toast.error(data?.message || "Failed to add event");
        return false;
      }
      await fetchEvents();
      notifyEventSync();
      return true;
    } catch (error) {
      toast.error("Failed to add event");
      return false;
    }
  };

  const handleUpdateEvent = async (updatedEvent: SchoolEvent) => {
    try {
      const response = await fetch(apiUrl(`/api/events/${updatedEvent.id}`), {
        method: "PUT",
        headers: buildAuthHeaders(true),
        body: JSON.stringify({
          title: updatedEvent.title,
          description: updatedEvent.description,
          location: updatedEvent.location,
          eventDateTime: new Date(`${updatedEvent.date}T${updatedEvent.time}`),
        }),
      });
      const data = await response.json();
      if (handleAuthFailure(response.status)) return false;
      if (!response.ok || !data.success) {
        toast.error(data?.message || "Failed to update event");
        return false;
      }
      await fetchEvents();
      notifyEventSync();
      return true;
    } catch {
      toast.error("Failed to update event");
      return false;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(apiUrl(`/api/events/${id}`), {
        method: "DELETE",
        headers: buildAuthHeaders()
      });
      const data = await response.json();
      if (handleAuthFailure(response.status)) return false;
      if (!response.ok || !data.success) {
        toast.error(data?.message || "Failed to delete event");
        return false;
      }
      await fetchEvents();
      notifyEventSync();
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
              onClick={handleLogout}
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
            <StudentTable
              onNotificationSent={handleNotificationSent}
              onStudentDeleted={loadStudentsSummary}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <FeeStats />
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationPanel
              notifications={notifications}
              onClearAllNotifications={handleClearAllNotifications}
            />
          </TabsContent>

          <TabsContent value="receipts">
            <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <ReceiptFeedbackPanel
                receipts={sentReceipts}
                onResendReceipt={handleResendReceipt}
                onClearAllReceipts={handleClearAllReceipts}
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
