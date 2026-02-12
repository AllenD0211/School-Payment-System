import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Send, Clock, CheckCheck } from "lucide-react";
import { useState } from "react";

export interface Notification {
  id: string;
  recipient: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'pending';
}

interface NotificationPanelProps {
  notifications: Notification[];
  onSendNotification: (recipient: string, message: string) => void;
}

export function NotificationPanel({ notifications, onSendNotification }: NotificationPanelProps) {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (recipient && message) {
      onSendNotification(recipient, message);
      setRecipient('');
      setMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="mb-4">Send Parent Notification</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">Parent Contact</Label>
            <Input
              id="recipient"
              placeholder="Enter phone number or email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter notification message..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button onClick={handleSend} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Recent Notifications</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No notifications sent yet</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{notification.recipient}</span>
                    <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'}>
                      {notification.status === 'sent' ? (
                        <><CheckCheck className="w-3 h-3 mr-1" />Sent</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" />Pending</>
                      )}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
