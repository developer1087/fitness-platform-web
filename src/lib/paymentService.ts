/**
 * Payment Service
 * Handles all payment, billing, and package management
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import {
  Package,
  TraineePackage,
  Invoice,
  Payment,
  PaymentAccount,
  Transaction,
  PaymentSummary,
  SessionPaymentInfo,
} from '../shared-types/payment/types';

const PACKAGES_COLLECTION = 'packages';
const TRAINEE_PACKAGES_COLLECTION = 'trainee_packages';
const INVOICES_COLLECTION = 'invoices';
const PAYMENTS_COLLECTION = 'payments';
const PAYMENT_ACCOUNTS_COLLECTION = 'payment_accounts';
const TRANSACTIONS_COLLECTION = 'transactions';
const SESSIONS_COLLECTION = 'sessions';

export class PaymentService {
  /**
   * PACKAGE MANAGEMENT
   */

  // Create a new package offering
  static async createPackage(trainerId: string, packageData: Omit<Package, 'id' | 'trainerId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');

    const now = new Date().toISOString();
    const packageDoc: Omit<Package, 'id'> = {
      ...packageData,
      trainerId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, PACKAGES_COLLECTION), packageDoc);
    return docRef.id;
  }

  // Get all packages for a trainer
  static async getTrainerPackages(trainerId: string): Promise<Package[]> {
    if (!db) return [];
    
    const q = query(
      collection(db, PACKAGES_COLLECTION),
      where('trainerId', '==', trainerId),
      orderBy('price', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
  }

  // Get active packages (for trainees to purchase)
  static async getActivePackages(trainerId: string): Promise<Package[]> {
    if (!db) return [];
    
    const q = query(
      collection(db, PACKAGES_COLLECTION),
      where('trainerId', '==', trainerId),
      where('isActive', '==', true),
      orderBy('price', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
  }

  // Update package
  static async updatePackage(packageId: string, updates: Partial<Package>): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const docRef = doc(db, PACKAGES_COLLECTION, packageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * TRAINEE PACKAGE MANAGEMENT
   */

  // Get trainee's active packages
  static async getTraineePackages(traineeId: string, trainerId?: string): Promise<TraineePackage[]> {
    if (!db) return [];
    
    let q = query(
      collection(db, TRAINEE_PACKAGES_COLLECTION),
      where('traineeId', '==', traineeId),
      orderBy('purchaseDate', 'desc')
    );

    if (trainerId) {
      q = query(q, where('trainerId', '==', trainerId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TraineePackage));
  }

  // Get best available package for a trainee (most sessions remaining, not expired)
  static async getBestAvailablePackage(traineeId: string, trainerId: string, sessionType?: string): Promise<TraineePackage | null> {
    const packages = await this.getTraineePackages(traineeId, trainerId);

    const activePackages = packages.filter(pkg =>
      pkg.status === 'active' &&
      pkg.remainingSessions > 0 &&
      new Date(pkg.expiryDate) > new Date()
    );

    if (activePackages.length === 0) return null;

    // Return package with most sessions remaining
    return activePackages.reduce((best, current) =>
      current.remainingSessions > best.remainingSessions ? current : best
    );
  }

  // Deduct a session credit from package
  static async deductPackageCredit(traineePackageId: string, sessionId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const packageRef = doc(db, TRAINEE_PACKAGES_COLLECTION, traineePackageId);
    const packageDoc = await getDoc(packageRef);

    if (!packageDoc.exists()) {
      throw new Error('Package not found');
    }

    const packageData = { id: packageDoc.id, ...packageDoc.data() } as TraineePackage;

    if (packageData.remainingSessions <= 0) {
      throw new Error('No sessions remaining in package');
    }

    if (packageData.status !== 'active') {
      throw new Error('Package is not active');
    }

    if (new Date(packageData.expiryDate) < new Date()) {
      throw new Error('Package has expired');
    }

    const newRemaining = packageData.remainingSessions - 1;
    const updates: Partial<TraineePackage> = {
      remainingSessions: newRemaining,
      updatedAt: new Date().toISOString(),
    };

    // Mark as exhausted if no sessions left
    if (newRemaining === 0) {
      updates.status = 'exhausted';
    }

    await updateDoc(packageRef, updates);

    // Create transaction record
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      trainerId: packageData.trainerId,
      traineeId: packageData.traineeId,
      type: 'debit',
      amount: 0,
      sessionId,
      traineePackageId,
      packageId: packageData.packageId,
      description: `Session credit used from package: ${packageData.packageName} (${newRemaining} remaining)`,
      createdAt: new Date().toISOString(),
    } as Omit<Transaction, 'id'>);
  }

  /**
   * INVOICE MANAGEMENT
   */

  // Create invoice for a session
  static async createSessionInvoice(
    trainerId: string,
    traineeId: string,
    sessionId: string,
    sessionData: {
      scheduledDate: string;
      startTime: string;
      sessionRate: number;
      type: string;
      traineePackageId?: string;
    },
    createAt: 'immediate' | 'before_24h' = 'before_24h'
  ): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const now = new Date().toISOString();
    const sessionDateTime = new Date(`${sessionData.scheduledDate}T${sessionData.startTime}`);

    // Calculate cancellation deadline (24h before session)
    const cancellationDeadline = new Date(sessionDateTime);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

    // If creating invoice 24h before, set billing date to that time
    const billingDate = createAt === 'before_24h'
      ? cancellationDeadline.toISOString()
      : now;

    const invoice: Omit<Invoice, 'id'> = {
      trainerId,
      traineeId,
      sessionId,
      traineePackageId: sessionData.traineePackageId,
      type: 'session',
      amount: sessionData.traineePackageId ? 0 : sessionData.sessionRate,
      description: `${sessionData.type} session on ${sessionData.scheduledDate} at ${sessionData.startTime}`,
      billingDate,
      dueDate: sessionData.scheduledDate,
      status: sessionData.traineePackageId ? 'paid' : 'pending',
      cancellationDeadline: cancellationDeadline.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    // If using package, mark as paid immediately
    if (sessionData.traineePackageId) {
      invoice.paidAt = now;
    }

    const docRef = await addDoc(collection(db, INVOICES_COLLECTION), invoice);

    // Create transaction record
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      trainerId,
      traineeId,
      type: sessionData.traineePackageId ? 'credit' : 'charge',
      amount: sessionData.traineePackageId ? 0 : sessionData.sessionRate,
      sessionId,
      invoiceId: docRef.id,
      traineePackageId: sessionData.traineePackageId,
      description: invoice.description,
      createdAt: now,
    } as Omit<Transaction, 'id'>);

    return docRef.id;
  }

  // Helper: Check and update overdue invoices
  private static async updateOverdueInvoices(invoices: Invoice[]): Promise<Invoice[]> {
    if (!db) return invoices;

    const now = new Date();
    const firestore = db; // Capture db in local variable for TypeScript
    const batch = writeBatch(firestore);
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit

    const updatedInvoices = invoices.map(invoice => {
      // Only check pending invoices
      if (invoice.status === 'pending' && invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);

        // If due date has passed, mark as overdue
        if (now > dueDate) {
          const invoiceRef = doc(firestore, INVOICES_COLLECTION, invoice.id);
          batch.update(invoiceRef, {
            status: 'overdue',
            updatedAt: now.toISOString()
          });
          batchCount++;

          // Return updated invoice
          return { ...invoice, status: 'overdue' as Invoice['status'] };
        }
      }
      return invoice;
    });

    // Commit batch if there are updates
    if (batchCount > 0 && batchCount <= maxBatchSize) {
      try {
        await batch.commit();
        console.log(`✅ Updated ${batchCount} invoices to overdue status`);
      } catch (error) {
        console.error('Error updating overdue invoices:', error);
      }
    }

    return updatedInvoices;
  }

  // Get trainer's invoices
  static async getTrainerInvoices(trainerId: string, status?: Invoice['status']): Promise<Invoice[]> {
    if (!db) return [];

    let q = query(
      collection(db, INVOICES_COLLECTION),
      where('trainerId', '==', trainerId),
      orderBy('billingDate', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));

    // Check and update overdue invoices
    return await this.updateOverdueInvoices(invoices);
  }

  // Get trainee's invoices
  static async getTraineeInvoices(traineeId: string, trainerId?: string): Promise<Invoice[]> {
    if (!db) return [];

    let q = query(
      collection(db, INVOICES_COLLECTION),
      where('traineeId', '==', traineeId),
      orderBy('billingDate', 'desc')
    );

    if (trainerId) {
      q = query(q, where('trainerId', '==', trainerId));
    }

    const snapshot = await getDocs(q);
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));

    // Check and update overdue invoices
    return await this.updateOverdueInvoices(invoices);
  }

  // Cancel invoice (if within cancellation window)
  static async cancelInvoice(invoiceId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);

    if (!invoiceDoc.exists()) {
      throw new Error('Invoice not found');
    }

    const invoice = { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;

    if (invoice.status !== 'pending') {
      throw new Error('Can only cancel pending invoices');
    }

    // Check if within cancellation window
    if (invoice.cancellationDeadline) {
      const deadline = new Date(invoice.cancellationDeadline);
      if (new Date() > deadline) {
        throw new Error('Cancellation deadline has passed');
      }
    }

    await updateDoc(invoiceRef, {
      status: 'cancelled',
      wasCancelledInTime: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * PAYMENT MANAGEMENT
   */

  // Record a payment
  static async recordPayment(
    trainerId: string,
    traineeId: string,
    paymentData: {
      amount: number;
      invoiceIds: string[];
      paymentMethod: Payment['paymentMethod'];
      transactionId?: string;
      notes?: string;
    }
  ): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // 1. Create payment record
    const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
    const payment: Omit<Payment, 'id'> = {
      trainerId,
      traineeId,
      amount: paymentData.amount,
      currency: 'ILS',
      invoiceIds: paymentData.invoiceIds,
      paymentMethod: paymentData.paymentMethod,
      paymentProcessor: 'manual',
      ...(paymentData.transactionId && { transactionId: paymentData.transactionId }), // Only include if provided
      status: 'completed',
      ...(paymentData.notes && { notes: paymentData.notes }), // Only include if provided
      createdAt: now,
      updatedAt: now,
    };
    batch.set(paymentRef, payment);

    // 2. Update invoices as paid
    for (const invoiceId of paymentData.invoiceIds) {
      const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
      batch.update(invoiceRef, {
        status: 'paid',
        paymentId: paymentRef.id,
        paidAt: now,
        updatedAt: now,
      });
    }

    // 3. Create transaction record
    const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
    const transaction: Omit<Transaction, 'id'> = {
      trainerId,
      traineeId,
      type: 'payment',
      amount: paymentData.amount,
      paymentId: paymentRef.id,
      description: `Payment for ${paymentData.invoiceIds.length} invoice(s)`,
      createdAt: now,
    };
    batch.set(transactionRef, transaction);

    await batch.commit();
    return paymentRef.id;
  }

  // Get trainer's payments
  static async getTrainerPayments(trainerId: string): Promise<Payment[]> {
    if (!db) return [];
    
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('trainerId', '==', trainerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  /**
   * PAYMENT ACCOUNT MANAGEMENT
   */

  // Get or create payment account
  static async getPaymentAccount(trainerId: string): Promise<PaymentAccount> {
    if (!db) throw new Error('Firestore not initialized');
    
    const docRef = doc(db, PAYMENT_ACCOUNTS_COLLECTION, trainerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { trainerId, ...docSnap.data() } as PaymentAccount;
    }

    // Create default payment account
    const now = new Date().toISOString();
    const defaultAccount: PaymentAccount = {
      trainerId,
      acceptCash: true,
      acceptBankTransfer: true,
      defaultCancellationWindow: 24,
      lateCancellationFee: 0,
      noShowFee: 0,
      nextInvoiceNumber: 1001,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, defaultAccount);
    return defaultAccount;
  }

  // Update payment account
  static async updatePaymentAccount(trainerId: string, updates: Partial<PaymentAccount>): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const docRef = doc(db, PAYMENT_ACCOUNTS_COLLECTION, trainerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * SUMMARY AND ANALYTICS
   */

  // Get payment summary for dashboard
  static async getPaymentSummary(trainerId: string, year: number, month: number): Promise<PaymentSummary> {
    if (!db) {
      return {
        trainerId,
        period: `${year}-${String(month).padStart(2, '0')}`,
        totalRevenue: 0,
        pendingPayments: 0,
        overduePayments: 0,
        sessionRevenue: 0,
        packageRevenue: 0,
        totalSessions: 0,
        paidSessions: 0,
        unpaidSessions: 0,
        packagesSold: 0,
        activePackages: 0,
      };
    }

    const period = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Get invoices for the period
    const invoicesQuery = query(
      collection(db, INVOICES_COLLECTION),
      where('trainerId', '==', trainerId),
      where('billingDate', '>=', startDate),
      where('billingDate', '<=', endDate)
    );
    const invoicesSnapshot = await getDocs(invoicesQuery);
    const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));

    // Calculate metrics
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const pendingPayments = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overduePayments = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const sessionRevenue = invoices
      .filter(inv => inv.type === 'session' && inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const packageRevenue = invoices
      .filter(inv => inv.type === 'package' && inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const sessionInvoices = invoices.filter(inv => inv.type === 'session');
    const totalSessions = sessionInvoices.length;
    const paidSessions = sessionInvoices.filter(inv => inv.status === 'paid').length;
    const unpaidSessions = sessionInvoices.filter(inv => inv.status === 'pending').length;

    // Get packages sold in period
    const packagesQuery = query(
      collection(db, TRAINEE_PACKAGES_COLLECTION),
      where('trainerId', '==', trainerId),
      where('purchaseDate', '>=', startDate),
      where('purchaseDate', '<=', endDate)
    );
    const packagesSnapshot = await getDocs(packagesQuery);
    const packagesSold = packagesSnapshot.size;

    // Get active packages
    const activePackagesQuery = query(
      collection(db, TRAINEE_PACKAGES_COLLECTION),
      where('trainerId', '==', trainerId),
      where('status', '==', 'active')
    );
    const activePackagesSnapshot = await getDocs(activePackagesQuery);
    const activePackages = activePackagesSnapshot.size;

    return {
      trainerId,
      period,
      totalRevenue,
      pendingPayments,
      overduePayments,
      sessionRevenue,
      packageRevenue,
      totalSessions,
      paidSessions,
      unpaidSessions,
      packagesSold,
      activePackages,
    };
  }
}
