import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Mail, Smartphone, CheckCircle2, Clock, MessageSquare, ThumbsUp, Plus, ReceiptIcon, TrendingUp, AlertCircle, Copy, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface ReceiptFeedback {
  id: string;
  receiptNumber: string;
  studentName: string;
  amount: number;
  sentVia: 'email' | 'sms';
  sentTo: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'delivered' | 'read' | 'acknowledged';
  parentFeedback?: string;
  feedbackAt?: string;
  paymentDescription?: string; // New field for payment reason
}

interface ReceiptFeedbackPanelProps {
  receipts: ReceiptFeedback[];
  onResendReceipt: (receiptId: string) => void | Promise<void>;
  onClearAllReceipts?: () => Promise<boolean>;
  onAddManualReceipt: (
    receipt: Omit<ReceiptFeedback, 'id' | 'sentAt' | 'status'>,
  ) => boolean | Promise<boolean>;
}

export function ReceiptFeedbackPanel({
  receipts,
  onResendReceipt,
  onClearAllReceipts,
  onAddManualReceipt,
}: ReceiptFeedbackPanelProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isManualReceiptDialogOpen, setIsManualReceiptDialogOpen] = useState(false);
  const [isSubmittingManualReceipt, setIsSubmittingManualReceipt] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [manualReceiptForm, setManualReceiptForm] = useState({
    receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
    studentName: '',
    amount: '',
    sentVia: 'email' as 'email' | 'sms',
    sentTo: '',
    paymentDescription: '', // New field
  });

  const resetManualForm = () => {
    setManualReceiptForm({
      receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
      studentName: '',
      amount: '',
      sentVia: 'email',
      sentTo: '',
      paymentDescription: '',
    });
  };

  const handleAddManualReceipt = async () => {
    const receiptNumber = manualReceiptForm.receiptNumber.trim();
    const studentName = manualReceiptForm.studentName.trim();
    const sentVia = manualReceiptForm.sentVia;
    const sentTo = manualReceiptForm.sentTo.trim();
    const amount = Number(manualReceiptForm.amount);
    const paymentDescription = manualReceiptForm.paymentDescription.trim();

    if (!receiptNumber || !studentName || !manualReceiptForm.amount || !sentTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!paymentDescription) {
      toast.error('Please enter a payment description');
      return;
    }

    if (sentVia === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sentTo)) {
        toast.error("Please enter a valid parent email address");
        return;
      }
    } else {
      const phoneRegex = /^\+?[0-9()\-\s]{7,20}$/;
      if (!phoneRegex.test(sentTo)) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    try {
      setIsSubmittingManualReceipt(true);
      const didCreate = await onAddManualReceipt({
        receiptNumber,
        studentName,
        amount,
        sentVia,
        sentTo,
        paymentDescription,
      });

      if (!didCreate) return;

      resetManualForm();
      setIsManualReceiptDialogOpen(false);
      toast.success(
        sentVia === "email"
          ? "Manual receipt sent successfully to parent email"
          : "Manual receipt added successfully"
      );
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add manual receipt');
    } finally {
      setIsSubmittingManualReceipt(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 hover:bg-amber-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'read':
        return <Badge className="bg-purple-500 hover:bg-purple-600"><Eye className="w-3 h-3 mr-1" />Read</Badge>;
      case 'acknowledged':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><ThumbsUp className="w-3 h-3 mr-1" />Acknowledged</Badge>;
      default:
        return null;
    }
  };

  const handleAddNote = (receiptId: string) => {
    if (adminNote.trim()) {
      toast.success('Note added to receipt');
      setAdminNote('');
      setSelectedReceipt(null);
    }
  };

  const handleCopyReceipt = (receiptNumber: string) => {
    navigator.clipboard.writeText(receiptNumber);
    toast.success('Receipt number copied to clipboard!');
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = async () => {
    if (receipts.length === 0) {
      toast.error("No receipts to clear");
      setClearAllDialogOpen(false);
      return;
    }

    if (!onClearAllReceipts) {
      toast.error("Clear action is not configured.");
      setClearAllDialogOpen(false);
      return;
    }

    try {
      setIsClearingAll(true);
      const didClear = await onClearAllReceipts();
      if (!didClear) return;

      toast.success(`All ${receipts.length} receipts cleared successfully!`);
      setClearAllDialogOpen(false);
      setSelectedReceipt(null);
      setAdminNote("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to clear receipts");
    } finally {
      setIsClearingAll(false);
    }
  };

  // Calculate statistics
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const emailCount = receipts.filter(r => r.sentVia === 'email').length;
  const smsCount = receipts.filter(r => r.sentVia === 'sms').length;
  const sentCount = receipts.filter(r => r.status === 'sent').length;
  const pendingCount = receipts.filter(r => r.status === 'pending').length;
  const acknowledgedCount = receipts.filter(r => r.status === 'acknowledged').length;

  const selectedReceiptData = receipts.find(r => r.id === selectedReceipt);

  return (
    <>
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Clear All Receipts
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              <div className="space-y-3">
                <p>
                  Are you sure you want to clear{" "}
                  <span className="font-semibold text-red-600">{receipts.length} receipts</span>?
                </p>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Sent:</span> {sentCount}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Pending:</span> {pendingCount}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Acknowledged:</span> {acknowledgedCount}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Email / SMS:</span> {emailCount} / {smsCount}
                  </p>
                </div>
                <p className="text-sm text-red-600 font-semibold">
                  ⚠️ This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 mt-4">
            <AlertDialogCancel className="flex-1" disabled={isClearingAll}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmClearAll();
              }}
              disabled={isClearingAll}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isClearingAll ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-transparent border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Receipts</p>
              <p className="text-2xl font-bold text-blue-600">{receipts.length}</p>
            </div>
            <ReceiptIcon className="w-6 h-6 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-transparent border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">₱{(totalAmount / 1000).toFixed(0)}K</p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-transparent border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Acknowledged</p>
              <p className="text-2xl font-bold text-emerald-600">{acknowledgedCount}</p>
            </div>
            <ThumbsUp className="w-6 h-6 text-emerald-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-transparent border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Email / SMS</p>
              <p className="text-xl font-bold text-purple-600">{emailCount} / {smsCount}</p>
            </div>
            <div className="flex gap-1">
              <Mail className="w-5 h-5 text-blue-400" />
              <Smartphone className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receipt List */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F2854]">Sent Payment Receipts</h3>
                <p className="text-xs text-[#4988C4] mt-1">Track and manage all sent receipts</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={handleClearAll}
                  disabled={receipts.length === 0 || isClearingAll}
                  className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isClearingAll ? "Clearing..." : "Clear All"}
                </Button>
                <Dialog open={isManualReceiptDialogOpen} onOpenChange={setIsManualReceiptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetManualForm} className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manual Receipt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ReceiptIcon className="w-5 h-5 text-[#1C4D8D]" />
                      Add Manual Payment Receipt
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="receiptNumber" className="text-[#0F2854] font-semibold">Receipt Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="receiptNumber"
                          value={manualReceiptForm.receiptNumber}
                          onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, receiptNumber: e.target.value })}
                          placeholder="e.g., RCP-12345678"
                          className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newNumber = `RCP-${Date.now().toString().slice(-8)}`;
                            setManualReceiptForm({ ...manualReceiptForm, receiptNumber: newNumber });
                          }}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="studentName" className="text-[#0F2854] font-semibold">Student Name</Label>
                      <Input
                        id="studentName"
                        value={manualReceiptForm.studentName}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, studentName: e.target.value })}
                        placeholder="Enter student name"
                        className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="amount" className="text-[#0F2854] font-semibold">Amount (₱)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={manualReceiptForm.amount}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, amount: e.target.value })}
                        placeholder="Enter payment amount"
                        className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentDescription" className="text-[#0F2854] font-semibold">Payment Description / Reason *</Label>
                      <Textarea
                        id="paymentDescription"
                        value={manualReceiptForm.paymentDescription}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, paymentDescription: e.target.value })}
                        placeholder="e.g., Tuition Fee - January 2026, Library Fee, Activity Fee, Sports Program, etc."
                        rows={3}
                        className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] resize-none"
                      />
                      <p className="text-xs text-[#4988C4] mt-1">Describe what payment was made for</p>
                    </div>

                    <div>
                      <Label htmlFor="sentVia" className="text-[#0F2854] font-semibold">Send Via</Label>
                      <select
                        id="sentVia"
                        value={manualReceiptForm.sentVia}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, sentVia: e.target.value as 'email' | 'sms' })}
                        className="w-full p-2.5 border border-[#4988C4]/30 rounded-md focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                      >
                        <option value="email">📧 Email</option>
                        <option value="sms">📱 SMS</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="sentTo" className="text-[#0F2854] font-semibold">
                        {manualReceiptForm.sentVia === 'email' ? '📧 Email Address' : '📱 Phone Number'}
                      </Label>
                      <Input
                        id="sentTo"
                        value={manualReceiptForm.sentTo}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, sentTo: e.target.value })}
                        placeholder={manualReceiptForm.sentVia === 'email' ? 'parent@email.com' : '+1 (555) 123-4567'}
                        className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleAddManualReceipt}
                      disabled={isSubmittingManualReceipt}
                      className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
                    >
                      {isSubmittingManualReceipt ? "Adding..." : "Add Receipt"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isSubmittingManualReceipt}
                      onClick={() => { setIsManualReceiptDialogOpen(false); resetManualForm(); }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Separator className="mb-4" />

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {receipts.length === 0 ? (
                <div className="text-center py-12">
                  <ReceiptIcon className="w-12 h-12 text-[#BDE8F5] mx-auto mb-3" />
                  <p className="text-[#4988C4] font-medium">No receipts sent yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start by adding a manual receipt or sending one from student payments</p>
                </div>
              ) : (
                receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      selectedReceipt === receipt.id
                        ? 'border-[#1C4D8D] bg-[#BDE8F5]/10'
                        : 'border-[#BDE8F5] hover:border-[#4988C4] bg-white'
                    }`}
                    onClick={() => setSelectedReceipt(receipt.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-[#0F2854] font-semibold">{receipt.studentName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[#4988C4]">Receipt #</p>
                          <p className="text-xs font-mono text-[#0F2854]">{receipt.receiptNumber}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyReceipt(receipt.receiptNumber);
                            }}
                            className="text-[#4988C4] hover:text-[#1C4D8D]"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {getStatusBadge(receipt.status)}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-3 pb-3 border-b border-[#BDE8F5]">
                      <div>
                        <p className="text-[#4988C4] text-xs">Amount</p>
                        <p className="text-[#0F2854] font-semibold">₱{receipt.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#4988C4] text-xs">Sent At</p>
                        <p className="text-[#0F2854] text-xs">{receipt.sentAt}</p>
                      </div>
                      <div>
                        <p className="text-[#4988C4] text-xs">Via</p>
                        <div className="flex items-center gap-1 text-[#0F2854]">
                          {receipt.sentVia === 'email' ? (
                            <>
                              <Mail className="w-3 h-3" />
                              <span className="text-xs">Email</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3 h-3" />
                              <span className="text-xs">SMS</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Description */}
                    {receipt.paymentDescription && (
                      <div className="mb-3 pb-3 border-b border-[#BDE8F5]">
                        <p className="text-xs text-[#4988C4] font-semibold mb-1">Payment For:</p>
                        <p className="text-sm text-[#0F2854] bg-[#BDE8F5]/10 p-2 rounded">
                          {receipt.paymentDescription}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#4988C4] truncate">
                        {receipt.sentVia === 'email' ? '📧' : '📱'} {receipt.sentTo}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResendReceipt(receipt.id);
                        }}
                        className="text-[#1C4D8D] hover:text-[#0F2854] hover:bg-[#BDE8F5]/20"
                      >
                        Resend
                      </Button>
                    </div>

                    {receipt.parentFeedback && (
                      <div className="mt-3 pt-3 border-t border-[#BDE8F5]">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-[#4988C4] mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-[#4988C4] font-semibold mb-1">Parent Feedback</p>
                            <p className="text-sm text-[#0F2854] bg-[#BDE8F5]/20 p-2 rounded">
                              "{receipt.parentFeedback}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {receipt.feedbackAt}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Details & Actions Panel */}
        <div className="space-y-4">
          {/* Status Overview */}
          <Card className="p-6 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white rounded-xl shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Receipt Status Overview
            </h3>
            <Separator className="mb-4 bg-white/20" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                <span className="text-[#BDE8F5] flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Sent
                </span>
                <Badge className="bg-blue-500">{receipts.filter(r => r.status === 'sent').length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                <span className="text-[#BDE8F5] flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending
                </span>
                <Badge className="bg-amber-500">{receipts.filter(r => r.status === 'pending').length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                <span className="text-[#BDE8F5] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Delivered
                </span>
                <Badge className="bg-green-500">{receipts.filter(r => r.status === 'delivered').length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                <span className="text-[#BDE8F5] flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Read
                </span>
                <Badge className="bg-purple-500">{receipts.filter(r => r.status === 'read').length}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                <span className="text-[#BDE8F5] flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" /> Acknowledged
                </span>
                <Badge className="bg-emerald-500">{receipts.filter(r => r.status === 'acknowledged').length}</Badge>
              </div>
            </div>
          </Card>

          {/* Admin Notes */}
          {selectedReceiptData && (
            <Card className="p-6 border-[#4988C4]">
              <h3 className="text-[#0F2854] font-semibold mb-3">Add Admin Note</h3>
              <p className="text-xs text-[#4988C4] mb-2">For: {selectedReceiptData.studentName}</p>
              <Textarea
                placeholder="Add internal notes about this receipt..."
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="mb-3 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddNote(selectedReceipt!)}
                  className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
                >
                  Save Note
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdminNote('');
                    setSelectedReceipt(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 bg-gradient-to-br from-[#BDE8F5]/20 to-white border-[#4988C4]">
            <h3 className="text-[#0F2854] font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#4988C4]" />
              How It Works
            </h3>
            <ul className="text-sm text-[#0F2854] space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5 flex-shrink-0" />
                <span>Receipts sent via email or SMS automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5 flex-shrink-0" />
                <span>Parents can reply to acknowledge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5 flex-shrink-0" />
                <span>Track delivery in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5 flex-shrink-0" />
                <span>Add and manage manual receipts with descriptions</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
