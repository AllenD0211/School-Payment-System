import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Bell,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Mail,
  MessageSquare,
  X,
  GraduationCap,
  Users,
  FileText,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/app/components/ui/separator";

export interface EventFee {
  id: string;
  eventName: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  parentContact: string;
  feeAmount: number;
  feeStatus: "paid" | "pending" | "overdue";
  dueDate: string;
  description?: string;
  type?: string;
  parentEmail?: string;
  notificationMethod?: "sms" | "email";
  eventFees?: EventFee[];
  birthDate?: string;
}

interface StudentTableProps {
  students: Student[];
  onNotifyParent: (studentId: string, method: "sms" | "email") => void;
  onRecordPayment: (studentId: string) => void;
  onAddFee: (studentId: string, fee: Omit<Student, "id">) => void;
  onEditStudent: (studentId: string, student: Omit<Student, "id">) => void;
  onDeleteStudent: (studentId: string) => void;
}

interface FeeFormProps {
  formData: {
    feeType: string;
    feeAmount: string;
    dueDate: string;
    feeStatus: "paid" | "pending" | "overdue";
  };
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
}

// ==================== Fee Form ====================
const FeeForm = ({ formData, handleInputChange }: FeeFormProps) => (
  <div className="space-y-5">
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
        <h3 className="font-semibold text-[#0F2854]">Fee Information</h3>
      </div>
      <Separator />

      <div>
        <Label
          htmlFor="feeType"
          className="text-[#0F2854] font-semibold"
        >
          Fee Type *
        </Label>
        <Input
          id="feeType"
          name="feeType"
          type="text"
          value={formData.feeType}
          onChange={handleInputChange}
          placeholder="e.g., Tuition Fee, Laboratory Fee, Sports Event"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="feeAmount" className="text-[#0F2854] font-semibold">
          Fee Amount (₱) *
        </Label>
        <Input
          id="feeAmount"
          name="feeAmount"
          type="text"
          value={formData.feeAmount}
          onChange={handleInputChange}
          placeholder="Enter fee amount"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label
          htmlFor="dueDate"
          className="text-[#0F2854] font-semibold flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Due Date *
        </Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleInputChange}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="feeStatus" className="text-[#0F2854] font-semibold">
          Status
        </Label>
        <select
          id="feeStatus"
          name="feeStatus"
          value={formData.feeStatus}
          onChange={handleInputChange}
          className="w-full p-2.5 border rounded-md text-sm mt-1.5 border-gray-300 focus:border-[#1C4D8D]"
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
    </div>
  </div>
);

