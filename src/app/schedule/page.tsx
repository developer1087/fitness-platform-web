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
  BookSlotFormData,
  Trainee
} from '../../shared-types';

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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null);

  // Load data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentDate, loadData]);

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

      const [bookingsData, availabilityData, traineesData] = await Promise.all([
        ScheduleService.getTrainerBookings(
          user!.uid,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        ScheduleService.getTrainerAvailability(user!.uid),
        TraineeService.getTrainerTrainees(user!.uid)
      ]);

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

  const handleCreateBooking = async (bookingData: BookSlotFormData) => {
    try {
      await ScheduleService.bookTimeSlot(user!.uid, bookingData);
      setShowCreateBookingModal(false);
      setSelectedTimeSlot(null);
      loadData();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking');
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
      booking.status === 'booked'
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
      booking.status === 'booked'
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
            isSlotBooked={isSlotBooked}
            isSlotAvailable={isSlotAvailable}
            getBookingForSlot={getBookingForSlot}
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
    </TrainerLayout>
  );
}

// Week View Component
function WeekView({
  weekDays,
  timeSlots,
  onTimeSlotClick,
  isSlotBooked,
  isSlotAvailable,
  getBookingForSlot
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

              return (
                <div
                  key={dayIndex}
                  onClick={() => !isBooked && onTimeSlotClick(dateStr, time)}
                  className={`p-2 border-r last:border-r-0 h-12 relative cursor-pointer transition-colors ${
                    isBooked
                      ? 'bg-blue-100 border-blue-200'
                      : isAvailable
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {isBooked && booking && (
                    <div className="absolute inset-1 bg-blue-600 text-white text-xs rounded p-1 flex items-center justify-center">
                      <span className="truncate">{booking.sessionType}</span>
                    </div>
                  )}
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
                  {trainee.personalInfo.firstName} {trainee.personalInfo.lastName}
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