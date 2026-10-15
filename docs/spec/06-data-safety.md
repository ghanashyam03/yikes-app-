<!-- Source sections: 13, 16 -->
## 13. Data, safety and v1 launch scope

What the app collects. Everything the product needs to feel personal, and nothing else. This also keeps the app inside privacy law (India's DPDP Rules and GDPR both expect purpose limitation) and earns the trust a privacy-minded audience needs. Have a lawyer confirm obligations before launch.

Every user can export and delete from the Privacy centre. Staff access is role-based and logged.

Positioning. yikes! is skills practice and self-awareness, never treatment. Store copy and in-app words avoid clinical terms and claims such as treat, cure or therapy. The Coach never diagnoses.

Quality bar for AI output. Quotes are verified, JSON is validated, unsafe text is blocked, outputs are sampled by the judge model, and every message has a Was this fair? control. Weekly, the team reviews flagged messages and updates prompts.

v1 scope (what ships first)

Architecture in one paragraph. An Expo (React Native) app for iOS and Android; Supabase for accounts, database and row-level security; a small AI gateway service that routes each job to its model, validates output, applies safety checks, handles fallbacks and logs every call; RevenueCat for subscriptions; PostHog for opt-in analytics; Sentry for errors.

Open decisions. (1) Launch market and language mix, which shapes characters, scenarios and model choices. (2) Price points for Plus. (3) Whether to ship the optional streak at v1.

## 16. Reliability, cost control and pricing

AI gateway rules

One provider-neutral interface; model IDs and prompt versions pinned and logged on every call.

Timeouts of 8 seconds, one retry, then the backup model, then authored lines.

Per-user daily caps and a global request queue, so a burst never causes errors.

Cache everything reusable: Watch exchanges, Prep templates, Idea examples.

Cost and latency tracked per feature; a daily alert if cost per active user passes a set limit.

Check each provider's licence and terms before any real user touches it.

Cost shape. The costly calls are live chat turns and Coach feedback. Free users get a daily chat cap and limited Reply Helper uses; the cheap pieces (Idea, Watch, Read, Gap Game, Battery) cost almost nothing and stay unlimited.

Plans (starting hypothesis to test, not final)

Price points are an open decision; test in the launch market's local currency. Cancelling is one tap, and the paywall never appears during a chat, a Debrief or the support screen.
