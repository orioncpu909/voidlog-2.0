# Account & membership

The Account tab: plans, the trial, switching, cancelling, credits and contact.

33 features, 33 live. Back to the [feature list](README.md).

## Plan price list

A two-column grid of all eight prices for an account type: Classes, Cryo, Sauna, Float, Contrast, Red Light, HBOT, Treatments. For Restore it adds "1 free/mo, then" under the items with a monthly perk.

- **Where:** Membership page, plan sheet, onboarding, switch to Wellness
- **Code:** `components/PriceList.tsx`

## Plan and next-bill pop-up

Shows when you'll next be billed and for how much. During a trial: the day after it ends, with the first-month charge (the rest of that month, or a full first month for plans that are never prorated) minus your trial fee, then the monthly price on the 1st of every month. A cancelled trial or membership shows 'You won't be billed (again)' and says whether you go to a free Wellness Account or the account is deleted. Wellness shows 'No monthly bill: you pay for each visit when you book it.' Active memberships show the 1st of next month and the monthly price, plus which card is charged. Under that, 'What's included' lists the plan summary, 8 guest passes a month on monthly plans, and for plans tied to a home studio: classes at both locations, therapies and treatments at your home studio. A price list follows.

- **Where:** Profile > plan badge (top right)
- **Code:** `components/PlanSheet.tsx`, `lib/billing.ts`

## Account summary card

The top of the Account tab shows your name and email, your plan name, and its price line: "$X/mo · billed the 1st" for paid plans, "$29 for 7 days" for the trial, or "Free · pay per visit" for a Wellness Account. It also says where you can book: members get "Classes at both locations · therapies and treatments at [home studio]", and Wellness Accounts get "Book anything at West LA or Studio City". Your Instagram handle shows as a link if you added one. Members also see their treatment credit count (Gold adds "+1/month") and a "What credits cover" link.

- **Where:** Account tab > top card
- **Code:** `app/membership/page.tsx`

## Profile link from Account

A "Profile" link in the top card of the Account tab opens your profile page.

- **Where:** Account tab > top card > Profile
- **Code:** `app/membership/page.tsx`

## Restore monthly perks tracker

Restore members see 'This month's perks' on the Account card: four chips (class, sauna, cryo, massage). A chip reads '[perk] · 1 credit' while that perk is free this month and turns crossed out with 'used' once it's taken. Under the chips a line reads 'Then 25% off until next month (extra massages $125).' The card itself says nothing about cancelling. The rule still applies: a perk booking cancelled in time gives the perk back, a late cancel uses it up with no charge, and the booking's cancellation line reads 'To keep this month's included [perk], cancel by …'.

- **Where:** Account tab > top card (Restore only)
- **Code:** `app/membership/page.tsx`, `lib/store.tsx`

## Your plan's price list

Under the cards there is a section named after your current plan that lists what you pay for each service on that plan at your home studio.

- **Where:** Account tab > section titled with your plan name
- **Code:** `app/membership/page.tsx`

## Plans list and prices

Lists the plans you could move to: Restore $125/mo (1 massage, 1 sauna, 1 cryo and 1 class each month, 25% off everything else), Classic $199/mo (classes and cryo included, sauna $5, float/contrast/red light $19, treatments $125), Gold $299/mo (classes and all therapies included, plus 1 treatment credit every month), and the 7-Day Trial at $29. Your current plan is left out. The trial only appears for non-members who have never had one. Non-members see this list open under "Become a member". Members see it folded under "Explore other Memberships".

- **Where:** Account tab > Become a member (Wellness) or Explore other Memberships (members)
- **Code:** `app/membership/page.tsx`, `lib/data.ts`

## Monthly spend nudge

On a Wellness Account, if you have paid for any visits this month, the Become a member section shows 'You've spent $X on visits this month.' Membership and trial fees are not counted. Refunds and late-cancel fees are. Separately, whether or not you've spent anything, an account that already had its trial shows 'This account has already used its free 7-day trial.'

- **Where:** Account tab > Become a member (Wellness only)
- **Code:** `app/membership/page.tsx`, `lib/store.tsx`

## Join or switch plan confirmation

