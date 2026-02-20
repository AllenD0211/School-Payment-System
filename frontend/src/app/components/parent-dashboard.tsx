import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
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
  CreditCard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StudentInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  rollNumber: string;
  dateOfBirth: string;
}

interface ParentInfo {
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
}

const studentData: StudentInfo = {
  id: "STU-2024-001",
  name: "Emma Johnson",
  grade: "Grade 10",
  section: "A",
  rollNumber: "10-A-15",
  dateOfBirth: "2010-05-15",
};

const parentData: ParentInfo = {
  name: "Michael Johnson",
  email: "michael.j@email.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main Street, Springfield, IL 62701",
  relationship: "Father",
};

const paymentDues: PaymentDue[] = [
  {
    id: "1",
    type: "Tuition Fee",
    amount: 5000,
    dueDate: "2026-02-15",
    status: "pending",
    description: "Monthly tuition fee for February 2026",
  },
  {
    id: "2",
    type: "Library Fee",
    amount: 150,
    dueDate: "2026-02-01",
    status: "overdue",
    description: "Annual library subscription fee",
  },
  {
    id: "3",
    type: "Activity Fee",
    amount: 300,
    dueDate: "2026-03-01",
    status: "pending",
    description: "Sports and extracurricular activities fee",
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
];

const paymentHistory: PaymentHistory[] = [
  {
    id: "PAY-001",
    date: "2026-01-15",
    amount: 5000,
    type: "Tuition Fee",
    method: "Bank Transfer",
    receiptNumber: "RCP-12345678",
  },
  {
    id: "PAY-002",
    date: "2025-12-10",
    amount: 5000,
    type: "Tuition Fee",
    method: "Cash",
    receiptNumber: "RCP-87654321",
  },
  {
    id: "PAY-003",
    date: "2025-11-08",
    amount: 5000,
    type: "Tuition Fee",
    method: "Credit Card",
    receiptNumber: "RCP-45678912",
  },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500">
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
      academic: "bg-blue-500",
      sports: "bg-green-500",
      cultural: "bg-purple-500",
      meeting: "bg-orange-500",
    };
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>;
  };

  const handleDownloadReceipt = (receiptNumber: string) => {
    toast.success(`Receipt ${receiptNumber} downloaded`);
  };

  const handlePayNow = (paymentId: string) => {
    toast.info("Payment gateway integration would open here");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalDue = paymentDues
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#BDE8F5] rounded-xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-[#0F2854]" />
            </div>
            <div>
              <h1 className="text-3xl text-white">Parent Dashboard</h1>
              <p className="text-[#BDE8F5]">Welcome, {parentData.name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Due</p>
                <p className="text-3xl text-red-600">₱{totalDue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Upcoming Events</p>
                <p className="text-3xl text-blue-600">{upcomingEvents.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notifications</p>
                <p className="text-3xl text-purple-600">3</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-[#BDE8F5]"
            >
              Account
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Info */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl text-[#0F2854]">Student Information</h2>
                </div>
                <Separator className="mb-4" />

                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white text-xl">
                      {studentData.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg text-[#0F2854]">{studentData.name}</h3>
                    <p className="text-sm text-[#4988C4]">Student ID: {studentData.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#4988C4] text-xs">Grade</Label>
                    <p className="text-[#0F2854]">{studentData.grade}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Section</Label>
                    <p className="text-[#0F2854]">{studentData.section}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Roll Number</Label>
                    <p className="text-[#0F2854]">{studentData.rollNumber}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Date of Birth</Label>
                    <p className="text-[#0F2854]">{studentData.dateOfBirth}</p>
                  </div>
                </div>
              </Card>

              {/* Fee Summary */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl text-[#0F2854]">Fee Summary</h2>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-[#BDE8F5]/20 to-transparent rounded-lg border-2 border-[#BDE8F5]">
                    <p className="text-sm text-[#4988C4] mb-1">Total Fees Paid</p>
                    <p className="text-3xl text-green-600">₱{totalPaid.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time payment total</p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg border-2 border-red-200">
                    <p className="text-sm text-red-600 mb-1">Outstanding Balance</p>
                    <p className="text-3xl text-red-600">₱{totalDue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentDues.filter((p) => p.status !== "paid").length} pending payments
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700 mb-1">Pending</p>
                      <p className="text-xl text-yellow-700">
                        {paymentDues.filter((p) => p.status === "pending").length}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 mb-1">Overdue</p>
                      <p className="text-xl text-red-700">
                        {paymentDues.filter((p) => p.status === "overdue").length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Dues */}
              <Card className="p-6 bg-white/95 backdrop-blur-sm lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl text-[#0F2854]">Payment Dues</h2>
                </div>
                <Separator className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paymentDues.map((payment) => (
                    <div key={payment.id} className="p-3 border border-[#BDE8F5] rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[#0F2854]">{payment.type}</p>
                          <p className="text-xs text-[#4988C4]">Due: {payment.dueDate}</p>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      <p className="text-2xl text-[#1C4D8D] mb-2">₱{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mb-2">{payment.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6 bg-white/95 backdrop-blur-sm">
                  <h2 className="text-xl text-[#0F2854] mb-4">Payment History</h2>
                  <Separator className="mb-4" />

                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="p-4 border border-[#BDE8F5] rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-[#0F2854]">{payment.type}</p>
                            <p className="text-xs text-[#4988C4]">{payment.date}</p>
                          </div>
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl text-[#1C4D8D]">₱{payment.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Method: {payment.method}</p>
                            <p className="text-xs text-muted-foreground">Receipt: {payment.receiptNumber}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-6 bg-white/95 backdrop-blur-sm mb-4">
                  <h3 className="text-[#0F2854] mb-4">Outstanding Payments</h3>
                  <div className="space-y-3">
                    {paymentDues
                      .filter((p) => p.status !== "paid")
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="p-3 bg-gradient-to-r from-[#BDE8F5]/20 to-transparent rounded-lg border border-[#BDE8F5]"
                        >
                          <p className="text-sm text-[#0F2854] mb-1">{payment.type}</p>
                          <p className="text-xl text-[#1C4D8D] mb-2">₱{payment.amount}</p>
                          <p className="text-xs text-muted-foreground mb-2">Due: {payment.dueDate}</p>
                        </div>
                      ))}
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white">
                  <h3 className="mb-3">Payment Help</h3>
                  <p className="text-sm text-[#BDE8F5] mb-4">
                    Need assistance with payments? Contact the School office.
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
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="p-6 bg-white/95 backdrop-blur-sm">
              <h2 className="text-xl text-[#0F2854] mb-4">All Upcoming Events</h2>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border-2 border-[#BDE8F5] rounded-lg hover:border-[#4988C4] transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-[#0F2854] text-lg">{event.title}</h3>
                      {getEventTypeBadge(event.type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-[#4988C4]">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </p>
                      <p className="flex items-center gap-2 text-[#4988C4]">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </p>
                      <p className="flex items-center gap-2 text-[#4988C4]">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl text-[#0F2854]">Parent/Guardian Information</h2>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <div>
                    <Label className="text-[#4988C4] text-xs">Full Name</Label>
                    <p className="text-[#0F2854]">{parentData.name}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Relationship</Label>
                    <p className="text-[#0F2854]">{parentData.relationship}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Email</Label>
                    <p className="text-[#0F2854] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#4988C4]" />
                      {parentData.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Phone</Label>
                    <p className="text-[#0F2854] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#4988C4]" />
                      {parentData.phone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Address</Label>
                    <p className="text-[#0F2854]">{parentData.address}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-[#1C4D8D]" />
                  <h2 className="text-xl text-[#0F2854]">Student Details</h2>
                </div>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <div>
                    <Label className="text-[#4988C4] text-xs">Student Name</Label>
                    <p className="text-[#0F2854]">{studentData.name}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Student ID</Label>
                    <p className="text-[#0F2854]">{studentData.id}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Grade & Section</Label>
                    <p className="text-[#0F2854]">
                      {studentData.grade} - {studentData.section}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Roll Number</Label>
                    <p className="text-[#0F2854]">{studentData.rollNumber}</p>
                  </div>
                  <div>
                    <Label className="text-[#4988C4] text-xs">Date of Birth</Label>
                    <p className="text-[#0F2854]">{studentData.dateOfBirth}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}
