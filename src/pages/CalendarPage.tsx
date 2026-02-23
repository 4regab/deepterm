import React, { useState, useEffect, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import {
  CalendarEvent,
  CalendarEventType,
  EVENT_TYPE_CONFIG,
} from "@/types/calendar";
import {
  getEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/services/calendarService";

const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<CalendarEventType>("study");
  const [formStartDate, setFormStartDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formNotes, setFormNotes] = useState("");
  const [formAllDay, setFormAllDay] = useState(false);

  useEffect(() => {
    setEvents(getEvents());
  }, []);

  const refreshEvents = () => setEvents(getEvents());

  // Dates that have events — used to render dots on the calendar
  const eventDates = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const key = format(new Date(ev.startDateTime), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [events]);

  const datesWithEvents = useMemo(
    () => [...eventDates.keys()].map((d) => new Date(d)),
    [eventDates]
  );

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((e) => isSameDay(new Date(e.startDateTime), selectedDate))
        .sort(
          (a, b) =>
            new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
        ),
    [events, selectedDate]
  );

  const openNewEventDialog = (date?: Date) => {
    setEditingEvent(null);
    const d = date || selectedDate;
    setFormTitle("");
    setFormType("study");
    setFormStartDate(format(d, "yyyy-MM-dd"));
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormNotes("");
    setFormAllDay(false);
    setDialogOpen(true);
  };

  const openEditEventDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    setFormTitle(event.title);
    setFormType(event.type);
    setFormStartDate(format(start, "yyyy-MM-dd"));
    setFormStartTime(format(start, "HH:mm"));
    setFormEndTime(format(end, "HH:mm"));
    setFormNotes(event.notes || "");
    setFormAllDay(event.allDay);
    setDialogOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const startDateTime = new Date(`${formStartDate}T${formStartTime}:00`).toISOString();
    const endDateTime = new Date(`${formStartDate}T${formEndTime}:00`).toISOString();

    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, {
        title: formTitle.trim(),
        type: formType,
        startDateTime,
        endDateTime,
        allDay: formAllDay,
        notes: formNotes.trim() || null,
      });
    } else {
      createCalendarEvent({
        title: formTitle.trim(),
        type: formType,
        startDateTime,
        endDateTime,
        allDay: formAllDay,
        notes: formNotes.trim() || null,
      });
    }
    refreshEvents();
    setDialogOpen(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteCalendarEvent(eventId);
    refreshEvents();
  };

  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 relative inline-block">
            <CalendarDays className="inline-block mr-2 h-8 w-8" />
            Calendar
            <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#00C6C2] -z-10 transform -rotate-1"></div>
          </h1>
          <p className="text-gray-700 mt-3">Schedule your study sessions and track deadlines</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Left: Calendar picker (reuses existing shadcn/ui Calendar) */}
          <Card className="neo-box lg:col-span-1">
            <CardContent className="p-4 flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => day && setSelectedDate(day)}
                month={month}
                onMonthChange={setMonth}
                modifiers={{ hasEvent: datesWithEvents }}
                modifiersClassNames={{ hasEvent: "!font-bold !underline decoration-neo-accent2 decoration-2 underline-offset-4" }}
                className="rounded-md"
              />

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <span>{config.emoji}</span>
                    <span className="text-gray-600">{config.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Selected day events */}
          <Card className="neo-box lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <Button
                  onClick={() => openNewEventDialog()}
                  className="bg-neo-accent2 text-white hover:bg-neo-accent2/90 neo-border shadow-neo-sm"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> New Event
                </Button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No events for this day</p>
                  <Button
                    variant="link"
                    className="mt-2 text-neo-accent2"
                    onClick={() => openNewEventDialog()}
                  >
                    Add one
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((ev) => {
                    const config = EVENT_TYPE_CONFIG[ev.type];
                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-lg neo-border shadow-neo-sm ${config.bgColor} flex items-start justify-between group`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{config.emoji}</span>
                            <span className="font-medium text-sm">{ev.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {format(new Date(ev.startDateTime), "h:mm a")} –{" "}
                            {format(new Date(ev.endDateTime), "h:mm a")}
                          </p>
                          {ev.notes && (
                            <p className="text-xs text-gray-500 mt-1">{ev.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditEventDialog(ev)}
                            aria-label="Edit event"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeleteEvent(ev.id)}
                            aria-label="Delete event"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveEvent}>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
              <DialogDescription>
                {editingEvent ? "Update event details." : "Create a new calendar event."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Event title..."
                  className="neo-border"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as CalendarEventType)}>
                    <SelectTrigger className="neo-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.emoji} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="neo-border"
                    required
                  />
                </div>
              </div>
              {!formAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="event-start-time">Start Time</Label>
                    <Input
                      id="event-start-time"
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="neo-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="event-end-time">End Time</Label>
                    <Input
                      id="event-end-time"
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="neo-border"
                    />
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="event-notes">Notes</Label>
                <Textarea
                  id="event-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="neo-border resize-none"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              {editingEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    handleDeleteEvent(editingEvent.id);
                    setDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-neo-accent2 text-white hover:bg-neo-accent2/90">
                {editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CalendarPage;
