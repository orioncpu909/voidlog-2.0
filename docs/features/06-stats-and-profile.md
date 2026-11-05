# Stats & profile

The stats dashboard and the Profile page.

16 features, 16 live. Back to the [feature list](README.md).

## Stats page and headline numbers

Your stats page has four tiles: current streak, longest streak, total visits, and time in the sanctuary (in hours, to one decimal). Only visits you actually attended count, meaning booked, not cancelled, and already started. A streak is consecutive days with a visit, and it stays alive through today if your last visit was yesterday. The back arrow returns to whichever page opened Stats (Profile, Account or Home). Before your first visit it shows 'Your stats will show up here after your first visit' with a 'Book a visit' button.

- **Where:** Home > streak card, or Profile > Day streak, or Account > Stats row
- **Code:** `app/stats/page.tsx`, `lib/stats.ts`

## Visits-per-week chart

A bar chart of the last 8 weeks (Monday to Sunday), ending with this week. Tap a bar to see 'Week of [date]: N visits'. It also shows how many visits you've made this month.

- **Where:** Stats > Visits per week
- **Code:** `app/stats/page.tsx`, `lib/stats.ts`

## Visits by service

Bars show how many times you've done each service, most-visited first. A totals line underneath counts classes, therapies and treatments, plus events if you've been to any.

- **Where:** Stats > By service
- **Code:** `app/stats/page.tsx`, `lib/stats.ts`

## Favorite class and teacher

Shows the class you've attended most and the teacher or therapist you've booked most, each with how many times. Event hosts don't count.

- **Where:** Stats > favorites
- **Code:** `app/stats/page.tsx`, `lib/stats.ts`

## Stats visit history

A list of the visits you attended, newest first, with a 'Show all N' button after the first 5. Each row shows the date, the name, whether it was a class or event, the studio, the teacher, and 'Credit', 'Included' or the price paid.

- **Where:** Stats > Visit history
- **Code:** `app/stats/page.tsx`

## Stats summary on Account

A one-line Stats row on Account shows your streak, best streak, visits and hours (rounded), and tapping it opens the full Stats page. Before a first visit it reads 'Your streaks and visits show up here after your first visit.'

- **Where:** Account > Stats row
- **Code:** `components/StatsOverview.tsx`

## Profile header and plan badge

Profile has a back arrow to Home and a plan badge (Gold, Classic, Restore, Trial or Wellness) in the top right. Tap the badge to open your plan details.

- **Where:** Header avatar > Profile
- **Code:** `app/profile/page.tsx`

## Profile photo

Tap your picture to choose a photo from your camera roll or take one. It's cropped to a centered square and shrunk to 256px so it fits in the phone's storage. Once you have a photo, you can 'Change photo' or 'Remove'. A picture that can't be opened shows 'We couldn't open that picture. Try a different one.'

- **Where:** Profile > photo
- **Code:** `app/profile/page.tsx`, `lib/photo.ts`, `components/Avatar.tsx`

## Name, studio and member-since line

Shows your name, your Instagram handle if you've added one, and your home studio. A small line adds '[Plan] member since [month year]', or 'Trial ends [date]' during a trial, plus 'Visiting since [month year]' from your first attended visit.

- **Where:** Profile > top
- **Code:** `app/profile/page.tsx`

## Visit level

Members get a level based on total visits attended. You start at Level 1, and each milestone you pass adds a level: 10, 25, 50, 100, 250, 500 and 1,000 visits. The tile shows your visits and 'next level at N'. Wellness accounts see plain Visits and Hours tiles instead.

- **Where:** Profile > first tile
- **Code:** `app/profile/page.tsx`, `lib/profile.ts`

## Perks, credits or trial days tile

The second tile for members depends on the plan. Plans with monthly perks show 'Perks left: X of Y' and which ones remain, or 'Back on the 1st' once they're all used. A trial shows the days left. Other plans show your treatment credits, with '+N every month' or 'for treatments & HBOT'.

- **Where:** Profile > second tile (members)
- **Code:** `app/profile/page.tsx`

## Day streak row

Shows your current streak in days and your best streak, and tapping it opens Stats.

- **Where:** Profile > Day streak
- **Code:** `app/profile/page.tsx`

## Achievements

Members see a sideways row of 14 badges, each numbered by how many times you've done it: Cold-Blooded (cryo), Heat Seeker (infrared sauna), Hot & Cold (contrast), Weightless (float), Glow Getter (red light), Deep Breath (HBOT), Well Kneaded (treatments), Early Riser (classes before 8 AM), Night Owl (classes at 6 PM or later), Turn Up the Heat (heated classes), Sound Mind (sound baths), Double Up (days with 2+ visits), On a Roll (each full 7 days in a row; a 15-day streak counts as 2) and Both Studios (visits at your other studio). Badges you've earned come first, biggest counts first. The rest show a lock.

- **Where:** Profile > Achievements (members)
- **Code:** `app/profile/page.tsx`, `lib/profile.ts`

## Data highlights

For members, with a 1M (30 days), 3M (90 days) or All time toggle. Three rings show: days you came in (the share of days with a visit, counted from the start of the period or your first visit, whichever is later), your best week (most visit days in one Monday-to-Sunday week, out of 7), and days with recovery (the share of visit days that included a therapy or treatment). Streak numbers show your longest streak, most visits in one day, and days with 2+ visits. Records show your earliest and latest visit times, favorite class, most-booked teacher, credits used (not shown on trials) and perks used.

- **Where:** Profile > Data highlights (members)
- **Code:** `app/profile/page.tsx`, `lib/profile.ts`

## Activity summary

Everyone sees total visits for the chosen period (1M, 3M or All time), and each service with its time spent (in minutes, or hours once it's 60 minutes or more), its count and a bar, most-visited first. The top 5 show, with 'Show all N' for the rest.

- **Where:** Profile > Activity summary
- **Code:** `app/profile/page.tsx`, `lib/profile.ts`

## 'Members see more' teaser

Wellness accounts see a locked card saying members also get levels, achievements and data highlights, which links to Account. Before anyone's first visit, Profile instead shows 'Your activity shows up here after your first visit' with a 'Book a visit' button.

- **Where:** Profile > below Activity summary (Wellness accounts)
- **Code:** `app/profile/page.tsx`
