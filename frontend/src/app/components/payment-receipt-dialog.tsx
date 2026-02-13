import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Mail, Smartphone, Send, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  parentEmail: string;
  parentPhone: string;
  onReceiptSent: (method: 'email' | 'sms', contact: string) => void;
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  studentName,
  studentId,
  paymentAmount,
  paymentDate,
  paymentMethod,
  parentEmail,
  parentPhone,
  onReceiptSent,
}: PaymentReceiptDialogProps) {
  const [sendMethod, setSendMethod] = useState<'email' | 'sms'>('email');
  const [contact, setContact] = useState(parentEmail);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
  const currentDate = new Date().toLocaleDateString();

  const defaultReceiptMessage = `PAYMENT RECEIPT

Receipt Number: ${receiptNumber}
Date: ${currentDate}

Student Name: ${studentName}
Student ID: ${studentId}

Payment Details:
Amount Paid: $${paymentAmount.toLocaleString()}
Payment Method: ${paymentMethod}
Payment Date: ${paymentDate}

Thank you for your payment!

For any queries, contact:
Email: finance@school.edu
Phone: +1 (555) 999-8888

This is an automated receipt from the Student Information System.`;

  const handleMethodChange = (method: 'email' | 'sms') => {
    setSendMethod(method);
    setContact(method === 'email' ? parentEmail : parentPhone);
  };

  const handleSendReceipt = () => {
    if (!contact) {
      toast.error('Please enter a contact');
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      onReceiptSent(sendMethod, contact);
      toast.success(
        `Payment receipt sent via ${sendMethod === 'email' ? 'email' : 'SMS'} to ${contact}`
      );
      setIsSending(false);
      onOpenChange(false);
      setCustomMessage('');
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F2854]">
            <FileText className="w-5 h-5 text-[#1C4D8D]" />
            Send Payment Receipt
          </DialogTitle>
          <DialogDescription>
            Send a payment receipt confirmation to the parent/guardian
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Delivery Method Selection */}
          <div>
            <Label className="text-[#0F2854] mb-3 block">Select Delivery Method</Label>
            <RadioGroup
              value={sendMethod}
              onValueChange={handleMethodChange}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                <RadioGroupItem value="email" id="email-receipt" className="border-[#1C4D8D]" />
                <Label htmlFor="email-receipt" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="p-2 bg-[#BDE8F5] rounded-lg">
                    <Mail className="w-5 h-5 text-[#1C4D8D]" />
                  </div>
                  <div>
                    <p className="text-[#0F2854]">Email</p>
                    <p className="text-xs text-muted-foreground">Send via Gmail</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                <RadioGroupItem value="sms" id="sms-receipt" className="border-[#1C4D8D]" />
                <Label htmlFor="sms-receipt" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="p-2 bg-[#BDE8F5] rounded-lg">
                    <Smartphone className="w-5 h-5 text-[#1C4D8D]" />
                  </div>
                  <div>
                    <p className="text-[#0F2854]">SMS</p>
                    <p className="text-xs text-muted-foreground">Send via Text</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Contact Input */}
          <div>
            <Label htmlFor="contact" className="text-[#0F2854]">
              {sendMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </Label>
            <Input
              id="contact"
              type={sendMethod === 'email' ? 'email' : 'tel'}
              placeholder={sendMethod === 'email' ? 'parent@email.com' : '+1 (555) 123-4567'}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
          </div>

          {/* Receipt Preview */}
          <div>
            <Label className="text-[#0F2854] mb-2 block">Receipt Preview</Label>
            <Card className="p-4 bg-gradient-to-br from-[#BDE8F5]/20 to-white border-[#4988C4]">
              <pre className="whitespace-pre-wrap text-sm text-[#0F2854] font-sans">
                {defaultReceiptMessage}
              </pre>
            </Card>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="customMessage" className="text-[#0F2854]">
              Additional Message (Optional)
            </Label>
            <Textarea
              id="customMessage"
              placeholder="Add any additional message or notes..."
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendReceipt}
            disabled={isSending}
            className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]"
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Receipt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
