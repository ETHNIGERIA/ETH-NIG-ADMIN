# Deployment guide — Admin console (ETH-NIG-ADMIN)

This release adds admin invitations and account management, the event Communications
screen (announcements and purchased-ticket emails) and the event Check-in screen.

**Deploy the API first** (`lbw-backend-2026/DEPLOYMENT.md`). These screens call endpoints
that only exist in the new API.

## 1. Environment variables

No new variables. Confirm these are set (server-only, never `NEXT_PUBLIC_`):

| Variable | Value |
|---|---|
| `TICKETS_API_BASE_URL` | The API base including `/api`, e.g. `https://api.example.com/api`. |

On the **API**, `ADMIN_APP_URL` must be this console's public HTTPS origin. Invitation and
password-reset emails link to `${ADMIN_APP_URL}/tickets-command/accept-invitation` and
`/tickets-command/reset-password`.

## 2. Build and deploy

```sh
npm ci
npx tsc --noEmit
npm run build
npm start
```

Serve over **HTTPS**. Browsers only allow the camera on secure origins, so the Check-in
scanner will not start on plain HTTP.

## 3. After deploy

1. On the API, grant the first manager (API guide, step 5). Without it, nobody can open
   account management.
2. That admin signs in again and opens **Admins** (`/tickets-command/admins`) to invite
   or edit other admins.

## 4. Verify

- [ ] Invite a test admin. The email arrives, the link opens, and the account can sign in.
- [ ] "Forgot password" sends a working reset link.
- [ ] In an event: **Attendees → Communications** opens; a draft can be previewed and a
      test email arrives (tests go only to the signed-in admin).
- [ ] **Attendees → Check-in** on a phone: the camera scans a ticket QR. Entering the code by
      hand finds the ticket. Admission only happens after pressing **Confirm admission**.
- [ ] **Event settings** shows the optional WhatsApp and Telegram community links; saved links
      appear in confirmation emails.

## 5. Notes for staff

- Camera scanning uses the browser's built-in barcode detector (Chrome on Android, recent
  desktop Chrome or Edge). Safari on iPhone does not have it: staff there type the code
  printed under the QR instead.
- Opening a ticket link from the email never admits anyone. Only Check-in admits.
- Until the operator turns announcements on (API guide, step 7), a sent announcement is
  queued but nothing goes out, and purchased-ticket campaigns are refused at send.
  Drafts, previews and test emails work before that.

## 6. Rollback

Redeploy the previous build. The new screens disappear, and the API keeps working for
the older console.