Tapping a plan opens a confirm sheet titled "Upgrade to [plan]" for non-members or "Switch to [plan]" for members. It shows the plan summary, a "You pay today" amount, a "You'd pay" price list for that plan, and "Then $X/month, billed the 1st, starting [the 1st of next month]". Paid plans are described as month-to-month and valid at your home studio. The buttons are "Confirm and pay $X" (or just "Confirm" if nothing is due) and "Not now".

- **Where:** Account tab > plans list > tap a plan
- **Code:** `app/membership/page.tsx`, `lib/membership.ts`

## Prorated first month

When a Wellness Account joins Classic or Gold partway through a month, it pays only for the days left, counting today. The sheet shows "Prorated: X of Y days left this month", and the full rate starts on the 1st. Restore is never prorated: it always charges the full $125, and the sheet says so. Joining on the 1st charges the full month. A member switching plans, or a trial member switching straight to a plan, pays the new plan's full monthly price today.

- **Where:** Account tab > plans list > confirm sheet
- **Code:** `lib/membership.ts`, `app/membership/page.tsx`, `lib/store.tsx`

## Welcome and switching credits

Joining Restore, Classic or Gold gives 4 welcome treatment credits, once per account ever, even if you leave and rejoin. Gold's monthly credit is added straight away too, so joining Gold from a Wellness Account gives 5 credits at once (4 + 1), and Gold gets 1 more on each 1st. Switching between paid plans keeps your credits plus any extra monthly credit the new plan adds (Classic to Gold gives +1) and keeps your join date, so the 5-day refund window doesn't restart; moving from a trial straight to a plan (or a trial converting at its end) sets a new join date and a fresh 5-day window. Only a Wellness Account joining gets the note 'You're now a [plan] member. $X was charged today for the rest of this month, then $Y/month from the 1st.' (the 'rest of this month' part only when the charge was prorated); a member or trial switching plans gets no note. Joining from a free account charges the rest of this month for Classic or Gold, or a full month for Restore or when joining on the 1st.

- **Where:** Account tab > after confirming a plan
- **Code:** `lib/store.tsx`

## Start the 7-day trial

A non-member who has never had a trial can start one for $29; each account gets one trial, ever, and starting it sets treatment credits to 0. The trial lasts until the end of the 7th day, counting the start day as day 1. Trial prices: classes and cryo included, sauna $5, float $5, contrast $19, red light $69, HBOT $200, treatments $125, with no late-cancel fees. The confirm sheet explains that after 7 days the trial becomes Classic ($199/month) automatically, unless you pick Restore or Gold or cancel.

- **Where:** Account tab > Become a member > 7-Day Trial
- **Code:** `app/membership/page.tsx`, `lib/data.ts`, `lib/store.tsx`, `lib/trial.ts`

## Trial countdown card

While on the trial, a card shows "X days left" (or "Ends today") and the exact end time. It says which membership starts automatically next, at what monthly price, and that your $29 trial fee counts toward the first month. A Cancel trial button is always on the card.

- **Where:** Account tab > trial card (trial only)
- **Code:** `components/TrialCard.tsx`

## Choose what the trial becomes

Under "After your trial", the trial member picks Restore ($125/mo), Classic ($199/mo, marked "default") or Gold ($299/mo). If they never pick, it becomes Classic.

- **Where:** Account tab > trial card > After your trial
- **Code:** `components/TrialCard.tsx`, `lib/trial.ts`

## Trial converts to a membership

When a 7-day trial ends without being cancelled, the account becomes the plan the member picked, or Classic if they never picked. The card is charged that plan's rate from the day after the trial ends to the end of that month, minus the $29 trial fee and never less than $0; Restore is never prorated, so it charges the full $125 minus $29. Welcome credits are added if the account never had them (once per account), plus the plan's monthly credits, and a note on Home and Account says "Your 7-day trial ended, so you're now a [plan] member ($X/month). Your $29 trial fee went toward your first month." The app checks for this when it opens and once a minute.

- **Where:** Automatic at trial end; note on Home and Account
- **Code:** `lib/store.tsx`, `lib/trial.ts`

## Cancel trial

"Cancel trial" opens a sheet saying you won't be charged for a membership and can keep using the trial until its end time. You choose what happens when the trial ends: "Switch to a free Wellness Account" (the default) or "Delete my account". The buttons are "Cancel trial" and "Keep my trial". The same sheet also opens from the trial row on Home.

