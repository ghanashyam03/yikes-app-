<!-- Source sections: 8 -->
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
