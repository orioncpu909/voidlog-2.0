# Referrals

Referral codes and referral credits.

3 features, 3 live. Back to the [feature list](README.md).

## Refer a friend card

Every account gets a personal referral link (artha.la/join?ref=CODE); the code is your first name plus 4 letters or digits and never changes. Tap the link or Copy to copy it ('Copied' shows for 2 seconds), or tap 'Share my link' to open the phone's share sheet with 'Join me at ARTHA. Sign up with my link:' (it copies the link instead if sharing isn't available). Paying members (Restore, Classic, Gold, not trials) are told they earn 1 treatment credit for each friend who signs up with the link and becomes a member, added automatically once that friend's first monthly payment goes through; everyone else is told that members earn the credit.

- **Where:** Profile > Refer a friend (bottom)
- **Code:** `app/profile/page.tsx`, `lib/referral.ts`

## Your referrals list

Once friends have signed up with your link, you see the total credits earned and each friend with a status: 'Member · +1 credit', 'Member · joined before you were a member', 'On a trial · credit after first month' or 'Signed up · not a member yet'.

- **Where:** Profile > Refer a friend > Your referrals
- **Code:** `app/profile/page.tsx`

## Referral credit reward

When a referred friend's first monthly membership payment goes through, the person who referred them automatically gets 1 treatment credit, once per friend, but only if they are a paying member (Restore, Classic or Gold, not a trial) at that moment. Trial and Wellness referrers get nothing for that friend, and it is not paid later. A note on Home and Account says "[Name] became a member with your referral link, so you've earned 1 treatment credit" (if several friends count at the same time, the note names them all and gives the total).

- **Where:** Automatic; note on Home and Account
- **Code:** `lib/referral.ts`, `lib/store.tsx`
