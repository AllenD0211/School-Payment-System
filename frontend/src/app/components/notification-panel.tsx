import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
  CheckCheck,
  Clock,
  Bell,
  Trash2,
  MessageSquare,
  Mail,
  Search,
  AlertCircle,
  ReceiptText,
  TrendingUp,
  ThumbsUp,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

export interface Notification {
  id: string;
  recipient: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'pending';
  method?: 'sms' | 'email';
}

interface NotificationPanelProps {
  notifications: Notification[];
  onClearAllNotifications?: () => Promise<boolean>;
}

export function NotificationPanel({ notifications, onClearAllNotifications }: NotificationPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'pending'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'sms' | 'email'>('all');
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = 
      notif.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || notif.status === filterStatus;
    
    let matchesMethod = true;
    if (filterMethod === 'sms') {
      matchesMethod = notif.method === 'sms';
    } else if (filterMethod === 'email') {
      matchesMethod = notif.method === 'email';
    }
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate statistics
  const sentCount = notifications.filter(n => n.status === 'sent').length;
  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const smsCount = notifications.filter(n => n.method === 'sms').length;
  const emailCount = notifications.filter(n => n.method === 'email').length;

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = async () => {
    if (notifications.length === 0) {
      toast.error('No notifications to clear');
      setClearAllDialogOpen(false);
      return;
    }

    if (!onClearAllNotifications) {
      toast.error('Clear action is not configured.');
      setClearAllDialogOpen(false);
      return;
    }

    try {
      setIsClearingAll(true);
      const didClear = await onClearAllNotifications();
      if (!didClear) return;

      toast.success(`All ${notifications.length} notifications cleared successfully!`);
      setClearAllDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear notifications');
    } finally {
      setIsClearingAll(false);
    }
  };

  const getMethodIcon = (method?: string) => {
    if (method === 'sms') {
      return <MessageSquare className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (method === 'email') {
      return <Mail className="w-3.5 h-3.5 text-green-600" />;
    }
    return null;
  };

  const getMethodBadgeColor = (method?: string) => {
    if (method === 'sms') return 'bg-blue-100 text-blue-800';
    if (method === 'email') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getMethodLabel = (method?: string) => {
    if (method === 'sms') return 'SMS';
    if (method === 'email') return 'EMAIL';
    return 'UNKNOWN';
  };

  return (
    <>
      {/* ==================== Clear All Confirmation Dialog ==================== */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Clear All Notifications
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              <div className="space-y-3">
                <p>
                  Are you sure you want to clear <span className="font-semibold text-red-600">{notifications.length} notifications</span>?
                </p>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <span className="font-semibold">Sent:</span> {sentCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">
                      <span className="font-semibold">Pending:</span> {pendingCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <span className="font-semibold">SMS:</span> {smsCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      <span className="font-semibold">Email:</span> {emailCount}
                    </span>
                  </div>
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

      {/* ==================== Main Notification Panel ==================== */}
      <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/70">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-[#0F2854]">Notification History</h3>
              <p className="mt-1 text-xs text-[#4988C4]">Track all sent and pending notifications</p>
            </div>
            <Button
              variant="default"
              onClick={handleClearAll}
              disabled={notifications.length === 0 || isClearingAll}
              className="h-11 px-5 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isClearingAll ? "Clearing..." : "Clear All"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Card className="gap-0 rounded-2xl border border-[#3B82F6] bg-gradient-to-br from-[#E2E8F0] via-[#EDF2F7] to-[#F8FAFC] p-4 shadow-none">
              <div className="flex min-h-[98px] items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Notifications</p>
                  <p className="mt-2 text-4xl font-bold text-[#2563EB]">{notifications.length}</p>
                </div>
                <ReceiptText className="h-8 w-8 text-[#60A5FA]" />
              </div>
            </Card>
            <Card className="gap-0 rounded-2xl border border-[#22C55E] bg-gradient-to-br from-[#E2E8F0] via-[#EDF2F7] to-[#F8FAFC] p-4 shadow-none">
              <div className="flex min-h-[98px] items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Sent</p>
                  <p className="mt-2 text-4xl font-bold text-[#16A34A]">{sentCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-[#22C55E]" />
              </div>
            </Card>
            <Card className="gap-0 rounded-2xl border border-[#10B981] bg-gradient-to-br from-[#E2E8F0] via-[#EDF2F7] to-[#F8FAFC] p-4 shadow-none">
              <div className="flex min-h-[98px] items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="mt-2 text-4xl font-bold text-[#059669]">{pendingCount}</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-[#10B981]" />
              </div>
            </Card>
            <Card className="gap-0 rounded-2xl border border-[#A855F7] bg-gradient-to-br from-[#E2E8F0] via-[#EDF2F7] to-[#F8FAFC] p-4 shadow-none">
              <div className="flex min-h-[98px] items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Email / SMS</p>
                  <p className="mt-2 text-4xl font-bold text-[#7C3AED]">{emailCount} / {smsCount}</p>
                </div>
                <div className="flex items-center gap-1 text-[#A855F7]">
                  <Mail className="h-7 w-7" />
                  <Smartphone className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </div>

          <Separator className="bg-slate-200" />

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by recipient or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10 text-sm border-[#AFC7E0] bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white' : 'h-8 text-xs border-gray-300'}
                >
                  All Status
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'sent' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('sent')}
                  className={filterStatus === 'sent' ? 'h-8 text-xs bg-green-600 hover:bg-green-700 text-white' : 'h-8 text-xs border-gray-300'}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Sent
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('pending')}
                  className={filterStatus === 'pending' ? 'h-8 text-xs bg-yellow-600 hover:bg-yellow-700 text-white' : 'h-8 text-xs border-gray-300'}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 md:ml-auto">
                <Button
                  size="sm"
                  variant={filterMethod === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterMethod('all')}
                  className={filterMethod === 'all' ? 'h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white' : 'h-8 text-xs border-gray-300'}
                >
                  All Methods
                </Button>
                <Button
                  size="sm"
                  variant={filterMethod === 'sms' ? 'default' : 'outline'}
                  onClick={() => setFilterMethod('sms')}
                  className={filterMethod === 'sms' ? 'h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white' : 'h-8 text-xs border-gray-300'}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  SMS
                </Button>
                <Button
                  size="sm"
                  variant={filterMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setFilterMethod('email')}
                  className={filterMethod === 'email' ? 'h-8 text-xs bg-green-600 hover:bg-green-700 text-white' : 'h-8 text-xs border-gray-300'}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#BDE8F5] bg-white overflow-hidden">
            <div className="max-h-[620px] overflow-y-auto divide-y divide-[#D7E9F7]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 text-[#BDE8F5] mx-auto mb-3" />
                  <p className="text-sm text-[#4988C4] font-medium">
                    {notifications.length === 0
                      ? 'No notifications sent yet'
                      : 'No notifications match your filters'}
                  </p>
                  {notifications.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterMethod('all');
                      }}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-[#F7FBFF]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-[#0F2854]">
                            {notification.recipient}
                          </span>
                          <Badge
                            className={
                              notification.status === 'sent'
                                ? 'bg-green-500 hover:bg-green-600 text-white text-[11px]'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white text-[11px]'
                            }
                          >
                            {notification.status === 'sent' ? (
                              <>
                                <CheckCheck className="w-3 h-3 mr-1" />
                                Sent
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                          {notification.method && (
                            <Badge className={`${getMethodBadgeColor(notification.method)} text-[11px] flex items-center gap-1`}>
                              {getMethodIcon(notification.method)}
                              {getMethodLabel(notification.method)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#5E88B5]">{notification.timestamp}</p>
                      </div>
                    </div>
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-[#0F2854] leading-relaxed break-words">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {filteredNotifications.length > 0 && (
            <div className="text-center text-xs text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
