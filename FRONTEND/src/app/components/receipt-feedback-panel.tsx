import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Mail, Smartphone, CheckCircle2, Clock, MessageSquare, ThumbsUp, Plus, Receipt as ReceiptIcon } from "lucide-react";
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
  status: 'sent' | 'delivered' | 'read' | 'acknowledged';
  parentFeedback?: string;
  feedbackAt?: string;
}

interface ReceiptFeedbackPanelProps {
  receipts: ReceiptFeedback[];
  onResendReceipt: (receiptId: string) => void;
  onAddManualReceipt: (receipt: Omit<ReceiptFeedback, 'id' | 'sentAt' | 'status'>) => void;
}

export function ReceiptFeedbackPanel({ receipts, onResendReceipt, onAddManualReceipt }: ReceiptFeedbackPanelProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isManualReceiptDialogOpen, setIsManualReceiptDialogOpen] = useState(false);
  const [manualReceiptForm, setManualReceiptForm] = useState({
    receiptNumber: '',
    studentName: '',
    amount: '',
    sentVia: 'email' as 'email' | 'sms',
    sentTo: '',
  });

  const resetManualForm = () => {
    setManualReceiptForm({
      receiptNumber: '',
      studentName: '',
      amount: '',
      sentVia: 'email',
      sentTo: '',
    });
  };

  const handleAddManualReceipt = () => {
    if (!manualReceiptForm.receiptNumber || !manualReceiptForm.studentName || !manualReceiptForm.amount || !manualReceiptForm.sentTo) {
      toast.error('Please fill in all fields');
      return;
    }

    onAddManualReceipt({
      receiptNumber: manualReceiptForm.receiptNumber,
      studentName: manualReceiptForm.studentName,
      amount: parseFloat(manualReceiptForm.amount),
      sentVia: manualReceiptForm.sentVia,
      sentTo: manualReceiptForm.sentTo,
    });

    resetManualForm();
    setIsManualReceiptDialogOpen(false);
    toast.success('Manual receipt added successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'read':
        return <Badge className="bg-purple-500"><CheckCircle2 className="w-3 h-3 mr-1" />Read</Badge>;
      case 'acknowledged':
        return <Badge className="bg-emerald-500"><ThumbsUp className="w-3 h-3 mr-1" />Acknowledged</Badge>;
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Receipt List */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#0F2854]">Sent Payment Receipts</h3>
            <div className="flex items-center gap-2">
              <Dialog open={isManualReceiptDialogOpen} onOpenChange={setIsManualReceiptDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetManualForm} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manual Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Manual Payment Receipt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="receiptNumber">Receipt Number</Label>
                      <Input
                        id="receiptNumber"
                        value={manualReceiptForm.receiptNumber}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, receiptNumber: e.target.value })}
                        placeholder="e.g., RCP-12345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentName">Student Name</Label>
                      <Input
                        id="studentName"
                        value={manualReceiptForm.studentName}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, studentName: e.target.value })}
                        placeholder="Enter student name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (₱)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={manualReceiptForm.amount}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, amount: e.target.value })}
                        placeholder="Enter payment amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sentVia">Send Via</Label>
                      <select
                        id="sentVia"
                        value={manualReceiptForm.sentVia}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, sentVia: e.target.value as 'email' | 'sms' })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="sentTo">
                        {manualReceiptForm.sentVia === 'email' ? 'Email Address' : 'Phone Number'}
                      </Label>
                      <Input
                        id="sentTo"
                        value={manualReceiptForm.sentTo}
                        onChange={(e) => setManualReceiptForm({ ...manualReceiptForm, sentTo: e.target.value })}
                        placeholder={manualReceiptForm.sentVia === 'email' ? 'parent@email.com' : '+1 (555) 123-4567'}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAddManualReceipt} className="flex-1">Add Receipt</Button>
                    <Button variant="outline" onClick={() => { setIsManualReceiptDialogOpen(false); resetManualForm(); }} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-[#1C4D8D]">
                {receipts.length} Total
              </Badge>
            </div>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {receipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No receipts sent yet
              </p>
            ) : (
              receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                    selectedReceipt === receipt.id
                      ? 'border-[#1C4D8D] bg-[#BDE8F5]/10'
                      : 'border-[#BDE8F5] hover:border-[#4988C4]'
                  }`}
                  onClick={() => setSelectedReceipt(receipt.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[#0F2854]">{receipt.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        Receipt #{receipt.receiptNumber}
                      </p>
                    </div>
                    {getStatusBadge(receipt.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-[#4988C4] text-xs">Amount</p>
                      <p className="text-[#0F2854]">₱{receipt.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[#4988C4] text-xs">Sent At</p>
                      <p className="text-[#0F2854]">{receipt.sentAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-[#4988C4]">
                      {receipt.sentVia === 'email' ? (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>{receipt.sentTo}</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>{receipt.sentTo}</span>
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResendReceipt(receipt.id);
                      }}
                      className="text-[#1C4D8D] hover:text-[#0F2854]"
                    >
                      Resend
                    </Button>
                  </div>

                  {receipt.parentFeedback && (
                    <div className="mt-3 pt-3 border-t border-[#BDE8F5]">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-[#4988C4] mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-[#4988C4] mb-1">Parent Feedback</p>
                          <p className="text-sm text-[#0F2854] bg-[#BDE8F5]/20 p-2 rounded">
                            {receipt.parentFeedback}
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
        <Card className="p-6 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] text-white">
          <h3 className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Receipt Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#BDE8F5]">Sent</span>
              <span>{receipts.filter(r => r.status === 'sent').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#BDE8F5]">Delivered</span>
              <span>{receipts.filter(r => r.status === 'delivered').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#BDE8F5]">Read</span>
              <span>{receipts.filter(r => r.status === 'read').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#BDE8F5]">Acknowledged</span>
              <span>{receipts.filter(r => r.status === 'acknowledged').length}</span>
            </div>
          </div>
        </Card>

        {selectedReceipt && (
          <Card className="p-6">
            <h3 className="text-[#0F2854] mb-3">Add Admin Note</h3>
            <Textarea
              placeholder="Add internal notes about this receipt..."
              rows={4}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="mb-3 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
            <Button
              onClick={() => handleAddNote(selectedReceipt)}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
            >
              Save Note
            </Button>
          </Card>
        )}

        <Card className="p-6 bg-[#BDE8F5]/20 border-[#4988C4]">
          <h3 className="text-[#0F2854] mb-2">How Feedback Works</h3>
          <ul className="text-sm text-[#0F2854] space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5" />
              <span>Receipts are automatically sent via email or SMS</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5" />
              <span>Parents can reply to acknowledge receipt</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1C4D8D] mt-0.5" />
              <span>Track delivery and read status in real-time</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}