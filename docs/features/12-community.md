# Community

Leaderboards and challenges. The whole tab is switched off for now.

14 features, 0 live. Back to the [feature list](README.md).

## Community tab

A Community tab of friendly monthly challenges and leaderboards. The intro says first place wins 1 treatment credit and shows '1,000 members · N on the leaderboards'. The other people on the boards are made-up demo members. While the tab is switched off, it's missing from the tab bar, its address sends you Home, and no prizes or tie breakers run.

- **Where:** Community tab (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`, `lib/flags.ts`

## Leaderboards switch

Members choose whether to show on the boards, and the switch is off by default. When it's on, you appear as 'First L.' (first name, last initial) in every challenge. When it's off, nobody sees you, except in challenges you joined from a waitlist, but you still see where you'd rank. Wellness accounts see 'Challenges are for members' with a link to Account. Leaving a membership takes you off all boards and waitlists.

- **Where:** Community > top (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/store.tsx`

## Monthly challenges

Two challenges run all month. Class Count is most classes at either studio. Recovery Ritual is most therapies (cryo, sauna, red light, contrast, float, HBOT). Treatments never count. A visit counts once you've attended it.

- **Where:** Community > Active challenges (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `lib/community.ts`, `app/community/page.tsx`

## Weekly sprints

A short themed challenge runs each week of the month. Days 1–7: Early Riser Week (classes that start before 8 AM). Days 8–14: Stillness Week (sound bath, yin, restorative and breathwork classes). Days 15–21: Hot & Cold Week (sauna, cryo and contrast sessions). Day 22 to the end of the month: Weekend Warrior Week (classes and therapies on Saturday and Sunday).

- **Where:** Community > Active challenges (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `lib/community.ts`

## Challenge jump bar

A sideways row of chips at the top. First come challenges starting within the next 7 days (next month's included), showing the start date or '✓ On the waitlist'. Then the running ones, marked 'This week' or 'This month' with days left ('Last day' on the final day). Last is an 'All time' chip. Tapping a running chip scrolls to its card, and a coming-up chip opens its details.

- **Where:** Community > chip row (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`

## Challenge cards and leaderboards

Each running challenge has a card showing days left, a one-line standing ('You're #N of M with …', or 'you'd be #N' if your name is hidden) and the top 5. Tap the card for details: the dates, the rules, the prize, the top 10, and a 'Leave' button if you joined from the waitlist. People tied for 1st, 2nd or 3rd are grouped under 'Tied for 1st' and so on. Lower ties share a number. If you're below the cut-off, your own row appears after a gap.

- **Where:** Community > Active challenges > a card (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`

## Challenge waitlist

Members can join a coming-up challenge's waitlist from its chip, and leave it again. Joining enters you in that challenge and puts you on its board even if your leaderboards switch is off. With the switch on, it just says 'You're in'. A waitlist count is shown (a demo number plus you). Wellness accounts see 'Members can join'.

- **Where:** Community > a 'Coming up' chip (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/store.tsx`, `lib/community.ts`

## All-time leaderboard

Ranks every visit since a member's first booking, across every service, and never resets. It shows the top 10 and your standing: 'You're #N of M' if you're shown, 'You'd be #N … just for you' if you're hidden, or 'No visits yet. Your first one puts you on the board.'

- **Where:** Community > All-time leaderboard (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`

## Someone's stats pop-up

Tap anyone on any board to see their all-time visits and rank, the date they started, their classes, therapies, treatments and hours, and their visits by service.

- **Where:** Community > tap a name on a board (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`

## Challenge prizes and tie-breaker notices

The winner of each challenge (the monthly ones and the weekly sprints) gets 1 treatment credit added automatically, with a Home note "You won ...!". Only members can take part, and only in challenges that end after their membership started, so time on a Wellness account never counts; you're entered if your leaderboards switch was on by the challenge's last day or you joined its waitlist. A tied member gets a note to scan in and finish one more visit by a date to win, then a note on how the tie breaker ended, and leaving a membership takes you off all boards and waitlists. None of this runs while Community is switched off.

- **Where:** Community (switched off); credit and note land on Home
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `lib/community.ts`, `lib/flags.ts`, `lib/store.tsx`

## Tie breaker

If first place ends in a tie, the first of the tied people to check in and finish one more visit that counts, within 7 days after the challenge ends, wins the credit alone. If nobody does it in time, nobody wins. A tied person must still be a member to win. Tied members get a 'Tie breaker' card with days left and a 'Book it' link, plus Home notes when the tie breaker starts and when it's decided.

- **Where:** Community > Tie breaker (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`, `lib/store.tsx`

## Last month's results

During the first 7 days of a month, it shows the final results of last month's month-long challenges and its last weekly sprint (the ones that ended on the month's last day). Each shows the winner and score, or that it was tied with the tie breaker still open or unclaimed, or 'No entries', plus your own rank if you placed below 1st.

- **Where:** Community > Last month's results (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`

## Finished sprints this month

An 'Earlier this month' list of this month's finished weekly sprints and their winners. It's parked separately from the Community tab.

- **Where:** Community > Earlier this month (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/flags.ts`

## Cold Plunge Clock and plunge log

A monthly challenge for your best cold plunge, logged after a Contrast session you attended. You pick the session, then set the time with plus and minus buttons in 5-second steps, or quick picks of 0:30, 1:00, 2:00 or 3:00; times can be from 0:10 to 5:00, but the board counts at most 3:00, so everyone who reaches 3:00 shares first place. Each session can be logged once, during the challenge or within 2 days after the session, and the sample Community members come with past plunge times already filled in. It's parked separately from the Community tab and is switched off.

- **Where:** Community > Cold Plunge Clock > Log a plunge (switched off)
- **Status:** Hidden (switched off in lib/flags.ts)
- **Code:** `app/community/page.tsx`, `lib/community.ts`, `lib/flags.ts`, `lib/store.tsx`
