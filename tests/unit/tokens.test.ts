import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const variables = readFileSync(
  resolve(__dirname, '../../src/styles/variables.css'),
  'utf-8',
);
const global = readFileSync(
  resolve(__dirname, '../../src/styles/global.css'),
  'utf-8',
);

describe('design tokens', () => {
  it('defines 5 color tokens', () => {
    expect(variables).toMatch(/--ink-900:\s*#1F1B16/);
    expect(variables).toMatch(/--paper-50:\s*#FAF6F0/);
    expect(variables).toMatch(/--ember-500:\s*#FF6B6B/);
    expect(variables).toMatch(/--ember-700:\s*#E64C4C/);
    expect(variables).toMatch(/--fog-300:\s*#C7BEB2/);
  });

  it('defines 2 font tokens', () => {
    expect(variables).toMatch(/--font-display:\s*'Fraunces'/);
    expect(variables).toMatch(/--font-body:\s*'Inter'/);
  });

  it('global.css applies paper-50 background', () => {
    expect(global).toMatch(/background-color:\s*var\(--paper-50\)/);
  });

  it('global.css applies font-body token', () => {
    expect(global).toMatch(/font-family:\s*var\(--font-body\)/);
  });
});
