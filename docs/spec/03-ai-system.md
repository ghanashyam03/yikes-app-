<!-- Source sections: 5, 14 -->
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
