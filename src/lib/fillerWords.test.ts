import { describe, it, expect } from 'vitest';
import {
  getFillerCount,
  getFillerBreakdown,
  getFillerCountFromModel,
  DEFAULT_FILLER_LIST,
} from './fillerWords';

describe('getFillerCount', () => {
  it('returns 0 for empty or whitespace transcript', () => {
    expect(getFillerCount('')).toBe(0);
    expect(getFillerCount('   ')).toBe(0);
    expect(getFillerCount('\n\t')).toBe(0);
  });

  it('returns 0 when transcript has no fillers', () => {
    expect(getFillerCount('I went to the store today.')).toBe(0);
    expect(getFillerCount('Hello world.')).toBe(0);
  });

  it('counts single filler', () => {
    expect(getFillerCount('I um said hello')).toBe(1);
    expect(getFillerCount('uh we need to go')).toBe(1);
  });

  it('counts multiple same filler', () => {
    expect(getFillerCount('um um')).toBe(2);
    expect(getFillerCount('like like like')).toBe(3);
  });

  it('counts multiple different fillers', () => {
    expect(getFillerCount('um and uh well')).toBe(3);
    expect(getFillerCount('so um like actually')).toBe(4);
  });

  it('counts phrase filler "you know" once', () => {
    expect(getFillerCount('so you know we did')).toBe(2); // "so" + "you know"
  });

  it('counts phrase "you know" twice when present twice', () => {
    expect(getFillerCount('you know I think you know')).toBe(2);
  });

  it('uses word boundary: "um" in "instrument" does not count', () => {
    expect(getFillerCount('instrument')).toBe(0);
  });

  it('counts "like" as filler in "I like it" (current behavior)', () => {
    expect(getFillerCount('I like it')).toBe(1);
  });

  it('uses custom wordList when provided', () => {
    expect(getFillerCount('foo bar baz', ['foo', 'baz'])).toBe(2);
    expect(getFillerCount('um and uh', ['um'])).toBe(1);
  });

  it('normalizes: uppercase "UM" is counted', () => {
    expect(getFillerCount('I UM said')).toBe(1);
    expect(getFillerCount('UM UM')).toBe(2);
  });
});

describe('getFillerBreakdown', () => {
  it('returns all fillers with count 0 for empty transcript', () => {
    const result = getFillerBreakdown('');
    expect(result).toHaveLength(DEFAULT_FILLER_LIST.length);
    expect(result.every((item) => item.count === 0)).toBe(true);
    expect(result.map((r) => r.word)).toEqual(DEFAULT_FILLER_LIST);
  });

  it('returns only fillers with count > 0 for non-empty transcript', () => {
    const result = getFillerBreakdown('um so like');
    expect(result.length).toBeLessThanOrEqual(DEFAULT_FILLER_LIST.length);
    expect(result.every((item) => item.count > 0)).toBe(true);
    const um = result.find((r) => r.word === 'um');
    const so = result.find((r) => r.word === 'so');
    const like = result.find((r) => r.word === 'like');
    expect(um?.count).toBe(1);
    expect(so?.count).toBe(1);
    expect(like?.count).toBe(1);
  });
});

describe('getFillerCountFromModel', () => {
  it('resolves to same value as getFillerCount for given transcript', async () => {
    const transcript = 'um so like actually';
    const fromModel = await getFillerCountFromModel(transcript);
    expect(fromModel).toBe(getFillerCount(transcript));
    expect(fromModel).toBe(4);
  });

  it('resolves to 0 for empty transcript', async () => {
    expect(await getFillerCountFromModel('')).toBe(0);
  });
});
