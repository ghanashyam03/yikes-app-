# yikes! — App Specification (v3)

yikes! is a four-minute daily practice app where introverts rehearse conversations with AI partners, get coaching in their own voice, and carry one small step into real life.

## 1. The app in brief

yikes! turns the conversations introverts dread into a daily practice they can see improving.

The promise. In about four minutes: learn one move, rehearse it with an AI character, get coaching that quotes your own words, and pick one small step for a real conversation. Over weeks, a personal journal shows what changed.

For: adults 18+, especially introverts and ambiverts, who find conversation draining, replay it afterwards, or need to get through meetings, networking and social events without burning out.

Not for: treating any condition (the app says so plainly and points to professionals), under-18s, dating coaching or companionship. It never tries to make you extroverted.

Five signature features

Personal Playbook. A short quiz at the start builds a profile that reshapes the whole app.

AI practice partners with private inner thoughts you get to read after each chat.

Coach. Feedback in plain language that quotes your lines and rewrites them in your own voice.

Moments. Real events you add (a meeting, a party). The app preps you before and debriefs you after.

Social Battery. Track what drains and recharges you, so practice respects your energy.

Tone. A clever, kind friend. The name is the wince after an awkward moment; the app meets it with warmth and a dry joke. Never clinical, never preachy.

## 2. Why people come back

People return to an app that notices them, rewards real progress and never punishes a missed day. Each driver below is built into a specific feature.

The one-line retention strategy: make the first session feel personal, tie practice to real events, and make progress visible in the user's own words.

## 3. Sign-up, login and security

Accounts are passwordless by default, so there is nothing to forget and nothing to leak.

Ways in

Continue with Apple and Continue with Google (one tap).

Email code: a 6-digit one-time code, valid 10 minutes, with the email app opening from the button.

Phone code (India SMS): optional, same 6-digit flow.

Passkey: offered after the first successful login, so the next login is Face ID or fingerprint.

When the account is created. Not at the start. Users do the taster, the quiz and a warm-up chat as a guest, see their Playbook, and only then are asked to save it. Guest progress is held on the device for 7 days and merges into the new account.

Age gate. A birth-year screen. Under 18 gets a kind, clear message and nothing is stored.

Session and device control. Sessions use short-lived tokens that refresh quietly. Settings lists signed-in devices with Sign out everywhere. Changing email or phone needs a fresh code.

Quiet Lock. An optional Face ID or fingerprint lock on the app, because the content is personal.

Abuse protection. Code entry allows 5 tries, then a 15-minute pause. Requests are rate-limited and bot-checked at sign-up.

Recovery and deletion. Lost access is recovered by a code to the verified email or phone. Delete account is in Settings, removes all personal data within 30 days, and confirms by email.

Protection. Encryption in transit and at rest, row-level security so a user can only read their own rows, secrets kept off the device, and an audit log for any staff access.

## 4. The personalization quiz

The quiz takes about three minutes, one question per screen, and ends with a real warm-up chat and a Playbook the user can read and edit. Every answer changes something visible in the app, and the table below says what.

The 14 questions

Then: a one-minute warm-up chat with an AI partner, followed by the Coach's first read. This is the baseline, and it shows the app's value before the account wall.

Optional deeper profile (2 minutes, skippable). Eight short statements about sociability and calm under pressure. They only nudge starting difficulty. Never shown as a type or label.

How answers change the app

It keeps learning. After two weeks the app proposes changes from behaviour ("Level 2 looks easy now. Try something tougher?"), and any answer can be re-taken from You, then Playbook.

## 5. The AI system

The AI is the heart of the app, not a bolt-on: it plays the partner, reads the conversation, coaches, preps and reviews. Underneath, code only enforces safety, length and format, so nothing a user sees is a mechanical score.

Models and jobs (proposed assignment)

I could not verify these model names or what each does well, so run a one-day side-by-side test on 30 real prompts before locking the assignments. The app talks to an internal AI gateway, so swapping a model is a config change.

Free endpoints are for building, not launching. NVIDIA's FAQ says its free API endpoints are for research, development and test use, and that serving real end users counts as production and needs an NVIDIA AI Enterprise licence or a paid partner endpoint. Forum posts report a default of about 40 requests per minute. One 6-turn chat costs roughly 19 model calls (partner, safety in and out per turn, plus one Coach call), so the free tier supports about 2 chats a minute across all users. That is enough for a closed beta of a few dozen people, not a public launch. The gateway lets you move to paid endpoints before launch with no app change.