- **Where:** Account tab > trial card > Cancel trial (also Home trial row)
- **Code:** `components/TrialCard.tsx`, `lib/store.tsx`

## Trial cancelled card and undo

After cancelling, the trial card says "Trial cancelled · X days left", says you won't be charged, and says whether the account becomes a free Wellness Account or is deleted once the trial ends. "Changed your mind? Keep my trial" undoes the cancellation.

- **Where:** Account tab > trial card (after cancelling)
- **Code:** `components/TrialCard.tsx`, `lib/store.tsx`

## Cancelled trial end

When a cancelled trial ends, it does what the member chose. With the free-account option it becomes a free Wellness Account with no credits and the note "Your trial has ended. You weren't charged for a membership, and you're now on a free Wellness Account." With delete, the account is removed, upcoming bookings are cancelled and what was paid for them is refunded, and a goodbye screen explains it.

- **Where:** Automatic at trial end
- **Code:** `lib/store.tsx`

## Cancel membership button

Paying members (Restore, Classic, Gold) see a "Cancel membership" button at the bottom of the Account tab. It is hidden for trials and once a cancellation is already scheduled.

- **Where:** Account tab > bottom
- **Code:** `components/MembershipCard.tsx`

## 5-day full refund

If a paying member cancels within 5 days of joining and hasn't used the membership, the most recent membership payment is fully refunded and the membership ends right away; trials can't be cancelled this way. "Used" means you attended a visit since joining, or a treatment credit (or Restore's monthly massage) is on a booking, even an upcoming one; bookings cancelled in time don't count. You then either drop to a free Wellness Account with no credits (your bookings are kept) or, if you chose delete, the account is deleted at once. A note confirms the refund amount.

- **Where:** Account tab > Cancel membership
- **Code:** `components/MembershipCard.tsx`, `lib/membership.ts`, `lib/store.tsx`

## Cancel after 5 days or after use

After the first 5 days, or sooner if you have used the membership, there is no refund. Nothing more is charged, and you keep full access, member prices and your calendar until the last day of the month. Then you move to a free Wellness Account. The sheet tells you which case applies: "You've already used your membership" or "It's past your first 5 days".

- **Where:** Account tab > Cancel membership
- **Code:** `lib/membership.ts`, `lib/store.tsx`, `components/MembershipCard.tsx`

## Keep a free Wellness Account offer

The cancel sheet includes a "Before you go" box offering a free Wellness Account: no monthly fee, pay as you go at both studios, get every new special, and keep your calendar, bookings and stats. Its button reads "Refund and switch to Wellness" inside the refund window, or "Switch to Wellness Account" after it. "Keep my membership" closes the sheet.

- **Where:** Account tab > Cancel membership sheet
- **Code:** `components/MembershipCard.tsx`

## Delete account

"No thanks, delete my account" opens a second confirm. Inside the refund window, the membership is refunded and the account is deleted now. Otherwise you keep your plan until the end of the month, then the account is deleted, and you can change your mind until then. Upcoming bookings are cancelled and refunded. History, stats and unused credits are removed with the account. The buttons are "Delete my account" and "Back".

- **Where:** Account tab > Cancel membership > No thanks, delete my account
- **Code:** `components/MembershipCard.tsx`, `lib/store.tsx`

## Goodbye screen

When the account you are using is deleted (at the end of a trial or membership, or straight away when cancelling inside the 5-day window), the whole app shows "Goodbye, [first name]" with a short reason, for example that the membership ended and you won't be charged again, or the refund amount if you cancelled within 5 days. A "Back to the demo" button returns to the app.

- **Where:** Full screen after an account is deleted
- **Code:** `lib/store.tsx`

## Membership cancelled card and undo

Once a cancellation is scheduled, a card shows "Membership cancelled · Active until [date]", says you won't be charged again, that you keep full access until then, and what happens next: a free Wellness Account or deletion. Until the month ends, "Changed your mind? Keep my membership" undoes the cancellation (clearing the end date and any deletion), and if deletion is scheduled, "Keep a free Wellness Account instead" keeps just the account, so the membership still ends but the account becomes Wellness. The same undo is on the Home row, and a cancelled trial can likewise be kept.

- **Where:** Account tab (after cancelling)
- **Code:** `components/MembershipCard.tsx`, `lib/store.tsx`

## Membership end switch-over

A membership cancelled after the 5-day refund window runs to the end of the paid month. Then it becomes a free Wellness Account: credits are reset to 0, the member is taken off Community boards, and a note says "Your membership has ended and you're now on a free Wellness Account. Your calendar and bookings are still here." If delete was chosen instead, the account is removed and upcoming paid bookings are refunded. Bookings for dates after the end are priced at Wellness prices, and treatment credits can't be used on those dates.

- **Where:** Automatic at month end
- **Code:** `lib/store.tsx`

## Switch to Wellness Account tile

A dashed "Wellness Account · Free" tile at the end of the plans list lets any member or trial move to pay-as-you-go. It follows the same rules as cancelling. Inside the refund window, the membership ends now and the refund amount is shown. Otherwise you keep the plan to month end. A trial runs to its end date and won't become a membership. The sheet warns that unused treatment credits and monthly perks end with the membership, and shows Wellness prices. Once a switch is scheduled, the tile shows "Scheduled" and the switch date.

- **Where:** Account tab > plans list > Wellness Account
- **Code:** `components/SwitchToWellness.tsx`, `lib/store.tsx`

## What treatment credits cover

A sheet explains that one credit covers one session of anything members pay $125 for: every treatment, plus Hyperbaric Oxygen. It lists those services for each studio. It explains that members get welcome credits when they join (plus 1 a month on Gold), and that Restore's monthly massage is a separate perk. A covered booking applies the credit automatically for $0, and you can untick it to pay instead. Cancelling in time gives the credit back, while a late cancel or no-show uses it up. Classes and therapies are not covered. It shows your credit count, or tells Wellness Accounts that credits come with a membership.

- **Where:** Account tab > What credits cover (also Home and Book)
- **Code:** `components/CreditsInfo.tsx`

## Contact us

A folded 'Contact us' section lists both studios: ARTHA West LA (12121 Olympic Blvd, Los Angeles, 424.317.0005, email westedge@artha.la) and ARTHA Studio City (12169 Ventura Blvd, Studio City, 818.856.8238, email studiocity@artha.la). Each has a tap-to-call phone number and an 'Email this studio' button, which members and trials only see for their home studio. Membership questions go to membership@artha.la.

- **Where:** Account tab > Contact us
- **Code:** `app/membership/page.tsx`, `lib/data.ts`

## Email a studio

An in-app email form that always shows which studio it goes to, with its email and address. Members and trials can only email their home studio, so the other studio's button is hidden. Wellness Accounts can switch between studios. You pick a topic (Booking question, Membership, Feedback, Something else), add an optional subject and a message of at least 5 characters, then tap "Send to [studio]". It then says the message is ready and offers "Open in my email app", prefilled with your name and phone. A demo note says nothing is sent from the app yet.

- **Where:** Account tab > Contact us > Email this studio (also on Book details)
- **Code:** `components/EmailStudio.tsx`

## Cancellation policy section

Inside Contact us: classes and therapies are free to cancel until 3 hours before, and treatments and contrast until 12 hours before. A late cancel or no-show is charged what the service costs at that time, and a credit-paid booking uses up the credit. Trial members see "no charge during your trial" instead. It also asks you to arrive 5 minutes early, with no phone calls and inside voices.

- **Where:** Account tab > Contact us > Cancellation policy
- **Code:** `app/membership/page.tsx`

## Automatic checks on open and every minute

Each time the app opens, every minute while it is open, and on pull-to-refresh, the app applies anything that is due: ended trials, ended memberships, monthly renewals and referral rewards. It also removes guest passes still waiting to be claimed if the sender is no longer a paying member. Each change happens only once.

- **Where:** Runs in the background
- **Code:** `lib/store.tsx`

## Members can't change home studio

Nowhere in the app can a member (Trial, Restore, Classic or Gold) change their home studio. The onboarding location step is skipped for them, and in Book their studio switch only changes the Classes list. Only Wellness Accounts change their home studio, from the studio switch in Book or during onboarding. A Wellness Account that joins a plan is tied to whatever studio is set at that moment, and the join sheet says the plan is 'valid at [that studio]'.

- **Where:** Book tab studio switch; Onboarding > Pick your home location; Account > join a plan
- **Code:** `app/book/page.tsx`, `components/Onboarding.tsx`, `lib/store.tsx`, `app/membership/page.tsx`
