# Ratings & staff admin

Rating classes and events, private comments, and the staff admin page.

10 features, 5 live. Back to the [feature list](README.md).

## Rate your last class on Home

After a class or ticketed event ends, Home asks "How was [class] with [instructor]?" with its day, time and studio and 1 to 5 stars. Only the most recently ended one is asked about, only for 7 days after it ends, and only once. Free RSVPs and cancelled bookings aren't asked about. After rating it says thanks for 3 seconds, then disappears.

- **Where:** Home > rating card
- **Code:** `components/RateClass.tsx`, `lib/ratings.ts`, `app/page.tsx`

## Comment required for 3 stars or fewer

4 or 5 stars saves with one tap. 1 to 3 stars opens "What could have been better?" and the rating saves only after "Send rating" with at least 10 characters (up to 500).

- **Where:** Home > rating card > tap 1-3 stars
- **Code:** `components/RateClass.tsx`, `lib/ratings.ts`, `lib/store.tsx`

## "Not now" to skip a rating

An X button skips the question; skipping counts as an answer and that class is not asked about again.

- **Where:** Home > rating card > X
- **Code:** `components/RateClass.tsx`, `lib/ratings.ts`, `lib/store.tsx`

## Anonymous ratings promise

The card says all reviews are anonymous, and after rating, that comments are private and only the ARTHA team sees them, never who gave them. Members and guests never see ratings, averages or counts anywhere in the app.

- **Where:** Home > rating card
- **Code:** `components/RateClass.tsx`, `lib/ratings.ts`

## Guests can rate too

A guest using a guest pass can rate the class they booked on the pass. The question appears on that class's card on the guest page after the class ends, for up to 7 days. Same rules as members: 1 to 5 stars, once, and 3 stars or fewer needs a comment of at least 10 characters. Unlike members, guests have no 'Not now' button to skip it.

- **Where:** Guest page
- **Code:** `app/guest/page.tsx`, `components/RateClass.tsx`, `lib/store.tsx`

## Staff admin: ratings overview

A staff page "Class and event ratings" with filters for studio (Both studios, West LA, Studio City) and period (7 days, 30 days by default, All time). Tiles show the average stars, the number of ratings, and the share of class and event visits that were rated. Shows "No ratings for these filters yet" when empty. No staff sign-in yet.

- **Where:** Account > Demo > Open the staff admin (class ratings)
- **Status:** Staff only
- **Code:** `app/admin/page.tsx`

## Staff admin: stars breakdown

A bar chart of how many 5, 4, 3, 2 and 1 star ratings were given, with count and percentage for each.

- **Where:** Staff admin > Stars given
- **Status:** Staff only
- **Code:** `app/admin/page.tsx`

## Staff admin: by instructor and by class

Two tables listing each instructor (events grouped as "Events") and each class or event with average stars and number of ratings, most-rated first.

- **Where:** Staff admin > By instructor / By class or event
- **Status:** Staff only
- **Code:** `app/admin/page.tsx`

## Staff admin: private comments

Every comment left with a rating of 3 stars or fewer, newest first, with the class, instructor, day, time, studio and stars, never the member's name.

- **Where:** Staff admin > Comments
- **Status:** Staff only
- **Code:** `app/admin/page.tsx`

## Staff admin: latest ratings

The 25 newest ratings with class, instructor, day, time, studio and stars, noting "The 25 newest of N" when there are more. A "Member app" link goes back to Account.

- **Where:** Staff admin > Latest ratings
- **Status:** Staff only
- **Code:** `app/admin/page.tsx`
