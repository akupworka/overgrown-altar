# Guild emails

Branded emails sent by Supabase. Paste each into **Supabase → Authentication → Emails → Templates**:

| Template in Supabase | File | Subject |
|---|---|---|
| Invite user | `invite.html` | A seat at the table: welcome to the Guild |
| Reset password | `reset-password.html` | A new key to your Guild Desk |
| Confirm sign up | `confirm-signup.html` | Confirm your seat at the table |
| Magic link | `magic-link.html` | Your key to the Guild Desk |
| Change email address | `change-email.html` | Confirm your new email address |
| Reauthentication | `reauthentication.html` | Your Guild security code |

Sign-ups are switched off (members are invited), so Confirm sign up and Magic link should rarely or never send;
they are designed anyway, so no Guild email ever arrives looking like a default.

## Sending through Resend (custom SMTP)
Supabase's own mail service is for testing (a few emails an hour, a generic sender). Under
**Authentication → Emails → SMTP Settings**, enable custom SMTP:
host `smtp.resend.com`, port `465`, username `resend`, password = a Resend API key with sending access,
sender email `editor@overgrownaltar.com`, sender name `Overgrown Altar`.

The links go to `/guild/desk/?token_hash=…&type=…`; the Desk opens them itself (`DeskApp.tsx`) and shows "choose your password".
