import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendPaymentConfirmationMail } from '@/lib/mail';
import {
  normalizeCurrency,
  normalizeEmail,
  reconcilePaystackCharge,
  type PaymentStatus,
  type PaystackWebhookPayload,
} from '@/lib/payments';

export type PaymentRecord = {
  idempotencyKey?: string;
  eventId?: string;
  eventTitle?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  expectations?: string;
  organization?: string;
  community?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  confirmationEmailSent?: boolean;
  emailDispatchInFlight?: boolean;
};

export type PaymentAttemptRecord = {
  reference: string;
  idempotencyKey: string;
  eventId: string;
  eventTitle: string;
  email: string;
  fullName: string;
  phone?: string;
  expectations?: string;
  organization?: string;
  community?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
};

export type PaymentContext =
  | { kind: 'attempt_not_found' }
  | { kind: 'payment_not_found'; attempt: PaymentAttemptRecord }
  | {
      kind: 'ok';
      reference: string;
      db: FirebaseFirestore.Firestore;
      attemptRef: FirebaseFirestore.DocumentReference;
      paymentRef: FirebaseFirestore.DocumentReference;
      attempt: PaymentAttemptRecord;
      payment: PaymentRecord;
      expectedAmount: number;
      expectedCurrency: string;
      expectedEmail: string;
    };

type FinalizeSuccessParams = {
  context: Extract<PaymentContext, { kind: 'ok' }>;
  payload: PaystackWebhookPayload;
  source: 'paystack-webhook' | 'paystack-verify-endpoint';
  emailErrorLogPrefix: string;
};

const formatFirestoreDateToIso = (
  value: FirebaseFirestore.Timestamp | Date | { toDate?: () => Date; seconds?: number } | null | undefined
) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
};

const getEventDateForAcknowledgement = async (
  db: FirebaseFirestore.Firestore,
  eventId: string | undefined
) => {
  if (!eventId) {
    return null;
  }

  const eventSnap = await db.collection('events').doc(eventId).get();
  if (!eventSnap.exists) {
    return null;
  }

  const event = eventSnap.data() as {
    date?: FirebaseFirestore.Timestamp | Date | { toDate?: () => Date; seconds?: number };
  };

  return formatFirestoreDateToIso(event.date);
};

const claimEmailDispatch = async (paymentRef: FirebaseFirestore.DocumentReference) => {
  const db = getAdminDb();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(paymentRef);

    if (!snap.exists) {
      return false;
    }

    const data = snap.data() as PaymentRecord;

    if (data.confirmationEmailSent || data.emailDispatchInFlight) {
      return false;
    }

    tx.set(
      paymentRef,
      {
        emailDispatchInFlight: true,
        emailDispatchStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  });
};

