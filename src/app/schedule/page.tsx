'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';

interface CalendarEvent {
  id: string;
  title: string;
  traineeId: string;
  traineeName: string;
  traineePhoto?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  color: string;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Personal Training',
    traineeId: '1',
    traineeName: 'Sarah Johnson',
    traineePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-21',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    type: 'Strength Training',
    location: 'Main Gym',
    status: 'scheduled',
    color: 'bg-blue-500'
  },
  {
    id: '2',
    title: 'HIIT Session',
    traineeId: '2',
    traineeName: 'Mike Chen',
    traineePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-21',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    type: 'HIIT',
    location: 'Studio A',
    status: 'scheduled',
    color: 'bg-green-500'
  },
  {
    id: '3',
    title: 'Athletic Performance',
    traineeId: '3',
    traineeName: 'Alex Rivera',
    traineePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-22',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    type: 'Athletic Performance',
    location: 'Main Gym',
    status: 'scheduled',
    color: 'bg-purple-500'
  },
  {
    id: '4',
    title: 'Yoga & Flexibility',
    traineeId: '4',
    traineeName: 'Emma Wilson',
    date: '2024-09-23',
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    type: 'Yoga',
    location: 'Studio B',
    status: 'scheduled',
    color: 'bg-orange-500'
  },
  {
    id: '5',
    title: 'Personal Training',
    traineeId: '1',
    traineeName: 'Sarah Johnson',
    traineePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face',
    date: '2024-09-24',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    type: 'Cardio',
    location: 'Cardio Zone',
    status: 'scheduled',
    color: 'bg-blue-500'
  },
  {
    id: '6',
    title: 'Strength Training',
    traineeId: '5',
    traineeName: 'David Park',
    date: '2024-09-25',
    startTime: '11:00',
    endTime: '12:00',
    duration: 60,
    type: 'Strength Training',
    location: 'Main Gym',
    status: 'scheduled',
    color: 'bg-red-500'
  }
];

const timeSlots: TimeSlot[] = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 6; // Start from 6 AM
  return {
    time: `${hour.toString().padStart(2, '0')}:00`,
    hour,
    minute: 0
  };
});

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchedulePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null);

  if (!user) {
    return <div>Loading...</div>;
  }

  // Get the start of the week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const getEventsForTimeSlot = (date: string, time: string) => {
    return events.filter(event =>
      event.date === date &&
      event.startTime <= time &&
      event.endTime > time
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleTimeSlotClick = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time });
    setShowAddEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500';
      case 'cancelled':
        return 'border-l-red-500';
      case 'no-show':
        return 'border-l-gray-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <TrainerLayout currentPage="schedule">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>

              {/* View Mode Toggle */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'week'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    viewMode === 'day'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateDay('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                  {viewMode === 'week' ? (
                    `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : (
                    selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  )}
                </div>

                <button
                  onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateDay('next')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Today
              </button>

              <button
                onClick={() => setShowAddEventModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'week' ? (
          /* Week View */
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-4 bg-gray-50 border-r"></div>
              {weekDates.map((date, index) => (
                <div key={index} className={`p-4 bg-gray-50 border-r last:border-r-0 text-center ${isToday(date) ? 'bg-blue-50' : ''}`}>
                  <div className="font-medium text-gray-900">{weekDays[index]}</div>
                  <div className={`text-2xl font-bold ${isToday(date) ? 'text-blue-600' : isPast(date) ? 'text-gray-400' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="max-h-[600px] overflow-y-auto">
              {timeSlots.map((slot) => (
                <div key={slot.time} className="grid grid-cols-8 border-b hover:bg-gray-50">
                  <div className="p-4 border-r bg-gray-50 text-sm font-medium text-gray-500 text-right">
                    {slot.time}
                  </div>
                  {weekDates.map((date, dateIndex) => {
                    const dateStr = formatDate(date);
                    const eventsInSlot = getEventsForTimeSlot(dateStr, slot.time);

                    return (
                      <div
                        key={dateIndex}
                        className="p-2 border-r last:border-r-0 min-h-[60px] cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleTimeSlotClick(dateStr, slot.time)}
                      >
                        {eventsInSlot.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className={`${event.color} text-white p-2 rounded-md text-xs font-medium cursor-pointer hover:opacity-90 mb-1 border-l-4 ${getStatusColor(event.status)}`}
                          >
                            <div className="font-semibold truncate">{event.traineeName}</div>
                            <div className="truncate">{event.type}</div>
                            <div className="text-xs opacity-90">{event.startTime}-{event.endTime}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Day View */
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {timeSlots.map((slot) => {
                const dateStr = formatDate(selectedDate);
                const eventsInSlot = getEventsForTimeSlot(dateStr, slot.time);

                return (
                  <div key={slot.time} className="flex border-b hover:bg-gray-50">
                    <div className="w-24 p-4 border-r bg-gray-50 text-sm font-medium text-gray-500 text-right">
                      {slot.time}
                    </div>
                    <div
                      className="flex-1 p-4 min-h-[80px] cursor-pointer hover:bg-gray-100 relative"
                      onClick={() => handleTimeSlotClick(dateStr, slot.time)}
                    >
                      {eventsInSlot.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={`${event.color} text-white p-3 rounded-md cursor-pointer hover:opacity-90 mb-2 border-l-4 ${getStatusColor(event.status)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{event.traineeName}</div>
                              <div className="text-sm">{event.type} • {event.location}</div>
                              <div className="text-xs opacity-90">{event.startTime} - {event.endTime}</div>
                            </div>
                            {event.traineePhoto && (
                              <img
                                src={event.traineePhoto}
                                alt={event.traineeName}
                                className="w-10 h-10 rounded-full border-2 border-white"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Sessions Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Sessions</h3>
          <div className="space-y-3">
            {getEventsForDate(formatDate(new Date())).length === 0 ? (
              <p className="text-gray-500">No sessions scheduled for today.</p>
            ) : (
              getEventsForDate(formatDate(new Date())).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {event.traineePhoto && (
                      <img
                        src={event.traineePhoto}
                        alt={event.traineeName}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{event.traineeName}</div>
                      <div className="text-sm text-gray-600">{event.type} • {event.startTime} - {event.endTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'completed' ? 'bg-green-100 text-green-800' :
                      event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    <button
                      onClick={() => handleEventClick(event)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Session</h3>
              {selectedTimeSlot && (
                <p className="text-sm text-gray-600 mb-4">
                  Selected: {new Date(selectedTimeSlot.date).toLocaleDateString()} at {selectedTimeSlot.time}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-4">
                Session scheduling functionality will be implemented next.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddEventModal(false);
                    setSelectedTimeSlot(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddEventModal(false);
                    setSelectedTimeSlot(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {selectedEvent.traineePhoto && (
                    <img
                      src={selectedEvent.traineePhoto}
                      alt={selectedEvent.traineeName}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{selectedEvent.traineeName}</div>
                    <div className="text-sm text-gray-600">{selectedEvent.type}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700">Date</label>
                    <p className="text-gray-900">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">Time</label>
                    <p className="text-gray-900">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">Duration</label>
                    <p className="text-gray-900">{selectedEvent.duration} minutes</p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">{selectedEvent.location}</p>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEvent.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    selectedEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>

                {selectedEvent.notes && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedEvent.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Edit Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  );
}