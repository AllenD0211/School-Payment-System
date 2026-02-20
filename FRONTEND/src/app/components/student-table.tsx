import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
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
import { Bell, DollarSign, CheckCircle2, AlertCircle, Plus, Pencil, Trash2, Mail, MessageSquare, X, GraduationCap, Users, FileText, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/app/components/ui/separator";

export interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  parentContact: string;
  feeAmount: number;
  feeStatus: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  description?: string;
  type?: string;
  parentEmail?: string;
  notificationMethod?: 'sms' | 'email';
}

interface StudentTableProps {
  students: Student[];
  onNotifyParent: (studentId: string, method: 'sms' | 'email') => void;
  onRecordPayment: (studentId: string) => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onEditStudent: (studentId: string, student: Omit<Student, 'id'>) => void;
  onDeleteStudent: (studentId: string) => void;
}

export function StudentTable({ 
  students, 
  onNotifyParent, 
  onRecordPayment,
  onAddStudent,
  onEditStudent,
  onDeleteStudent
}: StudentTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudentForNotify, setSelectedStudentForNotify] = useState<Student | null>(null);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(null);
  const [notificationMethod, setNotificationMethod] = useState<'sms' | 'email'>('sms');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [customFeeType, setCustomFeeType] = useState('');
  const [showCustomFeeInput, setShowCustomFeeInput] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    parentName: '',
    parentContact: '',
    parentEmail: '',
    feeAmount: '',
    feeStatus: 'pending' as 'paid' | 'pending' | 'overdue',
    dueDate: '',
    description: '',
    type: 'Tuition Fee',
    notificationMethod: 'sms' as 'sms' | 'email',
  });

  const defaultFeeTypes = ['Tuition Fee', 'Library Fee', 'Activity Fee'];

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      parentName: '',
      parentContact: '',
      parentEmail: '',
      feeAmount: '',
      feeStatus: 'pending',
      dueDate: '',
      description: '',
      type: 'Tuition Fee',
      notificationMethod: 'sms',
    });
    setCustomFeeType('');
    setShowCustomFeeInput(false);
  };

  // Fixed input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    // Handle select dropdown for feeStatus and type
    if (id === 'feeStatus') {
      setFormData((prev) => ({
        ...prev,
        feeStatus: value as 'paid' | 'pending' | 'overdue',
      }));
    } else if (id === 'notificationMethod') {
      setFormData((prev) => ({
        ...prev,
        notificationMethod: value as 'sms' | 'email',
      }));
    } else if (id === 'type') {
      if (value === 'other') {
        setShowCustomFeeInput(true);
        setFormData((prev) => ({
          ...prev,
          type: customFeeType || 'Other',
        }));
      } else {
        setShowCustomFeeInput(false);
        setCustomFeeType('');
        setFormData((prev) => ({
          ...prev,
          type: value,
        }));
      }
    } else if (id === 'customFeeType') {
      setCustomFeeType(value);
      setFormData((prev) => ({
        ...prev,
        type: value || 'Other',
      }));
    } else if (id === 'feeAmount') {
      // Allow only numbers and decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          [id]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  const handleAddStudent = () => {
    const { name, grade, parentName, parentContact, feeAmount, dueDate } = formData;
    if (!name || !grade || !parentName || !parentContact || !feeAmount || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone for SMS
    if (formData.notificationMethod === 'sms' && !parentContact) {
      toast.error('Phone number required for SMS notifications');
      return;
    }

    // Validate email for Email
    if (formData.notificationMethod === 'email' && !formData.parentEmail) {
      toast.error('Email required for Email notifications');
      return;
    }

    onAddStudent({
      ...formData,
      feeAmount: parseFloat(feeAmount),
    });

    resetForm();
    setIsAddDialogOpen(false);
    toast.success('Student added successfully');
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    const isCustomType = !defaultFeeTypes.includes(student.type || 'Tuition Fee');
    if (isCustomType) {
      setShowCustomFeeInput(true);
      setCustomFeeType(student.type || '');
    }
    setFormData({
      name: student.name,
      grade: student.grade,
      parentName: student.parentName,
      parentContact: student.parentContact,
      parentEmail: student.parentEmail || '',
      feeAmount: student.feeAmount.toString(),
      feeStatus: student.feeStatus,
      dueDate: student.dueDate,
      description: student.description || '',
      type: student.type || 'Tuition Fee',
      notificationMethod: student.notificationMethod || 'sms',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditStudent = () => {
    if (!editingStudent) return;
    const { name, grade, parentName, parentContact, feeAmount, dueDate } = formData;
    if (!name || !grade || !parentName || !parentContact || !feeAmount || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone for SMS
    if (formData.notificationMethod === 'sms' && !parentContact) {
      toast.error('Phone number required for SMS notifications');
      return;
    }

    // Validate email for Email
    if (formData.notificationMethod === 'email' && !formData.parentEmail) {
      toast.error('Email required for Email notifications');
      return;
    }

    onEditStudent(editingStudent.id, {
      ...formData,
      feeAmount: parseFloat(feeAmount),
    });

    resetForm();
    setEditingStudent(null);
    setIsEditDialogOpen(false);
    toast.success('Student updated successfully');
  };

  // ==================== Delete Handler ====================
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

  // ==================== Notification Handler ====================
  const handleNotifyClick = (student: Student) => {
    setSelectedStudentForNotify(student);
    setNotificationMethod(student.notificationMethod || 'sms');
    setNotifyDialogOpen(true);
  };

  const handleSendNotification = () => {
    if (!selectedStudentForNotify) return;

    // Validate contact info based on selected method
    if (notificationMethod === 'sms') {
      if (!selectedStudentForNotify.parentContact) {
        toast.error('Phone number not available for this parent');
        return;
      }
    } else if (notificationMethod === 'email') {
      if (!selectedStudentForNotify.parentEmail) {
        toast.error('Email not available for this parent');
        return;
      }
    }

    onNotifyParent(selectedStudentForNotify.id, notificationMethod);
    
    const methodText = notificationMethod === 'sms' ? 'SMS' : 'Email';
    toast.success(`Notification sent via ${methodText} to ${selectedStudentForNotify.parentName}`);
    
    setNotifyDialogOpen(false);
    setSelectedStudentForNotify(null);
    setNotificationMethod('sms');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return null;
    }
  };

  // ==================== Student Form ====================
  const StudentForm = ({ isEdit = false }) => (
    <div className="space-y-5">
      {/* Student Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#1C4D8D]" />
          <h3 className="font-semibold text-[#0F2854]">Student Information</h3>
        </div>
        <Separator />
        
        <div>
          <Label htmlFor="name" className="text-[#0F2854] font-semibold">Student Name *</Label>
          <Input 
            id="name" 
            value={formData.name} 
            onChange={handleInputChange} 
            placeholder="Enter student name"
            type="text"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="grade" className="text-[#0F2854] font-semibold">Grade *</Label>
          <Input 
            id="grade" 
            value={formData.grade} 
            onChange={handleInputChange} 
            placeholder="e.g., Grade 10"
            type="text"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* Parent Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1C4D8D]" />
          <h3 className="font-semibold text-[#0F2854]">Parent Information</h3>
        </div>
        <Separator />
        
        <div>
          <Label htmlFor="parentName" className="text-[#0F2854] font-semibold">Parent Name *</Label>
          <Input 
            id="parentName" 
            value={formData.parentName} 
            onChange={handleInputChange} 
            placeholder="Enter parent name"
            type="text"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="notificationMethod" className="text-[#0F2854] font-semibold">Preferred Notification Method *</Label>
          <select 
            id="notificationMethod" 
            value={formData.notificationMethod} 
            onChange={handleInputChange} 
            className="w-full p-2.5 border rounded-md text-sm mt-1.5 border-gray-300 focus:border-[#1C4D8D]"
          >
            <option value="sms">SMS Only</option>
            <option value="email">Email Only</option>
          </select>
        </div>

        {/* Show Phone or Email based on notification method */}
        {formData.notificationMethod === 'sms' && (
          <div>
            <Label htmlFor="parentContact" className="text-[#0F2854] font-semibold">Parent Phone (SMS) *</Label>
            <Input 
              id="parentContact" 
              value={formData.parentContact} 
              onChange={handleInputChange} 
              placeholder="e.g., +1 (555) 123-4567"
              type="tel"
              className="mt-1.5"
            />
          </div>
        )}

        {formData.notificationMethod === 'email' && (
          <div>
            <Label htmlFor="parentEmail" className="text-[#0F2854] font-semibold">Parent Email *</Label>
            <Input 
              id="parentEmail" 
              type="email"
              value={formData.parentEmail} 
              onChange={handleInputChange} 
              placeholder="e.g., parent@email.com"
              className="mt-1.5"
            />
          </div>
        )}
      </div>

      {/* Fee Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
          <h3 className="font-semibold text-[#0F2854]">Fee Information</h3>
        </div>
        <Separator />
        
        <div>
          <Label htmlFor="type" className="text-[#0F2854] font-semibold">Fee Type</Label>
          <div className="space-y-2 mt-1.5">
            <select 
              id="type" 
              value={showCustomFeeInput ? 'other' : formData.type} 
              onChange={handleInputChange} 
              className="w-full p-2.5 border rounded-md text-sm border-gray-300 focus:border-[#1C4D8D]"
            >
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Library Fee">Library Fee</option>
              <option value="Activity Fee">Activity Fee</option>
              <option value="other">Other (Custom)</option>
            </select>
            
            {showCustomFeeInput && (
              <div className="flex gap-2">
                <Input 
                  id="customFeeType"
                  value={customFeeType}
                  onChange={handleInputChange}
                  placeholder="Enter custom fee type"
                  type="text"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCustomFeeInput(false);
                    setCustomFeeType('');
                    setFormData((prev) => ({ ...prev, type: 'Tuition Fee' }));
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="feeAmount" className="text-[#0F2854] font-semibold">Fee Amount (₱) *</Label>
          <Input 
            id="feeAmount" 
            type="number" 
            value={formData.feeAmount} 
            onChange={handleInputChange} 
            placeholder="Enter fee amount"
            step="0.01"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="dueDate" className="text-[#0F2854] font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Due Date *
          </Label>
          <Input 
            id="dueDate" 
            type="date" 
            value={formData.dueDate} 
            onChange={handleInputChange}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="feeStatus" className="text-[#0F2854] font-semibold">Fee Status</Label>
          <select 
            id="feeStatus" 
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

      {/* Description Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1C4D8D]" />
          <h3 className="font-semibold text-[#0F2854]">Additional Details</h3>
        </div>
        <Separator />
        
        <div>
          <Label htmlFor="description" className="text-[#0F2854] font-semibold">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter fee description"
            className="w-full p-2.5 border rounded-md text-sm mt-1.5 border-gray-300 focus:border-[#1C4D8D]"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

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
                    Are you sure you want to delete <span className="font-semibold">{selectedStudentForDelete.name}</span>?
                  </p>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 mt-3">
                    <p className="text-sm">
                      <span className="font-semibold">Student:</span> {selectedStudentForDelete.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Parent:</span> {selectedStudentForDelete.parentName}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Fee Amount:</span> ₱{selectedStudentForDelete.feeAmount.toLocaleString()}
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
                <p className="text-sm"><span className="font-semibold text-[#0F2854]">Student:</span> <span className="text-[#1C4D8D]">{selectedStudentForNotify.name}</span></p>
                <p className="text-sm mt-1"><span className="font-semibold text-[#0F2854]">Parent:</span> <span className="text-[#1C4D8D]">{selectedStudentForNotify.parentName}</span></p>
                <p className="text-sm mt-1"><span className="font-semibold text-[#0F2854]">Fee:</span> <span className="text-[#1C4D8D]">₱{selectedStudentForNotify.feeAmount.toLocaleString()}</span></p>
                <p className="text-sm mt-1"><span className="font-semibold text-[#0F2854]">Status:</span> {getStatusBadge(selectedStudentForNotify.feeStatus)}</p>
              </div>

              {/* Notification Method Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-[#0F2854]">Select Notification Method:</Label>
                
                {/* SMS Option */}
                <div 
                  className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all"
                  onClick={() => setNotificationMethod('sms')}
                >
                  <input
                    type="radio"
                    name="method"
                    value="sms"
                    checked={notificationMethod === 'sms'}
                    onChange={() => setNotificationMethod('sms')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm text-[#0F2854]">SMS</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Send via SMS to {selectedStudentForNotify.parentContact}
                    </p>
                  </div>
                </div>

                {/* Email Option */}
                <div 
                  className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-400 transition-all"
                  onClick={() => setNotificationMethod('email')}
                >
                  <input
                    type="radio"
                    name="method"
                    value="email"
                    checked={notificationMethod === 'email'}
                    onChange={() => setNotificationMethod('email')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm text-[#0F2854]">Email</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Send via Email to {selectedStudentForNotify.parentEmail || 'Not provided'}
                    </p>
                    {!selectedStudentForNotify.parentEmail && (
                      <p className="text-xs text-red-500 mt-1">⚠️ No email address on file</p>
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
                  Send {notificationMethod === 'sms' ? 'SMS' : 'Email'}
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

      {/* ==================== Student Fee Records Table ==================== */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#0F2854]">Student Fee Records</h3>
            <p className="text-sm text-[#4988C4] mt-1">Manage and track student payments</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" /> Add New Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-[#1C4D8D]" />
                  Add New Student
                </DialogTitle>
              </DialogHeader>
              <StudentForm isEdit={false} />
              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddStudent} className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]">
                  <Plus className="w-4 h-4 mr-2" /> Add Student
                </Button>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} className="flex-1">Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Pencil className="w-6 h-6 text-[#1C4D8D]" />
                Edit Student Information
              </DialogTitle>
            </DialogHeader>
            <StudentForm isEdit={true} />
            <div className="flex gap-2 mt-6">
              <Button onClick={handleEditStudent} className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Save Changes
              </Button>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingStudent(null); resetForm(); }} className="flex-1">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="rounded-lg border border-[#BDE8F5] overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
              <TableRow className="border-b border-[#BDE8F5]">
                <TableHead className="text-[#0F2854] font-bold">Student Name</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Grade</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Parent Name</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Contact Info</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Fee Type</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Amount</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Due Date</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Status</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F5FAFB]'}>
                  <TableCell className="font-semibold text-[#0F2854]">{student.name}</TableCell>
                  <TableCell className="text-[#4988C4]">{student.grade}</TableCell>
                  <TableCell className="text-[#0F2854]">{student.parentName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {student.notificationMethod === 'sms' ? (
                        <p className="text-[#4988C4]">{student.parentContact}</p>
                      ) : (
                        <p className="text-[#4988C4]">{student.parentEmail}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#0F2854]">{student.type || 'Tuition Fee'}</TableCell>
                  <TableCell className="font-bold text-[#1C4D8D]">₱{student.feeAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-[#4988C4]">{student.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(student.feeStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {student.feeStatus !== 'paid' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onRecordPayment(student.id)} title="Record Payment">
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleNotifyClick(student)} title="Send Notification">
                            <Bell className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(student)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteClick(student)} className="text-red-600 hover:text-red-700" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-[#BDE8F5] mx-auto mb-3" />
            <p className="text-[#4988C4] font-medium">No students added yet</p>
            <p className="text-sm text-muted-foreground">Click "Add New Student" to get started</p>
          </div>
        )}
      </Card>
    </>
  );
}