const upsertRegistration = async (
  registrationRef: FirebaseFirestore.DocumentReference,
  registration: {
    eventId: string;
    eventTitle: string;
    email: string;
    fullName: string;
    phone?: string;
    expectations?: string;
    organization?: string;
    community?: string;
    amount: number;
    currency: string;
    paymentReference: string;
  },
  source: FinalizeSuccessParams['source']
) => {
  const db = getAdminDb();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(registrationRef);
    const existingCreatedAt = snap.exists
      ? (snap.data() as { createdAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue }).createdAt
      : undefined;

    tx.set(
      registrationRef,
      {
        ...registration,
        paymentStatus: 'success',
        source,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: existingCreatedAt || FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
};

export const getPaymentContextByReference = async (reference: string): Promise<PaymentContext> => {
  const db = getAdminDb();
  const attemptRef = db.collection('payment_attempts').doc(reference);
  const attemptSnap = await attemptRef.get();

  if (!attemptSnap.exists) {
    return { kind: 'attempt_not_found' };
  }

  const attempt = attemptSnap.data() as PaymentAttemptRecord;
  const paymentRef = db.collection('event_payments').doc(attempt.idempotencyKey);
  const paymentSnap = await paymentRef.get();

  if (!paymentSnap.exists) {
    return { kind: 'payment_not_found', attempt };
  }

  const payment = paymentSnap.data() as PaymentRecord;

  return {
    kind: 'ok',
    reference,
    db,
    attemptRef,
    paymentRef,
    attempt,
    payment,
    expectedAmount: Number(payment.amount ?? attempt.amount),
    expectedCurrency: normalizeCurrency(payment.currency || attempt.currency || 'NGN'),
    expectedEmail: normalizeEmail(payment.email || attempt.email || ''),
  };
};

export const markPaymentFailedIfNotSuccessful = async (
  context: Extract<PaymentContext, { kind: 'ok' }>,
  status: PaymentStatus,
  providerPayload?: Record<string, unknown>
) => {
  await context.db.runTransaction(async (tx) => {
    const paymentSnap = await tx.get(context.paymentRef);
    const attemptSnap = await tx.get(context.attemptRef);

    if (!paymentSnap.exists || !attemptSnap.exists) {
      return;
    }

    const payment = paymentSnap.data() as PaymentRecord;
    if (payment.status === 'success') {
      return;
    }

    tx.set(
      context.paymentRef,
      {
        status,
        providerPayload,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      context.attemptRef,
      {
        status,
        providerPayload,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
};

export const finalizeSuccessfulPayment = async ({
  context,
  payload,
  source,
  emailErrorLogPrefix,
}: FinalizeSuccessParams): Promise<
  | { outcome: 'success' }
  | { outcome: 'mismatch'; reason: string }
> => {
  const reconciliation = reconcilePaystackCharge({
    expectedAmount: context.expectedAmount,
    expectedCurrency: context.expectedCurrency,
    expectedEmail: context.expectedEmail,
    payload,
  });

  if (!reconciliation.ok) {
    await Promise.all([
      context.paymentRef.set(
        {
          status: 'mismatch',
          mismatchReason: reconciliation.reason,
          providerPayload: payload,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      context.attemptRef.set(
        {
          status: 'mismatch',
          mismatchReason: reconciliation.reason,
          providerPayload: payload,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
    ]);

    return { outcome: 'mismatch', reason: reconciliation.reason };
  }

  await context.db.runTransaction(async (tx) => {
    const latestPaymentSnap = await tx.get(context.paymentRef);
    const latestAttemptSnap = await tx.get(context.attemptRef);

    if (!latestPaymentSnap.exists || !latestAttemptSnap.exists) {
      return;
    }

    const latestPayment = latestPaymentSnap.data() as PaymentRecord;
    if (latestPayment.status === 'success') {
      return;
    }

    const paidAt = payload.data?.paid_at || new Date().toISOString();
    const customerEmail = normalizeEmail(payload.data?.customer?.email || context.expectedEmail);

    tx.set(
      context.paymentRef,
      {
        status: 'success',
        paidAt,
        gatewayResponse: payload.data?.gateway_response || '',
        channel: payload.data?.channel || '',
        providerPayload: payload,
        customerEmail,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      context.attemptRef,
      {
        status: 'success',
        paidAt,
        gatewayResponse: payload.data?.gateway_response || '',
        channel: payload.data?.channel || '',
        providerPayload: payload,
        customerEmail,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  const registrationId = context.payment.idempotencyKey || context.attempt.idempotencyKey;
  if (registrationId) {
    await upsertRegistration(
      context.db.collection('event_registrations').doc(registrationId),
      {
        eventId: context.payment.eventId || context.attempt.eventId || '',
        eventTitle: context.payment.eventTitle || context.attempt.eventTitle || 'Event Ticket',
        email: normalizeEmail(
          context.payment.email || context.attempt.email || payload.data?.customer?.email || ''
        ),
        fullName: context.payment.fullName || context.attempt.fullName || '',
        phone: context.payment.phone || context.attempt.phone || '',
        expectations: context.payment.expectations || context.attempt.expectations || '',
        organization: context.payment.organization || context.attempt.organization || '',
        community: context.payment.community || context.attempt.community || '',
        amount: context.expectedAmount,
        currency: context.expectedCurrency,
        paymentReference: context.reference,
      },
      source
    );
  }

  const canSendEmail = await claimEmailDispatch(context.paymentRef);

  if (canSendEmail) {
    try {
      const paidAt = payload.data?.paid_at || new Date().toISOString();
      const eventDate =
        (await getEventDateForAcknowledgement(
          context.db,
          context.payment.eventId || context.attempt.eventId
        )) || paidAt;

      await sendPaymentConfirmationMail({
        email: normalizeEmail(
          context.payment.email || context.attempt.email || payload.data?.customer?.email || ''
        ),
        fullName: context.payment.fullName || context.attempt.fullName || '',
        eventName: context.payment.eventTitle || context.attempt.eventTitle || 'Ethereum Nigeria Event',
        amountPaid: context.expectedAmount / 100,
        currency: context.expectedCurrency,
        paymentDate: paidAt,
        eventDate,
      });

      await context.paymentRef.set(
        {
          confirmationEmailSent: true,
          emailDispatchInFlight: false,
          emailSentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (mailError) {
      console.error(emailErrorLogPrefix, mailError);
      await context.paymentRef.set(
        {
          confirmationEmailSent: false,
          emailDispatchInFlight: false,
          emailSendError: String(mailError),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  return { outcome: 'success' };
};
