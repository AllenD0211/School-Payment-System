import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { CheckCheck, Clock, Bell, Trash2, MessageSquare, Mail, Search, AlertCircle } from "lucide-react";
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
}

export function NotificationPanel({ notifications }: NotificationPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'pending'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'sms' | 'email'>('all');
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  // Filter notifications - FIXED
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = 
      notif.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || notif.status === filterStatus;
    
    // FIXED: Handle method filter properly - if no method is set, don't filter it out
    let matchesMethod = true;
    if (filterMethod === 'sms') {
      matchesMethod = notif.method === 'sms';
    } else if (filterMethod === 'email') {
      matchesMethod = notif.method === 'email';
    }
    // if filterMethod === 'all', matchesMethod remains true
    
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

  const confirmClearAll = () => {
    if (notifications.length === 0) {
      toast.error('No notifications to clear');
      setClearAllDialogOpen(false);
      return;
    }
    toast.success(`All ${notifications.length} notifications cleared successfully!`);
    setClearAllDialogOpen(false);
  };

  const getMethodIcon = (method?: string) => {
    if (method === 'sms') {
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
    if (method === 'email') {
      return <Mail className="w-4 h-4 text-green-600" />;
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
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearAll}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Clear All
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== Main Notification Panel ==================== */}
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-transparent border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
              </div>
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-transparent border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{sentCount}</p>
              </div>
              <CheckCheck className="w-6 h-6 text-green-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-transparent border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-transparent border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">SMS / Email</p>
                <p className="text-xl font-bold text-purple-600">{smsCount} / {emailCount}</p>
              </div>
              <div className="flex gap-1">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <Mail className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Notification Panel */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#0F2854]">Notification History</h3>
                <p className="text-xs text-[#4988C4] mt-1">Track all sent and pending notifications</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
            <Separator />
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by recipient or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'bg-[#1C4D8D]' : ''}
                >
                  All Status
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'sent' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('sent')}
                  className={filterStatus === 'sent' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Sent
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('pending')}
                  className={filterStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Button>
              </div>

              {/* Method Filter */}
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant={filterMethod === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterMethod('all')}
                  className={filterMethod === 'all' ? 'bg-[#1C4D8D]' : ''}
                >
                  All Methods
                </Button>
                <Button
                  size="sm"
                  variant={filterMethod === 'sms' ? 'default' : 'outline'}
                  onClick={() => setFilterMethod('sms')}
                  className={filterMethod === 'sms' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  SMS
                </Button>
                <Button
                  size="sm"
                  variant={filterMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setFilterMethod('email')}
                  className={filterMethod === 'email' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Button>
              </div>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Notifications List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-[#BDE8F5] mx-auto mb-3" />
                <p className="text-[#4988C4] font-medium">
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
                  className={`p-4 border border-[#BDE8F5] rounded-lg hover:shadow-md transition-shadow ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#F5FAFB]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Recipient and Status */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-[#0F2854]">
                            {notification.recipient}
                          </span>
                          
                          {/* Status Badge */}
                          <Badge
                            className={
                              notification.status === 'sent'
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-yellow-500 hover:bg-yellow-600'
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

                          {/* Method Badge */}
                          {notification.method && (
                            <Badge className={`${getMethodBadgeColor(notification.method)} flex items-center gap-1`}>
                              {getMethodIcon(notification.method)}
                              {getMethodLabel(notification.method)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <p className="text-xs text-[#4988C4]">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-[#0F2854] leading-relaxed break-words">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Stats */}
          {filteredNotifications.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="text-center text-xs text-gray-500">
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}