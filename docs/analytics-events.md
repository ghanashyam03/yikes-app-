# Analytics Events Dictionary

## Privacy Architecture & Guarantees
yikes! operates under strict privacy and purpose limitation principles as defined in `docs/spec/06-data-safety.md`.
The analytics pipeline is built on the following non-negotiable guarantees:

1. **Zero Free-Text Properties**:
   - Under no circumstances is free-form text, prompt text, user input, chat message content, speech transcript, AI inner thoughts, or contact names permitted in any analytics event.
   - All string properties are strictly validated against finite literal enums or strict UUID patterns.
   - Any unlisted event name or unapproved property is rejected at schema validation time.
2. **Explicit Consent Gating**:
   - Analytics events are only emitted when the user has explicitly granted the `analytics` consent.
   - If consent is missing, false, or withdrawn, events are dropped immediately on device and never transmitted.
3. **Strict Schema Validation**:
   - Every event emitted by `track()` in `apps/mobile/src/features/analytics/tracker.ts` is validated through a Zod schema with `.strict()`.

---

## Allowed Events & Properties Dictionary

### 1. `session_started`
Fired when a user initiates a practice session or exercises a scenario.
- **Allowed Properties**:
  - `session_id` (`string`, UUID format): Unique practice session identifier.
  - `scenario_id` (`string`, enum: `'smalltalk_coffee' | 'meeting_standup' | 'boundary_setting' | 'elevator_pitch' | 'lunch_invite' | 'saying_no' | 'custom_scenario'`): Approved scenario identifier.
  - `mode` (`string`, enum: `'try' | 'warmup' | 'rehearsal' | 'free'`): Mode of session.

### 2. `step_completed`
Fired when an individual step within a session runner is completed.
- **Allowed Properties**:
  - `session_id` (`string`, UUID format): Unique practice session identifier.
  - `step_index` (`number`, integer 0–10): Step order index.
  - `step_type` (`string`, enum: `'read' | 'watch' | 'warmup' | 'try' | 'debrief'`): Step type.
  - `duration_seconds` (`number`, float >= 0): Seconds spent on step.

### 3. `session_completed`
Fired when the user finishes all steps or completes the session.
- **Allowed Properties**:
  - `session_id` (`string`, UUID format): Unique practice session identifier.
  - `scenario_id` (`string`, enum as above): Scenario practiced.
  - `turns_count` (`number`, integer >= 0): Number of conversation turns taken.
  - `duration_seconds` (`number`, float >= 0): Total elapsed seconds.
  - `completed_all_steps` (`boolean`): Whether all steps were completed.

### 4. `moment_added`
Fired when the user saves an upcoming real-world moment to prepare for.
- **Allowed Properties**:
  - `category` (`string`, enum: `'meeting' | 'social' | 'confrontation' | 'family' | 'dating' | 'work' | 'general'`): Category enum.
  - `has_reminder` (`boolean`): Whether a notification reminder was configured.

### 5. `prep_generated`
Fired when a prep card is created for a real-world moment.
- **Allowed Properties**:
  - `category` (`string`, enum: `'meeting' | 'social' | 'confrontation' | 'family' | 'dating' | 'work' | 'general'`): Category enum.
  - `is_custom` (`boolean`): Whether customized from an open template.

### 6. `checkin_done`
Fired when a social battery or micro-rep check-in is submitted.
- **Allowed Properties**:
  - `checkin_type` (`string`, enum: `'energy' | 'micro_rep'`): Type of check-in.
  - `energy_level` (`number`, optional, integer 1–5): Social battery energy rating.
  - `gap_forecast` (`number`, optional, integer 1–5): Predicted difficulty rating.
  - `gap_actual` (`number`, optional, integer 1–5): Actual experienced rating.
  - `gap_delta` (`number`, optional, number): Computed difference between forecast and actual.

### 7. `paywall_viewed`
Fired when a paywall sheet or subscription screen is rendered.
- **Allowed Properties**:
  - `placement` (`string`, enum: `'session_gate' | 'settings' | 'reply_helper_limit' | 'letter'`): Screen triggering paywall.
  - `current_plan` (`string`, enum: `'free' | 'plus'`): User's current plan at view time.

### 8. `purchase_started`
Fired when the user initiates a checkout flow.
- **Allowed Properties**:
  - `package_id` (`string`, enum: `'monthly' | 'annual'`): SKU chosen.
  - `placement` (`string`, enum: `'session_gate' | 'settings' | 'reply_helper_limit' | 'letter'`): Screen initiating purchase.

### 9. `purchase_completed`
Fired when an entitlement purchase or restore is confirmed.
- **Allowed Properties**:
  - `package_id` (`string`, enum: `'monthly' | 'annual'`): Purchased SKU.
  - `is_restored` (`boolean`): True if restored from previous transaction.

### 10. `ladder_rung_added`
Fired when a new step is added to the Quiet Ladder.
- **Allowed Properties**:
  - `rung_index` (`number`, integer >= 0): Index of rung on ladder.
  - `is_ai_suggested` (`boolean`): Whether the rung was accepted from an AI suggestion.

### 11. `ladder_rung_completed`
Fired when a ladder rung is marked as done.
- **Allowed Properties**:
  - `rung_index` (`number`, integer >= 0): Index of rung completed.

### 12. `weekly_letter_viewed`
Fired when the user views their Sunday weekly reflection letter.
- **Allowed Properties**:
  - `letter_id` (`string`, UUID format): Anonymous letter record ID.
  - `is_plus` (`boolean`): Whether full Plus version or free digest.

### 13. `reply_helper_used`
Fired when Reply Helper processes an incoming message.
- **Allowed Properties**:
  - `mode` (`string`, enum: `'paste' | 'screenshot'`): Input mode.
  - `replies_count` (`number`, integer 1–3): Number of suggested replies produced.

### 14. `consent_updated`
Fired when a user updates any privacy consent toggle.
- **Allowed Properties**:
  - `kind` (`string`, enum: `'analytics' | 'improve_ai' | 'marketing'`): Consent category.
  - `granted` (`boolean`): New state of consent.

### 15. `privacy_data_exported`
Fired when the user triggers a GDPR/DPDP data export archive.
- **Allowed Properties**: (None - empty object `{}`)

### 16. `privacy_text_deleted`
Fired when the user purges practice conversations and transcripts.
- **Allowed Properties**: (None - empty object `{}`)

### 17. `privacy_account_deleted`
Fired when the user deletes their account.
- **Allowed Properties**: (None - empty object `{}`)

### 18. `app_opened`
Fired when the app is brought to foreground.
- **Allowed Properties**:
  - `is_cold_start` (`boolean`): Whether fresh app launch or resumed.

---

## Prohibited Properties (Strictly Disallowed)
The following properties are **strictly banned** and rejected at runtime:
- `text`, `message`, `content`, `body`, `prompt`
- `transcript`, `dialogue`, `thought`, `reply`
- `user_input`, `note`, `description`, `quote`
- Any free-form user comments or names
