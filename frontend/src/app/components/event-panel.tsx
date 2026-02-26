import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Plus, Pencil, Trash2, Calendar, MapPin, Clock, AlertCircle, Search } from "lucide-react";

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string; // ✅ NEW
  location: string;
}

interface EventTableProps {
  events: SchoolEvent[];
  onAddEvent: (event: Omit<SchoolEvent, "id">) => void;
  onUpdateEvent: (event: SchoolEvent) => void;
  onDeleteEvent: (id: string) => void;
}

interface EventFormProps {
  formData: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      date: string;
      time: string;
      location: string;
    }>
  >;
}

const EventForm = ({ formData, setFormData }: EventFormProps) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-[#0F2854] font-semibold">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
        />
      </div>
      <div>
        <Label htmlFor="date" className="text-[#0F2854] font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Event Date *
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
        />
      </div>
      <div>
      <Label
        htmlFor="time"
        className="text-[#0F2854] font-semibold flex items-center gap-2"
      >
        <Clock className="w-4 h-4" />
        Event Time *
      </Label>
      <Input
        id="time"
        type="time"
        value={formData.time}
        onChange={(e) =>
          setFormData({ ...formData, time: e.target.value })
        }
        className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
      />
    </div>
      <div>
        <Label htmlFor="location" className="text-[#0F2854] font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Enter location"
          className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-[#0F2854] font-semibold">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
          className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
        />
      </div>
    </div>
  );

export function EventTable({ events, onAddEvent, onUpdateEvent, onDeleteEvent }: EventTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<SchoolEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const resetForm = () => {
    setFormData({ title: "", description: "", date: "", time: "", location: "" });
    setEditingEvent(null);
  };

  const handleAddEvent = () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast.error("Title, Date, and Time are required");
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
      time: event.time,
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

  const handleDeleteClick = (event: SchoolEvent) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      onDeleteEvent(eventToDelete.id);
      toast.success("Event deleted successfully");
    }
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  // ---------------------- Filter & Sort ----------------------
  const filteredAndSortedEvents = useMemo(() => {
    const filtered = events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.time}`);
      const bDateTime = new Date(`${b.date}T${b.time}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });
  }, [events, searchQuery]);

  const isUpcoming = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diff = (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const isPast = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() < today.getTime();
  };

  const daysUntil = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const upcomingCount = events.filter(e => isUpcoming(e.date)).length;
  const pastCount = events.filter(e => isPast(e.date)).length;

  // ---------------------- Render ----------------------
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription>
              {eventToDelete && (
                <div className="space-y-3 mt-2">
                  <p>
                    Are you sure you want to delete <span className="font-semibold text-red-600">"{eventToDelete.title}"</span>?
                  </p>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Date:</span> {eventToDelete.date}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Location:</span> {eventToDelete.location}
                    </p>
                  </div>
                  <p className="text-sm text-red-600 font-semibold">
                    ⚠️ This action cannot be undone.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 mt-4">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="p-6 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#0F2854]">School Events</h3>
            <p className="text-xs text-[#4988C4] mt-1">Manage and schedule all school events</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D]">
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#1C4D8D]" />
                  Add New Event
                </DialogTitle>
              </DialogHeader>
              <EventForm 
                formData={formData}
                setFormData={setFormData}
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddEvent} className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]">Add Event</Button>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-transparent border-l-4 border-blue-500">
            <p className="text-xs text-gray-600">Total Events</p>
            <p className="text-2xl font-bold text-blue-600">{events.length}</p>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-green-50 to-transparent border-l-4 border-green-500">
            <p className="text-xs text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-green-600">{upcomingCount}</p>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-gray-50 to-transparent border-l-4 border-gray-500">
            <p className="text-xs text-gray-600">Past</p>
            <p className="text-2xl font-bold text-gray-600">{pastCount}</p>
          </Card>
        </div>

        <Separator className="mb-4" />

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by title, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
          />
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#1C4D8D]" />
                Edit Event
              </DialogTitle>
            </DialogHeader>
            <EventForm 
              formData={formData}
              setFormData={setFormData}
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleEditEvent} className="flex-1 bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]">Save Changes</Button>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <div className="rounded-lg border border-[#BDE8F5] overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
              <TableRow className="border-b border-[#BDE8F5]">
                <TableHead className="text-[#0F2854] font-bold">Title</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Date</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Location</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Description</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Status</TableHead>
                <TableHead className="text-[#0F2854] font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 text-[#BDE8F5]" />
                      <p className="text-[#4988C4]">No events found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedEvents.map((event, index) => (
                  <TableRow key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F5FAFB]'}>
                    <TableCell className="font-semibold text-[#0F2854]">{event.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[#4988C4]">
                        <Calendar className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">
                            {event.time}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[#4988C4]">
                        <MapPin className="w-4 h-4" />
                        {event.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#0F2854]">{event.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isPast(event.date) ? (
                          <Badge className="bg-gray-500">Past</Badge>
                        ) : isUpcoming(event.date) ? (
                          <Badge className="bg-green-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            In {daysUntil(event.date)} days
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500">Scheduled</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditClick(event)}
                          className="text-[#1C4D8D] hover:text-[#0F2854] hover:bg-[#BDE8F5]/20"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteClick(event)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}