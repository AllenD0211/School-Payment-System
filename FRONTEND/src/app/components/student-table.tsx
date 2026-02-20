import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Bell, DollarSign, CheckCircle2, AlertCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  parentContact: string;
  feeAmount: number;
  feeStatus: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}

interface StudentTableProps {
  students: Student[];
  onNotifyParent: (studentId: string) => void;
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
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    parentName: '',
    parentContact: '',
    feeAmount: '',
    feeStatus: 'pending' as 'paid' | 'pending' | 'overdue',
    dueDate: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      parentName: '',
      parentContact: '',
      feeAmount: '',
      feeStatus: 'pending',
      dueDate: '',
    });
  };

  // Unified input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'number' ? value : value, // keep feeAmount as string to allow continuous typing
    }));
  };

  const handleAddStudent = () => {
    const { name, grade, parentName, parentContact, feeAmount, dueDate, feeStatus } = formData;
    if (!name || !grade || !parentName || !parentContact || !feeAmount || !dueDate) {
      toast.error('Please fill in all fields');
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
    setFormData({
      name: student.name,
      grade: student.grade,
      parentName: student.parentName,
      parentContact: student.parentContact,
      feeAmount: student.feeAmount.toString(),
      feeStatus: student.feeStatus,
      dueDate: student.dueDate,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditStudent = () => {
    if (!editingStudent) return;
    const { name, grade, parentName, parentContact, feeAmount, dueDate, feeStatus } = formData;
    if (!name || !grade || !parentName || !parentContact || !feeAmount || !dueDate) {
      toast.error('Please fill in all fields');
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

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (confirm(`Are you sure you want to delete ${studentName}?`)) {
      onDeleteStudent(studentId);
      toast.success('Student deleted successfully');
    }
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

  // -------------------- Move Form Outside Dialog --------------------
  const StudentForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Student Name</Label>
        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Enter student name" />
      </div>
      <div>
        <Label htmlFor="grade">Grade</Label>
        <Input id="grade" value={formData.grade} onChange={handleInputChange} placeholder="e.g., Grade 10" />
      </div>
      <div>
        <Label htmlFor="parentName">Parent Name</Label>
        <Input id="parentName" value={formData.parentName} onChange={handleInputChange} placeholder="Enter parent name" />
      </div>
      <div>
        <Label htmlFor="parentContact">Parent Contact</Label>
        <Input id="parentContact" value={formData.parentContact} onChange={handleInputChange} placeholder="e.g., +1 (555) 123-4567" />
      </div>
      <div>
        <Label htmlFor="feeAmount">Fee Amount (₱)</Label>
        <Input id="feeAmount" type="number" value={formData.feeAmount} onChange={handleInputChange} placeholder="Enter fee amount" />
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="feeStatus">Fee Status</Label>
        <select id="feeStatus" value={formData.feeStatus} onChange={handleInputChange} className="w-full p-2 border rounded-md">
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3>Student Fee Records</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <StudentForm />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddStudent} className="flex-1">Add Student</Button>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} className="flex-1">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <StudentForm />
          <div className="flex gap-2 mt-4">
            <Button onClick={handleEditStudent} className="flex-1">Save Changes</Button>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingStudent(null); resetForm(); }} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Parent Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Fee Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{student.parentName}</TableCell>
                <TableCell>{student.parentContact}</TableCell>
                <TableCell>₱{student.feeAmount.toLocaleString()}</TableCell>
                <TableCell>{student.dueDate}</TableCell>
                <TableCell>{getStatusBadge(student.feeStatus)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {student.feeStatus !== 'paid' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onRecordPayment(student.id)}>
                          <DollarSign className="w-4 h-4 mr-1" /> Record
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onNotifyParent(student.id)}>
                          <Bell className="w-4 h-4 mr-1" /> Notify
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEditClick(student)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student.id, student.name)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
} 