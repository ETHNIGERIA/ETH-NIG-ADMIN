import { FieldValue } from 'firebase-admin/firestore';
import { corsOptionsResponse, jsonWithCors } from '@/lib/cors';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendEventRegistrationConfirmationMail } from '@/lib/mail';

type CreateFreeRegistrationBody = {
  eventId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  expectations?: string;
  organization?: string;
  community?: string;
  currency?: string;
  source?: string;
};

type EventRecord = {
  title?: string;
  date?: FirebaseFirestore.Timestamp | Date | { toDate?: () => Date; seconds?: number };
  image?: string;
  link?: string;
};

const toIsoDate = (
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

export function OPTIONS(req: Request) {
  return corsOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateFreeRegistrationBody;

    const eventId = body.eventId?.trim();
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim() || '';

    if (!eventId || !email) {
      return jsonWithCors(req, { error: 'eventId and email are required' }, { status: 400 });
    }

    const db = getAdminDb();
    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return jsonWithCors(req, { error: 'Event not found' }, { status: 404 });
    }

    const event = eventSnap.data() as EventRecord;
    const registrationRef = db.collection('event_registrations').doc();

    const registrationCreatedAtIso = new Date().toISOString();
    const eventDateIso = toIsoDate(event.date) || registrationCreatedAtIso;

    await registrationRef.set({
      eventId,
      eventTitle: event.title || 'Ethereum Nigeria Event',
      email,
      fullName,
      phone: body.phone?.trim() || '',
      expectations: body.expectations?.trim() || '',
      organization: body.organization?.trim() || '',
      community: body.community?.trim() || '',
      amount: 0,
      currency: body.currency?.trim() || 'NGN',
      paymentStatus: 'free',
      source: body.source?.trim() || 'landing-free-registration',
      confirmationEmailSent: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    try {
      await sendEventRegistrationConfirmationMail({
        email,
        fullName: fullName || 'there',
        eventId,
        eventName: event.title || 'Ethereum Nigeria Event',
        registrationType: 'free',
        registrationDate: registrationCreatedAtIso,
        eventDate: eventDateIso,
        ticketQuantity: 1,
        customizations: {
          ctaText: event.link ? 'View Event Details' : undefined,
          ctaUrl: event.link || undefined,
          bannerImageUrl: event.image || undefined,
        },
      });

      await registrationRef.set(
        {
          confirmationEmailSent: true,
          confirmationEmailSentAt: FieldValue.serverTimestamp(),
          confirmationEmailError: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (mailError) {
      console.error('Free registration email send failed:', mailError);
      await registrationRef.set(
        {
          confirmationEmailSent: false,
          confirmationEmailError: String(mailError),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return jsonWithCors(req, {
      ok: true,
      registrationId: registrationRef.id,
    });
  } catch (error) {
    console.error('Create free registration error:', error);
    return jsonWithCors(req, { error: 'Failed to create free registration' }, { status: 500 });
  }
}
