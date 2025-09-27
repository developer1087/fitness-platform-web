// Payment Management Types
// Handles billing, invoicing, payment processing, and financial tracking

export interface PaymentAccount {
  id: string;
  trainerId: string;

  // Account details
  accountType: 'individual' | 'business';
  businessName?: string;
  taxId?: string;

  // Payment processor settings
  stripeAccountId?: string;
  paypalAccountId?: string;
  squareAccountId?: string;

  // Bank account details (encrypted)
  bankAccountLast4?: string;
  routingNumberLast4?: string;
  accountHolderName?: string;

  // Payout settings
  payoutSchedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  minimumPayoutAmount: number;
  currency: string;

  // Status
  isVerified: boolean;
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'requires_info';

  // Fees
  platformFeePercentage: number; // Platform's commission
  processingFeePercentage: number; // Payment processor fee

  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  traineeId: string;

  // Payment method details
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  provider: 'stripe' | 'paypal' | 'square' | 'apple' | 'google';

  // Card details (if type is 'card')
  cardLast4?: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unknown';
  cardExpMonth?: number;
  cardExpYear?: number;

  // Bank account details (if type is 'bank_account')
  bankName?: string;
  accountLast4?: string;
  routingNumber?: string;

  // External IDs
  stripePaymentMethodId?: string;
  paypalPaymentMethodId?: string;

  // Status
  isDefault: boolean;
  isActive: boolean;
  isVerified: boolean;

  // Metadata
  nickname?: string; // User-friendly name like "Work Credit Card"
  billingAddress?: BillingAddress;

  createdAt: string;
  updatedAt: string;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Invoice {
  id: string;
  trainerId: string;
  traineeId: string;

  // Invoice details
  invoiceNumber: string; // Auto-generated unique number
  title: string;
  description?: string;

  // Financial details
  subtotal: number; // Before taxes and fees
  taxAmount: number;
  platformFee: number;
  processingFee: number;
  totalAmount: number;
  currency: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Status
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid' | 'refunded' | 'failed';

  // Important dates
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  paidDate?: string; // ISO date
  sentDate?: string; // When invoice was sent to trainee

  // Payment details
  paymentMethodId?: string;
  stripePaymentIntentId?: string;
  paymentReference?: string;

  // Terms and notes
  paymentTerms: string; // e.g., "Net 30", "Due on receipt"
  notes?: string;
  footerText?: string;

  // Auto-generation settings
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextInvoiceDate?: string;

  // Related entities
  sessionIds: string[]; // Sessions included in this invoice
  packageId?: string; // If part of a package deal

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;

  // Optional details
  sessionId?: string; // If line item is for a specific session
  sessionDate?: string;
  sessionType?: string;
  discountPercentage?: number;
  discountAmount?: number;

  // Tax details
  isTaxable: boolean;
  taxRate?: number;
  taxAmount?: number;
}

export interface Payment {
  id: string;
  trainerId: string;
  traineeId: string;
  invoiceId?: string; // null for one-off payments

  // Payment details
  amount: number;
  currency: string;
  paymentMethodId: string;

  // Status
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  failureReason?: string;

  // External payment processor details
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paypalPaymentId?: string;
  externalReference?: string;

  // Fees breakdown
  platformFee: number;
  processingFee: number;
  netAmount: number; // Amount after all fees

  // Important dates
  initiatedAt: string;
  processedAt?: string;
  failedAt?: string;
  refundedAt?: string;

  // Refund details
  isRefunded: boolean;
  refundAmount?: number;
  refundReason?: string;
  refundReference?: string;

  // Metadata
  description?: string;
  receiptUrl?: string;
  receiptNumber?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  trainerId: string;

  // Payout details
  amount: number;
  currency: string;
  netAmount: number; // After platform fees

  // Status
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'cancelled';
  failureReason?: string;

  // External processor details
  stripePayoutId?: string;
  bankTransferReference?: string;

  // Included payments
  paymentIds: string[]; // Payments included in this payout
  periodStart: string; // ISO date
  periodEnd: string; // ISO date

  // Fees and deductions
  totalGrossAmount: number; // Total before fees
  platformFees: number;
  processingFees: number;
  adjustments: PayoutAdjustment[]; // Any manual adjustments

  // Important dates
  scheduledAt: string; // When payout was scheduled
  processedAt?: string; // When actually processed
  arrivedAt?: string; // When funds arrived in account

