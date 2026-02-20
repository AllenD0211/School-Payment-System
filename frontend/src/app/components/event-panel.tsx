
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
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
import { Plus, Pencil, Trash2, Calendar, MapPin } from "lucide-react";

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

interface EventTableProps {
  events: SchoolEvent[];
  onAddEvent: (event: Omit<SchoolEvent, "id">) => void;
  onUpdateEvent: (event: SchoolEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export function EventTable({ events, onAddEvent, onUpdateEvent, onDeleteEvent }: EventTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const resetForm = () => {
    setFormData({ title: "", description: "", date: "", location: "" });
    setEditingEvent(null);
  };

  const handleAddEvent = () => {
    if (!formData.title || !formData.date) {
      toast.error("Title and Date are required");
      return;
    }

    onAddEvent({ ...formData });
    resetForm();
    setIsAddDialogOpen(false);
    toast.success("Event added successfully");
  };

  const handleEditClick = (event: SchoolEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditEvent = () => {
    if (!editingEvent) return;

    if (!formData.title || !formData.date) {
      toast.error("Title and Date are required");
      return;
    }

    onUpdateEvent({
      ...editingEvent,
      ...formData,
    });

    resetForm();
    setIsEditDialogOpen(false);
    toast.success("Event updated successfully");
  };

  const handleDeleteEvent = (event: SchoolEvent) => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      onDeleteEvent(event.id);
      toast.success("Event deleted successfully");
    }
  };

  const EventForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
        />
      </div>
      <div>
        <Label htmlFor="date">Event Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Enter location"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
        />
      </div>
    </div>
  );

  // ---------------------- Filter & Sort ----------------------
  const filteredAndSortedEvents = useMemo(() => {
    const filtered = events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [events, searchQuery]);

  const isUpcoming = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diff = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  // ---------------------- Render ----------------------
  return (
    <Card className="p-6">
      {/* Header + Search */}
      <div className="flex items-center justify-between mb-4">
        <h3>School Events</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <EventForm />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddEvent} className="flex-1">Add Event</Button>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search by title or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm />
          <div className="flex gap-2 mt-4">
            <Button onClick={handleEditEvent} className="flex-1">Save Changes</Button>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {event.title}
                  {isUpcoming(event.date) && (
                    <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                      Upcoming
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditClick(event)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event)}>
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