import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  ReceiptText,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

type StudentListItem = {
  status: StudentStatus;
  student_doc_id: string;
  student_user_id: string;
  student_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: string;
  birth_date: string;
  full_name: string;
  gradeSection: string;
  connected_to_parent: boolean;
  parent_id: string | null;
};

type StudentStatus = "active" | "inactive" | "transferred" | "graduated" | "archived";

type ParentInfo = {
  parent_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  contact_number: string;
  email: string;
};

type FeeRecord = {
  fee_id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  status: "paid" | "pending" | "overdue";
  created_at: string;
};

type StudentDetail = {
  student: {
    status: StudentStatus;
    student_doc_id: string;
    student_user_id: string;
    student_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender: string;
    birth_date: string;
    gradeSection: string;
    parent_id: string | null;
  };
  parent: ParentInfo | null;
  fees: FeeRecord[];
};

type FeeForm = {
  fee_type: string;
  amount: string;
  due_date: string;
  status: "pending" | "paid" | "overdue";
};

type SentNotification = {
  id: string;
  recipient: string;
  message: string;
  timestamp: string;
  status: "sent" | "pending";
  method: "sms" | "email";
};

type StudentTableProps = {
  onNotificationSent?: (notification: SentNotification) => void;
  onStudentDeleted?: () => void;
};

type NotifyForm = {
  message: string;
};

const EMPTY_FEE_FORM: FeeForm = {
  fee_type: "",
  amount: "",
  due_date: "",
  status: "pending",
};

const EMPTY_NOTIFY_FORM: NotifyForm = {
  message: "",
};

const toStringValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const composeName = (firstName?: string, middleName?: string, lastName?: string) => {
  return [firstName, middleName, lastName]
    .map((part) => toStringValue(part).trim())
    .filter(Boolean)
    .join(" ");
};

const normalizeStudentStatus = (value: unknown): StudentStatus => {
  const normalized = toStringValue(value).trim().toLowerCase();
  if (
    normalized === "active" ||
    normalized === "inactive" ||
    normalized === "transferred" ||
    normalized === "graduated" ||
    normalized === "archived"
  ) {
    return normalized;
  }
  return "active";
};

const getStudentStatusMeta = (status: StudentStatus) => {
  if (status === "inactive") {
    return {
      label: "Inactive",
      className: "bg-red-600 hover:bg-red-700",
    };
  }
  if (status === "transferred") {
    return {
      label: "Transferred",
      className: "bg-amber-500 hover:bg-amber-600",
    };
  }
  if (status === "graduated") {
    return {
      label: "Graduated",
      className: "bg-slate-600 hover:bg-slate-700",
    };
  }
  if (status === "archived") {
    return {
      label: "Archived",
      className: "bg-zinc-700 hover:bg-zinc-800",
    };
  }
  return {
    label: "Active",
    className: "bg-emerald-600 hover:bg-emerald-700",
  };
};

const normalizeStudentItem = (raw: any): StudentListItem => {
  const rawUserId = raw?.student_user_id ?? raw?.userId;
  const normalizedUserId =
    rawUserId && typeof rawUserId === "object"
      ? toStringValue(rawUserId?._id)
      : toStringValue(rawUserId);

  const firstName = toStringValue(raw?.first_name ?? raw?.firstName);
  const middleName = toStringValue(raw?.middle_name ?? raw?.middleName);
  const lastName = toStringValue(raw?.last_name ?? raw?.lastName);

  const parentIdRaw = raw?.parent_id ?? raw?.parentId ?? null;
  const connectedRaw = raw?.connected_to_parent ?? raw?.connectedToParent;
  const connected =
    typeof connectedRaw === "boolean"
      ? connectedRaw
      : Boolean(parentIdRaw);

  return {
    status: normalizeStudentStatus(raw?.status),
    student_doc_id: toStringValue(raw?._id),
    student_user_id: normalizedUserId,
    student_id: toStringValue(raw?.student_id ?? raw?.studentId),
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    gender: toStringValue(raw?.gender),
    birth_date: toStringValue(raw?.birth_date ?? raw?.birthdate),
    full_name:
      toStringValue(raw?.full_name ?? raw?.fullName) ||
      composeName(firstName, middleName, lastName),
    gradeSection: toStringValue(raw?.gradeSection),
    connected_to_parent: connected,
    parent_id: parentIdRaw ? toStringValue(parentIdRaw) : null,
  };
};

const normalizeFeeRecord = (raw: any): FeeRecord => ({
  fee_id: toStringValue(raw?.fee_id ?? raw?._id ?? raw?.id),
  fee_type: toStringValue(raw?.fee_type ?? raw?.feeType),
  amount: Number(raw?.amount ?? 0),
  due_date: toStringValue(raw?.due_date ?? raw?.dueDate),
  status: toStringValue(raw?.status || "pending").toLowerCase() as FeeRecord["status"],
  created_at: toStringValue(raw?.created_at ?? raw?.createdAt),
});

