type SendPaymentConfirmationMailParams = {
  email: string;
  fullName?: string;
  eventName: string;
  amountPaid: number;
  currency: string;
  paymentDate: string;
  eventDate: string;
};

type SendEventRegistrationConfirmationMailParams = {
  email: string;
  fullName?: string;
  eventId?: string;
  eventName: string;
  registrationType: 'free' | 'paid';
  registrationDate: string;
  eventDate: string;
  amountPaid?: number;
  currency?: string;
  ticketQuantity?: number;
  paymentReference?: string;
  customizations?: {
    introMessage?: string;
    ctaText?: string;
    ctaUrl?: string;
    bannerImageUrl?: string;
    extraNote?: string;
  };
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

const formatHumanDate = (input: string | Date) => {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date provided for acknowledgement email: ${String(input)}`);
  }

  return new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const sendPaymentConfirmationMail = async ({
  email,
  fullName,
  eventName,
  amountPaid,
  currency,
  paymentDate,
  eventDate,
}: SendPaymentConfirmationMailParams) => {
  const mailBaseUrl = process.env.MAIL_BASE_URL;

  if (!mailBaseUrl) {
    throw new Error('MAIL_BASE_URL is missing');
  }

  const response = await fetch(`${mailBaseUrl.replace(/\/$/, '')}/api/payment/send-acknowledgement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: fullName || 'there',
      email,
      amount: formatMoney(amountPaid, currency),
      eventName,
      paymentDate: formatHumanDate(paymentDate),
      eventDate: formatHumanDate(eventDate),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Acknowledgement mail request failed: ${body}`);
  }
};

export const sendEventRegistrationConfirmationMail = async ({
  email,
  fullName,
  eventId,
  eventName,
  registrationType,
  registrationDate,
  eventDate,
  amountPaid,
  currency,
  ticketQuantity,
  paymentReference,
  customizations,
}: SendEventRegistrationConfirmationMailParams) => {
  const mailBaseUrl = process.env.MAIL_BASE_URL;

  if (!mailBaseUrl) {
    throw new Error('MAIL_BASE_URL is missing');
  }

  const response = await fetch(
    `${mailBaseUrl.replace(/\/$/, '')}/api/event/send-registration-confirmation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        fullName: fullName || 'there',
        eventId,
        eventName,
        registrationType,
        registrationDate: formatHumanDate(registrationDate),
        eventDate: formatHumanDate(eventDate),
        amountPaid:
          typeof amountPaid === 'number' && currency
            ? formatMoney(amountPaid, currency)
            : undefined,
        currency,
        ticketQuantity,
        paymentReference,
        customizations,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Event registration mail request failed: ${body}`);
  }
};
