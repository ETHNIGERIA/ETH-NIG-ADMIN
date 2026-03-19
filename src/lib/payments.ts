import crypto from 'crypto';

type InitializePaystackParams = {
  email: string;
  amount: number;
  reference: string;
  currency: string;
  metadata?: Record<string, unknown>;
};

export type PaystackInitializeResponse = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type PaystackVerifyResponse = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paidAt?: string;
  customerEmail: string;
  gatewayResponse?: string;
  channel?: string;
};

export type PaymentStatus =
  | 'initializing'
  | 'initialized'
  | 'success'
  | 'failed'
  | 'mismatch'
  | 'initialize_failed';

export type PaystackWebhookPayload = {
  event?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string;
    customer?: {
      email?: string;
    };
    gateway_response?: string;
    channel?: string;
  };
};

type ReconcilePaystackChargeParams = {
  expectedAmount: number;
  expectedCurrency: string;
  expectedEmail: string;
  payload: PaystackWebhookPayload;
};

type ReconcilePaystackChargeResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
    };

export const PAYMENT_INITIALIZATION_LOCK_TTL_MS = 5 * 60 * 1000;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const normalizeCurrency = (currency: string) => currency.trim().toUpperCase();

export const buildIdempotencyKey = (eventId: string, email: string) => {
  return crypto.createHash('sha256').update(`${eventId}:${normalizeEmail(email)}`).digest('hex');
};

export const buildPaystackReference = (eventId: string, email: string) => {
  const hash = crypto
    .createHash('sha1')
    .update(`${eventId}:${normalizeEmail(email)}:${Date.now()}:${Math.random()}`)
    .digest('hex')
    .slice(0, 12);

  return `evt_${eventId.slice(0, 8)}_${hash}`;
};

export const initializePaystackTransaction = async ({
  email,
  amount,
  reference,
  currency,
  metadata,
}: InitializePaystackParams): Promise<PaystackInitializeResponse> => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is missing');
  }

  const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || process.env.APP_BASE_URL;

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      email,
      amount,
      reference,
      currency,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paystack initialize failed: ${body}`);
  }

  const payload = await response.json();

  if (!payload?.status || !payload?.data?.authorization_url) {
    throw new Error('Unexpected Paystack response during transaction initialize');
  }

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code,
    reference: payload.data.reference,
  };
};

export const verifyPaystackTransaction = async (reference: string): Promise<PaystackVerifyResponse> => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is missing');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paystack verify failed: ${body}`);
  }

  const payload = await response.json();

  if (!payload?.status || !payload?.data?.reference) {
    throw new Error('Unexpected Paystack response during transaction verify');
  }

  return {
    status: payload.data.status || '',
    reference: payload.data.reference,
    amount: Number(payload.data.amount || 0),
    currency: normalizeCurrency(payload.data.currency || 'NGN'),
    paidAt: payload.data.paid_at || undefined,
    customerEmail: normalizeEmail(payload.data.customer?.email || ''),
    gatewayResponse: payload.data.gateway_response || undefined,
    channel: payload.data.channel || undefined,
  };
};

export const verifyPaystackSignature = (rawBody: string, signature: string | null) => {
  if (!signature) {
    return false;
  }

  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!webhookSecret) {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha512', webhookSecret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

export const isInitializationLockActive = (
  lockExpiresAtMs: number | null | undefined,
  now = Date.now()
) => Number.isFinite(lockExpiresAtMs) && Number(lockExpiresAtMs) > now;

export const reconcilePaystackCharge = ({
  expectedAmount,
  expectedCurrency,
  expectedEmail,
  payload,
}: ReconcilePaystackChargeParams): ReconcilePaystackChargeResult => {
  if (payload.event !== 'charge.success' || payload.data?.status !== 'success') {
    return { ok: false, reason: 'Webhook payload is not a successful charge event' };
  }

  if (payload.data.amount !== expectedAmount) {
    return { ok: false, reason: `Amount mismatch: expected ${expectedAmount}, received ${payload.data.amount ?? 'unknown'}` };
  }

  if (normalizeCurrency(payload.data.currency || 'NGN') !== normalizeCurrency(expectedCurrency)) {
    return {
      ok: false,
      reason: `Currency mismatch: expected ${normalizeCurrency(expectedCurrency)}, received ${payload.data.currency || 'unknown'}`,
    };
  }

  if (normalizeEmail(payload.data.customer?.email || '') !== normalizeEmail(expectedEmail)) {
    return {
      ok: false,
      reason: `Customer email mismatch: expected ${normalizeEmail(expectedEmail)}, received ${normalizeEmail(payload.data.customer?.email || '')}`,
    };
  }

  return { ok: true };
};