AI features

Practice Partner. A live chat with a character who has a persona card, a scenario and a hidden mood. Characters are realistic, not agreeable: reserved at first, not oversharing, sometimes distracted, able to wrap up the chat. They never claim to be human.

Inner Voice. After every chat the user can read what the partner was privately thinking at each turn ("Okay, a real question. I like that."). The partner writes its thought with every reply, so the reveal is genuine to the scene.

Coach. Feedback with three parts: moments that worked (quoting the user's lines and why), one pivot moment (what happened and an alternative in the user's own voice), and one thing to try next. Every quote is checked by code to exist in the transcript.

Rewind and Retry. Jump back to any turn and try a different line; the partner reacts to the new path.

Prep for a Moment. Describe a real event; get a plan (opener, two questions, an exit line, a recovery suggestion) and rehearse it with a partner built for that event.

Reply Helper. Paste or screenshot a message; get what the sender may mean and three reply options in different tones, written in the user's voice.

Debrief chat. After a real event, a gentle AI interviewer asks four or five questions and writes a short takeaway.

Weekly Letter. A personal note each week: what changed, one pattern, one next focus, built from the week's sessions and Moments.

Voice Match. From opted-in practice text, suggestions sound like the user, not like a template.

Personalised scenarios. Every scenario is written for the user's Playbook, such as their field, their draining situations and their language mix.

Growth without scores. Each skill shows a stage (Starting, Practicing, Growing, Natural) with the evidence behind it. The Coach judges against a written rubric for that skill, and a stage changes only when it holds across the last three sessions, so one lucky or bad chat never swings it.

One turn of Practice Partner

User sends a message; the safety model checks it.

The gateway builds the prompt: persona card, scenario, Playbook summary (not raw history), recent turns, hidden mood.

The partner returns strict JSON: reply, private thought, new mood, wants-to-end, cue strength.

Code validates the JSON (retry once), clamps mood changes so characters stay believable, and the safety model checks the reply.

The reply streams in with a typing indicator; the thought is stored for the reveal.

Guardrails

A crisis signal on any input stops the practice and shows fixed, human-written support text with local resources. No model writes that screen.

Excluded scenarios: abuse, bereavement, confronting someone who harmed you, harassment reporting, medical news.

Text inside user messages is treated as content, never as instructions (prompt-injection safe).

Every AI surface is labelled as AI. The Coach never diagnoses or gives medical advice.

Failures degrade gracefully: 8-second timeout, then fallback model, then authored lines, with a calm "Maya is thinking" state and never an error dump.

Every call is logged with model and prompt version so bad outputs can be traced and fixed.

## 6. The core session

A session takes 3 to 5 minutes and has six beats. It can be paused and resumed, and every beat can be skipped.

Idea (20 seconds). One rule and one example, written for the user's scenario world. "Ask about the thing they got excited about, not the thing you want to say next."

Watch (40 seconds). A short modelled chat. The user taps the line where the skill happens.

Read (about 60 seconds). A short exchange, then the question "What is Maya thinking right now?" with three possible inner thoughts. The reveal shows her actual thought, which was written with the scene, so the answer is true to the story. Copy is honest: this is one character's thoughts, not a rule about all people.

Try (about 90 seconds). A live chat of 4 to 6 turns with the AI partner. The user picks a suggested reply (editable) or types their own. No timer, and "pass this one" is always available.

Coach (30 seconds). The Coach's feedback, then the Inner Voice reveal, then Retry from any turn.

Out there (optional). One small real-world step the user chooses, with a forecast before and a check-in after.

Twelve skills: starting a chat, asking follow-ups, acknowledging what was said, pacing what you share, reading engagement, keeping balance, handling silence, graceful exits, bridging from small talk, groups, polite disagreement, following up afterwards.

Five situation levels: friendly one-to-one, colleague, senior or busy person, groups, high stakes. The Path is skills by levels, ordered by the Playbook.

Unit 1 (the first 8 sessions): the opening line, one good follow-up, showing you heard, the warm exit, reading a short reply, sharing a little, the quiet moment, and your first real-world step.

Length adapts. Users who reported low energy get 3-minute sessions and a Take it easy card; users with a bigger appetite get a Stretch option.

## 7. Moments, Social Battery and the Gap Game

