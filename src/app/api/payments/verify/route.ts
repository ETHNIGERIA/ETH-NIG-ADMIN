import {
  finalizeSuccessfulPayment,
  getPaymentContextByReference,
  markPaymentFailedIfNotSuccessful,
} from '@/lib/paymentProcessing';
import {
  verifyPaystackTransaction,
  type PaystackWebhookPayload,
} from '@/lib/payments';
import { corsOptionsResponse, jsonWithCors } from '@/lib/cors';

export const runtime = 'nodejs';

type VerifyBody = {
  reference?: string;
};

export function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody;
    const reference = body.reference?.trim();

    if (!reference) {
      return jsonWithCors(req, { error: 'reference is required' }, { status: 400 });
    }

    const context = await getPaymentContextByReference(reference);

    if (context.kind === 'attempt_not_found') {
      return jsonWithCors(req, { error: 'Payment attempt not found for reference' }, { status: 404 });
    }

    if (context.kind === 'payment_not_found') {
      return jsonWithCors(req, { error: 'Payment record not found for reference' }, { status: 404 });
    }

    const verification = await verifyPaystackTransaction(reference);

    const payloadLikeWebhook: PaystackWebhookPayload = {
      event: verification.status === 'success' ? 'charge.success' : 'charge.failed',
      data: {
        status: verification.status,
        reference: verification.reference,
        amount: verification.amount,
        currency: verification.currency,
        paid_at: verification.paidAt,
        customer: {
          email: verification.customerEmail,
        },
        gateway_response: verification.gatewayResponse,
        channel: verification.channel,
      },
    };

    if (verification.status === 'success') {
      const result = await finalizeSuccessfulPayment({
        context,
        payload: payloadLikeWebhook,
        source: 'paystack-verify-endpoint',
        emailErrorLogPrefix: 'Email send failed on verify endpoint:',
      });

      if (result.outcome === 'mismatch') {
        return jsonWithCors(req, { ok: true, paid: false, status: 'mismatch', reason: result.reason });
      }

      return jsonWithCors(req, { ok: true, paid: true, status: 'success', reference });
    }

    await markPaymentFailedIfNotSuccessful(context, 'failed', payloadLikeWebhook as Record<string, unknown>);
    return jsonWithCors(req, { ok: true, paid: false, status: verification.status || 'failed', reference });
  } catch (error) {
    console.error('Paystack verify endpoint error:', error);
    return jsonWithCors(req, { error: 'Verification failed' }, { status: 500 });
  }
}
