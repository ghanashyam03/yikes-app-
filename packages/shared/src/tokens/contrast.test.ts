import { describe, expect, it } from 'vitest';
import { daylightColors, midnightColors, accents } from './colors.js';
import { getContrastRatio, passesWCAGAA } from './contrast.js';

describe('WCAG AA Token Contrast Ratios', () => {
  describe('Daylight Theme', () => {
    const pairs: Array<{ name: string; fg: string; bg: string; isLarge?: boolean }> = [
      { name: 'Ink text on Base background', fg: daylightColors.ink, bg: daylightColors.base },
      { name: 'Ink text on Surface 1', fg: daylightColors.ink, bg: daylightColors.surface1 },
      { name: 'Ink text on Surface 2', fg: daylightColors.ink, bg: daylightColors.surface2 },
      { name: 'Muted text on Surface 1', fg: daylightColors.muted, bg: daylightColors.surface1 },
      { name: 'Muted text on Base background', fg: daylightColors.muted, bg: daylightColors.base, isLarge: true },
      { name: 'Ink text on Ember gradient start', fg: daylightColors.ink, bg: accents.ember.gradient.start },
      { name: 'Ink text on Ember pop', fg: daylightColors.ink, bg: accents.ember.pop },
      { name: 'Ink text on Lilac tint', fg: daylightColors.ink, bg: accents.lilac.tint },
      { name: 'Ink text on Mint tint', fg: daylightColors.ink, bg: accents.mint.tint },
      { name: 'Ink text on Honey tint', fg: daylightColors.ink, bg: accents.honey.tint },
      { name: 'Ink text on Sky tint', fg: daylightColors.ink, bg: accents.sky.tint },
      { name: 'Ink text on Bubblegum tint', fg: daylightColors.ink, bg: accents.bubblegum.tint }
    ];

    pairs.forEach(({ name, fg, bg, isLarge }) => {
      it(`${name} passes WCAG AA (ratio >= ${isLarge ? '3.0' : '4.5'})`, () => {
        const ratio = getContrastRatio(fg, bg);
        const passed = passesWCAGAA(fg, bg, isLarge);
        expect(passed, `Expected ${name} (${fg} on ${bg}) ratio ${ratio} to pass WCAG AA`).toBe(true);
      });
    });
  });

  describe('Midnight Theme', () => {
    const pairs: Array<{ name: string; fg: string; bg: string; isLarge?: boolean }> = [
      { name: 'Ink text on Base background', fg: midnightColors.ink, bg: midnightColors.base },
      { name: 'Ink text on Surface 1', fg: midnightColors.ink, bg: midnightColors.surface1 },
      { name: 'Ink text on Surface 2', fg: midnightColors.ink, bg: midnightColors.surface2 },
      { name: 'Muted text on Base background', fg: midnightColors.muted, bg: midnightColors.base },
      { name: 'Muted text on Surface 1', fg: midnightColors.muted, bg: midnightColors.surface1 },
      { name: 'Muted text on Surface 2', fg: midnightColors.muted, bg: midnightColors.surface2, isLarge: true },
      { name: 'Ink text on Primary Ember button', fg: daylightColors.ink, bg: accents.ember.pop }
    ];

    pairs.forEach(({ name, fg, bg, isLarge }) => {
      it(`${name} passes WCAG AA (ratio >= ${isLarge ? '3.0' : '4.5'})`, () => {
        const ratio = getContrastRatio(fg, bg);
        const passed = passesWCAGAA(fg, bg, isLarge);
        expect(passed, `Expected ${name} (${fg} on ${bg}) ratio ${ratio} to pass WCAG AA`).toBe(true);
      });
    });
  });
});
