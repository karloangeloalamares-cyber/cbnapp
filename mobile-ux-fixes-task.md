# Mobile UX Fixes Task Tracker

This document tracks the findings and fixes from the recent Mobile UX review against the Claude skills guidelines.

## 🚨 Identified Issues to Fix
*(All identified UX issues have been mitigated!)*

## ✅ Completed Fixes
- [x] **MOB-UX-1 — Keyboard Handling in Authentication Forms**: Checked `LoginScreen.tsx` and `SignUpScreen.tsx`. Both natively implemented `returnKeyType="next"` and `onSubmitEditing` focus ref shifts.
- [x] **MOB-UX-2 — Lacking Clear Offline State Visibility**: Created an `<OfflineBanner />` component and implemented a global `@react-native-community/netinfo` listener above `MainNavigator.tsx`.
- [x] **MOB-UX-3 — Video Fullscreen Touch Target**: Increased the visual dimensions of the `<Video />` fullscreen button in `MessageCard.tsx` to iOS HIG minimum (44x44).

## Action Plan
- [x] Fix the Authentication Flow keyboard handling to make sign in/up smoother.
- [x] Fix the Video Fullscreen button in the Media Card so the touch target is strictly 44x44.
- [x] Add the global Offline Banner component context so when users lose signal, the app communicates it natively instead of blanking out.
