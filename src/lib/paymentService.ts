import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  PaymentAccount,
  PaymentMethod,
  Invoice,
  Payment,
  FinancialReport,
  PaymentSettings,
  CreateInvoiceFormData,
  ProcessPaymentFormData,
  PaymentMethodFormData
} from '../shared-types/payments';

// Collections
const PAYMENT_ACCOUNTS_COLLECTION = 'payment_accounts';
const PAYMENT_METHODS_COLLECTION = 'payment_methods';
const INVOICES_COLLECTION = 'invoices';
const PAYMENTS_COLLECTION = 'payments';
const FINANCIAL_REPORTS_COLLECTION = 'financial_reports';
const PAYMENT_SETTINGS_COLLECTION = 'payment_settings';

export class PaymentService {

  // ==================== PAYMENT ACCOUNT MANAGEMENT ====================

  // Create or update payment account
  static async setupPaymentAccount(
    trainerId: string,
    accountData: Partial<PaymentAccount>
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();
      const existingAccount = await this.getPaymentAccount(trainerId);

      if (existingAccount) {
        // Update existing account
        const docRef = doc(db, PAYMENT_ACCOUNTS_COLLECTION, existingAccount.id);
        await updateDoc(docRef, {
          ...accountData,
          updatedAt: now
        });
        return existingAccount.id;
      } else {
        // Create new account
        const account: Omit<PaymentAccount, 'id'> = {
          trainerId,
          accountType: accountData.accountType || 'individual',
          businessName: accountData.businessName,
          taxId: accountData.taxId,
          payoutSchedule: accountData.payoutSchedule || 'weekly',
          minimumPayoutAmount: accountData.minimumPayoutAmount || 25,
          currency: accountData.currency || 'USD',
          isVerified: false,
          isActive: true,
          verificationStatus: 'pending',
          platformFeePercentage: 5.0, // Default platform fee
          processingFeePercentage: 2.9, // Default processing fee
          createdAt: now,
          updatedAt: now
        };

        const accountRef = await addDoc(collection(db, PAYMENT_ACCOUNTS_COLLECTION), account);
        return accountRef.id;
      }
    } catch (error) {
      console.error('Error setting up payment account:', error);
      throw error;
    }
  }

  // Get payment account
  static async getPaymentAccount(trainerId: string): Promise<PaymentAccount | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const accountQuery = query(
        collection(db, PAYMENT_ACCOUNTS_COLLECTION),
        where('trainerId', '==', trainerId),
        limit(1)
      );

      const snapshot = await getDocs(accountQuery);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as PaymentAccount;
      }

      return null;
    } catch (error) {
      console.error('Error getting payment account:', error);
      throw error;
    }
  }

  // ==================== INVOICE MANAGEMENT ====================

  // Create an invoice
  static async createInvoice(
    trainerId: string,
    invoiceData: CreateInvoiceFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();
      const settings = await this.getPaymentSettings(trainerId);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(trainerId);

      // Calculate totals
      const subtotal = invoiceData.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * ((settings?.taxRate || 0) / 100);
      const totalAmount = subtotal + taxAmount;

      const invoice: Omit<Invoice, 'id'> = {
        trainerId,
        traineeId: invoiceData.traineeId,
        invoiceNumber,
        title: invoiceData.title,
        description: invoiceData.description,
        subtotal,
        taxAmount,
        platformFee: 0, // Calculated when payment is processed
        processingFee: 0, // Calculated when payment is processed
        totalAmount,
        currency: settings?.currency || 'USD',
        lineItems: invoiceData.lineItems.map((item, index) => ({
          id: `${Date.now()}-${index}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          sessionId: item.sessionId,
          isTaxable: true,
          taxRate: settings?.taxRate || 0,
          taxAmount: (item.quantity * item.unitPrice) * ((settings?.taxRate || 0) / 100)
        })),
        status: 'draft',
        paymentStatus: 'unpaid',
        issueDate: now.split('T')[0],
        dueDate: invoiceData.dueDate,
        paymentTerms: invoiceData.paymentTerms,
        notes: invoiceData.notes,
        isRecurring: invoiceData.isRecurring,
        recurringFrequency: invoiceData.recurringFrequency,
        sessionIds: invoiceData.lineItems.map(item => item.sessionId).filter(Boolean) as string[],
        createdAt: now,
        updatedAt: now
      };

      const invoiceRef = await addDoc(collection(db, INVOICES_COLLECTION), invoice);
      return invoiceRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Get invoices for a trainer
  static async getTrainerInvoices(
    trainerId: string,
    options: { status?: string; limit?: number } = {}
  ): Promise<Invoice[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      let invoicesQuery = query(
        collection(db, INVOICES_COLLECTION),
        where('trainerId', '==', trainerId),
        orderBy('createdAt', 'desc')
      );

      if (options.status) {
        invoicesQuery = query(invoicesQuery, where('status', '==', options.status));
      }

      if (options.limit) {
        invoicesQuery = query(invoicesQuery, limit(options.limit));
      }

      const snapshot = await getDocs(invoicesQuery);
      const invoices: Invoice[] = [];

      snapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() } as Invoice);
      });

      return invoices;
    } catch (error) {
      console.error('Error getting trainer invoices:', error);
      throw error;
    }
  }

  // Get a single invoice
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Invoice;
      }

      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  // Send invoice to trainee
  static async sendInvoice(invoiceId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      await updateDoc(docRef, {
        status: 'sent',
        sentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // TODO: Integrate with email service to actually send the invoice
      console.log('Invoice sent (email integration needed)');
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  // ==================== PAYMENT PROCESSING ====================

  // Process a payment (mock implementation)
  static async processPayment(
    trainerId: string,
    paymentData: ProcessPaymentFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();
      const account = await this.getPaymentAccount(trainerId);

      if (!account) {
        throw new Error('Payment account not found');
      }

      // Calculate fees
      const platformFee = paymentData.amount * (account.platformFeePercentage / 100);
      const processingFee = paymentData.amount * (account.processingFeePercentage / 100);
      const netAmount = paymentData.amount - platformFee - processingFee;

      // Mock payment processing (in real app, integrate with Stripe, PayPal, etc.)
      const paymentStatus = Math.random() > 0.1 ? 'succeeded' : 'failed'; // 90% success rate for demo

      const payment: Omit<Payment, 'id'> = {
        trainerId,
        traineeId: paymentData.traineeId,
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        currency: account.currency,
        paymentMethodId: paymentData.paymentMethodId,
        status: paymentStatus,
        failureReason: paymentStatus === 'failed' ? 'Insufficient funds' : undefined,
        stripePaymentIntentId: `pi_mock_${Date.now()}`,
        externalReference: `ref_${Date.now()}`,
        platformFee,
        processingFee,
        netAmount,
        initiatedAt: now,
        processedAt: paymentStatus === 'succeeded' ? now : undefined,
        failedAt: paymentStatus === 'failed' ? now : undefined,
        isRefunded: false,
        description: paymentData.description,
        receiptUrl: paymentStatus === 'succeeded' ? `https://mock-receipts.com/${Date.now()}` : undefined,
        receiptNumber: paymentStatus === 'succeeded' ? `RCP-${Date.now()}` : undefined,
        createdAt: now,
        updatedAt: now
      };

      const paymentRef = await addDoc(collection(db, PAYMENTS_COLLECTION), payment);

      // Update invoice if payment is for an invoice
      if (paymentData.invoiceId && paymentStatus === 'succeeded') {
        await this.updateInvoicePaymentStatus(paymentData.invoiceId, 'paid');
      }

      return paymentRef.id;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Update invoice payment status
  static async updateInvoicePaymentStatus(
    invoiceId: string,
    paymentStatus: Invoice['paymentStatus']
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      const updateData: any = {
        paymentStatus,
        updatedAt: new Date().toISOString()
      };

      if (paymentStatus === 'paid') {
        updateData.paidDate = new Date().toISOString();
        updateData.status = 'paid';
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating invoice payment status:', error);
      throw error;
    }
  }

  // ==================== PAYMENT METHODS ====================

  // Add payment method (mock implementation)
  static async addPaymentMethod(
    traineeId: string,
    methodData: PaymentMethodFormData
  ): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date().toISOString();

      // Mock payment method creation (in real app, integrate with Stripe, etc.)
      const method: Omit<PaymentMethod, 'id'> = {
        traineeId,
        type: methodData.type,
        provider: 'stripe', // Default to Stripe for mock
        cardLast4: methodData.type === 'card' ? methodData.cardNumber?.slice(-4) : undefined,
        cardBrand: methodData.type === 'card' ? 'visa' : undefined, // Mock detection
        cardExpMonth: methodData.cardExpMonth,
        cardExpYear: methodData.cardExpYear,
        bankName: methodData.type === 'bank_account' ? 'Mock Bank' : undefined,
        accountLast4: methodData.type === 'bank_account' ? methodData.accountNumber?.slice(-4) : undefined,
        stripePaymentMethodId: `pm_mock_${Date.now()}`,
        isDefault: false, // Set as default separately
        isActive: true,
        isVerified: true, // Mock verification
        nickname: methodData.nickname,
        billingAddress: methodData.billingAddress,
        createdAt: now,
        updatedAt: now
      };

      const methodRef = await addDoc(collection(db, PAYMENT_METHODS_COLLECTION), method);
      return methodRef.id;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Get payment methods for a trainee
  static async getTraineePaymentMethods(traineeId: string): Promise<PaymentMethod[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const methodsQuery = query(
        collection(db, PAYMENT_METHODS_COLLECTION),
        where('traineeId', '==', traineeId),
        where('isActive', '==', true),
        orderBy('isDefault', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(methodsQuery);
      const methods: PaymentMethod[] = [];

      snapshot.forEach((doc) => {
        methods.push({ id: doc.id, ...doc.data() } as PaymentMethod);
      });

      return methods;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // ==================== FINANCIAL REPORTING ====================

  // Generate financial report
  static async generateFinancialReport(
    trainerId: string,
    reportType: FinancialReport['reportType'],
    period: FinancialReport['period'],
    startDate?: string,
    endDate?: string
  ): Promise<FinancialReport> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const now = new Date();
      let calculatedStartDate: string;
      let calculatedEndDate: string;

      if (startDate && endDate) {
        calculatedStartDate = startDate;
        calculatedEndDate = endDate;
      } else {
        calculatedEndDate = now.toISOString().split('T')[0];
        const start = new Date(now);

        switch (period) {
          case 'week':
            start.setDate(now.getDate() - 7);
            break;
          case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            start.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
        }

        calculatedStartDate = start.toISOString().split('T')[0];
      }

      // Get payments in the period
      const payments = await this.getTrainerPayments(trainerId, calculatedStartDate, calculatedEndDate);
      const successfulPayments = payments.filter(p => p.status === 'succeeded');

      // Calculate metrics
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalSessions = successfulPayments.length;
      const averageSessionValue = totalSessions > 0 ? totalRevenue / totalSessions : 0;

      const platformFees = successfulPayments.reduce((sum, p) => sum + p.platformFee, 0);
      const processingFees = successfulPayments.reduce((sum, p) => sum + p.processingFee, 0);
      const netIncome = totalRevenue - platformFees - processingFees;

      const refundedAmount = payments.filter(p => p.isRefunded).reduce((sum, p) => sum + (p.refundAmount || 0), 0);

      const report: FinancialReport = {
        id: '',
        trainerId,
        reportType,
        period,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        totalRevenue,
        totalSessions,
        averageSessionValue,
        revenueBySessionType: {}, // Would need session data to populate
        grossIncome: totalRevenue,
        platformFees,
        processingFees,
        netIncome,
        totalPayments: payments.length,
        successfulPayments: successfulPayments.length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        refundedAmount,
        taxableIncome: netIncome, // Simplified calculation
        topSessionTypes: [], // Would need session data
        topTrainees: [], // Would need aggregation
        generatedAt: new Date().toISOString()
      };

      // Save report to database
      const reportRef = await addDoc(collection(db, FINANCIAL_REPORTS_COLLECTION), report);
      report.id = reportRef.id;

      return report;
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }

  // Get trainer payments
  static async getTrainerPayments(
    trainerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Payment[]> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const paymentsQuery = query(
        collection(db, PAYMENTS_COLLECTION),
        where('trainerId', '==', trainerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(paymentsQuery);
      let payments: Payment[] = [];

      snapshot.forEach((doc) => {
        payments.push({ id: doc.id, ...doc.data() } as Payment);
      });

      // Filter by date range if provided
      if (startDate || endDate) {
        payments = payments.filter(payment => {
          const paymentDate = payment.createdAt.split('T')[0];
          if (startDate && paymentDate < startDate) return false;
          if (endDate && paymentDate > endDate) return false;
          return true;
        });
      }

      return payments;
    } catch (error) {
      console.error('Error getting trainer payments:', error);
      throw error;
    }
  }

  // ==================== PAYMENT SETTINGS ====================

  // Get payment settings
  static async getPaymentSettings(trainerId: string): Promise<PaymentSettings | null> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, PAYMENT_SETTINGS_COLLECTION, trainerId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { trainerId, ...docSnap.data() } as PaymentSettings;
      }

      // Return default settings
      return {
        trainerId,
        defaultSessionRates: {
          personal_training: 100,
          group_training: 50,
          assessment: 150,
          consultation: 75
        },
        currency: 'USD',
        taxRate: 8.25, // Default tax rate
        defaultPaymentTerms: 'Net 15',
        latePaymentFee: 25,
        latePaymentFeeType: 'flat',
        invoicePrefix: 'INV-',
        nextInvoiceNumber: 1,
        autoInvoiceAfterSession: false,
        paymentDueDays: 15,
        sendInvoiceReminders: true,
        reminderDaysBefore: [7, 3, 1],
        sendPaymentConfirmations: true,
        allowPartialRefunds: true,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting payment settings:', error);
      throw error;
    }
  }

  // Update payment settings
  static async updatePaymentSettings(
    trainerId: string,
    settings: Partial<PaymentSettings>
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const docRef = doc(db, PAYMENT_SETTINGS_COLLECTION, trainerId);
      await updateDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment settings:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  // Generate unique invoice number
  static async generateInvoiceNumber(trainerId: string): Promise<string> {
    try {
      const settings = await this.getPaymentSettings(trainerId);
      const prefix = settings?.invoicePrefix || 'INV-';
      const nextNumber = settings?.nextInvoiceNumber || 1;

      // Update the next invoice number
      if (settings) {
        await this.updatePaymentSettings(trainerId, {
          nextInvoiceNumber: nextNumber + 1
        });
      }

      return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  // Calculate platform revenue for a period
  static async calculatePlatformRevenue(
    startDate: string,
    endDate: string
  ): Promise<{ totalRevenue: number; platformFees: number; processingFees: number }> {
    try {
      if (!db) {
        throw new Error('Firebase Firestore not initialized');
      }

      const paymentsQuery = query(
        collection(db, PAYMENTS_COLLECTION),
        where('status', '==', 'succeeded'),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(paymentsQuery);
      let totalRevenue = 0;
      let platformFees = 0;
      let processingFees = 0;

      snapshot.forEach((doc) => {
        const payment = doc.data() as Payment;
        const paymentDate = payment.createdAt.split('T')[0];

        if (paymentDate >= startDate && paymentDate <= endDate) {
          totalRevenue += payment.amount;
          platformFees += payment.platformFee;
          processingFees += payment.processingFee;
        }
      });

      return { totalRevenue, platformFees, processingFees };
    } catch (error) {
      console.error('Error calculating platform revenue:', error);
      throw error;
    }
  }

  // Get payment statistics
  static async getPaymentStats(trainerId: string): Promise<{
    totalRevenue: number;
    totalPayments: number;
    averagePayment: number;
    successRate: number;
  }> {
    try {
      const payments = await this.getTrainerPayments(trainerId);
      const successfulPayments = payments.filter(p => p.status === 'succeeded');

      const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPayments = payments.length;
      const averagePayment = successfulPayments.length > 0 ? totalRevenue / successfulPayments.length : 0;
      const successRate = totalPayments > 0 ? (successfulPayments.length / totalPayments) * 100 : 0;

      return {
        totalRevenue,
        totalPayments,
        averagePayment,
        successRate
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }
}