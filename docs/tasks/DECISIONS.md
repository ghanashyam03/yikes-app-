# yikes! — Architecture & Product Decisions

This document records the open product and technical decisions identified in the specification ([`docs/spec/06-data-safety.md`](../spec/06-data-safety.md#13-data-safety-and-v1-launch-scope)), along with the canonical default values and assumptions to be used across all build tasks (T-00 through T-27).

---

## Decision Log

### 1. Launch Market & Primary Language
- **Spec Reference**: Section 13 ("Launch market and language mix, which shapes characters, scenarios and model choices.")
- **Build Default**: **India, English first**.
- **Rationale & Scope**:
  - Initial personas, conversational scenarios, and cultural contexts are grounded in urban Indian professional and social settings (e.g., workplace syncs, networking tea/coffee, social gatherings).
  - Primary UI language and prompt system are English first, with natural Indian English conversational phrasing and idioms supported.
  - Emergency/crisis directory in [`docs/spec/crisis-resources.md`](../spec/crisis-resources.md) prioritizes verified Indian national hotlines (Tele-MANAS, Vandrevala Foundation, KIRAN).
  - Phone auth SMS support prioritizes Indian phone numbers (+91 format).

---

### 2. Streak Behavior vs. Rhythm Ring
- **Spec Reference**: Section 7 ("Rhythm, not streaks... A daily streak with freezes is available only if the user switches it on in Settings.") and Section 13 ("Whether to ship the optional streak at v1.")
- **Build Default**: **Streaks are OFF by default**.
- **Rationale & Scope**:
  - The default progression indicator is the **weekly rhythm ring** targeting the user's chosen weekly goal (2 to 5 sessions per week).
  - Missing a day or a week carries zero penalty, no guilt copy, and no streak freeze consumption by default.
  - An optional daily streak toggle exists in Settings (`D1. Settings` and `D2. Notification preferences`). If explicitly enabled by the user, streak tracking and freeze logic are activated.

---

### 3. Plus Subscription Pricing
- **Spec Reference**: Section 13 ("Price points for Plus.") and Section 16 ("Price points are an open decision; test in the launch market's local currency.")
- **Build Default**: **Placeholder token `[PRICE]`**.
- **Rationale & Scope**:
  - UI copy and subscription comparison surfaces (screens `D4. Subscription` and `D5. Paywall moment`) must display the placeholder string `[PRICE]` (or localized template `₹[PRICE]/month`) until live store SKUs and final market pricing are configured in RevenueCat.
  - Hardcoded monetary amounts must never be embedded in client source code.

---

### 4. Device Calendar Integration
- **Spec Reference**: Section 7 ("or pick events from their calendar if they choose to connect it (read-only, only the events they tick).") and Section 9 (`A14. Permissions, just in time`: "Calendar access appears only inside the Moments tab when a user taps Add from calendar.")
- **Build Default**: **Calendar connection is strictly optional**.
- **Rationale & Scope**:
  - Manual entry of Moments (what, who, when, how formal) taking under 15 seconds is the primary first-class path.
  - The app must never request calendar permissions upon onboarding or launch.
  - Calendar access permission is requested just-in-time only if the user explicitly taps "Add from calendar" in `C2. Add a Moment`.
  - When granted, calendar access is read-only, and only events explicitly selected by the user are imported.
