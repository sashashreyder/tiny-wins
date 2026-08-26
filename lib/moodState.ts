import { FeelingGroup, moodOptions } from '@/data/content';
import { MoodType } from '@/types';

export const MOOD_STATE_MIN = -3;
export const MOOD_STATE_MAX = 3;

export const moodStateLabels: Record<number, string> = {
  [-3]: 'Very unpleasant',
  [-2]: 'Unpleasant',
  [-1]: 'Slightly unpleasant',
  0: 'Neutral',
  1: 'Slightly pleasant',
  2: 'Pleasant',
  3: 'Very pleasant',
};

export const feelingGroupLabels: Record<FeelingGroup, string> = {
  pleasant: 'Pleasant',
  mixed: 'Neutral / mixed',
  unpleasant: 'Unpleasant',
};

export function clampMoodState(value: number): number {
  const rounded = Math.round(value);
  return Math.min(MOOD_STATE_MAX, Math.max(MOOD_STATE_MIN, rounded));
}

export function moodStateLabel(score: number): string {
  return moodStateLabels[clampMoodState(score)] ?? 'Neutral';
}

export function fallbackMoodFromScore(score: number | undefined): MoodType {
  const value = clampMoodState(score ?? 0);
  if (value <= -2) return 'sad';
  if (value === -1) return 'foggy';
  if (value === 0) return 'okay-ish';
  if (value === 1) return 'hopeful';
  return 'proud';
}

export function feelingGroupForScore(score: number): FeelingGroup {
  const value = clampMoodState(score);
  if (value < 0) return 'unpleasant';
  if (value > 0) return 'pleasant';
  return 'mixed';
}

/** ~8–12 first-screen suggestions for the current overall state. */
const PRIMARY_BY_SCORE: Record<number, MoodType[]> = {
  [-3]: ['sad', 'overwhelmed', 'empty', 'lonely', 'anxious', 'scared', 'stressed', 'angry', 'numb', 'detached'],
  [-2]: ['sad', 'anxious', 'frustrated', 'overwhelmed', 'worried', 'irritated', 'stressed', 'lonely', 'tired', 'foggy'],
  [-1]: ['anxious', 'worried', 'frustrated', 'tired', 'foggy', 'uncertain', 'restless', 'overwhelmed', 'okay-ish', 'distracted'],
  0: ['okay-ish', 'uncertain', 'tired', 'foggy', 'thoughtful', 'restless', 'distracted', 'bored', 'numb', 'surprised'],
  1: ['calm', 'content', 'hopeful', 'grateful', 'relieved', 'curious', 'motivated', 'okay-ish', 'thoughtful', 'tired'],
  2: ['hopeful', 'proud', 'grateful', 'energized', 'content', 'confident', 'connected', 'motivated', 'calm', 'curious'],
  3: ['proud', 'excited', 'energized', 'happy', 'playful', 'grateful', 'confident', 'connected', 'hopeful', 'motivated'],
};

function optionsFor(ids: MoodType[]) {
  return ids
    .map((id) => moodOptions.find((option) => option.id === id))
    .filter((option): option is (typeof moodOptions)[number] => Boolean(option));
}

export function primaryFeelings(score: number) {
  const ids = PRIMARY_BY_SCORE[clampMoodState(score)] ?? PRIMARY_BY_SCORE[0];
  return optionsFor(ids);
}

/** @deprecated Use primaryFeelings. Kept so Fast Refresh does not crash older MoodScreen bundles. */
export function recommendedFeelings(score: number) {
  return primaryFeelings(score);
}

/** Extra same-context feelings for the More overlay (not the opposite category). */
export function moreFeelings(score: number) {
  const group = feelingGroupForScore(score);
  const primary = new Set(
    (PRIMARY_BY_SCORE[clampMoodState(score)] ?? PRIMARY_BY_SCORE[0]) as MoodType[],
  );
  const groups: FeelingGroup[] =
    group === 'pleasant'
      ? ['pleasant', 'mixed']
      : group === 'unpleasant'
        ? ['unpleasant', 'mixed']
        : ['mixed'];
  return moodOptions.filter((option) => groups.includes(option.group) && !primary.has(option.id));
}

export function feelingsByGroup(group: FeelingGroup) {
  return moodOptions.filter((option) => option.group === group);
}