export function StudentTable({
  students,
  onNotifyParent,
  onRecordPayment,
  onAddFee,
  onEditStudent,
  onDeleteStudent,
}: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddNewStudentFeeDialogOpen, setIsAddNewStudentFeeDialogOpen] =
    useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudentForNotify, setSelectedStudentForNotify] =
    useState<Student | null>(null);
  const [selectedStudentForDelete, setSelectedStudentForDelete] =
    useState<Student | null>(null);
  const [notificationMethod, setNotificationMethod] = useState<"sms" | "email">(
    "sms",
  );
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForFee, setSelectedStudentForFee] =
    useState<Student | null>(null);

  const [formData, setFormData] = useState({
    feeType: "",
    feeAmount: "",
    dueDate: "",
    feeStatus: "pending" as "paid" | "pending" | "overdue",
    eventFeeAmount: "",
    eventFeeDueDate: "",
  });

  const [newStudentFeeForm, setNewStudentFeeForm] = useState({
    studentId: "",
    feeType: "",
    feeAmount: "",
    dueDate: "",
    feeStatus: "pending" as "paid" | "pending" | "overdue",
  });

  const resetForm = () => {
    setFormData({
      feeType: "",
      feeAmount: "",
      dueDate: "",
      feeStatus: "pending",
      eventFeeAmount: "",
      eventFeeDueDate: "",
    });
    setSelectedStudentForFee(null);
  };

  const resetNewStudentFeeForm = () => {
    setNewStudentFeeForm({
      studentId: "",
      feeType: "",
      feeAmount: "",
      dueDate: "",
      feeStatus: "pending",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "feeStatus") {
      setFormData((prev) => ({
        ...prev,
        feeStatus: value as "paid" | "pending" | "overdue",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNewStudentFeeInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "feeStatus") {
      setNewStudentFeeForm((prev) => ({
        ...prev,
        feeStatus: value as "paid" | "pending" | "overdue",
      }));
    } else {
      setNewStudentFeeForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddFeeForNewStudent = async () => {
    const { studentId, feeType, feeAmount, dueDate } = newStudentFeeForm;

    if (!studentId.trim() || !feeType.trim() || !feeAmount || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: studentId.trim(),
          feeType,
          amount: parseFloat(feeAmount),
          status: newStudentFeeForm.feeStatus,
          dueDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        resetNewStudentFeeForm();
        setIsAddNewStudentFeeDialogOpen(false);
        toast.success(`Fee added successfully for Student ID: ${studentId}`);
      } else {
        toast.error(data.message || "Failed to add fee");
      }
    } catch (error) {
      toast.error("Failed to add fee. Please check the student ID and try again.");
      console.error(error);
    }
  };

  const handleAddFee = async () => {
    if (!selectedStudentForFee) return;

    const { feeType, feeAmount, dueDate } = formData;

    if (!feeType.trim() || !feeAmount || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudentForFee.id,
          feeType,
          amount: parseFloat(feeAmount),
          status: formData.feeStatus,
          dueDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update parent component's state
        onAddFee(selectedStudentForFee.id, {
          ...selectedStudentForFee,
          type: feeType,
          feeAmount: parseFloat(feeAmount),
          dueDate,
          feeStatus: formData.feeStatus,
        });
        toastSuccess("Fee added successfully");
        resetForm();
        setIsAddFeeDialogOpen(false);
      } else {
        toast.error(data.message || "Failed to add fee");
      }
    } catch (error) {
      toast.error("Failed to add fee. Please try again.");
      console.error(error);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      feeType: student.type || "",
      feeAmount: student.feeAmount.toString(),
      dueDate: student.dueDate,
      feeStatus: student.feeStatus,
      eventFeeAmount: "",
      eventFeeDueDate: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditStudent = () => {
    if (!editingStudent) return;
    const { feeType, feeAmount, dueDate } = formData;
    if (!feeType.trim() || !feeAmount || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    onEditStudent(editingStudent.id, {
      ...editingStudent,
      type: feeType,
      feeAmount: parseFloat(feeAmount),
      dueDate,
      feeStatus: formData.feeStatus,
    });

    resetForm();
    setEditingStudent(null);
    setIsEditDialogOpen(false);
    toast.success("Fee updated successfully");
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudentForDelete(student);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStudentForDelete) {
      onDeleteStudent(selectedStudentForDelete.id);
      toast.success(`${selectedStudentForDelete.name} deleted successfully`);
    }
    setDeleteDialogOpen(false);
    setSelectedStudentForDelete(null);
  };

  const handleNotifyClick = (student: Student) => {
    setSelectedStudentForNotify(student);
    setNotificationMethod(student.notificationMethod || "sms");
    setNotifyDialogOpen(true);
  };

  const handleSendNotification = () => {
    if (!selectedStudentForNotify) return;

    if (notificationMethod === "sms") {
      if (!selectedStudentForNotify.parentContact) {
        toast.error("Phone number not available for this parent");
        return;
      }
    } else if (notificationMethod === "email") {
      if (!selectedStudentForNotify.parentEmail) {
        toast.error("Email not available for this parent");
        return;
      }
    }

    onNotifyParent(selectedStudentForNotify.id, notificationMethod);

    const methodText = notificationMethod === "sms" ? "SMS" : "Email";
    toast.success(
      `Notification sent via ${methodText} to ${selectedStudentForNotify.parentName}`,
    );

    setNotifyDialogOpen(false);
    setSelectedStudentForNotify(null);
    setNotificationMethod("sms");
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

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();

    return (
      student.id.toLowerCase().includes(term) ||
      student.name.toLowerCase().includes(term) ||
      student.grade.toLowerCase().includes(term) ||
      student.parentName.toLowerCase().includes(term) ||
      student.feeStatus.toLowerCase().includes(term) ||
      (student.type?.toLowerCase().includes(term) ?? false) ||
      (student.dueDate?.toLowerCase().includes(term) ?? false)
    );
  });

  return (
    <>
      {/* ==================== Delete Confirmation Dialog ==================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Delete Student Record
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              {selectedStudentForDelete && (
                <div className="space-y-2">
                  <p>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold">
                      {selectedStudentForDelete.name}
                    </span>
                    ?
                  </p>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 mt-3">
                    <p className="text-sm">
                      <span className="font-semibold">Student:</span>{" "}
                      {selectedStudentForDelete.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Parent:</span>{" "}
                      {selectedStudentForDelete.parentName}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Fee Amount:</span> ₱
                      {selectedStudentForDelete.feeAmount.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-red-600 font-semibold mt-3">
                    ⚠️ This action cannot be undone.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 mt-4">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== Notification Method Dialog ==================== */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1C4D8D]" />
              Send Notification
            </DialogTitle>
          </DialogHeader>

          {selectedStudentForNotify && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="p-4 bg-gradient-to-br from-[#BDE8F5]/20 to-transparent rounded-lg border border-[#BDE8F5]">
                <p className="text-sm">
                  <span className="font-semibold text-[#0F2854]">Student:</span>{" "}
                  <span className="text-[#1C4D8D]">
                    {selectedStudentForNotify.name}
                  </span>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-semibold text-[#0F2854]">Parent:</span>{" "}
                  <span className="text-[#1C4D8D]">
                    {selectedStudentForNotify.parentName}
                  </span>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-semibold text-[#0F2854]">Fee:</span>{" "}
                  <span className="text-[#1C4D8D]">
                    ₱{selectedStudentForNotify.feeAmount.toLocaleString()}
                  </span>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-semibold text-[#0F2854]">Status:</span>{" "}
                  {getStatusBadge(selectedStudentForNotify.feeStatus)}
                </p>
              </div>

              {/* Notification Method Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-[#0F2854]">
                  Select Notification Method:
                </Label>

                {/* SMS Option */}
                <div
                  className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all"
                  onClick={() => setNotificationMethod("sms")}
                >
                  <input
                    type="radio"
                    name="method"
                    value="sms"
                    checked={notificationMethod === "sms"}
                    onChange={() => setNotificationMethod("sms")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm text-[#0F2854]">
                        SMS
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Send via SMS to {selectedStudentForNotify.parentContact}
                    </p>
                  </div>
                </div>

                {/* Email Option */}
                <div
                  className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-400 transition-all"
                  onClick={() => setNotificationMethod("email")}
                >
                  <input
                    type="radio"
                    name="method"
                    value="email"
                    checked={notificationMethod === "email"}
                    onChange={() => setNotificationMethod("email")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm text-[#0F2854]">
                        Email
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Send via Email to{" "}
                      {selectedStudentForNotify.parentEmail || "Not provided"}
                    </p>
                    {!selectedStudentForNotify.parentEmail && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ No email address on file
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleSendNotification}
                  className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]"
                >
                  Send {notificationMethod === "sms" ? "SMS" : "Email"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNotifyDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== Add Fee for New Student Dialog ==================== */}
      <Dialog
        open={isAddNewStudentFeeDialogOpen}
        onOpenChange={setIsAddNewStudentFeeDialogOpen}
      >
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] mb-6">
            <Plus className="w-4 h-4 mr-2" /> Add fee for student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#1C4D8D]" />
              Add Fee for Student
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Student Identification Section */}
            <div className="space-y-4">
              <Separator />

              <div>
                <Label
                  htmlFor="studentId"
                  className="text-[#0F2854] font-semibold"
                >
                  Student ID *
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  type="text"
                  value={newStudentFeeForm.studentId}
                  onChange={handleNewStudentFeeInputChange}
                  placeholder="e.g., 2021-3441"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Fee Information Section */}
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="feeType"
                  className="text-[#0F2854] font-semibold"
                >
                  Fee Type *
                </Label>
                <Input
                  id="feeType"
                  name="feeType"
                  type="text"
                  value={newStudentFeeForm.feeType}
                  onChange={handleNewStudentFeeInputChange}
                  placeholder="e.g., Tuition Fee, Laboratory Fee, Sports Event"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label
                  htmlFor="newFeeAmount"
                  className="text-[#0F2854] font-semibold"
                >
                  Fee Amount (₱) *
                </Label>
                <Input
                  id="newFeeAmount"
                  name="feeAmount"
                  type="text"
                  value={newStudentFeeForm.feeAmount}
                  onChange={handleNewStudentFeeInputChange}
                  placeholder="Enter fee amount"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label
                  htmlFor="newDueDate"
                  className="text-[#0F2854] font-semibold flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Due Date *
                </Label>
                <Input
                  id="newDueDate"
                  name="dueDate"
                  type="date"
                  value={newStudentFeeForm.dueDate}
                  onChange={handleNewStudentFeeInputChange}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label
                  htmlFor="newFeeStatus"
                  className="text-[#0F2854] font-semibold"
                >
                  Status
                </Label>
                <select
                  id="newFeeStatus"
                  name="feeStatus"
                  value={newStudentFeeForm.feeStatus}
                  onChange={handleNewStudentFeeInputChange}
                  className="w-full p-2.5 border rounded-md text-sm mt-1.5 border-gray-300 focus:border-[#1C4D8D]"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleAddFeeForNewStudent}
                className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Fee
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetNewStudentFeeForm();
                  setIsAddNewStudentFeeDialogOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== Student Fee Records Table ==================== */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#0F2854]">
              Student Fee Records
            </h3>
            <p className="text-sm text-[#4988C4] mt-1">
              Manage and track student payments
            </p>
          </div>

          {/* 🔍 Search Input */}
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder="Search student"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

            {searchTerm && (
              <X
                className="absolute right-3 top-3 w-4 h-4 text-gray-400 cursor-pointer"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#BDE8F5] overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
              <TableRow className="border-b border-[#BDE8F5]">
                <TableHead className="text-[#0F2854] font-bold">
                  Student ID
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Student Name
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Grade
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Parent Name
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Contact Info
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Fee Type
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Amount
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Due Date
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Status
                </TableHead>
                <TableHead className="text-[#0F2854] font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student, index) => (
                <TableRow
                  key={student.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-[#F5FAFB]"}
                >
                  <TableCell className="font-semibold text-[#1C4D8D]">
                    {student.id}
                  </TableCell>
                  <TableCell className="font-semibold text-[#0F2854]">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-[#4988C4]">
                    {student.grade}
                  </TableCell>
                  <TableCell className="text-[#0F2854]">
                    {student.parentName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {student.notificationMethod === "sms" ? (
                        <p className="text-[#4988C4]">
                          {student.parentContact}
                        </p>
                      ) : (
                        <p className="text-[#4988C4]">{student.parentEmail}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#0F2854]">
                    {student.type || "-"}
                  </TableCell>
                  <TableCell className="font-bold text-[#1C4D8D]">
                    ₱{student.feeAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[#4988C4]">
                    {student.dueDate}
                  </TableCell>
                  <TableCell>{getStatusBadge(student.feeStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {student.feeStatus !== "paid" && (
                        <>
                          <Dialog
                            open={isAddFeeDialogOpen}
                            onOpenChange={setIsAddFeeDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Add Fee"
                                onClick={() => {
                                  setSelectedStudentForFee(student);
                                  resetForm();
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                  <Plus className="w-6 h-6 text-[#1C4D8D]" />
                                  Add Fee for {selectedStudentForFee?.name}
                                </DialogTitle>
                              </DialogHeader>
                              <FeeForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                              />
                              <div className="flex gap-2 mt-6">
                                <Button
                                  onClick={handleAddFee}
                                  className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Add Fee
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddFeeDialogOpen(false);
                                    resetForm();
                                  }}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNotifyClick(student)}
                            title="Send Notification"
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(student)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                              <Pencil className="w-6 h-6 text-[#1C4D8D]" />
                              Edit Fee for {editingStudent?.name}
                            </DialogTitle>
                          </DialogHeader>
                          <FeeForm
                            formData={formData}
                            handleInputChange={handleInputChange}
                          />
                          <div className="flex gap-2 mt-6">
                            <Button
                              onClick={handleEditStudent}
                              className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Save
                              Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingStudent(null);
                                resetForm();
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(student)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-[#BDE8F5] mx-auto mb-3" />
            <p className="text-[#4988C4] font-medium">
              {searchTerm ? "No matching students found" : "No students added yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Try a different keyword"
                : 'Click "Add Fee for Student" to get started'}
            </p>
          </div>
        )}
      </Card>
    </>
  );
}