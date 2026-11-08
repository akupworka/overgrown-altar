# Builds the Guild's account emails (paste each into Supabase > Authentication > Emails > Templates).
# Run:  python3 emails/build.py      The writer emails (netlify/functions/notify-writer.mts) use the same frame.
# Headers live in public/images/email/ (outside the site's password gate, so mail apps can load them).
SITE = 'https://overgrownaltar.com'
SERIF = "Georgia,'Times New Roman',serif"
SANS = "Arial,Helvetica,sans-serif"

def frame(*, subject, preview, header, eyebrow, heading, lines, button=None, href=None, steps=None, code=None, fine=''):
    btn = f'''
          <tr><td align="center" style="padding:30px 44px 6px 44px;">
            <a href="{href}" style="display:inline-block;background:#F3ECDC;color:#12160F;text-decoration:none;font-family:{SANS};font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;padding:18px 36px;border-radius:3px;">{button}&nbsp;&rarr;</a>
          </td></tr>''' if button else ''
    codebox = f'''
          <tr><td align="center" style="padding:30px 44px 6px 44px;">
            <div style="display:inline-block;padding:18px 30px;border:1px solid #6B5A2E;border-radius:4px;background:#171A12;font-family:'Courier New',Courier,monospace;font-size:34px;letter-spacing:10px;color:#FFE3A3;">{code}</div>
          </td></tr>''' if code else ''
    steps_html = ''
    if steps:
        rows = ''.join(f'''
                <tr>
                  <td valign="top" style="width:34px;padding:0 0 14px 0;font-family:{SERIF};font-size:18px;color:#D2A23A;">{n}</td>
                  <td valign="top" style="padding:0 0 14px 0;font-family:{SERIF};font-size:16px;line-height:1.5;color:#CFC8B8;"><span style="color:#F3ECDC;">{a}</span> {b}</td>
                </tr>''' for n, (a, b) in zip(['I', 'II', 'III', 'IV'], steps))
        steps_html = f'''
          <tr><td style="padding:34px 44px 0 44px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#171A12;border:1px solid #2C2E25;border-radius:4px;">
              <tr><td style="padding:22px 24px 8px 24px;">
                <div style="font-family:{SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8C8679;padding-bottom:16px;">What happens next</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">{rows}
                </table>
              </td></tr>
            </table>
          </td></tr>'''
    direct = f' If the button doesn&rsquo;t open, use <a href="{href}" style="color:#D2A23A;text-decoration:underline;">this direct link</a>.' if button else ''
    return f'''<!doctype html>
<!-- Subject: {subject} -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>Overgrown Altar</title></head>
<body style="margin:0;padding:0;background:#0A0C0A;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0A0C0A;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#12150F;border:1px solid #2C2E25;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:0;background:#12150F;line-height:0;font-size:0;">
          <img src="{SITE}/images/email/{header}.jpg" width="560" alt="Overgrown Altar" style="display:block;width:100%;max-width:560px;height:auto;border:0;color:#F3ECDC;font-family:{SERIF};font-size:28px;letter-spacing:6px;text-align:center;">
        </td></tr>
        <tr><td style="height:1px;line-height:1px;font-size:0;background:#6B5A2E;">&nbsp;</td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td align="center" style="padding:38px 44px 0 44px;font-family:{SERIF};font-size:12px;letter-spacing:5px;text-transform:uppercase;color:#E9C77A;">{eyebrow}</td></tr>
          <tr><td align="center" style="padding:14px 40px 0 40px;font-family:{SERIF};font-size:38px;line-height:1.1;color:#F3ECDC;">{heading}</td></tr>
          <tr><td align="center" style="padding:18px 48px 0 48px;font-family:{SERIF};font-style:italic;font-size:19px;line-height:1.6;color:#CFC8B8;">{lines}</td></tr>{btn}{codebox}{steps_html}
          <tr><td style="padding:30px 44px 34px 44px;font-family:{SANS};font-size:12px;line-height:1.7;color:#8C8679;">{fine}{direct}</td></tr>
          </table>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
        <tr><td align="center" style="padding:26px 20px 0 20px;font-family:{SERIF};font-style:italic;font-size:15px;color:#8C8679;">We light the signal fires on the perimeter.</td></tr>
        <tr><td align="center" style="padding:12px 20px 0 20px;font-family:{SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;">
          <a href="{SITE}" style="color:#6E6A5E;text-decoration:none;">overgrownaltar.com</a>
          <span style="color:#3E3C35;">&nbsp;&middot;&nbsp;</span>
          <a href="{SITE}/guild/desk/" style="color:#6E6A5E;text-decoration:none;">Your Desk</a>
          <span style="color:#3E3C35;">&nbsp;&middot;&nbsp;</span>
          <a href="{SITE}/contact" style="color:#6E6A5E;text-decoration:none;">Contact</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
'''

