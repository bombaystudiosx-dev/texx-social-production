# Texx Social

An open-source, Twitter/X-style social app built with Next.js (App Router), Tailwind CSS,
and **real Firebase** — Auth, Firestore, and Storage. No mocked backend: every post, like,
follow, and profile is a real read/write against your own Firebase project.

## Features

- Email/password and Google sign-in (Firebase Auth)
- Create posts with text + optional image upload (Firestore + Cloudinary)
- Real-time feed (Firestore `onSnapshot`)
- Likes with atomic counters (Firestore transactions)
- Follow/unfollow with atomic follower/following counts
- Public profile pages with a user's posts
- **Home feed** mixes real user posts with live public content from 9
  categories (Tech via Hacker News, Business, Music, Fashion, Food, Pets,
  Women's Lifestyle, Credit/Finance, AI Tools) so the feed is never empty —
  pulled live from legitimate public sources (`src/app/api/world/route.ts`),
  no login, key, or cost required. Every external item links back to its
  original source for attribution.
- **Explore page** (`/explore`): an Instagram-style grid of that same public
  content, with a filter drawer to narrow to specific categories.
  (Reddit was considered but left out: their Responsible Builder Policy
  requires explicit written approval for any commercial use of their data,
  which a free developer API key alone doesn't cover.)

## 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) and create a new project.
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore Database** → Create database (start in production mode).
4. **Storage** (optional) → requires the Blaze billing plan; skip if you'd
   rather not add a card — see step 2.
5. Project settings → General → "Your apps" → Add a **Web app** → copy the config.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the Firebase values from step 1:

```bash
cp .env.local.example .env.local
```

For image uploads without a Firebase billing card, this app uses
[Cloudinary](https://cloudinary.com)'s free tier instead of Firebase Storage:

1. Create a free Cloudinary account (no card required).
2. Settings → Upload → Upload presets → Add upload preset → set **Signing
   mode: Unsigned** → save.
3. Copy your **Cloud name** (dashboard home) and the preset name into
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
   in `.env.local`.

Without these two values, the image button in the composer is hidden and
posts are text-only — everything else still works.

## 3. Deploy security rules

This repo includes real Firestore and Storage rules (`firestore.rules`, `storage.rules`).
Deploy them with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage   # select your project, keep the existing rule file names
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data model

- `users/{uid}` — profile: username, displayName, bio, photoURL, counts
  - `users/{uid}/followers/{followerUid}`
  - `users/{uid}/following/{followingUid}`
- `posts/{postId}` — text, imageURL, author snapshot, counts, createdAt
  - `posts/{postId}/likes/{uid}`

## Notes

- This is an independent, from-scratch open-source project. It is not affiliated with,
  endorsed by, or a copy of any existing commercial social network's brand assets.
