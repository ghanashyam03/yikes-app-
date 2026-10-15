import { describe, expect, it } from 'vitest';
import {
  daylightColors,
  midnightColors,
  emberColor,
  lilacColor,
  mintColor,
  honeyColor,
  skyColor,
  bubblegumColor,
  focusRing
} from './colors.js';
import { spacing } from './spacing.js';
import { radii } from './radii.js';
import { motion } from './motion.js';
import { hapticMap } from './haptics.js';
import { lightShadows, darkGlows } from './shadows.js';
import { fontFamilies, fontFallbacks, typeRoles } from './typography.js';

describe('Design Tokens Specification Compliance', () => {
  it('Daylight palette matches spec values', () => {
    expect(daylightColors.base).toBe('#F7F1E9');
    expect(daylightColors.surface1).toBe('#FFFCF7');
    expect(daylightColors.surface2).toBe('#F1E9DF');
    expect(daylightColors.ink).toBe('#29232B');
    expect(daylightColors.muted).toBe('#776D72');
    expect(daylightColors.line).toBe('#E5DACE');
    expect(daylightColors.glass.background).toBe('rgba(255, 252, 247, 0.75)');
    expect(daylightColors.glass.border).toBe('rgba(229, 218, 206, 0.60)');
    expect(daylightColors.glass.blur).toBe(16);
  });

  it('Midnight palette matches spec values', () => {
    expect(midnightColors.base).toBe('#211B25');
    expect(midnightColors.surface1).toBe('#332A37');
    expect(midnightColors.surface2).toBe('#443749');
    expect(midnightColors.ink).toBe('#FFFCF7');
    expect(midnightColors.muted).toBe('#A69AA0');
    expect(midnightColors.line).toBe('#443749');
    expect(midnightColors.glass.background).toBe('rgba(51, 42, 55, 0.75)');
    expect(midnightColors.glass.border).toBe('rgba(68, 55, 73, 0.60)');
    expect(midnightColors.glass.blur).toBe(16);
  });

  it('Accent palettes match spec values with tint and pop', () => {
    // Ember
    expect(emberColor.base).toBe('#C8664D');
    expect(emberColor.tint).toBe('#F2DCD4');
    expect(emberColor.pop).toBe('#D67C62');
    expect(emberColor.gradient.start).toBe('#D67C62');
    expect(emberColor.gradient.end).toBe('#B85842');

    // Lilac
    expect(lilacColor.base).toBe('#B9A8D9');
    expect(lilacColor.tint).toBe('#EDE6F5');
    expect(lilacColor.pop).toBe('#D4C6E9');

    // Mint
    expect(mintColor.base).toBe('#AFCDB8');
    expect(mintColor.tint).toBe('#E6F0E7');
    expect(mintColor.pop).toBe('#8FBA86');

    // Honey
    expect(honeyColor.base).toBe('#E6C278');
    expect(honeyColor.tint).toBe('#F7EED8');
    expect(honeyColor.pop).toBe('#F4D38D');

    // Sky
    expect(skyColor.base).toBe('#7BB3D6');
    expect(skyColor.tint).toBe('#EBF3F8');
    expect(skyColor.pop).toBe('#96C7E6');

    // Bubblegum
    expect(bubblegumColor.base).toBe('#E598A8');
    expect(bubblegumColor.tint).toBe('#FCE8ED');
    expect(bubblegumColor.pop).toBe('#F2A7B8');
  });

  it('Spacing adheres to 8pt scale', () => {
    expect(spacing.base).toBe(8);
    expect(spacing[0]).toBe(0);
    expect(spacing[1]).toBe(4);
    expect(spacing[2]).toBe(8);
    expect(spacing[3]).toBe(12);
    expect(spacing[4]).toBe(16);
    expect(spacing[5]).toBe(20);
    expect(spacing[6]).toBe(24);
    expect(spacing[8]).toBe(32);
    expect(spacing[10]).toBe(40);
    expect(spacing[12]).toBe(48);
    expect(spacing[16]).toBe(64);
  });

  it('Radii match spec requirements: card 28, sheet 36, pill 9999', () => {
    expect(radii.card).toBe(28);
    expect(radii.sheet).toBe(36);
    expect(radii.pill).toBe(9999);
  });

  it('Motion springs and durations match spec exactly', () => {
    expect(motion.springs.playful.stiffness).toBe(300);
    expect(motion.springs.playful.damping).toBe(26);

    expect(motion.springs.calm.stiffness).toBe(300);
    expect(motion.springs.calm.damping).toBe(30);

    expect(motion.durations.tap).toBe(180);
    expect(motion.durations.transition).toBe(280);
    expect(motion.durations.crossfade).toBe(300);
    expect(motion.durations.reveal).toBe(420);
    expect(motion.squishScale).toBe(0.94);
  });

  it('Haptic map includes required interactions', () => {
    expect(hapticMap.choice.description).toContain('soft tick');
    expect(hapticMap.lockIn.description).toContain('medium thud');
    expect(hapticMap.reveal.description).toContain('rolling pulse');
    expect(hapticMap.milestone.description).toContain('gentle double tap');
  });

  it('Focus ring recipe matches 3px Lilac ring with 2px offset', () => {
    expect(focusRing.color).toBe('#B9A8D9');
    expect(focusRing.width).toBe(3);
    expect(focusRing.offset).toBe(2);
  });

  it('Shadow and glow recipes match spec requirements', () => {
    expect(lightShadows.card.shadowColor).toBe('#30212A');
    expect(lightShadows.card.shadowOffset.height).toBe(4);
    expect(lightShadows.card.shadowRadius).toBe(7);
    expect(lightShadows.innerHighlight.borderWidth).toBe(1);

    expect(darkGlows.ember.shadowColor).toBe('#D67C62');
    expect(darkGlows.lilac.shadowColor).toBe('#B9A8D9');
    expect(darkGlows.innerHighlight.borderWidth).toBe(1);
  });

  it('Typography matches required font families and fallbacks', () => {
    expect(fontFamilies.display).toBe('Instrument Serif Italic');
    expect(fontFamilies.heading).toBe('Bricolage Grotesque');
    expect(fontFamilies.body).toBe('Plus Jakarta Sans');

    expect(fontFallbacks.display).toContain('Instrument Serif');
    expect(fontFallbacks.heading).toContain('Bricolage Grotesque');
    expect(fontFallbacks.body).toContain('Plus Jakarta Sans');

    expect(typeRoles.displayLarge.fontSize).toBe(42);
    expect(typeRoles.titleLarge.fontSize).toBe(24);
    expect(typeRoles.bodyMedium.fontSize).toBe(14);
  });
});
