# Privacy Labels Mapping

This document maps all database tables and analytics events to store privacy declaration requirements.

## Data Collected & Linked to User
- **Account / Contact Info**: Email or phone (via authentication provider)
- **User Content**: Journal entries, chat turns with AI partner/coach, debrief transcripts
- **Identifiers**: User ID (UUID)
- **Diagnostics**: Crash logs, performance metrics (anonymized, stripped of message text)

## Analytics Events (Non-Linked)
- session_started
- step_completed
- session_completed
- moment_added
- checkin_done
- paywall_viewed
- purchase_started

All data is stored securely with Row Level Security (RLS) and can be exported or deleted via the in-app Privacy Centre.
