/**
 * Payment System Types
 * Supports hybrid billing: package-based (מנוי) and pay-per-session
 */

// Package (מנוי) - Pre-purchased session credits
export interface Package {
  id: string;
  trainerId: string;
  name: string; // e.g., "10 Sessions Package", "מנוי חודשי"
  description?: string;
  sessionsIncluded: number; // Number of sessions in package
  price: number; // Total price in ILS (₪)
  validityDays: number; // How many days package is valid (e.g., 90 days)
  sessionTypes: string[]; // Which session types this package covers
  isActive: boolean; // Can trainees purchase this package?
  createdAt: string;
  updatedAt?: string;
}

// Trainee's purchased package with remaining credits
export interface TraineePackage {
  id: string;
  traineeId: string;
  trainerId: string;
  packageId: string; // Reference to Package
  packageName: string; // Cached for display
  totalSessions: number; // Total sessions in package
  remainingSessions: number; // Remaining session credits
  purchaseDate: string;
  expiryDate: string; // When package expires
  status: 'active' | 'expired' | 'exhausted'; // exhausted = no sessions left
  paymentId?: string; // Reference to payment for this package
  createdAt: string;
  updatedAt?: string;
}

// Invoice - Generated for sessions (with or without package)
export interface Invoice {
  id: string;
  trainerId: string;
  traineeId: string;
  sessionId?: string; // If invoice is for a specific session
  packageId?: string; // If invoice is for a package purchase
  traineePackageId?: string; // If session used a package credit

  type: 'session' | 'package' | 'cancellation_fee'; // Invoice type
  amount: number; // Amount in ILS (₪)
  description: string;

  // Billing timing
  billingDate: string; // When debt was created (24h before session or at booking)
  dueDate: string; // When payment is due

  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

  // Payment tracking
  paymentId?: string; // Reference to Payment if paid
  paidAt?: string;

  // Cancellation policy
  cancellationDeadline?: string; // 24h before session - can cancel without charge
  wasCancelledInTime?: boolean; // Did trainee cancel within policy?

  createdAt: string;
  updatedAt?: string;
}

// Payment - Actual payment transaction
export interface Payment {
  id: string;
  trainerId: string;
  traineeId: string;

  amount: number; // Amount paid in ILS (₪)
  currency: 'ILS'; // Israeli Shekel

  // What's being paid
  invoiceIds: string[]; // Can pay multiple invoices at once
  packageId?: string; // If purchasing a package

  // Payment method and processor
  paymentMethod: 'credit_card' | 'cash' | 'bank_transfer' | 'bit' | 'paypal';
  paymentProcessor?: 'tranzila' | 'cardcom' | 'stripe' | 'manual'; // Israeli processors
  transactionId?: string; // External transaction ID from payment processor

  status: 'pending' | 'completed' | 'failed' | 'refunded';

  // Metadata
  receiptUrl?: string; // Link to receipt
  notes?: string;

  createdAt: string;
  updatedAt?: string;
}

// Payment Account - Trainer's payment settings
export interface PaymentAccount {
  trainerId: string; // Document ID = trainerId

  // Business info
  businessName?: string;
  taxId?: string; // Israeli business tax ID (ח.פ / ע.מ)

  // Payment processor credentials (encrypted)
  tranzila?: {
    enabled: boolean;
    terminalId?: string;
    // Credentials stored securely in Firebase Functions environment
  };
  cardcom?: {
    enabled: boolean;
    terminalId?: string;
    // Credentials stored securely
  };

  // Manual payment settings
  acceptCash: boolean;
  acceptBankTransfer: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    branchNumber: string;
  };

  // Billing settings
  defaultCancellationWindow: number; // Hours before session (default: 24)
  lateCancellationFee: number; // Fee for cancelling after deadline (₪)
  noShowFee: number; // Fee if trainee doesn't show up (₪)

  // Invoice settings
  invoicePrefix?: string; // e.g., "RYZUP-"
  nextInvoiceNumber: number;

  createdAt: string;
  updatedAt?: string;
}

// Transaction - Audit log of all financial events
export interface Transaction {
  id: string;
  trainerId: string;
  traineeId: string;

  type: 'charge' | 'payment' | 'refund' | 'credit' | 'debit' | 'package_purchase';
  amount: number; // Positive for income, negative for refunds

  // References
  sessionId?: string;
  invoiceId?: string;
  paymentId?: string;
  packageId?: string;
  traineePackageId?: string;

  description: string;

  // Metadata
  metadata?: Record<string, any>;

  createdAt: string;
}

// Helper type for creating sessions with payment
export interface SessionPaymentInfo {
  usePackageCredit: boolean; // Should use trainee's package credits?
  traineePackageId?: string; // Which package to deduct from
  sessionRate?: number; // Price if paying per session
  createInvoiceAt: 'immediate' | 'before_24h'; // When to generate invoice
}

// Summary for dashboard
export interface PaymentSummary {
  trainerId: string;
  period: string; // e.g., "2025-10" for October 2025

  totalRevenue: number; // Total revenue this period
  pendingPayments: number; // Amount owed but not paid
  overduePayments: number; // Amount overdue

  sessionRevenue: number; // Revenue from pay-per-session
  packageRevenue: number; // Revenue from package sales

  totalSessions: number; // Sessions conducted
  paidSessions: number; // Sessions paid for
  unpaidSessions: number; // Sessions not yet paid

  packagesSold: number; // Number of packages sold
  activePackages: number; // Active trainee packages
}