  // Bank details (for reference)
  destinationAccountLast4?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PayoutAdjustment {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface PaymentPackage {
  id: string;
  trainerId: string;

  // Package details
  name: string;
  description?: string;
  packageType: 'sessions' | 'time_based' | 'unlimited' | 'custom';

  // Sessions package details
  sessionsIncluded?: number;
  sessionType?: string;
  sessionDuration?: number; // minutes

  // Time-based package details
  validityPeriod?: number; // days
  expirationDate?: string;

  // Pricing
  totalPrice: number;
  pricePerSession?: number; // calculated or override
  currency: string;
  discountPercentage?: number;

  // Usage tracking
  sessionsUsed: number;
  sessionsRemaining: number;
  isActive: boolean;

  // Purchase details
  purchasedBy: string; // trainee ID
  purchasedAt: string;
  invoiceId?: string;

  // Auto-renewal
  isRecurring: boolean;
  renewalFrequency?: 'monthly' | 'quarterly' | 'yearly';
  nextRenewalDate?: string;
  autoRenew: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface FinancialReport {
  id: string;
  trainerId: string;

  // Report details
  reportType: 'revenue' | 'expenses' | 'tax' | 'payout' | 'comprehensive';
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;

  // Revenue metrics
  totalRevenue: number;
  totalSessions: number;
  averageSessionValue: number;
  revenueBySessionType: { [sessionType: string]: number };

  // Expense metrics (if tracked)
  totalExpenses?: number;
  expensesByCategory?: { [category: string]: number };

  // Net metrics
  grossIncome: number;
  platformFees: number;
  processingFees: number;
  netIncome: number;

  // Payment breakdown
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;

  // Tax information
  taxableIncome: number;
  taxRate?: number;
  estimatedTaxOwed?: number;

  // Growth metrics
  periodOverPeriodGrowth?: number; // percentage
  revenueGrowthRate?: number;

  // Top performers
  topSessionTypes: { type: string; revenue: number; count: number }[];
  topTrainees: { traineeId: string; revenue: number; sessions: number }[];

  generatedAt: string;
  fileUrl?: string; // URL to downloadable report
}

export interface PaymentSettings {
  trainerId: string;

  // Default pricing
  defaultSessionRates: { [sessionType: string]: number };
  currency: string;
  taxRate: number; // percentage

  // Payment terms
  defaultPaymentTerms: string;
  latePaymentFee: number;
  latePaymentFeeType: 'flat' | 'percentage';

  // Invoice settings
  invoicePrefix: string; // e.g., "INV-" for invoice numbers
  nextInvoiceNumber: number;
  invoiceNotes?: string;
  invoiceFooter?: string;

  // Auto-billing
  autoInvoiceAfterSession: boolean;
  autoInvoiceFrequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  paymentDueDays: number; // Days after invoice date

  // Notifications
  sendInvoiceReminders: boolean;
  reminderDaysBefore: number[];
  sendPaymentConfirmations: boolean;

  // Refund policy
  refundPolicy?: string;
  allowPartialRefunds: boolean;
  refundDeadlineDays?: number;

  updatedAt: string;
}

// Form data types
export interface CreateInvoiceFormData {
  traineeId: string;
  title: string;
  description?: string;
  dueDate: string;
  paymentTerms: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    sessionId?: string;
  }[];
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface ProcessPaymentFormData {
  traineeId: string;
  amount: number;
  paymentMethodId: string;
  description?: string;
  invoiceId?: string;
}

export interface PayoutRequestFormData {
  amount?: number; // If not specified, payout all available
  description?: string;
}

export interface PaymentMethodFormData {
  type: 'card' | 'bank_account';
  nickname?: string;

  // Card details
  cardNumber?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardCvc?: string;

  // Bank account details
  accountNumber?: string;
  routingNumber?: string;
  accountHolderName?: string;

  // Billing address
  billingAddress: BillingAddress;
}

// Analytics and insights
export interface PaymentAnalytics {
  trainerId: string;
  period: string;

  // Revenue trends
  revenueByDay: { date: string; amount: number }[];
  revenueByMonth: { month: string; amount: number }[];

  // Payment patterns
  averagePaymentTime: number; // Days from invoice to payment
  onTimePaymentRate: number; // Percentage
  latePaymentRate: number; // Percentage

  // Session value trends
  averageSessionValue: number;
  sessionValueTrend: 'increasing' | 'decreasing' | 'stable';

  // Popular packages and pricing
  popularPackages: { packageId: string; sales: number; revenue: number }[];
  priceElasticity: { sessionType: string; optimalPrice: number }[];

  generatedAt: string;
}