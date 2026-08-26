import { moodOptions } from '@/data/content';
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

const RECOMMENDED_BY_SCORE: Record<number, MoodType[]> = {
  [-3]: ['sad', 'overwhelmed', 'anxious', 'empty', 'lonely', 'numb', 'tired', 'detached'],
  [-2]: ['sad', 'anxious', 'frustrated', 'overwhelmed', 'worried', 'tired', 'lonely', 'irritated'],
  [-1]: ['tired', 'foggy', 'uncertain', 'anxious', 'restless', 'distracted', 'worried', 'okay-ish'],
  0: ['okay-ish', 'calm', 'uncertain', 'tired', 'curious', 'restless', 'foggy', 'content'],
  1: ['calm', 'hopeful', 'content', 'okay-ish', 'curious', 'relieved', 'motivated', 'grateful'],
  2: ['hopeful', 'proud', 'grateful', 'energized', 'content', 'confident', 'connected', 'motivated'],
  3: ['proud', 'grateful', 'excited', 'energized', 'confident', 'connected', 'hopeful', 'motivated'],
};

export function recommendedFeelings(score: number): typeof moodOptions {
  const ids = RECOMMENDED_BY_SCORE[clampMoodState(score)] ?? RECOMMENDED_BY_SCORE[0];
  return ids
    .map((id) => moodOptions.find((option) => option.id === id))
    .filter((option): option is (typeof moodOptions)[number] => Boolean(option));
}

export function feelingsByGroup(group: 'pleasant' | 'mixed' | 'unpleasant') {
  return moodOptions.filter((option) => option.group === group);
}
