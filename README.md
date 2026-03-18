# ETH Nigeria Admin

Next.js admin application for managing events, content, uploads, and Paystack-backed event payments.

## Development

Run the app locally:

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm run build
```

## Environment

Create `.env.local` with the values below.

### Firebase client

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### Firebase admin

Use either explicit service-account credentials:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_USE_DEFAULT_CREDENTIALS=false
```

or platform default credentials:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_USE_DEFAULT_CREDENTIALS=true
```

### Paystack

```env
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
PAYSTACK_CALLBACK_URL=
APP_BASE_URL=http://localhost:3000
```

Notes:
- `PAYSTACK_CALLBACK_URL` falls back to `APP_BASE_URL` if not set.
- `PAYSTACK_WEBHOOK_SECRET` falls back to `PAYSTACK_SECRET_KEY` in code, but you should set `PAYSTACK_WEBHOOK_SECRET` explicitly in production.

### Mail acknowledgement API

```env
MAIL_BASE_URL=http://localhost:3000
```

Used by the payment flow to call:

```text
POST {MAIL_BASE_URL}/api/payment/send-acknowledgement
```

Request body sent by the app:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "amount": "₦50,000",
  "eventName": "Ethereum Nigeria Summit 2026",
  "paymentDate": "March 18, 2026",
  "eventDate": "April 12, 2026"
}
```

### Uploads

```env
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### CORS

```env
CORS_ALLOW_ALL=true
CORS_ALLOWED_ORIGINS=*
```

Current defaults from the code:
- `CORS_ALLOWED_ORIGINS` defaults to `*`
- `CORS_ALLOW_ALL` defaults to `true` unless explicitly set to `false`
- Result: CORS is effectively open by default

For production, lock this down:

```env
CORS_ALLOW_ALL=false
CORS_ALLOWED_ORIGINS=https://admin.example.com,https://www.example.com
```

## Payment Security Notes

The Paystack flow currently applies these controls:
- Payment initialization is idempotent per `eventId + email`
- Each Paystack `reference` is stored as its own immutable payment-attempt record
- Webhook signatures are verified with HMAC SHA-512
- Signature comparison uses `timingSafeEqual`
- Successful charges are reconciled against expected amount, currency, and customer email before access is granted
- Webhook and manual verify routes share the same finalization logic to avoid drift

Recommended deployment posture:
- Set a dedicated `PAYSTACK_WEBHOOK_SECRET`
- Do not expose `PAYSTACK_SECRET_KEY` to the client
- Restrict CORS in production
- Keep `MAIL_BASE_URL` pointed at a trusted internal or controlled service
- Treat Firebase admin credentials as server-only secrets

## Known Warning

`npm run build` currently succeeds with one warning from [src/app/api/upload/route.ts](/home/codetective/workdir/ETH-NIG-ADMIN/src/app/api/upload/route.ts) because it uses deprecated `config` export syntax for Next.js route handlers.