Practice only matters if it reaches real life, so the app is built around the user's real calendar of conversations.

Moments. A Moment is a real upcoming event: a meeting, a party, a call, a networking night. Users add one by hand in 15 seconds (what, who, when, how formal), or pick events from their calendar if they choose to connect it (read-only, only the events they tick). Each Moment has a three-step life:

Before: a notification the evening before and an hour before, with a Prep card and a 2-minute rehearsal.

During: one tap opens a quiet pocket card with the opener, two questions and an exit line.

After: a nudge 30 minutes later for the energy rating and a short Debrief chat.

Social Battery. A one-tap rating of energy before and after any Moment or practice. Over time the app shows what drains and what recharges ("Large groups after 6pm cost you most; one-to-ones at lunch recharge you") and suggests recovery: "Thursday is heavy. Keep Friday evening free." It is information, never a score to maximise.

The Gap Game. Before a real step, the user forecasts how draining it will be (0 to 10) and how warm the other person will be. Afterwards they record what happened. The Gap is the difference. Over weeks the user watches their forecasts move closer to reality, which is the app's quiet proof that things go better than feared.

The Quiet Ladder. A personal ladder of 8 to 10 real steps from easy to hard ("say hi to a neighbour" up to "ask a question in a meeting"), seeded by the quiz and editable. Climbing it is the progression. Every rung is the user's choice.

Rhythm, not streaks. A weekly ring fills toward the user's own goal (2 to 5 sessions). Missing a week changes nothing. A daily streak with freezes is available only if the user switches it on in Settings.

Quiet milestones. First real follow-up question, first graceful exit, first Gap under one point, first Moment debriefed. Each gets one beautiful, calm moment and an entry in the journal. No confetti.

