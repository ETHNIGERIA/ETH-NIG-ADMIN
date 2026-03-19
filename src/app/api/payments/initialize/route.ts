import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  buildIdempotencyKey,
  buildPaystackReference,
  isInitializationLockActive,
  initializePaystackTransaction,
  normalizeCurrency,
  normalizeEmail,
  PAYMENT_INITIALIZATION_LOCK_TTL_MS,
  type PaystackInitializeResponse,
  type PaymentStatus,
} from '@/lib/payments';
import { corsOptionsResponse, jsonWithCors } from '@/lib/cors';

export const runtime = 'nodejs';

type InitializeBody = {
  eventId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  expectations?: string;
  organization?: string;
  organisation?: string;
  community?: string;
};

type PaymentRecord = {
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
  provider?: string;
  reference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  createdAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  initializationLockExpiresAt?: number | null;
  lastInitializationError?: string;
};

type PaymentAttemptRecord = {
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
  authorizationUrl?: string;
  accessCode?: string;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
  provider: 'paystack';
};

type InitializationResolution =
  | { kind: 'already_paid'; record: PaymentRecord }
  | { kind: 'already_initialized'; record: PaymentRecord }
  | { kind: 'initialization_in_progress'; reference?: string }
  | { kind: 'initialize'; reference: string };

export function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InitializeBody;
    const eventId = body.eventId?.trim();
    const email = body.email?.trim();
    const fullName = body.fullName?.trim() || '';
    const phone = body.phone?.trim() || '';
    const expectations = body.expectations?.trim() || '';
    const organization = body.organization?.trim() || body.organisation?.trim() || '';
    const community = body.community?.trim() || '';

    if (!eventId || !email) {
      return jsonWithCors(req, { error: 'eventId and email are required' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = getAdminDb();

    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return jsonWithCors(req, { error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventSnap.data() as {
      title?: string;
      isPayable?: boolean;
      price?: number;
      currency?: string;
    };

    if (!eventData?.isPayable) {
      return jsonWithCors(req, { error: 'This event is not payable' }, { status: 400 });
    }

    const eventPrice = Number(eventData.price || 0);
    const amountInMinorUnit = Math.round(eventPrice * 100);

    if (!Number.isFinite(amountInMinorUnit) || amountInMinorUnit <= 0) {
      return jsonWithCors(req, { error: 'Invalid payable amount configured for this event' }, { status: 400 });
    }

    const currency = normalizeCurrency(eventData.currency || 'NGN');
    const idempotencyKey = buildIdempotencyKey(eventId, normalizedEmail);
    const paymentRef = db.collection('event_payments').doc(idempotencyKey);

    const eventTitle = eventData.title || 'Event Ticket';
    const initializationDecision = await db.runTransaction<InitializationResolution>(async (tx) => {
      const snap = await tx.get(paymentRef);
      const existing = snap.exists ? (snap.data() as PaymentRecord) : null;
      const now = Date.now();

      if (existing?.status === 'success') {
        return { kind: 'already_paid', record: existing };
      }

      if (
        existing?.status === 'initialized' &&
        existing.authorizationUrl &&
        Number(existing.amount) === amountInMinorUnit &&
        normalizeCurrency(existing.currency || currency) === currency
      ) {
        return { kind: 'already_initialized', record: existing };
      }

      if (
        existing?.status === 'initializing' &&
        existing.reference &&
        isInitializationLockActive(existing.initializationLockExpiresAt, now)
      ) {
        return { kind: 'initialization_in_progress', reference: existing.reference };
      }

      const reference = buildPaystackReference(eventId, normalizedEmail);
      tx.set(
        paymentRef,
        {
          idempotencyKey,
          eventId,
          eventTitle,
          email: normalizedEmail,
          fullName,
          phone,
          expectations,
          organization,
          community,
          amount: amountInMinorUnit,
          currency,
          status: 'initializing',
          provider: 'paystack',
          reference,
          createdAt: existing?.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          initializationLockExpiresAt: now + PAYMENT_INITIALIZATION_LOCK_TTL_MS,
          lastInitializationError: FieldValue.delete(),
        },
        { merge: true }
      );

      return { kind: 'initialize', reference };
    });

    if (initializationDecision.kind === 'already_paid') {
      return jsonWithCors(req, {
        ok: true,
        alreadyPaid: true,
        message: 'Payment already confirmed for this email on this event',
        reference: initializationDecision.record.reference,
        accessCode: initializationDecision.record.accessCode,
      });
    }

    if (initializationDecision.kind === 'already_initialized') {
      return jsonWithCors(req, {
        ok: true,
        alreadyInitialized: true,
        authorizationUrl: initializationDecision.record.authorizationUrl,
        reference: initializationDecision.record.reference,
        amount: initializationDecision.record.amount,
        currency: initializationDecision.record.currency || currency,
        accessCode: initializationDecision.record.accessCode,
      });
    }

    if (initializationDecision.kind === 'initialization_in_progress') {
      return jsonWithCors(
        req,
        {
          ok: false,
          pending: true,
          message: 'A payment initialization is already in progress for this email and event',
          reference: initializationDecision.reference,
        },
        { status: 202 }
      );
    }

    const reference = initializationDecision.reference;
    const attemptRef = db.collection('payment_attempts').doc(reference);

    await attemptRef.set({
      reference,
      idempotencyKey,
      eventId,
      eventTitle,
      email: normalizedEmail,
      fullName,
      phone,
      expectations,
      organization,
      community,
      amount: amountInMinorUnit,
      currency,
      status: 'initializing',
      provider: 'paystack',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    } satisfies PaymentAttemptRecord);

    let initialized: PaystackInitializeResponse;
    try {
      initialized = await initializePaystackTransaction({
        email: normalizedEmail,
        amount: amountInMinorUnit,
        reference,
        currency,
        metadata: {
          eventId,
          eventTitle,
          idempotencyKey,
          fullName,
          phone,
          expectations,
          organization,
          community,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Paystack initialization error';

      await Promise.all([
        attemptRef.set(
          {
            status: 'initialize_failed',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        ),
        paymentRef.set(
          {
            status: 'initialize_failed',
            initializationLockExpiresAt: null,
            lastInitializationError: errorMessage,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        ),
      ]);

      throw error;
    }

    await Promise.all([
      attemptRef.set(
        {
          status: 'initialized',
          reference: initialized.reference,
          authorizationUrl: initialized.authorizationUrl,
          accessCode: initialized.accessCode,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      paymentRef.set(
        {
          status: 'initialized',
          reference: initialized.reference,
          authorizationUrl: initialized.authorizationUrl,
          accessCode: initialized.accessCode,
          initializationLockExpiresAt: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
    ]);

    return jsonWithCors(req, {
      ok: true,
      authorizationUrl: initialized.authorizationUrl,
      reference: initialized.reference,
      amount: amountInMinorUnit,
      currency,
      accessCode: initialized.accessCode,
      idempotencyKey,
    });
  } catch (error) {
    console.error('Payment initialize error:', error);
    return jsonWithCors(req, { error: 'Failed to initialize payment' }, { status: 500 });
  }
}
