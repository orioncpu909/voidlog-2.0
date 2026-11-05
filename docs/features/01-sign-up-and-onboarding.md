# Sign-up & onboarding

Creating an account, the welcome walkthrough, and where a new person lands.

16 features, 16 live. Back to the [feature list](README.md).

## Welcome screen for new downloads

Someone who has just downloaded the app sees a full-screen welcome before anything else: the ARTHA wordmark over a photo, 'Move. Sweat. Freeze.', a line about booking at ARTHA West LA and Studio City, and the line 'Join 4,000 people. N joined this week.' The 4,000 is the demo figure of 1,000 members plus 3,000 Wellness Accounts. N is a made-up number between 29 and 41 that changes each week (about 35 sign-ups a week). There are two buttons, 'Create account' and 'I already have an account', and a footer reads 'Demo app: nothing you enter leaves this device.'

- **Where:** First app open (no account yet)
- **Code:** `components/SignUp.tsx`, `components/AppShell.tsx`

## Create account form

Asks for first name, last name, email, mobile phone, password and confirm password (all required), plus optional Instagram and referral code. It says up front it is free to join and you only pay when you book. Error messages show only after the first tap on "Create account", and each field turns red with its own message.

- **Where:** Welcome screen > Create account
- **Code:** `components/SignUp.tsx`

## Name checks

First and last name must each be filled in, at most 50 characters, letters only (accents, apostrophes, spaces, periods and hyphens allowed), and contain at least 2 letters. Extra spaces and invisible characters are cleaned out before saving.

- **Where:** Create account form > First name / Last name
- **Code:** `lib/validate.ts`, `components/SignUp.tsx`

## Email check

Email must look like name@example.com and be at most 254 characters; it is saved in lower case with spaces trimmed. If another account on the device already uses that email, it says "That email already has an account."

- **Where:** Create account form > Email
- **Code:** `lib/validate.ts`, `lib/store.tsx`, `components/SignUp.tsx`

## Mobile phone check

Must be a real 10-digit US number (a leading 1 is accepted and dropped). Area code and exchange can't start with 0 or 1, all-same-digit numbers are rejected, and only digits, spaces, +, parentheses, periods and dashes may be typed. A number already used by another account is refused. Hint text: "For booking reminders."

- **Where:** Create account form > Mobile phone
- **Code:** `lib/validate.ts`, `lib/store.tsx`, `components/SignUp.tsx`

## Optional Instagram handle

Accepts a handle with or without @, or a pasted instagram.com profile link (the link is trimmed down to the handle). Up to 30 letters, numbers, periods and underscores, no double periods and no period at the end. A handle already used by another account (not case sensitive) is refused.

- **Where:** Create account form > Instagram (optional)
- **Code:** `lib/validate.ts`, `lib/store.tsx`, `components/SignUp.tsx`

## Referral code at sign-up

Sign-up has an optional "Referral code" field that fills in automatically when someone opens the app from a friend's referral link. It accepts a code or a pasted link, in capital or small letters, and shows "Referred by [first name]" when it matches another account. An unknown code blocks sign-up with "We don't recognize that code. Check it, or leave it blank." A valid code links the new account to the person who referred them.

- **Where:** Create account form > Referral code (optional)
- **Code:** `components/SignUp.tsx`, `lib/referral.ts`, `lib/store.tsx`

## Password rules and strength meter

Password needs at least 12 characters, an uppercase letter, a lowercase letter, a number and a symbol, must not be one of the 10,000 most common passwords, and must score at least "Strong" (3 of 4) on a guessability check that also treats your name, email, Instagram and "artha" as easy to guess. A 4-bar meter labels it Very weak / Weak / Fair / Strong / Very strong and names the next thing to fix. The password is never saved.

- **Where:** Create account form > Password
- **Code:** `lib/password.ts`, `components/SignUp.tsx`

## Confirm password and show/hide

Confirm password must match exactly ("Passwords don't match." otherwise). A "Show password" / "Hide password" link reveals or hides both password boxes at once.

- **Where:** Create account form > Confirm password
- **Code:** `components/SignUp.tsx`

## Terms agreement checkbox

A required checkbox: "I agree to ARTHA's terms and cancellation policy." Sign-up is blocked with "Please agree to continue." until it is ticked.

- **Where:** Create account form, above the Create account button
- **Code:** `components/SignUp.tsx`

## Where a new sign-up lands

After a successful sign-up the person is put into the free Wellness sample account (with its visit history, streak and bookings) under their own name, email, phone and Instagram, and sent to the welcome walkthrough. No card is asked for at sign-up, but the sample account's made-up card (a Visa ending 4242) is already on file. The person also takes over the sample's history flags: the free 7-Day Trial and the first-visit price count as already used, so they can't start a trial or get the first-visit price. Each new sign-up reuses this same account, replacing the previous sign-up's details. The email, phone and Instagram are remembered so the same details can't sign up again, even after the demo restarts as a new download.

- **Where:** Create account form > Create account
- **Code:** `lib/store.tsx`, `components/SignUp.tsx`

## "I already have an account" sample picker

There is no real sign-in. This screen ("Welcome back") lists the sample accounts by first name and plan with a one-line plan summary; tapping one opens the app as that account.

- **Where:** Welcome screen > I already have an account
- **Code:** `components/SignUp.tsx`

## Onboarding walkthrough

A first-run walkthrough with a step indicator and Continue/Back buttons. Members locked to their home location get 2 steps (Welcome, Pricing); everyone else gets 3 (Welcome, Location, Pricing). The last button, "Start booking", marks onboarding done and opens the Book tab.

- **Where:** Shown automatically after sign-up, or for any account not yet onboarded
- **Code:** `components/Onboarding.tsx`, `components/AppShell.tsx`, `lib/store.tsx`

## Onboarding welcome step

Greets the person by first name, explains "Artha" means "the true meaning of life", shows three tiles (Move: Yoga, Pilates, HIIT, Sound Bath; Sweat: infrared sauna, red light; Freeze: cryo, cold plunge), suggests the ritual of class, then heat, then cold, and explains booking in three taps: pick, see your price, confirm with the free-cancellation time shown.

- **Where:** Onboarding > step 1
- **Code:** `components/Onboarding.tsx`

## Pick your home location

Choose West LA or Studio City (with addresses) as home; the selected one is highlighted with a check. It explains this is where the app opens by default, you can switch anytime, and a Wellness Account works at both. Skipped for plans locked to their home location.

- **Where:** Onboarding > step 2
- **Code:** `components/Onboarding.tsx`, `lib/store.tsx`

## Your prices step

Shows "Your free Wellness Account" (no monthly fee) or "Your [plan] membership" (classes at both locations, therapies and treatments at home), the full price list for your plan and home, and the cancellation rule: free up to 3 hours before a class or therapy, 12 hours before a treatment or contrast. Members with credits see "You have N treatment credits"; free accounts see any current specials with sale price, regular price crossed out, and end date.

- **Where:** Onboarding > last step
- **Code:** `components/Onboarding.tsx`
