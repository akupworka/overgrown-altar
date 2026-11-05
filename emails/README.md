# Guild emails

Branded emails sent by Supabase. Paste each into **Supabase → Authentication → Emails → Templates**:

| Template in Supabase | File | Subject |
|---|---|---|
| Invite user | `invite.html` | A seat at the table: welcome to the Guild |
| Reset password | `reset-password.html` | A new key to your Guild Desk |

The links go to `/guild/desk/?token_hash=…&type=…`; the Desk opens them itself (`DeskApp.tsx`) and shows "choose your password".
