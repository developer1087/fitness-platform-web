'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';
import { ScheduleService } from '../../lib/scheduleService';
import { TraineeService } from '../../lib/traineeService';
import type {
  BookingSlot,
  TrainerAvailabilitySlot,
  CreateAvailabilityFormData,
  BookSlotFormData
} from '../../shared-types/schedule';
import type { Trainee } from '../../shared-types';

export default function SchedulePage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month' | 'day'>('week');
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [availability, setAvailability] = useState<TrainerAvailabilitySlot[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedSession, setSelectedSession] = useState<BookingSlot | null>(null);

  // Load data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range for current view
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);

      if (view === 'week') {
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
      } else if (view === 'month') {
        startDate.setDate(1);
        endDate.setMonth(startDate.getMonth() + 1, 0);
      } else {
        endDate.setDate(startDate.getDate());
      }

      // Load actual sessions and trainees (not booking_slots)
      const [traineesData, availabilityData] = await Promise.all([
        TraineeService.getTraineesByTrainer(user!.uid),
        ScheduleService.getTrainerAvailability(user!.uid)
      ]);

      // Load sessions for the date range
      const { SessionService } = await import('../../lib/sessionService');
      const sessionsData = await SessionService.getTrainerSessions(user!.uid, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Convert sessions to booking slots format for calendar display
      // Filter out incomplete sessions and map to BookingSlot format
      const bookingsData: BookingSlot[] = sessionsData
        .filter(session => {
          // Only include sessions with required fields
          return session.startTime && session.scheduledDate && session.duration;
        })
        .map(session => {
          // Calculate end time from start time + duration
          const [hours, minutes] = session.startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + session.duration;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

          return {
            id: session.id,
            trainerId: session.trainerId,
            traineeId: session.traineeId,
            date: session.scheduledDate,
            startTime: session.startTime,
            endTime: endTime,
            duration: session.duration,
            // Map session status to booking slot status
            status: (() => {
              if (session.status === 'completed') return 'completed' as any;
              if (session.status === 'cancelled') return 'cancelled' as any;
              return 'booked' as any; // scheduled, in_progress, etc.
            })(),
            sessionType: session.type,
            isRecurring: false,
            location: session.location || '',
            isRemote: false,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          };
        });

      setBookings(bookingsData);
      setAvailability(availabilityData);
      setTrainees(traineesData);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotClick = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time });
    setShowCreateBookingModal(true);
  };

  const handleSessionClick = (session: BookingSlot) => {
    setSelectedSession(session);
    setShowSessionDetailsModal(true);
  };

  const handleCreateBooking = async (bookingData: BookSlotFormData) => {
    try {
      // Convert booking data to session format
      const { SessionService } = await import('../../lib/sessionService');
      const sessionData = {
        traineeId: bookingData.traineeId,
        title: `${bookingData.sessionType.replace('_', ' ')} Session`,
        description: bookingData.notes || '',
        type: bookingData.sessionType as any,
        scheduledDate: bookingData.date,
        startTime: bookingData.startTime,
        duration: bookingData.duration,
        location: bookingData.location || 'Studio',
        sessionRate: 0,
        trainerNotes: ''
      };

      await SessionService.createSession(user!.uid, sessionData);
      setShowCreateBookingModal(false);
      setSelectedTimeSlot(null);
      loadData();
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
    }
  };

  const handleCreateAvailability = async (availabilityData: CreateAvailabilityFormData) => {
    try {
      await ScheduleService.createAvailabilitySlot(user!.uid, availabilityData);
      setShowAvailabilityModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating availability:', error);
      setError('Failed to create availability');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const isSlotBooked = (date: string, time: string) => {
    return bookings.some(booking =>
      booking.date === date &&
      booking.startTime <= time &&
      booking.endTime > time &&
      (booking.status === 'booked' || booking.status === 'completed' || booking.status === 'cancelled')
    );
  };

  const isSlotAvailable = (date: string, time: string) => {
    const dayOfWeek = new Date(date).getDay();
    return availability.some(avail =>
      avail.dayOfWeek === dayOfWeek &&
      avail.startTime <= time &&
      avail.endTime > time &&
      avail.isAvailable
    );
  };

  const getBookingForSlot = (date: string, time: string) => {
    return bookings.find(booking =>
      booking.date === date &&
      booking.startTime <= time &&
      booking.endTime > time &&
      (booking.status === 'booked' || booking.status === 'completed' || booking.status === 'cancelled')
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TrainerLayout currentPage="schedule">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Schedule & Calendar</h2>

              {/* View Toggle */}
              <div className="flex rounded-md shadow-sm">
                {(['day', 'week', 'month'] as const).map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`px-3 py-2 text-sm font-medium ${
                      view === viewType
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${
                      viewType === 'day' ? 'rounded-l-md' :
                      viewType === 'month' ? 'rounded-r-md' : ''
                    } border border-gray-300`}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Set Availability
              </button>
              <button
                onClick={() => setShowCreateBookingModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Book Session
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => navigateDate('prev')}
              className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Previous
            </button>

            <h3 className="text-lg font-medium text-gray-900">
              {view === 'month'
                ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : view === 'week'
                ? `${getWeekDays()[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${getWeekDays()[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              }
            </h3>

            <button
              onClick={() => navigateDate('next')}
              className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading schedule...</p>
            </div>
          </div>
        ) : view === 'week' ? (
          <WeekView
            weekDays={getWeekDays()}
            timeSlots={getTimeSlots()}
            onTimeSlotClick={handleTimeSlotClick}
            onSessionClick={handleSessionClick}
            isSlotBooked={isSlotBooked}
            isSlotAvailable={isSlotAvailable}
            getBookingForSlot={getBookingForSlot}
            trainees={trainees}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Day and Month views coming soon!</p>
            <p className="text-sm text-gray-400 mt-2">Currently showing Week view functionality</p>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateBookingModal && (
        <CreateBookingModal
          isOpen={showCreateBookingModal}
          onClose={() => {
            setShowCreateBookingModal(false);
            setSelectedTimeSlot(null);
          }}
          onSubmit={handleCreateBooking}
          trainees={trainees}
          selectedTimeSlot={selectedTimeSlot}
        />
      )}

      {/* Create Availability Modal */}
      {showAvailabilityModal && (
        <CreateAvailabilityModal
          isOpen={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
          onSubmit={handleCreateAvailability}
        />
      )}

      {/* Session Details Modal */}
      {showSessionDetailsModal && selectedSession && (
        <SessionDetailsModal
          isOpen={showSessionDetailsModal}
          session={selectedSession}
          trainee={trainees.find(t => t.id === selectedSession.traineeId || (t as any).userId === selectedSession.traineeId)}
          onClose={() => {
            setShowSessionDetailsModal(false);
            setSelectedSession(null);
          }}
        />
      )}
    </TrainerLayout>
  );
}

// Week View Component
function WeekView({
  weekDays,
  timeSlots,
  onTimeSlotClick,
  onSessionClick,
  isSlotBooked,
  isSlotAvailable,
  getBookingForSlot,
  trainees
}: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Days Header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-4 bg-gray-50 border-r"></div>
        {weekDays.map((day: Date, index: number) => (
          <div key={index} className="p-4 bg-gray-50 border-r last:border-r-0">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-semibold ${
                day.toDateString() === new Date().toDateString()
                  ? 'text-blue-600'
                  : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="max-h-96 overflow-y-auto">
        {timeSlots.map((time: string) => (
          <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
            {/* Time Label */}
            <div className="p-2 bg-gray-50 border-r text-xs text-gray-500 text-center">
              {time}
            </div>

            {/* Day Columns */}
            {weekDays.map((day: Date, dayIndex: number) => {
              const dateStr = day.toISOString().split('T')[0];
              const isBooked = isSlotBooked(dateStr, time);
              const isAvailable = isSlotAvailable(dateStr, time);
              const booking = getBookingForSlot(dateStr, time);

              // Determine if this is the first slot of the session
              const isFirstSlot = booking && booking.startTime === time;

              // Get colors based on status
              const getSessionColors = (status: string) => {
                if (status === 'completed') return { bg: 'bg-emerald-100', border: 'border-emerald-200', pill: 'bg-emerald-600' };
                if (status === 'cancelled') return { bg: 'bg-red-100', border: 'border-red-200', pill: 'bg-red-600' };
                return { bg: 'bg-blue-100', border: 'border-blue-200', pill: 'bg-blue-600' }; // booked/scheduled
              };

              const colors = booking ? getSessionColors(booking.status) : null;

              return (
                <div
                  key={dayIndex}
                  onClick={() => {
                    if (booking) {
                      onSessionClick(booking);
                    } else if (isAvailable) {
                      onTimeSlotClick(dateStr, time);
                    }
                    // Do nothing if slot is not available
                  }}
                  className={`p-2 border-r last:border-r-0 h-12 relative transition-colors ${
                    isBooked && colors
                      ? `${colors.bg} ${colors.border} cursor-pointer`
                      : isAvailable
                      ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                      : 'bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isBooked && booking && isFirstSlot && (() => {
                    // Only show trainee name in the first time slot of the session
                    const trainee = trainees.find((t: any) => t.id === booking.traineeId || t.userId === booking.traineeId);
                    const displayName = trainee ? `${trainee.firstName} ${trainee.lastName}` : 'Session';

                    return (
                      <div className={`absolute inset-1 ${colors?.pill} text-white text-xs rounded p-1 flex items-center justify-center hover:opacity-90`}>
                        <span className="truncate" title={`${displayName} - ${booking.sessionType} (${booking.status})`}>
                          {displayName}
                        </span>
                      </div>
                    );
                  })()}
                  {isAvailable && !isBooked && (
                    <div className="absolute inset-1 border-2 border-dashed border-green-300 rounded"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Create Booking Modal Component
function CreateBookingModal({ isOpen, onClose, onSubmit, trainees, selectedTimeSlot }: any) {
  const [formData, setFormData] = useState<Partial<BookSlotFormData>>({
    date: selectedTimeSlot?.date || '',
    startTime: selectedTimeSlot?.time || '',
    duration: 60,
    sessionType: 'personal_training',
    isRemote: false,
    isRecurring: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.traineeId && formData.date && formData.startTime) {
      onSubmit(formData as BookSlotFormData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Book Session</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Trainee</label>
            <select
              value={formData.traineeId || ''}
              onChange={(e) => setFormData({...formData, traineeId: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select a trainee</option>
              {trainees.map((trainee: Trainee) => (
                <option key={trainee.id} value={trainee.id}>
                  {trainee.firstName} {trainee.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Session Type</label>
            <select
              value={formData.sessionType || ''}
              onChange={(e) => setFormData({...formData, sessionType: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="personal_training">Personal Training</option>
              <option value="group_training">Group Training</option>
              <option value="assessment">Assessment</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <select
              value={formData.duration || 60}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRemote"
              checked={formData.isRemote || false}
              onChange={(e) => setFormData({...formData, isRemote: e.target.checked})}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="isRemote" className="ml-2 block text-sm text-gray-900">
              Remote session
            </label>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Book Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Availability Modal Component
function CreateAvailabilityModal({ isOpen, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState<Partial<CreateAvailabilityFormData>>({
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    sessionTypes: ['personal_training'],
    recurrenceType: 'weekly',
    isRemote: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CreateAvailabilityFormData);
  };

  if (!isOpen) return null;

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Set Availability</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Day of Week</label>
            <select
              value={formData.dayOfWeek || 1}
              onChange={(e) => setFormData({...formData, dayOfWeek: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {daysOfWeek.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Session Types</label>
            <div className="mt-2 space-y-2">
              {['personal_training', 'group_training', 'assessment', 'consultation'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sessionTypes?.includes(type) || false}
                    onChange={(e) => {
                      const currentTypes = formData.sessionTypes || [];
                      if (e.target.checked) {
                        setFormData({...formData, sessionTypes: [...currentTypes, type]});
                      } else {
                        setFormData({...formData, sessionTypes: currentTypes.filter(t => t !== type)});
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Set Availability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Session Details Modal Component
function SessionDetailsModal({ isOpen, session, trainee, onClose }: any) {
  if (!isOpen) return null;

  const sessionDate = new Date(session.date);
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const startTimeDisplay = new Date(sessionDate);
  startTimeDisplay.setHours(hours, minutes, 0, 0);

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800'; // booked
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Trainee */}
          <div>
            <span className="text-sm font-medium text-gray-500">Trainee:</span>
            <p className="text-gray-900 mt-1">
              {trainee ? `${trainee.firstName} ${trainee.lastName}` : 'Unknown trainee'}
            </p>
          </div>

          {/* Session Type */}
          <div>
            <span className="text-sm font-medium text-gray-500">Session Type:</span>
            <p className="text-gray-900 mt-1 capitalize">
              {session.sessionType?.replace('_', ' ') || 'Session'}
            </p>
          </div>

          {/* Date & Time */}
          <div>
            <span className="text-sm font-medium text-gray-500">Date & Time:</span>
            <p className="text-gray-900 mt-1">
              {sessionDate.toLocaleDateString()} at {startTimeDisplay.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>

          {/* Duration */}
          <div>
            <span className="text-sm font-medium text-gray-500">Duration:</span>
            <p className="text-gray-900 mt-1">{session.duration} minutes</p>
          </div>

          {/* Location */}
          {session.location && (
            <div>
              <span className="text-sm font-medium text-gray-500">Location:</span>
              <p className="text-gray-900 mt-1">{session.location}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <div className="mt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                {session.status?.replace('_', ' ') || 'scheduled'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}