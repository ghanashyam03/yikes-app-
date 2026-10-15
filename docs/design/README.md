# yikes! — Design Screen Library & Implementation Guide

This document serves as the implementation bridge between the visual screen designs located in `docs/design/` and the formal design system specified in [`docs/spec/04-design-system.md`](../spec/04-design-system.md).

> [!IMPORTANT]
> **Source of Truth Rule (AGENTS.md #3)**: The screen designs in `docs/design/` represent the primary visual reference. Refine them; do not copy flaws. If any visual asset conflicts with `docs/spec/04-design-system.md`, **the specification wins**. Implementers must resolve all differences in favour of the specification.

## Systemic Differences Across Assets vs. 04-design-system.md

The SVG screen library contains 74 vector mockups (`390x844`). Because these files are static graphic exports, implementers must account for the following systemic discrepancies when translating SVGs into code:

1. **Dual Theme Support (Light & Dark Mode)**: 72 of the 74 SVGs depict only the light Daylight palette (`#F7F1E9` background). Only `A01` (Launch) and `C05` (Pocket card) are dark. The spec strictly mandates first-class light AND dark mode support for every screen (Daylight and Midnight palettes with 300ms crossfade).
2. **Continuous Squircles vs. Standard Radii**: The SVGs use standard SVG `rx`/`ry` fillets. The spec requires continuous squircle curvature: 28px for cards, 36px for bottom sheets, and full pills (9999px) for buttons/chips.
3. **Glossy Bead Depth Layering**: Surfaces in the SVGs frequently display flat borders or generic drop shadows. The spec specifies a 3-layer depth hierarchy (base, surface, floating) where every surface features a 1px top-left inner highlight (`rgba(255,255,255,0.6)` in light, `rgba(255,255,255,0.12)` in dark) resembling a glossy pebble.
4. **Asymmetry and Card Tilt**: In the SVGs, all cards and bento tiles are placed at 0 degrees. The spec explicitly requires purposeful asymmetry: large left-aligned headlines, varied tile spans, and selected sticker cards tilted at 1.5 degrees so layouts feel editorial.
5. **No Default Values on Sliders**: Several SVGs render slider thumbs at the midpoint (50%) for visual demonstration. The spec strictly mandates: rating and scale sliders have NO default value (`value = null` until first touch) and the thumb inflates dynamically from the track.
6. **Physical Touch and Spring Dynamics**: SVGs are static. The spec requires physical feel: every tap squishes to 94% with spring overshoot (stiffness 300, damping 26 for playful, 30 for calm), 180ms tap timings, and UI-thread execution via Reanimated worklets.
7. **No Red for Errors**: SVGs must never be adapted to red alert colors. Spec Rule 1 requires Honey amber (`#E6C278`) for all error and pivot states.
8. **Accessibility & Hitboxes**: All interactive touchables (links, chips, icons) must provide a minimum 48x48pt touch target, pass WCAG AA contrast in both themes, and support dynamic type scaling to 200% without clipping.

## Category Overviews

### Category A · Onboarding & Account (A01 – A16)
This category encompasses the launch screen, welcome carousel, 14-question personalization quiz, deeper profile option, 4-turn warm-up chat, Coach baseline read, Playbook reveal, and account creation/auth flows. Implementers must ensure that guest progress is cached locally for 7 days without requiring immediate account creation. Sliders in quiz screens must have no default value, and age verification must strictly confirm 18+ status without storing a birth year.

### Category B · Core Session Loop (B01 – B13)
This category defines the daily core engagement loop: the Today home bento, the curved Path curriculum map, and the 6 beats of a session (Idea, Watch, Read, Try, Coach, Out there) through completion and Take it easy mode. Implementers must enforce that every Coach quote matches the user's transcript verbatim, partner typing indicators are character-coloured, and no countdown timers, XP, or points are ever displayed.

### Category C · Moments, AI Tools & Progress (C01 – C18)
This category covers real-world event preparation, rehearsal, the high-contrast Pocket card, Social Battery energy tracking, Debrief chat, micro-rep check-ins, Free chat, Reply Helper, You tab, Growth Journal, Weekly Letter, Skill detail, Gap Game line charts, and the Quiet Ladder. Implementers must ensure that Reply Helper screenshots are never persisted unless explicitly saved, battery gauges implement fluid liquid sloshing animations, and Gap Game calculations cleanly highlight prediction vs reality deltas.

### Category D · Settings, Safety & System States (D01 – D14)
This category covers system configuration, notification preferences, privacy centre data controls, subscription comparison, the paywall sheet, help/feedback, AI transparency, the emergency Support screen, and system fallback states (offline, busy, daily limit, welcome back, empty, error). Implementers must ensure that the Support screen shows zero AI-written text, the paywall is never triggered during chat or crisis states, and subscription pricing utilizes the `[PRICE]` placeholder token.

## Screen-by-Screen Reference (74 Screens)

### `A01`: Launch (`a01-launch.svg`)
The initial splash/launch screen displaying the dark Midnight background with the serif yikes! wordmark and the subtle Wince squint glyph fading in amidst an ambient glow. **Visible differences from spec**: The SVG shows a static backdrop; the spec requires a drifting ambient glow bubble backdrop that animates smoothly on the UI thread and halts when Reduced Motion is enabled.

### `A02`: Welcome (`a02-welcome.svg`)
The three-beat onboarding welcome carousel introducing private rehearsal, the Inner Voice post-chat reveal, and real-world micro-steps, anchored by an Ember start button and sign-in link. **Visible differences from spec**: The SVG is rendered only in Daylight mode, lacks squircle continuous card radii (28px), and shows static carousel pagination dots without gesture-driven swiping or spring squish on the primary Ember button.

### `A03`: Quiz intro (`a03-quiz-intro.svg`)
The quiz introduction screen setting expectations for the 3-minute personalization questionnaire, presenting three preview tiles (pace, first steps, Coach tone) and the Begin CTA alongside a skip option. **Visible differences from spec**: Rendered in static light mode only; preview tiles lack the 1px top-left glossy bead highlight, and touch targets on the skip link require expansion to satisfy the 48pt accessibility rule.

### `A04-Q01`: Quiz question 01 (`a04-q01-quiz-question-01.svg`)
Personalization quiz question screen 01 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q02`: Quiz question 02 (`a04-q02-quiz-question-02.svg`)
Personalization quiz question screen 02 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q03`: Quiz question 03 (`a04-q03-quiz-question-03.svg`)
Personalization quiz question screen 03 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q04`: Quiz question 04 (`a04-q04-quiz-question-04.svg`)
Personalization quiz question screen 04 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q05`: Quiz question 05 (`a04-q05-quiz-question-05.svg`)
Personalization quiz question screen 05 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q06`: Quiz question 06 (`a04-q06-quiz-question-06.svg`)
Personalization quiz question screen 06 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q07`: Quiz question 07 (`a04-q07-quiz-question-07.svg`)
Personalization quiz question screen 07 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q08`: Quiz question 08 (`a04-q08-quiz-question-08.svg`)
Personalization quiz question screen 08 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q09`: Quiz question 09 (`a04-q09-quiz-question-09.svg`)
Personalization quiz question screen 09 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q10`: Quiz question 10 (`a04-q10-quiz-question-10.svg`)
Personalization quiz question screen 10 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q11`: Quiz question 11 (`a04-q11-quiz-question-11.svg`)
Personalization quiz question screen 11 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q12`: Quiz question 12 (`a04-q12-quiz-question-12.svg`)
Personalization quiz question screen 12 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q13`: Quiz question 13 (`a04-q13-quiz-question-13.svg`)
Personalization quiz question screen 13 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A04-Q14`: Quiz question 14 (`a04-q14-quiz-question-14.svg`)
Personalization quiz question screen 14 presenting a single targeted diagnostic prompt with thin progress bar, contextual rationale note, and thumb-zone response inputs (chips, scales, or time wheels). **Visible differences from spec**: The SVG depicts static unpressed states (and in scale questions, visual thumbs); the spec mandates that rating sliders have strictly no default value until first touch, chips require soft tick haptics with glow, and cards must use 28px squircles in both light and dark modes.

### `A05`: Optional deeper profile (`a05-optional-deeper-profile.svg`)
The skippable deeper profile invitation card offering 8 optional sociability and pressure statements to calibrate starting difficulty without assigning diagnostic labels. **Visible differences from spec**: Rendered without dark mode representation; the secondary action button requires a dashed outline when disabled and full pill geometry, while the card container must implement 28px squircle corners with top-left bead highlight.

### `A06`: Warm-up chat (`a06-warm-up-chat.svg`)
The 4-turn baseline warm-up chat with an AI practice partner featuring suggested response chips, free text input, pass button, and reassurance copy. **Visible differences from spec**: The SVG illustrates static chat bubbles; the spec specifies partner-coloured typing indicators on turn 3, Lilac user bubbles, Honey error states (never red), and 48pt touch targets for suggested response chips.

### `A07`: Coach's first read (`a07-coach-s-first-read.svg`)
The Coach first read bento screen displaying personalized baseline observations, identified conversational strengths, and an initial voice rewrite. **Visible differences from spec**: The SVG does not reflect the Lilac pulse animation on the Coach avatar during generation or skeleton line fallbacks; tiles lack 1px top-left glossy highlights and must support dark Midnight styling.

### `A08`: Your Playbook reveal (`a08-your-playbook-reveal.svg`)
The Playbook reveal payoff screen assembling personal pace, battery dynamics, hardest conversational environments, initial micro-steps, and Coach tone into glass tiles with an Ember save button. **Visible differences from spec**: Rendered in static Daylight mode; the spec requires a slow cinematic tile assembly animation with spring overshoot, edit pencil icons with 48pt hitboxes, and dark mode theme tokens.

### `A09`: Create account (`a09-create-account.svg`)
The account creation screen offering Apple, Google, email, and phone options to persist guest progress, accompanied by privacy assurance copy. **Visible differences from spec**: Third-party auth buttons use generic vector rectangles; the spec requires full pill buttons with spring squish to 94% on press, 180ms interaction duration, and Midnight palette support.

### `A10`: Email or phone entry (`a10-email-or-phone-entry.svg`)
The email or phone input screen with prominent numeric/text field, auto-focus keyboard layout, and inline validation messaging. **Visible differences from spec**: Input box uses standard SVG border strokes; the spec mandates 3px Lilac focused ring with 2px offset, full accessible input labels, and dark mode background elevation tokens.

### `A11`: Code entry (`a11-code-entry.svg`)
The 6-digit one-time passcode verification screen with auto-advancing input cells, resend countdown timer, and remaining attempts indicator. **Visible differences from spec**: The SVG shows a static numeric grid; the spec requires a gentle shake animation and Honey-toned alert on mismatch (strictly never red), automatic suggestion autofill, and 15-minute lockouts after 5 failed attempts.

### `A12`: Consent (`a12-consent.svg`)
The granular privacy consent screen with four independent glass toggle cards (Required, Analytics, Improve AI, Tips) and explanatory detail sheets. **Visible differences from spec**: Toggles are shown in static states without haptic feedback; the spec mandates explicit 1px top-left inner highlights on cards, 48pt toggle touch hitboxes, and full light/dark theme adaptation.

### `A13`: Age confirmation (`a13-age-confirmation.svg`)
The adult age verification screen featuring a birth-year selection wheel that enforces the 18+ requirement while storing no birth date. **Visible differences from spec**: Selection wheel lacks native inertia and haptic tick feedback; implementers must ensure no birth date is written to state or database, and provide Midnight mode styling.

### `A14`: Permissions, just in time (`a14-permissions-just-in-time.svg`)
The just-in-time permissions explanation screen demonstrating sample notification cards before triggering system permission dialogues. **Visible differences from spec**: The sample notification preview lacks squircle corner curves; the primary CTA requires Ember gradient pill styling with spring overshoot upon press.

### `A15`: Passkey offer (`a15-passkey-offer.svg`)
The post-login passkey prompt offering biometric Face ID/fingerprint authentication for subsequent logins via a bottom sheet. **Visible differences from spec**: The sheet uses standard rounded corners; the spec requires a 36px squircle sheet radius with glass backdrop blur and drag-to-dismiss gesture handling.

### `A16`: Returning sign-in (`a16-returning-sign-in.svg`)
The returning user sign-in sheet supporting passkey biometric auto-trigger, OAuth providers, and passcode recovery links. **Visible differences from spec**: Static presentation does not show automatic biometric launch; button hitboxes must meet 48pt minimums, and sheet edges must follow 36px squircle geometry in both modes.

### `B01`: Today — Home (`b01-today-home.svg`)
The Today home bento dashboard displaying personalized greeting, battery level, weekly rhythm ring, hero Next session card, Moment tile, and check-in prompt. **Visible differences from spec**: Tiles are uniformly aligned at 0 degrees; the spec specifies bento layout with generous gaps, optional 1.5-degree sticker tilt on evidence cards, pull-to-refresh skeleton loading, and full dark Midnight support.

### `B02`: Path (`b02-path.svg`)
The Path curriculum map rendering sequential skill nodes along a curved progression line with growth stage rings (Starting, Practicing, Growing, Natural). **Visible differences from spec**: The SVG shows a static vector path; the spec mandates interactive node tap expansion into 36px bottom sheets, dimmed but visible locked nodes, header Gap trend sparklines, and 48pt touch targets.

### `B03`: Session intro (`b03-session-intro.svg`)
The session intro card detailing skill name, scene context (character and setting), 6-beat progress tracker, and Begin button. **Visible differences from spec**: The card is shown flat; spec requires full-screen expansion from the tapped node, continuous 28px card squircles, 1px top-left glossy inner highlight, and back gesture preservation.

### `B04`: Idea (`b04-idea.svg`)
The Idea beat screen introducing a single conversational rule in 28pt serif with worked dialogue examples and an expandable Why this works section. **Visible differences from spec**: Expandable section is static in SVG; spec requires spring-driven accordion reveal, hand-drawn tint highlighter swipe behind key headline terms, and light/dark theme parity.

### `B05`: Watch (`b05-watch.svg`)
The Watch beat screen presenting modelled partner dialogue where the user identifies the pivotal skill execution line. **Visible differences from spec**: Static dialogue lines; spec requires sequential bubble appearance, instant soft Lilac glow and haptic on tap, Honey feedback on near-misses (never red), and Show me fallback.

### `B06`: Read (`b06-read.svg`)
The Read beat screen exploring partner subtext through three prospective inner thought cards followed by the authentic thought reveal. **Visible differences from spec**: Reveal animation is absent in SVG; spec requires partner-tinted thought drifting upward with spring physics, explicit Different people, different signals disclaimer, and 48pt card touch areas.

### `B07`: Try (`b07-try.svg`)
The Try beat chat interface featuring partner portrait with mood reactivity, turn counter pill, suggested reply chips, text input, and hint access. **Visible differences from spec**: The SVG cannot convey live chat dynamics; spec mandates partner-coloured typing indicators, 8-second fallback gracefully switching to Maya is thinking, no countdown timer, and Lilac user bubble tint.

### `B08`: Coach (`b08-coach.svg`)
The Coach feedback screen delivering three stacked glass tiles: What worked (Mint), Pivot moment (Honey), and Next focus (Lilac) with rewrite preview. **Visible differences from spec**: Tiles are shown flat; spec requires progressive text typing with skeleton lines, verbatim quotes verified by code against transcript, 1px glossy highlights, and thumbs feedback widgets.

### `B09`: Inner Voice reveal (`b09-inner-voice-reveal.svg`)
The signature Inner Voice reveal screen replaying the chat in dim mode with drifting dashed thought bubbles tinted in partner colours. **Visible differences from spec**: Static depiction; spec mandates an interactive turn scrubber timeline, dashed thought bubble floating animation, tap-to-open Coach note link, and full Reduced Motion fade fallback.

### `B10`: Rewind and Retry (`b10-rewind-and-retry.svg`)
The Rewind and Retry screen allowing users to branch conversation from any previous turn to explore alternate dialogue paths. **Visible differences from spec**: The SVG shows static transcript lines; spec requires interactive message selection, collapsing subsequent turns with a New path marker, and post-retry side-by-side comparison.

### `B11`: Out there (`b11-out-there.svg`)
The Out there real-world commitment screen presenting three tailored micro-rep cards and a forecast modal with dual draining/warmth sliders. **Visible differences from spec**: Sliders in SVG have visual thumbs; spec explicitly forbids default values on forecast sliders until touched, mandates 1.5-degree tilt on selected cards, and gives equal visual weight to Skip.

### `B12`: Session complete (`b12-session-complete.svg`)
The calm session complete screen showing evidence quote, single-segment rhythm ring advance with haptic pulse, and ambient light sweep. **Visible differences from spec**: The SVG shows static graphics; spec prohibits points, XP, and confetti, requiring an ambient light beam animation, gentle double-tap haptic, and dark Midnight theme compliance.

### `B13`: Take it easy mode (`b13-take-it-easy-mode.svg`)
The Take it easy mode screen providing a compressed 2-minute session variant (one Idea, 3-turn chat, concise Coach note) for low-energy days. **Visible differences from spec**: Shows daylight styling; spec requires calm mode spring parameters (damping 30), reduced backdrop bubble counts, and full credit toward the weekly rhythm ring.

### `C01`: Moments tab (`c01-moments-tab.svg`)
The Moments tab timeline displaying upcoming real-world events as glass cards with prep status badges, energy estimates, and floating Add button. **Visible differences from spec**: Cards lack squircle 28px corners; spec requires segmented control switching to Past debriefs, empty state with Wince illustration, and 48pt floating action button hitbox.

### `C02`: Add a Moment (`c02-add-a-moment.svg`)
The Add a Moment bottom sheet capturing event category chips, optional attendee names, date/time, formality slider, and prep objectives. **Visible differences from spec**: Sheet corners are standard radius in SVG; spec specifies 36px squircle sheet, no default on formality slider, optional Add from calendar integration, and evening reminder toggle.

### `C03`: Prep for a Moment (`c03-prep-for-a-moment.svg`)
The Prep for a Moment result card generating conversational openers, two tailored questions, exit strategies, and energy protection plans. **Visible differences from spec**: Rendered statically; spec requires 5-second skeleton loading state, inline edit pencils with 48pt hitboxes, regenerate icons, and direct 2-minute Rehearse CTA.

### `C04`: Rehearse (`c04-rehearse.svg`)
The Moment rehearsal chat screen connecting the user with a tailored AI partner configured for the specific upcoming event scenario. **Visible differences from spec**: Static mockup; spec mandates Rehearsal mode header pill, partner persona contextualized from Moment data, graceful 8s timeout, and post-chat Coach debrief.

### `C05`: Pocket card (`c05-pocket-card.svg`)
The high-contrast Pocket card designed for quick discreet reference during live events, featuring large legible typography and dark styling. **Visible differences from spec**: The SVG is dark, but spec requires high-contrast lockscreen/widget integration, zero motion for discrete glanceability, and Done, how drained? transition to energy rating.

### `C06`: Energy check-in (`c06-energy-check-in.svg`)
The Social Battery energy check-in screen featuring a vertical draggable battery gauge with contextual drain/recharge tag chips. **Visible differences from spec**: The SVG shows static fill level; spec mandates liquid sloshing fill animation, color transitions from Mint to Honey to Ember, haptic pulse every 10%, and under-10-second completion.

### `C07`: Debrief chat (`c07-debrief-chat.svg`)
The post-event Debrief chat interface featuring gentle Lilac-themed AI interviewer questions and an editable takeaway summary card. **Visible differences from spec**: The SVG does not reflect conversational turn streaming; spec requires distinct Lilac visual styling for Debrief bot, safety routing to crisis support on distress keywords, and journal export.

### `C08`: Check-in — micro-rep (`c08-check-in-micro-rep.svg`)
The micro-rep check-in screen capturing real-world execution outcome, recipient warmth rating, and the Gap reveal comparison. **Visible differences from spec**: Static layout; spec requires animated Gap reveal highlighting forecast vs actual delta, Coach reflection sentence, and no penalizing copy for missed attempts.

### `C09`: Practice sheet (`c09-practice-sheet.svg`)
The centre Practice sheet modal presenting five glass action tiles (Free chat, Prep Moment, Reply Helper, Rewind past, Take it easy). **Visible differences from spec**: Rendered in standard sheet radius; spec requires 36px squircle sheet with glass blur, spring overshoot on tile press, and accessible action descriptions.

### `C10`: Free chat setup (`c10-free-chat-setup.svg`)
The Free chat setup screen allowing customization of situation chips, character portrait carousels, and personality trait sliders. **Visible differences from spec**: Sliders in SVG depict mid-point thumbs; spec dictates no default values until touch, 48pt target bounds for situation chips, and dark mode palette support.

### `C11`: Reply Helper (`c11-reply-helper.svg`)
The Reply Helper screen supporting pasted text or screenshot upload with one-tap name blurring and three voice-matched reply variations. **Visible differences from spec**: Static SVG displays fixed copy; spec mandates explicit I can't know what they meant disclaimer, non-storage of screenshots unless saved to journal, and copy/edit clipboard actions.

### `C12`: You tab (`c12-you-tab.svg`)
The You tab bento dashboard aggregating Growth Journal, 12 skill stage rings, Gap sparkline, Battery insights, and Quiet Ladder rungs. **Visible differences from spec**: Tiles are uniformly oriented; spec allows subtle 1.5-degree tilt on evidence tiles, generous bento spacing, non-numeric progress metrics, and complete Midnight theme support.

### `C13`: Growth Journal (`c13-growth-journal.svg`)
The Growth Journal reverse-chronological feed showing milestone cards, Coach quotes, debrief takeaways, and filter category chips. **Visible differences from spec**: Cards are flat; spec mandates 28px squircle bead cards with top-left highlight, favorite/delete swipe gestures, and designed empty state with Wince mascot.

### `C14`: Weekly Letter (`c14-weekly-letter.svg`)
The Weekly Letter full-screen serif editorial card presenting synthesized weekly growth observations, conversational patterns, and a Plan it CTA. **Visible differences from spec**: Shows static text; spec limits length to 150 words, requires Sunday evening scheduled delivery, opt-out toggle in Settings, and light/dark theme parity.

### `C15`: Skill detail (`c15-skill-detail.svg`)
The Skill detail screen showing stage ring indicator, Why I think so evidence lines quoting previous sessions, and review status badge. **Visible differences from spec**: Evidence quotes lack Lilac border rule; spec requires code verification of quotes, stage transition rules across 3 consecutive sessions, and 28px card corners.

### `C16`: Gap screen (`c16-gap-screen.svg`)
The Gap screen displaying a multi-week line chart comparing predicted vs actual social drain with shaded variance area and plain-language caption. **Visible differences from spec**: The SVG shows a static SVG chart; spec requires interactive point tapping to open historical check-in records, WCAG AA contrast on shaded fill, and empty state handling.

### `C17`: Battery patterns (`c17-battery-patterns.svg`)
The Battery patterns screen featuring a weekly heat-grid of energy by time/day, Coach pattern insight cards, and a Plan my week scheduling action. **Visible differences from spec**: Heat-grid squares lack accessibility labels; spec requires accessible value announcements, 1.5-degree tilted insight cards, and light/dark mode color mapping.

### `C18`: Quiet Ladder (`c18-quiet-ladder.svg`)
The Quiet Ladder vertical progression screen displaying 8 to 10 customizable real-world challenge rungs with completion marks and AI suggestions. **Visible differences from spec**: Static ladder graphics; spec requires drag-to-reorder rung capability, inline editing in the user's own words, and 48pt touch targets on Mark done buttons.

### `D01`: Settings (`d01-settings.svg`)
The Settings screen presenting grouped navigation rows for Playbook, Coach tone, Rhythm, Reminders, Appearance, Quiet Lock, Account, and Privacy. **Visible differences from spec**: List rows use standard dividers; spec requires grouped glass surfaces with 28px squircles, search field at top with Lilac focus ring, and full Midnight palette styling.

### `D02`: Notification preferences (`d02-notification-preferences.svg`)
The Notification preferences screen with granular toggles, live push previews, quiet-hours time slider, and Pause everything button. **Visible differences from spec**: Sliders in SVG have static thumbs; spec mandates no-default sliders for time ranges, strictly maximum one notification per day rule, and haptic feedback on toggles.

### `D03`: Privacy centre (`d03-privacy-centre.svg`)
The Privacy centre screen providing transparent controls for data download, practice text purging, account deletion, and model training disclosures. **Visible differences from spec**: Buttons use standard rects; spec mandates Honey warnings for irreversible deletion (never red), 24-hour export delivery guarantee, and 30-day deletion SLA.

### `D04`: Subscription (`d04-subscription.svg`)
The Subscription comparison screen presenting Free vs Plus feature tiers, local-currency pricing, trial terms, and one-tap cancellation guarantee. **Visible differences from spec**: Price is shown statically; spec and project decisions mandate the placeholder token [PRICE] until launch pricing is locked, with equal prominence for Not now.

### `D05`: Paywall moment (`d05-paywall-moment.svg`)
The Paywall moment contextual bottom sheet triggered after session 5, highlighting personalized value metrics and trial options. **Visible differences from spec**: Sheet lacks 36px squircle radius; spec strictly prohibits paywall display during active chat, Debrief sessions, or the emergency support screen.

### `D06`: Help and feedback (`d06-help-and-feedback.svg`)
The Help and feedback screen offering searchable FAQ cards, support contact links, and message report tools. **Visible differences from spec**: Reporting interface in SVG is generic; spec requires Tell us about a bad AI answer context attachment with user consent and 48pt touch targets.

### `D07`: About the AI (`d07-about-the-ai.svg`)
The About the AI transparency page explaining synthetic character simulation, Coach boundaries, non-clinical positioning, and lack of human sentience. **Visible differences from spec**: Editorial layout must adhere to strict non-clinical vocabulary (no diagnosis, therapy, or treatment terms) and support 200% dynamic text scaling without clipping.

### `D08`: Support screen (`d08-support-screen.svg`)
The emergency Support screen triggered by crisis detection, displaying immediate helpline dial buttons, text links, and trusted contact shortcuts. **Visible differences from spec**: The SVG shows static buttons; spec mandates zero AI-generated text, dimmed background hush, verified local numbers from crisis-resources.md, and 48pt minimum CTA targets.

### `D09`: Offline (`d09-offline.svg`)
The offline state screen maintaining local access to preloaded sessions and the Pocket card while displaying a calm reconnection prompt. **Visible differences from spec**: Features Wince mascot peeking; spec requires cached offline functionality for Moments pocket cards and graceful connection retry without disruptive alerts.

### `D10`: Coach or partner busy (`d10-coach-or-partner-busy.svg`)
The Coach or partner busy state screen indicating model latency with progress shimmers and polite fallback messaging. **Visible differences from spec**: The SVG shows static card; spec requires 8-second timeout before switching to backup model or authored script, avoiding technical error codes.

### `D11`: Daily AI limit (`d11-daily-ai-limit.svg`)
The daily AI limit notice screen informing free tier users of daily practice cap completion with invitations to return tomorrow or continue scripted. **Visible differences from spec**: Rendered in light mode; spec requires Honey tinting rather than error red, calm non-punitive tone, and complete Midnight mode palette tokens.

### `D12`: Welcome back (`d12-welcome-back.svg`)
The welcome back screen greeting returning users after 3+ days away with an invitation to a 1-minute warm-up and quiet rhythm ring reset. **Visible differences from spec**: Shows static greeting; spec strictly forbids guilt copy or mention of missed practice, requiring immediate entry into an easy session in both modes.

### `D13`: Empty states (`d13-empty-states.svg`)
The empty states catalog showcasing illustrative empty views for Moments, Journal, Gap, and Ladder with encouraging copy and action buttons. **Visible differences from spec**: SVG uses generic illustrations; spec specifies Wince mascot poses (curious, peeking, sleepy), 48pt action buttons, and 28px squircle cards.

### `D14`: Error states (`d14-error-states.svg`)
The error states catalog presenting plain-language recovery cards (Couldn't save that. Try again) without technical jargon. **Visible differences from spec**: SVG cards use flat fills; spec requires Honey amber error indicators (strictly never red), single retry CTA, and 1px top-left glossy inner highlights.

