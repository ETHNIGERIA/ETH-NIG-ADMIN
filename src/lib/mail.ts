type SendPaymentConfirmationMailParams = {
  email: string;
  fullName?: string;
  eventName: string;
  amountPaid: number;
  currency: string;
  paymentDate: string;
  eventDate: string;
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
