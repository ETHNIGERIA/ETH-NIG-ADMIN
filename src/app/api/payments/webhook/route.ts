import {
  finalizeSuccessfulPayment,
  getPaymentContextByReference,
  markPaymentFailedIfNotSuccessful,
} from '@/lib/paymentProcessing';
import { verifyPaystackSignature, type PaystackWebhookPayload } from '@/lib/payments';
import { corsOptionsResponse, jsonWithCors } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!verifyPaystackSignature(rawBody, signature)) {
      return jsonWithCors(req, { error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaystackWebhookPayload;
    const eventType = payload.event;
    const reference = payload.data?.reference;

    if (!reference || !eventType) {
      return jsonWithCors(req, { ok: true, ignored: true });
    }

    const context = await getPaymentContextByReference(reference);

    if (context.kind !== 'ok') {
      return jsonWithCors(req, { ok: true, ignored: true });
    }

    if (eventType === 'charge.success') {
      const result = await finalizeSuccessfulPayment({
        context,
        payload,
        source: 'paystack-webhook',
        emailErrorLogPrefix: 'Email send failed:',
      });

      if (result.outcome === 'mismatch') {
        return jsonWithCors(req, { ok: true, ignored: true });
      }

      return jsonWithCors(req, { ok: true });
    }

    if (eventType === 'charge.failed' || eventType === 'charge.abandoned') {
      await markPaymentFailedIfNotSuccessful(context, 'failed', payload as Record<string, unknown>);
      return jsonWithCors(req, { ok: true });
    }

    return jsonWithCors(req, { ok: true, ignored: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return jsonWithCors(req, { error: 'Webhook processing failed' }, { status: 500 });
  }
}
