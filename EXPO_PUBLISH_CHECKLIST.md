# CBN App Expo Publish Checklist (iOS + Android)

## Scope
This checklist is based on the current workspace state as reviewed on 2026-02-19.

## P0 Blockers To Resolve Before Submission
1. Remove and rotate sensitive credentials currently in repo.
- File: `cbn-app-305a2-firebase-adminsdk-fbsvc-6ec43b8455.json`
- Action: remove from app repository, rotate key, and move any server-only credentials to secure backend secrets.

2. Confirm production Supabase environment variables are set for Expo builds.
- Required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Action: set production values in EAS secrets/env and verify app is not pointed to staging/dev.

3. Apply and verify database schema/migrations in production Supabase.
- Files: `supabase/schema.sql`, `supabase/add_avatar_url.sql`, `supabase/add_video_url.sql`, `supabase/add_saved_items.sql`
- Action: ensure tables, indexes, RLS policies, triggers, RPC (`upsert_push_token`) and notification functions exist and work in production.

4. Deploy and verify push Edge Function.
- File: `supabase/functions/send-push/index.ts`
- Action: deploy function and set secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Action: validate admin-only auth path, token loading, and Expo push delivery end-to-end.

5. Configure Google OAuth for production redirect flow.
- File: `src/utils/AuthUtils.ts`
- Redirect used: `cbnapp://auth/callback`
- Action: add redirect URLs in Supabase Auth settings and Google Cloud OAuth client config.

## iOS Release Requirements
1. Apple setup.
- Active Apple Developer account.
- App Store Connect app created with bundle id `com.kalamares.cbnapp`.

2. Push notifications on iOS.
- Upload APNs key/cert in Expo credentials for the project.
- Validate token registration and notification open navigation in a physical iPhone build.

3. iOS permission metadata.
- Add/verify usage descriptions in app config for media access and notifications (photo library, camera/mic if used, notifications).

4. Build and distribution.
- Create production iOS build using EAS.
- Upload to TestFlight and complete external/internal tester pass.

## Android Release Requirements
1. Google Play setup.
- Create Play Console app with package `com.kalamares.cbnapp`.

2. Push notifications on Android.
- Confirm `google-services.json` is production-ready.
- Configure FCM credentials for Expo push in EAS project settings.

3. Build and distribution.
- Produce Android App Bundle (`.aab`) with EAS production profile.
- Upload to Internal testing track and validate install/update path.

## App Configuration Checks
1. Versioning and identifiers.
- Confirm `app.json` version and build number strategy before submission.
- Add/verify iOS build number and Android versionCode auto-increment strategy in EAS profile.

2. Runtime/update strategy.
- Decide OTA policy (EAS Update vs store-only updates) and configure runtime version policy accordingly.

3. Branding assets.
- Re-verify icon, adaptive icon, splash, and store listing assets are final.

## Code/UX Hardening Recommended Before Release
1. Remove debug/noisy logs from production paths.
- Current logs are present in auth, media upload, and video/image render flows.

2. Fix text encoding artifacts in UI strings.
- Example symptoms: malformed arrow/checkmark characters in multiple screens/components.

3. Validate admin/user role behavior end-to-end.
- Admin post creation, delete/edit flows, viewer counts.
- User reactions, saved items, notifications, push handling.

4. Validate media upload reliability on real devices.
- Large image/video paths, upload failures, fallback behavior.

5. Validate deep link routes.
- `cbnapp://...` routes for auth reset and notification navigation targets.

## QA Gate (Must Pass)
1. Authentication.
- Email/password signup/login/logout.
- Google sign-in on iOS and Android production builds.
- Forgot-password deep link reset flow.

2. Core feed behavior.
- News and announcements load/refresh.
- Reaction toggles and persistence.
- Save/unsave and Saved tab consistency.
- Long-press modal actions (copy/share/delete/edit role-specific).

3. Notifications.
- In-app notification list, unread badge updates, mark-read behavior.
- Push open-to-detail navigation for both news and announcement targets.

4. Profile/settings.
- Avatar update, display name update, dark mode persistence.

5. Stability.
- Cold start, background/foreground transitions, offline handling, and crash-free sanity pass.

## Suggested Pre-Publish Command Sequence
1. `npx tsc --noEmit --pretty false`
2. `npx expo-doctor`
3. `eas build --platform ios --profile production`
4. `eas build --platform android --profile production`
5. `eas submit --platform ios --profile production`
6. `eas submit --platform android --profile production`

## Nice-To-Have (Post-P0)
1. Add a formal CI pipeline for typecheck + build health checks.
2. Add crash/analytics instrumentation before broad rollout.
3. Add smoke E2E scripts for auth + posting + notifications.