const fetchJsonSafe = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  const rawText = await response.text();
  let parsed: any = null;

  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    const compact = rawText.replace(/\s+/g, " ").trim();
    const plain = compact.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return {
      response,
      data: {
        success: false,
        message:
          plain ||
          `Non-JSON response from ${url} (status ${response.status})`,
      },
    };
  }

  return { response, data: parsed };
};

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const toReadableStatus = (status: FeeRecord["status"]) => {
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  return "Pending";
};

const formatDate = (dateValue?: string | Date) => {
  if (!dateValue) return "-";
  if (typeof dateValue === "string") {
    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().split("T")[0];
};

const toInputDateValue = (dateValue?: string | Date) => {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

const normalizeNotificationPayload = (raw: any): SentNotification | null => {
  if (!raw || typeof raw !== "object") return null;
  const method = toStringValue(raw.method).toLowerCase() === "sms" ? "sms" : "email";
  const status = toStringValue(raw.status).toLowerCase() === "sent" ? "sent" : "pending";

  return {
    id: toStringValue(raw.id ?? raw._id),
    recipient: toStringValue(raw.recipient),
    message: toStringValue(raw.message),
    timestamp: toStringValue(raw.timestamp ?? raw.sentAt ?? raw.createdAt),
    status,
    method,
  };
};

export function StudentTable({
  onNotificationSent,
  onStudentDeleted,
}: StudentTableProps = {}) {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [selectedStudentUserId, setSelectedStudentUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StudentStatus>("all");
  const [statusAction, setStatusAction] = useState<StudentStatus | "">("");
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [feeForm, setFeeForm] = useState<FeeForm>(EMPTY_FEE_FORM);
  const [deleteFeeDialogOpen, setDeleteFeeDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<FeeRecord | null>(null);
  const [isDeletingFee, setIsDeletingFee] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notifyForm, setNotifyForm] = useState<NotifyForm>(EMPTY_NOTIFY_FORM);
  const [deleteParentDialogOpen, setDeleteParentDialogOpen] = useState(false);
  const [isDeletingParent, setIsDeletingParent] = useState(false);
  const [deleteStudentDialogOpen, setDeleteStudentDialogOpen] = useState(false);
  const [isUpdatingStudentStatus, setIsUpdatingStudentStatus] = useState(false);

  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const { response, data } = await fetchJsonSafe(apiUrl("/api/admin/students"), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load students");
      }

      const studentRows = Array.isArray(data)
        ? data
        : Array.isArray(data?.students)
          ? data.students
          : [];

      setStudents(studentRows.map(normalizeStudentItem));
    } catch (error: any) {
      toast.error(error.message || "Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const loadStudentDetail = async (studentUserId: string) => {
    try {
      setIsLoadingDetail(true);
      const selected = students.find((s) => s.student_user_id === studentUserId);
      if (!selected) {
        throw new Error("Student not found in current list.");
      }

      let studentDetail: StudentDetail["student"] = {
        status: selected.status,
        student_doc_id: selected.student_doc_id,
        student_user_id: selected.student_user_id,
        student_id: selected.student_id,
        first_name: selected.first_name,
        middle_name: selected.middle_name || "",
        last_name: selected.last_name,
        gender: selected.gender || "",
        birth_date: selected.birth_date || "",
        gradeSection: selected.gradeSection,
        parent_id: selected.parent_id,
      };

      let parentDetail: ParentInfo | null = null;

      try {
        const { response, data } = await fetchJsonSafe(
          apiUrl(`/api/students/${studentUserId}`),
        );

        if (response.ok && data?.student) {
          studentDetail = {
            status: normalizeStudentStatus(data.student.status ?? selected.status),
            student_doc_id: toStringValue(data.student._id ?? selected.student_doc_id),
            student_user_id: toStringValue(data.student.userId ?? selected.student_user_id),
            student_id: toStringValue(data.student.studentId ?? selected.student_id),
            first_name: toStringValue(data.student.firstName ?? selected.first_name),
            middle_name: toStringValue(data.student.middleName ?? selected.middle_name),
            last_name: toStringValue(data.student.lastName ?? selected.last_name),
            gender: toStringValue(data.student.gender),
            birth_date: toStringValue(data.student.birthdate),
            gradeSection: toStringValue(data.student.gradeSection ?? selected.gradeSection),
            parent_id: data.student.parentId ? toStringValue(data.student.parentId) : selected.parent_id,
          };
        }
      } catch {
        // Keep list values if students detail endpoint is unavailable.
      }

      try {
        const { response, data } = await fetchJsonSafe(
          apiUrl(`/api/admin/students/${studentUserId}`),
          {
            headers: getAuthHeaders(),
          },
        );

        if (response.ok && data?.student) {
          studentDetail = {
            status: normalizeStudentStatus(data.student.status ?? studentDetail.status),
            student_doc_id: toStringValue(
              data.student._id ?? data.student.student_doc_id ?? studentDetail.student_doc_id,
            ),
            student_user_id: toStringValue(
              data.student.student_user_id ?? data.student.userId ?? studentDetail.student_user_id,
            ),
            student_id: toStringValue(
              data.student.student_id ?? data.student.studentId ?? studentDetail.student_id,
            ),
            first_name: toStringValue(
              data.student.first_name ?? data.student.firstName ?? studentDetail.first_name,
            ),
            middle_name: toStringValue(
              data.student.middle_name ?? data.student.middleName ?? studentDetail.middle_name,
            ),
            last_name: toStringValue(
              data.student.last_name ?? data.student.lastName ?? studentDetail.last_name,
            ),
            gender: toStringValue(data.student.gender ?? studentDetail.gender),
            birth_date: toStringValue(
              data.student.birth_date ?? data.student.birthdate ?? studentDetail.birth_date,
            ),
            gradeSection: toStringValue(data.student.gradeSection ?? studentDetail.gradeSection),
            parent_id: data.student.parent_id
              ? toStringValue(data.student.parent_id)
              : data.student.parentId
                ? toStringValue(data.student.parentId)
                : studentDetail.parent_id,
          };
        }

        if (data?.parent) {
          const parentGender = toStringValue(
            data.parent.gender ?? data.parent.parent_gender,
          );

          parentDetail = {
            parent_id: toStringValue(data.parent.parent_id ?? data.parent._id),
            first_name: toStringValue(
              data.parent.first_name ?? data.parent.firstName ?? data.parent.father_name,
            ),
            middle_name: toStringValue(
              data.parent.middle_name ?? data.parent.middleName ?? data.parent.mother_name,
            ),
            last_name: toStringValue(data.parent.last_name ?? data.parent.lastName),
            gender: parentGender,
            contact_number: toStringValue(data.parent.contact_number ?? data.parent.phoneNumber),
            email: toStringValue(data.parent.email),
          };
        }
      } catch {
        // Fallback to students-table-only details when admin detail endpoint is unavailable.
      }

      let feeRows: FeeRecord[] = [];
      try {
        const { response, data } = await fetchJsonSafe(
          apiUrl(`/api/fees/student/${studentUserId}`),
        );
        if (response.ok) {
          const rows = Array.isArray(data?.fees) ? data.fees : [];
          feeRows = rows.map(normalizeFeeRecord);
        }
      } catch {
        // Keep empty fee list when fee endpoint is unavailable.
      }

      setDetail({
        student: studentDetail,
        parent: parentDetail,
        fees: feeRows,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load student details");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const refreshFeeTableOnly = async (studentUserId: string) => {
    try {
      const { response, data } = await fetchJsonSafe(
        apiUrl(`/api/fees/student/${studentUserId}`),
      );

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to refresh fee records");
      }

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fees: Array.isArray(data.fees) ? data.fees.map(normalizeFeeRecord) : [],
        };
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh fee records");
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const gradeOptions = useMemo(() => {
    const options = Array.from(new Set(students.map((student) => student.gradeSection)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return options;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      if (gradeFilter !== "all" && student.gradeSection !== gradeFilter) {
        return false;
      }
      if (statusFilter !== "all" && student.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      const searchable = [
        student.student_id,
        student.first_name,
        student.middle_name,
        student.last_name,
        student.gradeSection,
        student.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [students, searchTerm, gradeFilter, statusFilter]);

  const handleSelectStudent = async (studentUserId: string) => {
    setSelectedStudentUserId(studentUserId);
    setStatusAction("");
    setIsAddFeeModalOpen(false);
    setEditingFeeId(null);
    setFeeForm(EMPTY_FEE_FORM);
    setDeleteFeeDialogOpen(false);
    setFeeToDelete(null);
    setDeleteParentDialogOpen(false);
    setDeleteStudentDialogOpen(false);
    await loadStudentDetail(studentUserId);
  };

  const handleBackToList = () => {
    setSelectedStudentUserId(null);
    setStatusAction("");
    setDetail(null);
    setIsAddFeeModalOpen(false);
    setIsNotifyModalOpen(false);
    setEditingFeeId(null);
    setFeeForm(EMPTY_FEE_FORM);
    setDeleteFeeDialogOpen(false);
    setFeeToDelete(null);
    setDeleteParentDialogOpen(false);
    setDeleteStudentDialogOpen(false);
    setNotifyForm(EMPTY_NOTIFY_FORM);
  };

  const openEditFeeInline = (fee: FeeRecord) => {
    setEditingFeeId(fee.fee_id);
    setFeeForm({
      fee_type: fee.fee_type,
      amount: String(fee.amount || ""),
      due_date: toInputDateValue(fee.due_date),
      status: fee.status,
    });
  };

  const handleCreateFee = async () => {
    if (!selectedStudentUserId) return;

    const parsedAmount = Number(feeForm.amount);
    if (!feeForm.fee_type.trim() || Number.isNaN(parsedAmount) || !feeForm.due_date) {
      toast.error("fee_type, amount, and due_date are required.");
      return;
    }

    try {
      setIsSavingFee(true);
      const { response, data } = await fetchJsonSafe(apiUrl("/api/fees"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentUserId,
          feeType: feeForm.fee_type.trim(),
          amount: parsedAmount,
          dueDate: feeForm.due_date,
          status: feeForm.status,
        }),
      });

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to add fee");
      }

      toast.success("Fee added successfully.");
      setIsAddFeeModalOpen(false);
      setFeeForm(EMPTY_FEE_FORM);
      await refreshFeeTableOnly(selectedStudentUserId);
    } catch (error: any) {
      toast.error(error.message || "Failed to add fee");
    } finally {
      setIsSavingFee(false);
    }
  };

  const handleSaveEditedFee = async (feeId: string) => {
    if (!selectedStudentUserId) return;

    const parsedAmount = Number(feeForm.amount);
    if (!feeForm.fee_type.trim() || Number.isNaN(parsedAmount) || !feeForm.due_date) {
      toast.error("fee_type, amount, and due_date are required.");
      return;
    }

    try {
      const { response, data } = await fetchJsonSafe(apiUrl(`/api/fees/${feeId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeType: feeForm.fee_type.trim(),
          amount: parsedAmount,
          dueDate: feeForm.due_date,
          status: feeForm.status,
        }),
      });

      if (response.ok && data?.success) {
        toast.success("Fee updated successfully.");
        setEditingFeeId(null);
        setFeeForm(EMPTY_FEE_FORM);
        await refreshFeeTableOnly(selectedStudentUserId);
        return;
      }

      // Legacy fallback for servers that do not expose PUT /api/fees/:id:
      // create a replacement row then delete the old row.
      if (response.status === 404) {
        const createFallback = await fetchJsonSafe(apiUrl("/api/fees"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudentUserId,
            feeType: feeForm.fee_type.trim(),
            amount: parsedAmount,
            dueDate: feeForm.due_date,
            status: feeForm.status,
          }),
        });

        if (!createFallback.response.ok || !createFallback.data?.success) {
          throw new Error(createFallback.data?.message || "Failed to update fee");
        }

        const deleteOld = await fetchJsonSafe(apiUrl(`/api/fees/${feeId}`), {
          method: "DELETE",
        });
        if (!deleteOld.response.ok || !deleteOld.data?.success) {
          toast.error("Fee was duplicated because old record could not be removed.");
        } else {
          toast.success("Fee updated successfully.");
        }
        setEditingFeeId(null);
        setFeeForm(EMPTY_FEE_FORM);
        await refreshFeeTableOnly(selectedStudentUserId);
        return;
      }

      throw new Error(data?.message || "Failed to update fee");
    } catch (error: any) {
      toast.error(error.message || "Failed to update fee");
    }
  };

  const openDeleteFeeDialog = (fee: FeeRecord) => {
    setFeeToDelete(fee);
    setDeleteFeeDialogOpen(true);
  };

  const confirmDeleteFee = async () => {
    if (!selectedStudentUserId || !feeToDelete) return;

    try {
      setIsDeletingFee(true);
      let { response, data } = await fetchJsonSafe(apiUrl(`/api/fees/${feeToDelete.fee_id}`), {
        method: "DELETE",
      });

      if (response.status === 404) {
        const fallback = await fetchJsonSafe(apiUrl(`/api/fees/${feeToDelete.fee_id}/delete`), {
          method: "POST",
        });
        response = fallback.response;
        data = fallback.data;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to delete fee");
      }

      toast.success("Fee deleted.");
      setDeleteFeeDialogOpen(false);
      setFeeToDelete(null);
      await refreshFeeTableOnly(selectedStudentUserId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete fee");
    } finally {
      setIsDeletingFee(false);
    }
  };

  const openNotifyParentModal = () => {
    if (!detail?.parent) {
      toast.error("This student is not yet connected to a parent account.");
      return;
    }

    setNotifyForm({
      message: "",
    });
    setIsNotifyModalOpen(true);
  };

  const notifyRecipient = toStringValue(detail?.parent?.email);

  const handleSendNotifyParent = async () => {
    if (!detail?.student?.student_user_id) return;
    if (!detail?.parent) {
      toast.error("This student is not yet connected to a parent account.");
      return;
    }
    if (!notifyRecipient) {
      toast.error("Parent email is not available.");
      return;
    }

    try {
      setIsSendingNotification(true);
      const { response, data } = await fetchJsonSafe(
        apiUrl(`/api/admin/students/${detail.student.student_user_id}/notify`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            message: notifyForm.message.trim(),
          }),
        },
      );

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to notify parent");
      }

      const normalizedNotification = normalizeNotificationPayload(data.notification);
      if (normalizedNotification && onNotificationSent) {
        onNotificationSent(normalizedNotification);
      }

      toast.success("Parent notified via EMAIL.");
      setIsNotifyModalOpen(false);
      setNotifyForm(EMPTY_NOTIFY_FORM);
    } catch (error: any) {
      toast.error(error.message || "Failed to notify parent");
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleUpdateStudentStatus = async (nextStatus: StudentStatus) => {
    const studentUserId = toStringValue(detail?.student?.student_user_id);
    if (!studentUserId) {
      toast.error("Student user ID is missing.");
      return false;
    }

    try {
      setIsUpdatingStudentStatus(true);
      const { response, data } = await fetchJsonSafe(
        apiUrl(`/api/admin/students/${studentUserId}/status`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update student status");
      }

      const updatedStatus = normalizeStudentStatus(data?.student?.status ?? nextStatus);

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          student: {
            ...prev.student,
            status: updatedStatus,
          },
        };
      });

      setStudents((prev) =>
        prev.map((student) =>
          student.student_user_id === studentUserId
            ? {
                ...student,
                status: updatedStatus,
              }
            : student,
        ),
      );

      toast.success(data?.message || "Student status updated successfully.");
      setDeleteStudentDialogOpen(false);
      await loadStudents();
      onStudentDeleted?.();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update student status");
      return false;
    } finally {
      setIsUpdatingStudentStatus(false);
    }
  };

  const confirmDeleteStudentAccount = async () => {
    await handleUpdateStudentStatus("inactive");
  };

  const confirmUnlinkParentAccount = async () => {
    const studentUserId = toStringValue(detail?.student?.student_user_id);
    if (!studentUserId) {
      toast.error("Student user ID is missing.");
      return;
    }
    if (!detail?.parent?.parent_id) {
      toast.error("No parent is linked to this student.");
      return;
    }

    try {
      setIsDeletingParent(true);
      const { response, data } = await fetchJsonSafe(
        apiUrl(`/api/admin/students/${studentUserId}/unlink-parent`),
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to unlink parent from student");
      }

      toast.success(data?.message || "Student unlinked from parent successfully.");
      setDeleteParentDialogOpen(false);
      setIsNotifyModalOpen(false);
      setNotifyForm(EMPTY_NOTIFY_FORM);

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          student: {
            ...prev.student,
            parent_id: null,
          },
          parent: null,
        };
      });

      setStudents((prev) =>
        prev.map((student) =>
          student.student_user_id === studentUserId
            ? {
                ...student,
                parent_id: null,
                connected_to_parent: false,
              }
            : student,
        ),
      );

      await loadStudents();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlink parent from student");
    } finally {
      setIsDeletingParent(false);
    }
  };

  const currentStudentStatus = normalizeStudentStatus(detail?.student?.status);
  const currentStudentStatusMeta = getStudentStatusMeta(currentStudentStatus);
  const handleStatusActionChange = async (value: StudentStatus | "") => {
    setStatusAction(value);
    if (!value) return;

    if (value === "inactive") {
      setDeleteStudentDialogOpen(true);
      setStatusAction("");
      return;
    }

    await handleUpdateStudentStatus(value);
    setStatusAction("");
  };

  if (selectedStudentUserId) {
    return (
      <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#BDE8F5]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Student List
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#4988C4]">
                Student Profile
              </p>
              <h2 className="text-xl font-bold text-[#0F2854]">
                {detail?.student
                  ? composeName(
                      detail.student.first_name,
                      detail.student.middle_name,
                      detail.student.last_name,
                    ) || detail.student.student_id
                  : "Student Details"}
              </h2>
              <div className="mt-2">
                <Badge className={currentStudentStatusMeta.className}>
                  {currentStudentStatusMeta.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start lg:self-auto">
            <select
              value={statusAction}
              onChange={(e) => {
                void handleStatusActionChange(
                  (e.target.value as StudentStatus | "") || "",
                );
              }}
              className="h-10 rounded-md border px-3 text-sm min-w-[220px] border-[#BDE8F5] bg-[#F7FBFF] text-[#0F2854]"
              disabled={isLoadingDetail || isUpdatingStudentStatus}
            >
              <option value="">Student Status Actions</option>
              <option value="inactive">Deactivate Student</option>
              <option value="transferred">Mark as Transferred</option>
              <option value="graduated">Mark as Graduated</option>
              <option value="archived">Archive Student</option>
              <option value="active">Reactivate Student</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setDeleteParentDialogOpen(true)}
              className="border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isLoadingDetail || isDeletingParent || !detail?.parent}
            >
              Unlink Parent Account
            </Button>
          </div>

        </div>

        {isLoadingDetail && (
          <div className="text-sm text-[#4988C4] py-8">Loading student details...</div>
        )}

        {!isLoadingDetail && detail && (
          <div className="space-y-6">
            <Card className="p-5 border border-[#BDE8F5] rounded-xl bg-gradient-to-br from-[#F7FBFF] to-white">
              <div className="flex items-center gap-2 mb-4">
                <UserRound className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-bold text-[#0F2854]">Student Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold text-[#0F2854]">Student ID:</span>{" "}
                    {detail.student.student_id || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">First Name:</span>{" "}
                    {detail.student.first_name || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Middle Name:</span>{" "}
                    {detail.student.middle_name || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Last Name:</span>{" "}
                    {detail.student.last_name || "Not Provided"}
                  </p>
                </div>
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold text-[#0F2854]">Gender:</span>{" "}
                    {detail.student.gender || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Birth Date:</span>{" "}
                    {(() => {
                      if (!detail.student.birth_date) return "Not Provided";
                      const formatted = formatDate(detail.student.birth_date);
                      return formatted === "-" ? "Not Provided" : formatted;
                    })()}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Grade &amp; Section:</span>{" "}
                    {detail.student.gradeSection || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Student Status:</span>{" "}
                    <span className="font-semibold">{currentStudentStatusMeta.label}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Parent Status:</span>{" "}
                    {detail.student.parent_id ? "Connected" : "Not Connected"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-[#BDE8F5] rounded-xl bg-gradient-to-br from-[#F7FBFF] to-white">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#1C4D8D]" />
                <h3 className="text-xl font-bold text-[#0F2854]">Parent Details</h3>
              </div>
              {detail.parent ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p>
                    <span className="font-semibold text-[#0F2854]">Parent Name:</span>{" "}
                    {detail.parent.first_name || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Middle Name:</span>{" "}
                    {detail.parent.middle_name || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Last Name:</span>{" "}
                    {detail.parent.last_name || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Contact Number:</span>{" "}
                    {detail.parent.contact_number || "Not Provided"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F2854]">Email:</span>{" "}
                    {detail.parent.email || "Not Provided"}
                  </p>
                </div>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span aria-hidden="true">⚠</span>
                  Not yet connected to a parent account
                </p>
              )}
            </Card>

            <Card className="p-5 border border-[#BDE8F5] rounded-xl bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-[#1C4D8D]" />
                  <h3 className="text-xl font-bold text-[#0F2854]">Fee Records</h3>
                </div>
                <Button
                  onClick={() => {
                    setIsAddFeeModalOpen(true);
                    setEditingFeeId(null);
                    setFeeForm(EMPTY_FEE_FORM);
                  }}
                  className="bg-[#1C4D8D] hover:bg-[#0F2854]"
                >
                  Add Fee
                </Button>
              </div>

              <div className="rounded-xl border border-[#BDE8F5] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F1F7FD]">
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.fees.map((fee) => (
                    <TableRow key={fee.fee_id}>
                      {editingFeeId === fee.fee_id ? (
                        <>
                          <TableCell>
                            <Input
                              value={feeForm.fee_type}
                              onChange={(e) =>
                                setFeeForm((prev) => ({ ...prev, fee_type: e.target.value }))
                              }
                              placeholder="Fee type"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={feeForm.amount}
                              onChange={(e) =>
                                setFeeForm((prev) => ({ ...prev, amount: e.target.value }))
                              }
                              placeholder="Amount"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={feeForm.due_date}
                              onChange={(e) =>
                                setFeeForm((prev) => ({ ...prev, due_date: e.target.value }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              value={feeForm.status}
                              onChange={(e) =>
                                setFeeForm((prev) => ({
                                  ...prev,
                                  status: e.target.value as FeeForm["status"],
                                }))
                              }
                              className="h-9 rounded-md border px-3 text-sm w-full"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEditedFee(fee.fee_id)}
                                className="bg-[#1C4D8D] hover:bg-[#0F2854]"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingFeeId(null);
                                  setFeeForm(EMPTY_FEE_FORM);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{fee.fee_type || "Not Provided"}</TableCell>
                          <TableCell>₱{Number(fee.amount).toLocaleString()}</TableCell>
                          <TableCell>{formatDate(fee.due_date)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                fee.status === "paid"
                                  ? "bg-green-600"
                                  : fee.status === "overdue"
                                    ? "bg-red-600"
                                    : "bg-yellow-500"
                              }
                            >
                              {toReadableStatus(fee.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditFeeInline(fee)}
                                className="border-[#4988C4] text-[#1C4D8D]"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteFeeDialog(fee)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={openNotifyParentModal}
                                className="border-[#4988C4] text-[#1C4D8D]"
                              >
                                <Bell className="w-3.5 h-3.5 mr-1" />
                                Notify Parent
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}

                  {detail.fees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-[#4988C4] py-6">
                        No fee records found for this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </Card>

            <AlertDialog
              open={deleteFeeDialogOpen}
              onOpenChange={(open) => {
                if (isDeletingFee && !open) return;
                setDeleteFeeDialogOpen(open);
                if (!open) {
                  setFeeToDelete(null);
                }
              }}
            >
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Delete Fee Record
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {feeToDelete && (
                      <div className="space-y-3 mt-2">
                        <p>
                          Are you sure you want to delete{" "}
                          <span className="font-semibold text-red-600">
                            "{feeToDelete.fee_type || "this fee record"}"
                          </span>
                          ?
                        </p>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold">Amount:</span>{" "}
                            ₱{Number(feeToDelete.amount).toLocaleString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Due Date:</span>{" "}
                            {formatDate(feeToDelete.due_date)}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Status:</span>{" "}
                            {toReadableStatus(feeToDelete.status)}
                          </p>
                        </div>
                        <p className="text-sm text-red-600 font-semibold">
                          ⚠️ This action cannot be undone.
                        </p>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2 mt-4">
                  <AlertDialogCancel className="flex-1" disabled={isDeletingFee}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void confirmDeleteFee();
                    }}
                    disabled={isDeletingFee || !feeToDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingFee ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={deleteParentDialogOpen}
              onOpenChange={(open) => {
                if (isDeletingParent && !open) return;
                setDeleteParentDialogOpen(open);
              }}
            >
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Unlink Parent Account
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-3 mt-2">
                      <p>
                        Are you sure you want to unlink this parent from this student?
                      </p>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">Parent:</span>{" "}
                          {detail?.parent
                            ? composeName(
                                detail.parent.first_name,
                                detail.parent.middle_name,
                                detail.parent.last_name,
                              ) || "Not Provided"
                            : "Not Provided"}
                        </p>
                        <p>
                          <span className="font-semibold">Contact:</span>{" "}
                          {detail?.parent?.contact_number || "Not Provided"}
                        </p>
                        <p>
                          <span className="font-semibold">Email:</span>{" "}
                          {detail?.parent?.email || "Not Provided"}
                        </p>
                      </div>
                      <p className="text-sm text-red-600 font-semibold">
                        This will only unlink the selected student. Parent account and data will remain.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2 mt-4">
                  <AlertDialogCancel
                    className="flex-1"
                    disabled={isDeletingParent}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void confirmUnlinkParentAccount();
                    }}
                    disabled={isDeletingParent || !detail?.parent?.parent_id}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingParent ? "Unlinking..." : "Unlink"}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={deleteStudentDialogOpen}
              onOpenChange={(open) => {
                if (isUpdatingStudentStatus && !open) return;
                setDeleteStudentDialogOpen(open);
              }}
            >
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Deactivate Student
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-3 mt-2">
                      <p>
                        Are you sure you want to deactivate this student?
                      </p>
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">Student:</span>{" "}
                          {detail?.student
                            ? composeName(
                                detail.student.first_name,
                                detail.student.middle_name,
                                detail.student.last_name,
                              ) || detail.student.student_id
                            : "Not Provided"}
                        </p>
                        <p>
                          <span className="font-semibold">Student ID:</span>{" "}
                          {detail?.student?.student_id || "Not Provided"}
                        </p>
                        <p>
                          <span className="font-semibold">Grade & Section:</span>{" "}
                          {detail?.student?.gradeSection || "Not Provided"}
                        </p>
                      </div>
                      <p className="text-sm text-red-600 font-semibold">
                        The student will not be able to login and will be hidden from enrollment lists.
                        Payment records and history will be preserved.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2 mt-4">
                  <AlertDialogCancel
                    className="flex-1"
                    disabled={isUpdatingStudentStatus}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void confirmDeleteStudentAccount();
                    }}
                    disabled={isUpdatingStudentStatus || !detail?.student?.student_user_id}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isUpdatingStudentStatus ? "Updating..." : "Deactivate"}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog
              open={isAddFeeModalOpen}
              onOpenChange={(open) => {
                setIsAddFeeModalOpen(open);
                if (!open) setFeeForm(EMPTY_FEE_FORM);
              }}
            >
              <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                  <DialogTitle className="text-[#0F2854]">Add Fee Record</DialogTitle>
                  <DialogDescription>Enter fee details for this student.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Fee Type"
                    value={feeForm.fee_type}
                    onChange={(e) =>
                      setFeeForm((prev) => ({ ...prev, fee_type: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={feeForm.amount}
                    onChange={(e) =>
                      setFeeForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Due Date"
                    type="date"
                    value={feeForm.due_date}
                    onChange={(e) =>
                      setFeeForm((prev) => ({ ...prev, due_date: e.target.value }))
                    }
                  />
                  <select
                    value={feeForm.status}
                    onChange={(e) =>
                      setFeeForm((prev) => ({
                        ...prev,
                        status: e.target.value as FeeForm["status"],
                      }))
                    }
                    className="h-9 rounded-md border px-3 text-sm w-full"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddFeeModalOpen(false);
                      setFeeForm(EMPTY_FEE_FORM);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateFee}
                    disabled={isSavingFee}
                    className="bg-[#1C4D8D] hover:bg-[#0F2854]"
                  >
                    {isSavingFee ? "Saving..." : "Save Fee"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isNotifyModalOpen}
              onOpenChange={(open) => {
                setIsNotifyModalOpen(open);
                if (!open) {
                  setNotifyForm(EMPTY_NOTIFY_FORM);
                }
              }}
            >
              <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                  <DialogTitle className="text-[#0F2854]">Notify Parent</DialogTitle>
                  <DialogDescription>
                    Send an email notification to the connected parent account.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="rounded-lg border border-[#BDE8F5] bg-[#F7FBFF] p-3 text-sm">
                    <p className="text-[#0F2854] font-semibold">
                      {composeName(
                        detail.student.first_name,
                        detail.student.middle_name,
                        detail.student.last_name,
                      ) || detail.student.student_id}
                    </p>
                    <p className="text-xs text-[#4988C4] mt-1">
                      Student ID: {detail.student.student_id || "-"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2854]">
                      Recipient (Email)
                    </label>
                    <Input value={notifyRecipient || "Not Available"} disabled />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2854]">
                      Message (Optional)
                    </label>
                    <Textarea
                      value={notifyForm.message}
                      onChange={(e) =>
                        setNotifyForm((prev) => ({ ...prev, message: e.target.value }))
                      }
                      rows={4}
                      placeholder="Enter custom reminder message for the parent..."
                    />
                    <p className="text-xs text-[#4988C4]">
                      Leave empty to send the default system reminder message.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsNotifyModalOpen(false);
                      setNotifyForm(EMPTY_NOTIFY_FORM);
                    }}
                    disabled={isSendingNotification}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendNotifyParent}
                    disabled={isSendingNotification}
                    className="bg-[#1C4D8D] hover:bg-[#0F2854]"
                  >
                    {isSendingNotification ? "Sending..." : "Send Notification"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#BDE8F5]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#4988C4]">
            Student Fee Management
          </p>
          <h3 className="text-3xl font-bold text-[#0F2854]">Student List</h3>
          <p className="text-sm text-[#4988C4] mt-1">
            Select a student to open full profile and fee records.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student_id, first_name, last_name, gradeSection"
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target.value as "all" | StudentStatus) || "all")
            }
            className="h-9 rounded-md border px-3 text-sm min-w-[220px] border-[#BDE8F5] bg-[#F7FBFF]"
          >
            <option value="all">All Students</option>
            <option value="active">Active Students</option>
            <option value="inactive">Inactive Students</option>
            <option value="transferred">Transferred Students</option>
            <option value="graduated">Graduated Students</option>
            <option value="archived">Archived Students</option>
          </select>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm min-w-[220px] border-[#BDE8F5] bg-[#F7FBFF]"
          >
            <option value="all">All Grade-Section</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoadingStudents && (
        <div className="text-sm text-[#4988C4] py-8">Loading students...</div>
      )}

      {!isLoadingStudents && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <button
              key={student.student_user_id}
              type="button"
              onClick={() => handleSelectStudent(student.student_user_id)}
              className="text-left"
            >
              <Card className="p-0 border border-[#BDE8F5] hover:shadow-xl hover:border-[#4988C4] transition-all h-full overflow-hidden">
                <div className="px-4 py-2 bg-gradient-to-r from-[#E6F4FB] to-transparent border-b border-[#BDE8F5]">
                  <p className="text-xs text-[#4988C4] font-semibold">
                    STUDENT ID
                  </p>
                  <p className="text-sm font-bold text-[#1C4D8D]">
                    {student.student_id || "-"}
                  </p>
                </div>
                <div className="p-4">
                <h4 className="text-lg font-bold text-[#0F2854]">
                  {composeName(student.first_name, student.middle_name, student.last_name) || student.full_name || "-"}
                </h4>
                <p className="text-sm text-[#1C4D8D] mt-1">{student.gradeSection || "-"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    className={getStudentStatusMeta(student.status).className}
                  >
                    {getStudentStatusMeta(student.status).label}
                  </Badge>
                  <Badge
                    className={
                      student.connected_to_parent ? "bg-blue-600" : "bg-yellow-500"
                    }
                  >
                    {student.connected_to_parent ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {!isLoadingStudents && filteredStudents.length === 0 && (
        <div className="text-center text-[#4988C4] py-10">
          No students found for current search/filter.
        </div>
      )}
    </Card>
  );
}