Notifications (max one a day, inside the user's window). A rhythm nudge built from the anchor, a Moment prompt, a review due, the Weekly Letter. Copy is warm and specific; never guilt, countdowns or streak threats.

## 8. Design system: "Soft Pop"

Soft Pop is bubbly, squishy and playful, and still calm. The energy comes from shape and motion, never from urgency: no countdowns, no flashing, no red alerts. Think glossy pebbles floating in warm water. Light and dark are both first-class, each designed on its own rather than inverted.

Five design rules

Touch should feel physical. Every tap squishes and springs back; every drag has weight.

One star per screen. One Ember action, one hero animation. Everything else supports it.

Fun that respects energy. When the Social Battery is low or Take it easy is on, the app calms itself: fewer floating bubbles, slower motion, softer sound.

Be asymmetrical on purpose. Big left-aligned headlines, tiles of different sizes, and a few sticker-like cards tilted 1.5 degrees, so no screen looks like a template.

Type

A key word in a headline gets a hand-drawn highlighter swipe behind it in a tint. Text scales to 200% without clipping.

Shape and depth

8pt grid. Cards use 28px continuous (squircle) corners, sheets 36px, buttons and chips full pills.

Layers: base, surface, floating. Every surface has a 1px top-left inner highlight so it looks like a glossy bead.

Bento layouts on Today and You: tiles in different sizes with generous gaps.

Mascot "Wince": a small squishy blob with a tiny squint. It lives in empty states, loading and the launch screen with 6 poses (curious, sleepy, thinking, proud, peeking shyly, offline). It never speaks and never acts as a friend or companion.

Micro-interactions

Motion uses springs (stiffness 300, damping 26 for playful, 30 for calm). Timings: 180ms taps, 280ms transitions, 420ms reveals. Reduced Motion swaps movement for fades and keeps haptics.

Component states. Every component has all of these designed.

Haptics and sound. Haptics: soft tick on choices, medium thud on lock-in, a rolling pulse on reveals, a gentle double tap on milestones. Sound is off by default; if on, a soft marimba-like pop with six sounds in total, never louder than the system volume.

Iconography. Chunky rounded icons with a 2.5px stroke and a small filled accent in the active state.

Accessibility. WCAG AA contrast on every pair in both modes; full VoiceOver and TalkBack labels; meaning never carried by colour alone; 48pt touch targets; haptic and visual alternatives for every sound.

## 9. Screens, part 1: launch, account and the quiz

Each screen lists its layout from top to bottom, what the user can do, what the AI does, and its edge states.

### A1. Launch. Night background, the serif yikes! wordmark fading in with a small wince glyph, ambient glow drifting. One second, then straight to A2. First-time users never see a spinner.

### A2. Welcome. A short story in three swipeable cards over a glowing gradient: (1) Conversations you dread, rehearsed in private. (2) An AI partner that thinks out loud afterwards. (3) Small steps into the real thing. Bottom: Ember button Start with a 3-minute quiz, and a quiet text link I already have an account. Page dots; swipe or tap. No permissions asked here.

### A3. Quiz intro. Serif headline Let's build your Playbook. A line saying what it is for and that it takes about 3 minutes and nothing is shared. Three small tiles preview what comes out: your pace, your first steps, your Coach. Button Begin. A Skip, use defaults link at the bottom (the Playbook is then built from behaviour over time).

### A4. Quiz question screens (Q1 to Q14). A thin progress line on top and a back arrow. One question in serif, a one-line reason under it (We use this to choose your first scenarios). Answers sit in the lower half where the thumb is: large chips for choices, a slider for scales (no default thumb), or a time wheel for the window. The Ember Next button stays disabled until an answer is given; Skip is always visible and equally easy. Choosing a chip gives a soft haptic and a gentle glow. Each answer saves instantly, so quitting mid-quiz resumes exactly there. Q3 offers a small Moment form (what, when); Q14 lets the user type their own anchor.

### A5. Optional deeper profile. A calm card offering Go deeper (2 minutes). If accepted, 8 statements, one per screen, on a five-step scale. A visible Skip returns to the flow. The user is told it only affects starting difficulty.

### A6. Warm-up chat. The same chat screen as a Try, labelled Warm-up. An AI partner opens in a scenario built from Q1, Q2 and Q4. Three suggested replies plus a text field; Pass always available; 4 turns, no timer. A line above the field: There are no wrong answers. This is just so your Coach can meet you. On the third turn, the typing indicator uses a character-coloured bubble so the partner feels alive.

### A7. Coach's first read. A bento screen: one tile with a short, warm paragraph from the Coach in the tone chosen in Q11 (quoting one real line the user wrote), a second tile What I noticed with two strengths, a third One thing to try with a rewrite in the user's voice. A soft pulse of Lilac glow on the Coach avatar while the AI writes it, with skeleton lines. If the AI is slow, the screen shows the Playbook first and the read arrives as a card.

### A8. Your Playbook reveal. The payoff screen. A slow, cinematic build: the Playbook assembles as glass tiles, each answering a question: Your pace (thinks first, speaks well), Your battery (how fast it drains and what recharges it), Your hardest places, Your first 3 steps, Your Coach (tone). An Edit pencil on each tile. Below: Your first session is ready. Button Save my Playbook (leads to A9).

### A9. Create account. Title Save your Playbook. Buttons: Continue with Apple, Continue with Google, Continue with email, Continue with phone. Beneath, a one-line promise: Your practice text is private to you. Terms and Privacy as links. Not now keeps the guest session for 7 days.

### A10. Email or phone entry. One field, large, keyboard up, a clear We'll send a 6-digit code. Inline validation. A back arrow.

### A11. Code entry. Six large boxes that auto-advance and auto-fill from the SMS or email suggestion. A countdown to Resend code. Wrong code: gentle shake and That code didn't match. 4 tries left. After 5 failures, a 15-minute pause with a clear message.

### A12. Consent. Four separate glass cards, each with a toggle, a one-line what and why, and a Learn more sheet: Required (account and progress, always on), Product analytics (content-free usage events, opt-in), Improve the AI (your practice text, with names removed, used to improve the app; opt-in; withdraw any time), Tips and updates (opt-in). Declining any optional one changes nothing about access.

### A13. Age confirmation. A single birth-year wheel. If under 18: a kind explanation and a sign-out; nothing is stored.

### A14. Permissions, just in time. Not up front. The notification permission appears after the user sets a reminder window, with a screen showing a sample notification first. Calendar access appears only inside the Moments tab when a user taps Add from calendar. Microphone and camera are never requested.

### A15. Passkey offer. After the first login, a calm sheet: Sign in with Face ID next time. Set up or Maybe later.

### A16. Returning sign-in. The Welcome screen's account link opens a sheet with Apple, Google, email, phone and passkey. If the device has a passkey, Face ID starts automatically. Forgot access? leads to recovery by code.

## 10. Screens, part 2: Today, Path and the session player

### B1. Today (home). A bento screen, top to bottom:

Greeting row: a serif greeting by the user's name and time of day, a small battery icon showing today's energy, and a weekly rhythm ring.

Hero tile (large): the Next session card with the partner's illustrated portrait, the skill, a one-line why (Because follow-up questions are your first step), the length (4 min), and the Ember Start button. A small Take it easy link switches to a 2-minute version.

Moment tile: the next real Moment with a Prep button, or Nothing coming up. Add one? when empty.

Check-in tile (only when due): How did asking that question go? with four faces.

Evidence tile: one quoted line from the user's last session ("What got you into that?" This warmed Maya up.) with a thin Lilac rule.

Nothing else. Pull to refresh; AI-written copy fades in over a skeleton.

Empty first day: the hero is the first session; the Moment tile invites the user to add one.

### B2. Path. A vertical, scrolling map of skills grouped into units, drawn as glowing glass nodes along a curved line (not a grid), ordered by the Playbook. Each node shows its growth stage as a soft ring (Starting, Practicing, Growing, Natural). Tap opens a bottom sheet: skill name, a sentence of what it is, the stage with the evidence line, the next session, and Try ahead for locked ones. Locked nodes are dimmed but never hidden. A Gap trend mini-chart sits in the header and opens the Gap screen.

### B3. Session intro. The tapped card expands to full screen. A progress line with six small beats (Idea to Out there). Skill name in serif, the character's portrait, a line setting the scene (Priya from the design team, in the kitchen at 4pm). Button Begin; a back arrow saves progress.

### B4. Idea. One glass card. The rule in 28pt serif, a worked example in two chat bubbles below it, and a collapsed Why this works row that opens a two-sentence explanation. Button Next.

### B5. Watch. Chat bubbles appear one at a time with the partner's avatar. The instruction: Tap the line where the move happens. A tap gets an instant soft glow and a one-line note; a wrong tap gets Close. Look at the question. The user can always tap Show me.

### B6. Read. A short exchange, then What is Maya thinking? with three thought cards. After the user picks one, the real thought drifts up in the partner's colour with a one-sentence note on the cue (Short replies and no question back: she is being polite, not bored). Below it, a small Different people, different signals note so one answer is never presented as universal.

### B7. Try. The full chat screen. Partner portrait at the top with a mood-reactive expression, a Turn 3 of 6 pill (no timer), partner bubbles on the left, user bubbles in Lilac on the right. A typing indicator in the partner's colour appears while the AI answers. At the bottom: three suggested replies as chips (tap to drop into the field, then edit), a text field, a send arrow, and a quiet Pass this one link. A Need a hint? button opens a small card with an idea, not a script. If the user pauses for 20 seconds, nothing nags; a faint Take your time line fades in. Edge states: a slow reply keeps the typing indicator up to 8 seconds, then switches to a calm Maya is thinking message; a failed reply retries silently once; if the AI is down, the session offers a short scripted version.

### B8. Coach. The feedback screen, in three stacked glass tiles with a Coach avatar:

What worked (Mint rule): two or three of the user's own lines in quote bubbles, each with a one-line reason.

A pivot moment (Honey rule): the turn where the chat changed, what happened, and a rewrite in the user's own voice with a Try it button.

Try this next time (Lilac rule): one concrete idea.

Below the tiles: Rewind, See Maya's thoughts, Continue, and Was this fair? thumbs. The text types in progressively with skeleton lines first, never all at once.

### B9. Inner Voice reveal. The signature screen. The chat replays slowly in a dim view; after each partner line, a dashed thought bubble drifts up beside her portrait, tinted in her colour. The user scrubs a timeline to jump between turns and taps any thought to open the matching Coach note. A Done button returns to the Coach.

### B10. Rewind and Retry. The user taps any of their messages in the transcript; the chat reopens from that turn with the later messages collapsed and a note New path. The partner reacts to the new line. The Coach compares the two paths side by side afterwards.

### B11. Out there. Take it into the real world. Three micro-rep cards written for the user's Playbook (Ask one follow-up in your next meeting). Selecting one opens the Forecast screen: two no-default sliders, How draining do you expect it to be? and How warm do you expect them to be?, then an optional time and a reminder anchor (after lunch today). Skip is equal in weight to Choose.

### B12. Session complete. A quiet full-screen moment. One evidence line, the rhythm ring advancing one segment with a soft haptic, and a thin line of ambient light across the screen. If a milestone happened, it appears here as a small card. Buttons: Done and Another one. No confetti, no points.

### B13. Take it easy mode. A two-minute version for low-energy days: a single Idea, one 3-turn chat, a short Coach line. Reached from Today or from a Social Battery signal. It counts fully toward the rhythm ring.

## 11. Screens, part 3: Moments, AI tools and progress

### C1. Moments tab. A header with the Social Battery gauge and a one-line recovery tip. Below, a vertical timeline of upcoming Moments as glass cards (title, day and time, a small battery-cost estimate, a status of Prep ready or Needs prep). A segmented control switches to Past (with Debrief and energy chips). A floating Add Moment button. Empty state: an illustration and Add the next conversation you're nervous about. It takes 15 seconds.

### C2. Add a Moment. A bottom sheet. Fields in order: What is it? (chips: meeting, party, call, networking, one-to-one, other), Who will be there? (free text, optional, first names only), When? (date and time), How formal? (slider), What would make it go well? (free text). A secondary button Add from calendar if connected. Button Save and prep. Saving also offers Remind me the evening before as a toggle.

### C3. Prep for a Moment. The AI builds a card in about 5 seconds while a skeleton shows: Your opener (two options in the user's voice), Two questions to ask, Your exit line, If it gets draining (a quiet-break idea), and a Recovery plan (what to protect afterwards). Each item has a regenerate icon and an edit pencil. Buttons: Rehearse it (2 min) and Save to Moment.

### C4. Rehearse. The Try chat screen, labelled Rehearsal, with a partner built from the Moment (Sam, your manager, at the 10am sync). Same controls as B7. Afterwards the Coach gives a short read focused on the Moment's goal.

### C5. Pocket card (during). A one-tap, always-quiet card reachable from the lock-screen notification and the Moments tab: the opener, the two questions and the exit line, large type, dark by default, no motion. A small Done, how drained? button leads to the energy screen.

### C6. Energy check-in. A single large battery that the user drags up or down, with soft haptics at each step. Optional tag chips (people, noise, length, who). Button Save. Takes under 10 seconds. Shown before and after a Moment.

### C7. Debrief chat. A calm conversation with the Debrief interviewer, in a different visual style from partners (Lilac only). Four or five gentle questions (What went better than you expected?, Was there a moment you felt your energy dip?). The user can answer by tapping suggested chips or typing. At the end, a Takeaway card the user can edit, save to the journal or discard. If the user typed something distressing, the safety model routes to the support screen.

### C8. Check-in (micro-rep). Opened from a notification or Today. Did you ask the follow-up? with four options (yes, tried, no, no chance). Then How did it land? (warmer, the same, colder), then the energy battery, then the Gap reveal: You expected 7 out of 10 draining; it was 4. with a single line of reflection written by the Coach.

### C9. Practice sheet (the centre button). A glass bottom sheet with five large tiles: Free chat (pick any situation and character), Prep for a Moment, Reply Helper, Rewind a past chat, Take it easy. Each tile has a one-line description.

### C10. Free chat setup. Pick a situation (chips), a character (portrait carousel with personality sliders such as reserved to chatty), and a goal (just practice, practice a hard moment). The user can also describe a situation in words and the AI builds it. Button Start.

### C11. Reply Helper. Two modes: paste text, or upload a screenshot (a small instruction suggests blurring names first, and the app offers a one-tap blur). Result screen: What they may mean (two plausible readings, with the honest line I can't know what they meant), then Three replies (warm, direct, light) written in the user's voice, each with Copy and Edit. Nothing is sent anywhere by the app. The screenshot is not stored after the result is shown unless the user taps Save to journal.

### C12. You tab. A bento screen: Growth Journal card, Skills card (twelve small rings), Gap trend sparkline, Social Battery patterns, Quiet Ladder progress, Playbook, and a link to Settings. Header: the user's name and a quiet line of evidence, never a number.

### C13. Growth Journal. A reverse-chronological timeline of entries, each a glass card: a Coach quote, a milestone, a Debrief takeaway, or a Weekly Letter. A filter row (All, Wins, Letters, Debriefs). Entries can be favourited or deleted. Empty state: Your first entry appears after your first session.

### C14. Weekly Letter. A full-screen serif letter from the Coach, arriving each Sunday evening as a notification: what changed this week, one pattern the user may not have noticed (You ask more questions in one-to-ones than in groups), and one focus for next week, with a button Plan it. Short, 150 words at most, written from the week's sessions and Moments. Users can turn it off.

### C15. Skill detail. The skill name, the stage as a large ring, a Why I think so section with three evidence lines (quotes from different sessions), recent sessions, the next session, and a Review due badge when a skill is fading.

### C16. Gap screen. A line chart of forecast against reality over weeks, with the gap shaded. A caption in plain words (Your forecasts are getting closer to what actually happens). Tapping a point opens that check-in. Empty state: Do a real-world step to start your Gap.

### C17. Battery patterns. A weekly heat-grid of average energy by day and time, plus three insight cards written by the Coach (Large groups cost you the most; plan a quiet hour after them). A Plan my week button builds a gentle schedule suggestion for Moments and recovery.

### C18. Quiet Ladder. A vertical ladder of 8 to 10 rungs with current rung highlighted. Tapping a rung shows what it is, a suggested micro-rep, and Mark done. A Reorder and Add rung option; the user can rewrite any rung in their own words. A small AI button suggests the next rung.

## 12. Screens, part 4: settings, privacy, paywall and system states

### D1. Settings. A grouped list on glass: Playbook (edit any quiz answer), Coach (tone, humour), Rhythm (weekly goal, optional streak toggle, pause for a busy week), Reminders (window, anchor, per-type toggles), Appearance (dark, light, auto; text size; Reduced Motion; haptics; sound), Quiet Lock, Account (email, phone, devices, passkeys), Privacy centre, Subscription, Help, About. Search at the top.

### D2. Notification preferences. A toggle per type (rhythm nudge, Moment prompts, check-ins, review due, Weekly Letter) with a live preview of each notification, a quiet-hours slider and a Max one a day note. A Pause everything for a week button.

### D3. Privacy centre. The consent toggles from A12 with plain-language explanations; Download my data (a file by email within 24 hours); Delete my practice text (keeps progress); Delete my account (confirm with a code, 30-day removal); a note that already-trained models cannot be untrained. Every control shows what it does before the user commits.

### D4. Subscription. Free includes daily sessions, the Playbook, Moments, the Gap Game and Reply Helper limited to a few uses per week. Plus adds unlimited Free chat and Reply Helper, Prep for Moments with rehearsal, the Weekly Letter, Voice Match and deeper Battery insights. A 3-card comparison, local-currency price, a clear trial length, and Not now equally visible. Cancel in one tap from the same screen.

### D5. Paywall moment. Shown after the user's fifth session or the first time they open a Plus feature. A calm sheet: what they get, tied to their own journey (You've done 5 sessions and 2 real steps), price, Try free and Not now. Never shown during a chat, a Debrief or the support screen.

### D6. Help and feedback. Search, common questions, a Tell us about a bad AI answer button available on every Coach and partner message, and a contact form. Report attaches the offending message with the user's consent.

### D7. About the AI. A plain page: which parts are AI, that characters are not real people, what the Coach can and cannot do, and that it is not therapy or medical advice.

### D8. Support screen (safety). Triggered when a message signals crisis. A hush: background dims, practice pauses. Fixed, human-written text: It sounds like things are really heavy right now. You're not alone. A large button to call a local helpline chosen by locale, a second button to text, a third to contact someone they trust, and a quiet Back to practice when you're ready. No AI-written words on this screen.

### D9. Offline. Content already loaded stays usable; AI features show a small Reconnect to chat with Maya card. The Moments pocket card works fully offline.

### D10. Coach or partner busy. A friendly full-card state (Maya is taking a moment) with a progress shimmer. After 8 seconds the app tries the backup model, then offers a short scripted version or Come back in a minute. Never an error code.

### D11. Daily AI limit. A calm card (You've had a full day of practice. Come back tomorrow, or switch to a scripted session) for free users who reach their cap; Plus users have a higher cap.

### D12. Welcome back. After 3 or more days away: a warm full-screen greeting (Good to see you. Want a one-minute warm-up?), the rhythm ring reset without comment, and one easy session. Nothing about what was missed.

### D13. Empty states. Every list has a designed empty state with a small illustration, a sentence of encouragement and one action (Moments, Journal, Gap, Ladder, History).

### D14. Error states. Plain words and a single action: Couldn't save that. Try again. Never technical text, never a dead end.

## 13. Data, safety and v1 launch scope

What the app collects. Everything the product needs to feel personal, and nothing else. This also keeps the app inside privacy law (India's DPDP Rules and GDPR both expect purpose limitation) and earns the trust a privacy-minded audience needs. Have a lawyer confirm obligations before launch.

Every user can export and delete from the Privacy centre. Staff access is role-based and logged.

Positioning. yikes! is skills practice and self-awareness, never treatment. Store copy and in-app words avoid clinical terms and claims such as treat, cure or therapy. The Coach never diagnoses.

Quality bar for AI output. Quotes are verified, JSON is validated, unsafe text is blocked, outputs are sampled by the judge model, and every message has a Was this fair? control. Weekly, the team reviews flagged messages and updates prompts.

v1 scope (what ships first)

Architecture in one paragraph. An Expo (React Native) app for iOS and Android; Supabase for accounts, database and row-level security; a small AI gateway service that routes each job to its model, validates output, applies safety checks, handles fallbacks and logs every call; RevenueCat for subscriptions; PostHog for opt-in analytics; Sentry for errors.

Open decisions. (1) Launch market and language mix, which shapes characters, scenarios and model choices. (2) Price points for Plus. (3) Whether to ship the optional streak at v1.

## 14. Honesty rules for the AI

The AI should feel personal and never pretend to know more than it can. These rules apply to every AI message.

Characters are simulated. Inner Voice shows what the character was written to think. The app never says it reveals what real people think, and the Read step always includes Different people, different signals.

No invented evidence. Every quote the Coach uses must appear exactly in the user's chat; code checks this and regenerates once, then falls back to simpler feedback.

No praise without a reason. Strengths must point to a specific line. If nothing worked, the Coach says so kindly and moves to one next step.

No shaming. No red marks, no ranking, no you failed. Not-yet is amber and always comes with a next move.

Uncertainty is stated. Reply Helper offers two readings and says I can't know what they meant.

No labels. The app never calls anyone shy, anxious, extroverted or introverted as a verdict, and never shows a personality type.

Stable growth stages. The Coach judges each skill against a written rubric, and a stage changes only when it holds across the last three sessions. A fixed set of about 30 example chats with agreed ratings is rerun whenever a model or prompt changes, and the change ships only if stages stay consistent.

Never a real-person verdict. The app does not claim a real person liked, disliked or understood the user.

## 15. Content operations

The AI writes scenarios and chats, but the curriculum around them is authored and checked.

Session format. Each session is stored as one record with these parts:

Quality checks before a scenario goes live

A human reads it for tone, realism and cultural fit for the launch market.

It is run 10 times against the partner model; no run may break character, over-share, or turn unsafe.

The Coach rubric is tested on the two sample chats and must give the expected feedback.

Excluded topics are scanned for (abuse, bereavement, harassment reporting, medical news).

AI-written scenarios. Personalised scenarios (written from a user's Playbook) must pass the same automatic checks (3 and 4) at generation time. Anything failing falls back to the authored scenario.

Launch curriculum. 3 units, about 24 sessions, 6 to 8 characters. Unit 1 is the first 8 sessions listed in section 6; Unit 2 covers groups and endings; Unit 3 covers disagreement and high-stakes moments.

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

## 17. Acceptance criteria

An area is done when every line below is true.

Product

A new user reaches their first tailored session in under 5 minutes without creating an account.

Every quiz answer visibly changes something, and the Playbook can be edited at any time.

Every step in a session can be skipped or paused and resumed exactly.

No screen shows points, ranks or a streak unless the user switched the streak on.

AI

Every quote the Coach shows exists exactly in the user's chat.

Partner and Coach JSON is valid on at least 98% of calls after one retry.

On the 30-chat test set, partners stay in character and never over-share, and the Coach's stages match the agreed ratings on at least 80% of chats.

A crisis message always lands on the fixed support screen, never on AI text.

If any model is down, the user still completes a session using backup models or authored lines.

Privacy and security

Export, delete-text and delete-account all work from the app and finish within the stated times.

A user can never read another user's data (tested for every table).

No practice text is used to improve the AI without the separate opt-in.

Screenshots in Reply Helper are not stored unless the user saves them.

Design and accessibility

Every text and control pair passes WCAG AA, in dark and light.

Every screen works with VoiceOver and TalkBack, at 200% text size and with Reduced Motion on.

Every list and AI wait has a designed empty, loading and error state.

Touch targets are at least 48pt.
