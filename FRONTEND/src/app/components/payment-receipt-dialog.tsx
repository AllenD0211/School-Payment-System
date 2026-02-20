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
import { Badge } from "@/app/components/ui/badge";
import {
  Mail,
  Smartphone,
  Send,
  FileText,
  CheckCircle2,
  Copy,
  Download,
  AlertCircle,
  Clock,
  DollarSign,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentType: string;
  receiptNumber?: string;
  parentEmail: string;
  parentPhone: string;
  parentName?: string;
  schoolName?: string;
  onReceiptSent: (method: "email" | "sms", contact: string) => void;
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  studentName,
  studentId,
  paymentAmount,
  paymentDate,
  paymentMethod,
  paymentType,
  receiptNumber: providedReceiptNumber,
  parentEmail,
  parentPhone,
  parentName = "Guardian",
  schoolName = "GREENFIELD PUBLIC SCHOOL",
  onReceiptSent,
}: PaymentReceiptDialogProps) {
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");
  const [contact, setContact] = useState(parentEmail);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const receiptNumber =
    providedReceiptNumber || `RCP-${Date.now().toString().slice(-8)}`;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const receiptContent = {
    title: "PAYMENT RECEIPT",
    receiptNumber,
    currentDate,
    student: {
      name: studentName,
      id: studentId,
    },
    amount: paymentAmount,
    paymentMethod,
    paymentType,
    paymentDate,
    parentName,
    schoolName,
    customMessage,
  };

  const generatePlainTextReceipt = () => {
    return `${receiptContent.schoolName}
"Excellence in Education"

===============================================
                    PAYMENT RECEIPT
===============================================

Receipt Number: ${receiptContent.receiptNumber}
Date Issued: ${receiptContent.currentDate}
Status: PAID

===============================================
                   STUDENT DETAILS
===============================================
Name: ${receiptContent.student.name}
Student ID: ${receiptContent.student.id}

===============================================
                   PAYMENT DETAILS
===============================================
Payment Type: ${receiptContent.paymentType}
Amount Paid: ₱${receiptContent.amount.toLocaleString()}
Payment Method: ${receiptContent.paymentMethod}
Payment Date: ${receiptContent.paymentDate}

===============================================
                  PAYER DETAILS
===============================================
Name: ${receiptContent.parentName}

===============================================
                      NOTES
===============================================
${customMessage || "Thank you for your payment!"}

This is an official receipt from ${receiptContent.schoolName}.
Please retain this receipt for your records.

For inquiries, contact:
Email: finance@school.edu
Phone: +1 (555) 999-8888

===============================================
Generated: ${new Date().toLocaleString()}
===============================================`;
  };

  const generatePDFReceipt = () => {
    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // ========== HEADER ==========
      doc.setFillColor(15, 40, 84);
      doc.rect(0, 0, pageWidth, 30, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(receiptContent.schoolName, margin, 12);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text('"Excellence in Education"', margin, 18);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 40, 84);
      doc.text("PAYMENT RECEIPT", pageWidth - margin - 40, 15);

      yPosition = 42;

      // ========== RECEIPT INFO ==========
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.setFont("Helvetica", "normal");

      doc.text(`Receipt #: ${receiptContent.receiptNumber}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Date: ${receiptContent.currentDate}`, margin, yPosition);
      yPosition += 5;
      doc.text("Status: PAID", margin, yPosition);

      yPosition += 7;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 7;

      // ========== STUDENT SECTION ==========
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 40, 84);
      doc.text("STUDENT DETAILS", margin, yPosition);

      yPosition += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);

      doc.text(`Name: ${receiptContent.student.name}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Student ID: ${receiptContent.student.id}`, margin, yPosition);

      yPosition += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 7;

      // ========== PAYMENT SECTION ==========
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 40, 84);
      doc.text("PAYMENT DETAILS", margin, yPosition);

      yPosition += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);

      doc.text(`Payment Type: ${receiptContent.paymentType}`, margin, yPosition);
      yPosition += 5;
      doc.text(
        `Amount Paid: ₱${receiptContent.amount.toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 5;
      doc.text(`Payment Method: ${receiptContent.paymentMethod}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Payment Date: ${receiptContent.paymentDate}`, margin, yPosition);

      yPosition += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 7;

      // ========== PAYER SECTION ==========
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 40, 84);
      doc.text("PAYER DETAILS", margin, yPosition);

      yPosition += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`Name: ${receiptContent.parentName}`, margin, yPosition);

      yPosition += 8;

      // ========== CUSTOM MESSAGE ==========
      if (customMessage) {
        yPosition += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 7;

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 40, 84);
        doc.text("ADDITIONAL MESSAGE", margin, yPosition);

        yPosition += 5;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);

        const lines = doc.splitTextToSize(customMessage, contentWidth - 6);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin + 3, yPosition);
          yPosition += 4;
        });
      }

      // ========== FOOTER ==========
      yPosition = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);

      yPosition += 3;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);

      doc.text(
        "This is an official receipt from " + receiptContent.schoolName,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 3;
      doc.text("Please retain this receipt for your records.", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 3;
      doc.text(
        "For inquiries: finance@school.edu | +1 (555) 999-8888",
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      return doc;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw error;
    }
  };

  const handleMethodChange = (method: "email" | "sms") => {
    setSendMethod(method);
    setContact(method === "email" ? parentEmail : parentPhone);
  };

  const handleCopyReceipt = () => {
    try {
      navigator.clipboard.writeText(generatePlainTextReceipt());
      toast.success("Receipt copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy receipt");
    }
  };

  const handleDownloadReceipt = async (format: "txt" | "pdf") => {
    try {
      setIsDownloading(true);

      if (format === "txt") {
        // Download as Text file
        const element = document.createElement("a");
        const file = new Blob([generatePlainTextReceipt()], {
          type: "text/plain;charset=utf-8",
        });
        element.href = URL.createObjectURL(file);
        element.download = `Receipt-${receiptNumber}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);

        toast.success("Receipt downloaded as TXT!");
      } else if (format === "pdf") {
        // Download as PDF
        const doc = generatePDFReceipt();
        doc.save(`Receipt-${receiptNumber}.pdf`);
        toast.success("Receipt downloaded as PDF!");
      }
    } catch (error) {
      console.error(`Download error (${format}):`, error);
      toast.error(`Failed to download receipt as ${format.toUpperCase()}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const validateContact = () => {
    if (!contact.trim()) {
      toast.error(
        `Please enter a ${
          sendMethod === "email" ? "email address" : "phone number"
        }`
      );
      return false;
    }

    if (sendMethod === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        toast.error("Please enter a valid email address");
        return false;
      }
    }

    if (sendMethod === "sms") {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(contact.replace(/\s/g, ""))) {
        toast.error("Please enter a valid phone number (at least 10 digits)");
        return false;
      }
    }

    return true;
  };

  const handleSendReceipt = () => {
    if (!validateContact()) return;

    setIsSending(true);

    // Simulate sending
    setTimeout(() => {
      onReceiptSent(sendMethod, contact);
      toast.success(
        `Payment receipt sent via ${
          sendMethod === "email" ? "Email" : "SMS"
        } to ${contact}`
      );
      setIsSending(false);
      onOpenChange(false);

      // Reset form
      setCustomMessage("");
      setContact(sendMethod === "email" ? parentEmail : parentPhone);
      setSendMethod("email");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-[#0F2854]">
            <div className="p-2 bg-[#BDE8F5] rounded-lg">
              <FileText className="w-6 h-6 text-[#1C4D8D]" />
            </div>
            Send Payment Receipt
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Send a payment receipt confirmation to the parent/guardian via email or SMS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student & Payment Summary */}
          <Card className="p-5 bg-gradient-to-br from-[#BDE8F5] via-[#BDE8F5]/50 to-white border-2 border-[#4988C4]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-[#4988C4] mb-1">
                  <User className="w-3 h-3" />
                  Student Name
                </div>
                <p className="text-[#0F2854] font-bold">{studentName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#4988C4] mb-1">Student ID</p>
                <p className="text-[#0F2854] font-bold">{studentId}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-[#4988C4] mb-1">
                  <DollarSign className="w-3 h-3" />
                  Amount Paid
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ₱{paymentAmount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-[#4988C4] mb-1">
                  <Clock className="w-3 h-3" />
                  Payment Date
                </div>
                <p className="text-[#0F2854] font-bold">{paymentDate}</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#4988C4]">Payment Type</p>
                <Badge className="bg-blue-500 mt-1">{paymentType}</Badge>
              </div>
              <div>
                <p className="text-xs text-[#4988C4]">Payment Method</p>
                <Badge className="bg-green-500 mt-1">{paymentMethod}</Badge>
              </div>
            </div>
          </Card>

          {/* Delivery Method Selection */}
          <div className="space-y-3">
            <Label className="text-[#0F2854] font-bold text-base">
              📤 Select Delivery Method
            </Label>
            <RadioGroup
              value={sendMethod}
              onValueChange={handleMethodChange}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {/* Email Option */}
              <div onClick={() => handleMethodChange("email")} className="relative">
                <RadioGroupItem value="email" id="email-receipt" className="sr-only" />
                <Label
                  htmlFor="email-receipt"
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    sendMethod === "email"
                      ? "border-[#1C4D8D] bg-gradient-to-r from-[#1C4D8D]/15 to-transparent shadow-md"
                      : "border-[#BDE8F5] hover:border-[#4988C4] bg-gradient-to-r from-[#BDE8F5]/5 to-transparent"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg transition-colors ${
                      sendMethod === "email" ? "bg-[#1C4D8D]" : "bg-[#BDE8F5]"
                    }`}
                  >
                    <Mail
                      className={`w-5 h-5 ${
                        sendMethod === "email" ? "text-white" : "text-[#1C4D8D]"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#0F2854] font-semibold">Email</p>
                    <p className="text-xs text-[#4988C4]">Send to parent's email</p>
                  </div>
                  {sendMethod === "email" && (
                    <CheckCircle2 className="w-5 h-5 text-[#1C4D8D] flex-shrink-0" />
                  )}
                </Label>
              </div>

              {/* SMS Option */}
              <div onClick={() => handleMethodChange("sms")} className="relative">
                <RadioGroupItem value="sms" id="sms-receipt" className="sr-only" />
                <Label
                  htmlFor="sms-receipt"
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    sendMethod === "sms"
                      ? "border-[#1C4D8D] bg-gradient-to-r from-[#1C4D8D]/15 to-transparent shadow-md"
                      : "border-[#BDE8F5] hover:border-[#4988C4] bg-gradient-to-r from-[#BDE8F5]/5 to-transparent"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg transition-colors ${
                      sendMethod === "sms" ? "bg-[#1C4D8D]" : "bg-[#BDE8F5]"
                    }`}
                  >
                    <Smartphone
                      className={`w-5 h-5 ${
                        sendMethod === "sms" ? "text-white" : "text-[#1C4D8D]"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#0F2854] font-semibold">SMS</p>
                    <p className="text-xs text-[#4988C4]">Send text message</p>
                  </div>
                  {sendMethod === "sms" && (
                    <CheckCircle2 className="w-5 h-5 text-[#1C4D8D] flex-shrink-0" />
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Contact Input */}
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-[#0F2854] font-bold">
              {sendMethod === "email" ? "📧 Email Address" : "📱 Phone Number"}
            </Label>
            <Input
              id="contact"
              type={sendMethod === "email" ? "email" : "tel"}
              placeholder={
                sendMethod === "email"
                  ? "parent@email.com"
                  : "+1 (555) 123-4567"
              }
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2 text-[#0F2854]"
            />
            <p className="text-xs text-[#4988C4]">
              {sendMethod === "email"
                ? `Current email: ${parentEmail}`
                : `Current phone: ${parentPhone}`}
            </p>
          </div>

          <Separator />

          {/* Additional Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customMessage" className="text-[#0F2854] font-bold">
                📝 Additional Message
              </Label>
              <Badge variant="outline" className="ml-2 text-xs">
                Optional
              </Badge>
            </div>
            <Textarea
              id="customMessage"
              placeholder="Add any additional message or notes to include in the receipt..."
              rows={3}
              value={customMessage}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setCustomMessage(e.target.value);
                }
              }}
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2 text-[#0F2854] resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#4988C4]">
                {customMessage.length}/500 characters
              </p>
              {customMessage.length > 450 && (
                <div className="flex items-center gap-1 text-xs text-orange-500">
                  <AlertCircle className="w-3 h-3" />
                  Approaching limit
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Receipt Preview & Download */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[#1C4D8D] hover:bg-[#BDE8F5] gap-2"
              >
                {showPreview ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyReceipt}
                  disabled={isDownloading}
                  className="text-xs border-[#4988C4] text-[#1C4D8D] hover:bg-[#BDE8F5]"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReceipt("txt")}
                  disabled={isDownloading}
                  className="text-xs border-[#4988C4] text-[#1C4D8D] hover:bg-[#BDE8F5]"
                >
                  <Download className="w-3 h-3 mr-1" />
                  TXT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReceipt("pdf")}
                  disabled={isDownloading}
                  className="text-xs border-[#4988C4] text-[#1C4D8D] hover:bg-[#BDE8F5]"
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-1">⏳</span>
                      PDF
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {showPreview && (
              <Card className="p-4 bg-gradient-to-br from-[#BDE8F5]/10 to-white border-[#4988C4] max-h-[300px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs text-[#0F2854] font-mono leading-relaxed">
                  {generatePlainTextReceipt()}
                </pre>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setCustomMessage("");
              setContact(sendMethod === "email" ? parentEmail : parentPhone);
              setSendMethod("email");
            }}
            disabled={isSending || isDownloading}
            className="border-[#4988C4] text-[#1C4D8D]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendReceipt}
            disabled={isSending || isDownloading || !contact}
            className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white font-semibold"
          >
            {isSending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sending Receipt...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Receipt via {sendMethod === "email" ? "Email" : "SMS"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}