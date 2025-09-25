'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TrainerLayout from '../../components/TrainerLayout';

interface Payment {
  id: string;
  traineeId: string;
  traineeName: string;
  traineePhoto?: string;
  amount: number;
  currency: string;
  date: string;
  dueDate?: string;
  method: 'cash' | 'credit_card' | 'bank_transfer' | 'paypal' | 'check';
  status: 'paid' | 'pending' | 'overdue' | 'failed' | 'refunded';
  description: string;
  invoiceNumber?: string;
  sessionIds?: string[];
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalPayments: number;
  monthlyPayments: number;
}

const mockPayments: Payment[] = [
  {
    id: '1',
    traineeId: '1',
    traineeName: 'Sarah Johnson',
    traineePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face',
    amount: 320,
    currency: 'USD',
    date: '2024-09-20',
    method: 'credit_card',
    status: 'paid',
    description: 'Monthly Personal Training Package - September 2024',
    invoiceNumber: 'INV-2024-001',
    sessionIds: ['1', '2', '3', '4'],
    paidAt: '2024-09-20T10:30:00Z',
    createdAt: '2024-09-01T09:00:00Z'
  },
  {
    id: '2',
    traineeId: '2',
    traineeName: 'Mike Chen',
    traineePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    amount: 480,
    currency: 'USD',
    date: '2024-09-21',
    dueDate: '2024-09-25',
    method: 'bank_transfer',
    status: 'pending',
    description: 'Premium Training Package - September 2024',
    invoiceNumber: 'INV-2024-002',
    sessionIds: ['5', '6', '7', '8', '9', '10'],
    notes: 'Client requested bank transfer payment',
    createdAt: '2024-09-01T09:00:00Z'
  },
  {
    id: '3',
    traineeId: '3',
    traineeName: 'Alex Rivera',
    traineePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    amount: 240,
    currency: 'USD',
    date: '2024-09-18',
    method: 'cash',
    status: 'paid',
    description: 'Athletic Performance Training - 3 Sessions',
    invoiceNumber: 'INV-2024-003',
    sessionIds: ['11', '12', '13'],
    paidAt: '2024-09-18T16:00:00Z',
    createdAt: '2024-09-15T09:00:00Z'
  },
  {
    id: '4',
    traineeId: '4',
    traineeName: 'Emma Wilson',
    amount: 160,
    currency: 'USD',
    date: '2024-09-10',
    dueDate: '2024-09-15',
    method: 'credit_card',
    status: 'overdue',
    description: 'Yoga & Flexibility Sessions - August 2024',
    invoiceNumber: 'INV-2024-004',
    sessionIds: ['14', '15'],
    notes: 'Payment overdue - follow up required',
    createdAt: '2024-08-25T09:00:00Z'
  },
  {
    id: '5',
    traineeId: '1',
    traineeName: 'Sarah Johnson',
    traineePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face',
    amount: 320,
    currency: 'USD',
    date: '2024-08-20',
    method: 'credit_card',
    status: 'paid',
    description: 'Monthly Personal Training Package - August 2024',
    invoiceNumber: 'INV-2024-005',
    sessionIds: ['16', '17', '18', '19'],
    paidAt: '2024-08-20T11:15:00Z',
    createdAt: '2024-08-01T09:00:00Z'
  },
  {
    id: '6',
    traineeId: '5',
    traineeName: 'David Park',
    amount: 200,
    currency: 'USD',
    date: '2024-09-19',
    method: 'paypal',
    status: 'failed',
    description: 'Personal Training Sessions - September',
    invoiceNumber: 'INV-2024-006',
    notes: 'Payment failed - insufficient funds',
    createdAt: '2024-09-15T09:00:00Z'
  }
];

const mockSummary: PaymentSummary = {
  totalRevenue: 1720,
  monthlyRevenue: 1240,
  pendingAmount: 480,
  overdueAmount: 160,
  totalPayments: 6,
  monthlyPayments: 5
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [summary] = useState<PaymentSummary>(mockSummary);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'credit_card' | 'bank_transfer' | 'paypal' | 'check'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    const matchesMonth = !selectedMonth || payment.date.startsWith(selectedMonth);
    return matchesStatus && matchesMethod && matchesMonth;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getMethodBadge = (method: string) => {
    const styles = {
      cash: 'bg-green-100 text-green-800',
      credit_card: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      paypal: 'bg-orange-100 text-orange-800',
      check: 'bg-gray-100 text-gray-800'
    };
    return styles[method as keyof typeof styles] || styles.cash;
  };

  const formatMethod = (method: string) => {
    const formats = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
      paypal: 'PayPal',
      check: 'Check'
    };
    return formats[method as keyof typeof formats] || method;
  };

  const markAsPaid = (paymentId: string) => {
    setPayments(prev => prev.map(payment =>
      payment.id === paymentId
        ? { ...payment, status: 'paid' as const, paidAt: new Date().toISOString() }
        : payment
    ));
  };

  const markAsFailed = (paymentId: string) => {
    setPayments(prev => prev.map(payment =>
      payment.id === paymentId
        ? { ...payment, status: 'failed' as const }
        : payment
    ));
  };

  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  return (
    <TrainerLayout currentPage="payments">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${summary.monthlyRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">${summary.pendingAmount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-gray-900">${summary.overdueAmount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalPayments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="check">Check</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedMonth(new Date().toISOString().slice(0, 7));
                  setStatusFilter('all');
                  setMethodFilter('all');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your filters or create a new invoice.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden mr-3">
                            {payment.traineePhoto ? (
                              <img
                                src={payment.traineePhoto}
                                alt={payment.traineeName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{payment.traineeName}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{payment.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${payment.amount}</div>
                        <div className="text-sm text-gray-500">{payment.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodBadge(payment.method)}`}>
                          {formatMethod(payment.method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        {payment.dueDate && payment.status !== 'paid' && (
                          <div className="text-sm text-gray-500">
                            Due: {new Date(payment.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => viewPaymentDetails(payment)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {payment.status === 'pending' && (
                            <button
                              onClick={() => markAsPaid(payment.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Mark as Paid"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {(payment.status === 'pending' || payment.status === 'overdue') && (
                            <button
                              onClick={() => markAsFailed(payment.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Mark as Failed"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Invoice</h3>
              <p className="text-sm text-gray-600 mb-4">
                Invoice creation functionality will be implemented next.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setShowPaymentDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trainee</label>
                    <p className="text-sm text-gray-900">{selectedPayment.traineeName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-sm text-gray-900">${selectedPayment.amount} {selectedPayment.currency}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-sm text-gray-900">{formatMethod(selectedPayment.method)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedPayment.status)}`}>
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedPayment.date).toLocaleDateString()}</p>
                  </div>
                  {selectedPayment.dueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <p className="text-sm text-gray-900">{new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedPayment.invoiceNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                      <p className="text-sm text-gray-900">{selectedPayment.invoiceNumber}</p>
                    </div>
                  )}
                  {selectedPayment.paidAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Paid At</label>
                      <p className="text-sm text-gray-900">{new Date(selectedPayment.paidAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedPayment.description}</p>
                </div>

                {selectedPayment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedPayment.notes}</p>
                  </div>
                )}

                {selectedPayment.sessionIds && selectedPayment.sessionIds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Related Sessions</label>
                    <p className="text-sm text-gray-900">{selectedPayment.sessionIds.length} sessions included</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowPaymentDetails(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedPayment.invoiceNumber && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Download Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  );
}