link = lambda t: f'{SITE}/guild/desk/?token_hash={{{{ .TokenHash }}}}&type={t}'
B = lambda t: f'<span style="color:#F3ECDC;font-style:normal;">{t}</span>'

EMAILS = {
  'invite.html': dict(subject='A seat at the table: welcome to the Guild', preview='Your application has been read, and there is a seat for you at the table.',
    header='welcome', eyebrow='Welcome to the Guild', heading='Pull up a chair.',
    lines='Your application has been read, and there is a seat for you at the Inklings&rsquo; Table. Choose a password to open your Guild Desk.',
    button='Take your seat', href=link('invite'),
    steps=[('Choose your password.', 'The button above opens your Desk.'),
           ('Fill in My page:', 'your portrait, your craft, a few lines in your own words.'),
           ('Begin a piece.', 'Essays for The Watchtower, work for The Hearth, testimony for The Perimeter. Every piece is read by the Editor in Chief before it goes up.'),
           ('Join the conversation.', 'The Forum is open to members: pull up a chair in The Common Room and say hello.')],
    fine='This invitation was sent to {{ .Email }} and can be used once.'),
  'reset-password.html': dict(subject='A new key to your Guild Desk', preview='Choose a new password for your Guild Desk.',
    header='account', eyebrow='Your Guild Desk', heading='A new key.',
    lines='Someone asked to reset the password for your Guild Desk. If it was you, choose a new one below.',
    button='Choose a new password', href=link('recovery'),
    steps=[('Open the link', 'and choose a new password.'), ('You&rsquo;ll be taken straight to your Desk,', 'signed in.')],
    fine='If you didn&rsquo;t ask for this, you can ignore this email; your password stays as it is. This link was sent to {{ .Email }} and works once.'),
  'confirm-signup.html': dict(subject='Confirm your seat at the table', preview='Confirm your email to open your Guild Desk.',
    header='welcome', eyebrow='The Guild', heading='Confirm your seat.',
    lines='One step before the table: confirm this is your email, and your Guild Desk will open.',
    button='Confirm my email', href=link('signup'),
    fine='This was sent to {{ .Email }}. If you didn&rsquo;t ask to join the Guild, you can let this email pass.'),
  'magic-link.html': dict(subject='Your key to the Guild Desk', preview='A one-time link to sign in to your Guild Desk.',
    header='account', eyebrow='Sign in', heading='Your key to the Desk.',
    lines='Here is a one-time link to sign in to your Guild Desk. It works once, and only for a short while.',
    button='Open my Desk', href=link('magiclink'),
    fine='This was sent to {{ .Email }}. If you didn&rsquo;t ask to sign in, you can let this email pass; nothing changes until the link is used.'),
  'change-email.html': dict(subject='Confirm your new email address', preview='Confirm the new email address for your Guild Desk.',
    header='account', eyebrow='Your account', heading='A new address.',
    lines=f'You asked to change the email for your Guild Desk from {B("{{ .Email }}")} to {B("{{ .NewEmail }}")}. Confirm it, and sign in with the new address from then on.',
    button='Confirm the new address', href=link('email_change'),
    fine='If you didn&rsquo;t ask for this, don&rsquo;t open the link, and write to the editor.'),
  'reauthentication.html': dict(subject='Your Guild security code', preview='Your one-time code for the Guild Desk.',
    header='account', eyebrow='Security', heading='Your one-time code.',
    lines='Enter this code at your Guild Desk to confirm it&rsquo;s you. It works once, and only for a few minutes.',
    code='{{ .Token }}',
    fine='This was sent to {{ .Email }}. If you didn&rsquo;t ask for a code, someone may have your password: change it from your Desk, and let the editor know.'),
}

if __name__ == '__main__':
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    for name, args in EMAILS.items():
        open(os.path.join(here, name), 'w').write(frame(**args))
    print('built', len(EMAILS), 'emails')
