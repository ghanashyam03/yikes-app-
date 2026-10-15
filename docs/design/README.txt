YIKES! — SOFT POP SVG SCREEN LIBRARY
====================================

Contents
- 74 individual SVG mobile screens at 390 x 844.
- `index.html`: searchable local gallery. Open it in a browser to inspect any screen and open each SVG separately.
- `manifest.json`: screen IDs, names, palette, and filenames.
- Screen IDs follow the source spec: A01–A03, A04-Q01–Q14, A05–A16, B01–B13, C01–C18, D01–D14.

Visual direction
- Warm paper + ink editorial foundation, Ember primary actions, Lilac reflection, Mint evidence, Honey pivot.
- Buttons use clean pill shapes with a solid fill or subtle outline — no colored stripe at the left edge.
- Wince, the blob mascot, appears as a recurring visual motif in brand, onboarding, empty/loading/waiting and gentle completion moments. It is decorative, not a companion and does not speak.
- Artwork is native SVG vector markup. Most shapes, cards, text and charts can be ungrouped/edited after import; SVG-imported text is not automatically connected to live design-system text styles.

Import into Figma
1. Unzip the package.
2. Open `index.html` to preview the screens.
3. Drag individual `.svg` files into Figma, or use File → Place image.
4. For the closest typography, have Plus Jakarta Sans and Instrument Serif installed. SVG uses font-family fallback stacks.
5. Each SVG is a standalone 390 x 844 vector screen, intended to be arranged as individual frames/artboards after import.

Important limitation
This is a high-fidelity visual screen library, not a running application. Auth, live AI, reminders, persistence, subscription and security behavior must still be implemented in the app. The static sliders, toggles and CTA controls show intended states but do not perform app actions inside SVG.
