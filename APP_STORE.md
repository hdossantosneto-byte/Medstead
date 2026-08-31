# App Store — in progress, not live

The product is this Next.js company OS (Prisma, NextAuth, API routes). The iOS app is a Capacitor WebView shell (`com.medstead.app`, display name **MedStead**) that loads the hosted site. A static export cannot ship this app.

PWA (`public/manifest.json`) stays. It is not the App Store path.

## What Hairson still has to do

1. Enroll in the Apple Developer Program as **MEDSTEAD LLC** ($99 / year). This repo does not invent a Team ID or signing certificates.
2. Create the app in App Store Connect: name **MedStead**, subtitle **FASTER ACCESS. BETTER CARE.** Bundle ID `com.medstead.app`.
3. Put this same app on a live **HTTPS** URL. Set `CAPACITOR_SERVER_URL` to that origin (never bolt.host as production). Point `NEXTAUTH_URL` at the same host. Then on a Mac: `npx cap sync ios`.
4. Archive and upload from Xcode on a Mac. A Linux VM can generate and sync the iOS project; it cannot sign or submit.

Until step 3, Capacitor points at the documented placeholder `https://YOUR-LIVE-HTTPS-HOST.example`.

## Commands that work here

```bash
npx cap sync ios
```

Do not treat MTG Airlines as a live Part 135 carrier in store copy. No peptides or GLP-1 in the name or subtitle. No bank numbers, FEIN, or Florida document number.
