import { useEffect, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { MonthCalendar } from '@/components/tiny-wins/MonthCalendar';
import { moodTags } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  dateFromDateKey,
  formatTimeForDisplay,
  isMonthAfterDateKey,
  monthFromDateKey,
  shiftMonth,
  todayLocalDateKey,
} from '@/lib/dateUtils';
import {
  MOOD_HISTORY_PREVIEW_COUNT,
  factorLabel,
  getEntryMoods,
  getStateTrend,
  groupMoodsByDate,
  moodCountByDate,
  moodMeta,
  summarizeMoodPatterns,
} from '@/lib/moodHistory';
import {
  fallbackMoodFromScore,
  feelingsByGroup,
  moodStateLabel,
  recommendedFeelings,
} from '@/lib/moodState';
import { getMoodSupportRecommendations, MoodSupportRecommendation } from '@/lib/moodSupport';
import { AppTheme, radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { MoodEntry, MoodType } from '@/types';

const CHECKIN_MAX_WIDTH = 680;
const PAGE_MAX_WIDTH = 1080;
const HISTORY_WIDE = 900;
const NO_HARD_DAYS: Record<string, boolean> = {};

function accentTint(isDark: boolean): string {
  return isDark ? 'rgba(255, 138, 122, 0.2)' : 'rgba(255, 138, 122, 0.14)';
}

function formatHistoryDate(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MoodScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HISTORY_WIDE;
  const addMood = useAppStore((s) => s.addMood);
  const moodEntries = useAppStore((s) => s.moodEntries);

  const todayKey = todayLocalDateKey();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stateScore, setStateScore] = useState(0);
  const [feelings, setFeelings] = useState<MoodType[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [showAllFeelings, setShowAllFeelings] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => monthFromDateKey(todayKey));
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [patternDays, setPatternDays] = useState<7 | 30>(7);
  const [savedCheckIn, setSavedCheckIn] = useState<{
    feelings: MoodType[];
    stateScore: number;
    tags: string[];
  } | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  const moodsByDate = useMemo(() => groupMoodsByDate(moodEntries), [moodEntries]);
  const countByDate = useMemo(() => moodCountByDate(moodEntries), [moodEntries]);
  const dayEntries = moodsByDate[selectedDateKey] ?? [];
  const isToday = selectedDateKey === todayKey;
  const visibleEntries =
    showAllEntries || dayEntries.length <= MOOD_HISTORY_PREVIEW_COUNT
      ? dayEntries
      : dayEntries.slice(0, MOOD_HISTORY_PREVIEW_COUNT);

  const nextVisibleMonth = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
  const canGoNextMonth = !isMonthAfterDateKey(
    nextVisibleMonth.year,
    nextVisibleMonth.monthIndex,
    todayKey,
  );

  const patterns = useMemo(
    () => summarizeMoodPatterns(moodEntries, patternDays, todayKey),
    [moodEntries, patternDays, todayKey],
  );
  const trend = useMemo(
    () => (patterns.sparse ? [] : getStateTrend(moodEntries, patternDays, todayKey)),
    [moodEntries, patternDays, patterns.sparse, todayKey],
  );
  const recommended = useMemo(() => recommendedFeelings(stateScore), [stateScore]);
  const recommendations = savedCheckIn
    ? getMoodSupportRecommendations(savedCheckIn.feelings, savedCheckIn.tags)
    : [];

  useEffect(() => {
    setShowAllEntries(false);
  }, [selectedDateKey]);

  const toggleFeeling = (id: MoodType) => {
    setFeelings((prev) =>
      prev.includes(id) ? prev.filter((feeling) => feeling !== id) : [...prev, id],
    );
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const selectDate = (dateKey: string) => {
    if (dateKey > todayKey) return;
    setSelectedDateKey(dateKey);
    setVisibleMonth(monthFromDateKey(dateKey));
  };

  const save = () => {
    addMood({
      mood: feelings[0] ?? fallbackMoodFromScore(stateScore),
      moods: feelings,
      stateScore,
      tags,
      note: note || undefined,
    });
    setSavedCheckIn({ feelings, stateScore, tags });
    setSupportOpen(false);
    setNote('');
  };

  const savedLabels = savedCheckIn
    ? savedCheckIn.feelings.map((id) => moodMeta(id).label).join(' · ')
    : '';

  return (
    <AppShell title="Mood Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={styles.checkIn}>
              {step <= 3 ? (
                <Text style={[styles.progress, { color: theme.textMuted }]}>{step} of 3</Text>
              ) : null}

              {step === 1 ? (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>
                    How are you feeling right now?
                  </Text>
                  <Text style={[styles.supportCopy, { color: theme.textSecondary }]}>
                    Start with the overall feeling. You can describe it more precisely next.
                  </Text>
                  <StateSlider value={stateScore} onChange={setStateScore} theme={theme} />
                  <GradientButton
                    label="Continue"
                    onPress={() => setStep(2)}
                    small
                    style={styles.primaryBtn}
                  />
                </View>
              ) : null}

              {step === 2 ? (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>
                    What best describes this feeling?
                  </Text>
                  <Text style={[styles.supportCopy, { color: theme.textSecondary }]}>
                    Choose anything that fits. Mixed feelings are completely fine.
                  </Text>
                  {feelings.length > 0 ? (
                    <View style={styles.selectedWrap}>
                      {feelings.map((id) => (
                        <FeelingChip
                          key={`selected-${id}`}
                          label={moodMeta(id).label}
                          selected
                          theme={theme}
                          onPress={() => toggleFeeling(id)}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.hint, { color: theme.textMuted }]}>
                      None selected — that’s okay.
                    </Text>
                  )}
                  <Text style={[styles.groupLabel, { color: theme.text }]}>
                    Recommended for this overall state
                  </Text>
                  <View style={styles.chipGrid}>
                    {recommended.map((option) => (
                      <FeelingChip
                        key={option.id}
                        label={option.label}
                        selected={feelings.includes(option.id)}
                        theme={theme}
                        onPress={() => toggleFeeling(option.id)}
                      />
                    ))}
                  </View>
                  <Pressable
                    onPress={() => setShowAllFeelings((open) => !open)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                    <Text style={[styles.textBtnLabel, { color: theme.accent }]}>
                      {showAllFeelings ? 'Hide full list' : 'Show all feelings'}
                    </Text>
                  </Pressable>
                  {showAllFeelings ? (
                    <View style={styles.allFeelings}>
                      <FeelingGroup
                        title="Pleasant"
                        ids={feelingsByGroup('pleasant').map((item) => item.id)}
                        selected={feelings}
                        onToggle={toggleFeeling}
                        theme={theme}
                      />
                      <FeelingGroup
                        title="Mixed / low-energy"
                        ids={feelingsByGroup('mixed').map((item) => item.id)}
                        selected={feelings}
                        onToggle={toggleFeeling}
                        theme={theme}
                      />
                      <FeelingGroup
                        title="Unpleasant"
                        ids={feelingsByGroup('unpleasant').map((item) => item.id)}
                        selected={feelings}
                        onToggle={toggleFeeling}
                        theme={theme}
                      />
                    </View>
                  ) : null}
                  <View style={styles.stepNav}>
                    <Pressable
                      onPress={() => setStep(1)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                      <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>Back</Text>
                    </Pressable>
                    <GradientButton
                      label="Continue"
                      onPress={() => setStep(3)}
                      small
                      style={styles.primaryBtn}
                    />
                  </View>
                </View>
              ) : null}

              {step === 3 ? (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>
                    What’s having the biggest impact on you right now?
                  </Text>
                  <Text style={[styles.supportCopy, { color: theme.textSecondary }]}>
                    Choose anything that feels relevant.
                  </Text>
                  <View style={styles.chipGrid}>
                    {moodTags.map((tag) => (
                      <FeelingChip
                        key={tag}
                        label={tag}
                        selected={tags.includes(tag)}
                        theme={theme}
                        onPress={() => toggleTag(tag)}
                      />
                    ))}
                  </View>
                  <View style={styles.stepNav}>
                    <Pressable
                      onPress={() => setStep(2)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                      <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>Back</Text>
                    </Pressable>
                    <GradientButton
                      label="Continue"
                      onPress={() => setStep(4)}
                      small
                      style={styles.primaryBtn}
                    />
                  </View>
                </View>
              ) : null}

              {step === 4 ? (
                <View>
                  <Text style={[styles.question, { color: theme.text }]}>
                    Anything else you want to remember?
                  </Text>
                  <Text style={[styles.supportCopy, { color: theme.textSecondary }]}>
                    Optional. You can log this check-in as it is.
                  </Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Optional note..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                  />
                  <View style={styles.stepNav}>
                    <Pressable
                      onPress={() => setStep(3)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                      <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>Back</Text>
                    </Pressable>
                    <GradientButton
                      label="Log check-in"
                      onPress={save}
                      small
                      style={styles.primaryBtn}
                    />
                  </View>
                  {savedCheckIn ? (
                    <View style={styles.savedInline}>
                      <Text style={[styles.savedTitle, { color: theme.text }]}>
                        ✓ Logged
                      </Text>
                      <Text style={[styles.savedDetail, { color: theme.textSecondary }]}>
                        {savedLabels || moodStateLabel(savedCheckIn.stateScore)}
                      </Text>
                      {!supportOpen ? (
                        <Pressable
                          onPress={() => setSupportOpen(true)}
                          accessibilityRole="button"
                          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                          <Text style={[styles.textBtnLabel, { color: theme.accent }]}>
                            Want support?
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={styles.supportArea}>
                          <Text style={[styles.supportTitle, { color: theme.text }]}>
                            Want a little support?
                          </Text>
                          <View style={[styles.recs, !isWide && styles.recsStack]}>
                            {recommendations.map((rec) => (
                              <SupportRecCard
                                key={rec.id}
                                rec={rec}
                                theme={theme}
                                stacked={!isWide}
                                onOpen={() => router.push(rec.route as never)}
                              />
                            ))}
                          </View>
                          <Pressable
                            onPress={() => setSupportOpen(false)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                            <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>
                              Hide suggestions
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
              {isWide ? (
                <View style={styles.historyWide}>
                  <View style={styles.calendarColWide}>
                    <MonthCalendar
                      year={visibleMonth.year}
                      monthIndex={visibleMonth.monthIndex}
                      selectedDateKey={selectedDateKey}
                      todayKey={todayKey}
                      activityCountByDate={countByDate}
                      hardDayByDate={NO_HARD_DAYS}
                      markerMode="dot"
                      compact
                      activityNoun={{ one: 'check-in', other: 'check-ins' }}
                      onSelectDate={selectDate}
                      onPrevMonth={() =>
                        setVisibleMonth((month) => shiftMonth(month.year, month.monthIndex, -1))
                      }
                      onNextMonth={() => {
                        const next = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
                        if (isMonthAfterDateKey(next.year, next.monthIndex, todayKey)) return;
                        setVisibleMonth(next);
                      }}
                      canGoNextMonth={canGoNextMonth}
                    />
                  </View>
                  <DayPanel
                    isToday={isToday}
                    selectedDateKey={selectedDateKey}
                    dayEntries={dayEntries}
                    visibleEntries={visibleEntries}
                    showAllEntries={showAllEntries}
                    onBackToToday={() => selectDate(todayKey)}
                    onToggleAll={() => setShowAllEntries((open) => !open)}
                  />
                </View>
              ) : (
                <View>
                  <View style={styles.calendarCol}>
                    <MonthCalendar
                      year={visibleMonth.year}
                      monthIndex={visibleMonth.monthIndex}
                      selectedDateKey={selectedDateKey}
                      todayKey={todayKey}
                      activityCountByDate={countByDate}
                      hardDayByDate={NO_HARD_DAYS}
                      markerMode="dot"
                      compact
                      activityNoun={{ one: 'check-in', other: 'check-ins' }}
                      onSelectDate={selectDate}
                      onPrevMonth={() =>
                        setVisibleMonth((month) => shiftMonth(month.year, month.monthIndex, -1))
                      }
                      onNextMonth={() => {
                        const next = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
                        if (isMonthAfterDateKey(next.year, next.monthIndex, todayKey)) return;
                        setVisibleMonth(next);
                      }}
                      canGoNextMonth={canGoNextMonth}
                    />
                  </View>
                  <DayPanel
                    isToday={isToday}
                    selectedDateKey={selectedDateKey}
                    dayEntries={dayEntries}
                    visibleEntries={visibleEntries}
                    showAllEntries={showAllEntries}
                    onBackToToday={() => selectDate(todayKey)}
                    onToggleAll={() => setShowAllEntries((open) => !open)}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Patterns</Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                A simple look at what you’ve been logging. No explanations, just patterns.
              </Text>
              <View style={styles.periodRow}>
                <PeriodChip
                  label="7 days"
                  selected={patternDays === 7}
                  onPress={() => setPatternDays(7)}
                  theme={theme}
                />
                <PeriodChip
                  label="30 days"
                  selected={patternDays === 30}
                  onPress={() => setPatternDays(30)}
                  theme={theme}
                />
              </View>
              {patterns.sparse ? (
                <Text style={[styles.sparse, { color: theme.textSecondary }]}>
                  Keep checking in. Patterns will start showing once there’s a little more data.
                </Text>
              ) : (
                <View>
                  <View style={styles.statsGrid}>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Check-ins</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>{patterns.count}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Most common feelings
                      </Text>
                      {patterns.topMoods.length > 0 ? (
                        patterns.topMoods.map((mood) => (
                          <Text key={mood.id} style={[styles.statValue, { color: theme.text }]}>
                            {mood.label} · {mood.count}
                          </Text>
                        ))
                      ) : (
                        <Text style={[styles.statValue, { color: theme.text }]}>—</Text>
                      )}
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Overall state
                      </Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.overallStateLabel ?? 'Not enough overall-state logs yet'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Common impacts
                      </Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.topFactors.length > 0
                          ? patterns.topFactors.map((factor) => factor.label).join(' · ')
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Multiple-check-in days
                      </Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.multiCheckInDays}
                      </Text>
                    </View>
                  </View>
                  {patterns.cooccurrence.length > 0 ? (
                    <View style={styles.sentences}>
                      {patterns.cooccurrence.map((sentence) => (
                        <Text
                          key={sentence}
                          style={[styles.sentence, { color: theme.textSecondary }]}>
                          {sentence}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {trend.some((point) => point.average != null) ? (
                    <View style={styles.trend}>
                      <Text style={[styles.trendLabel, { color: theme.textMuted }]}>
                        Overall state, last {patternDays} days
                      </Text>
                      <View style={styles.trendRow}>
                        {trend.map((point) => (
                          <View key={point.dateKey} style={styles.trendCol}>
                            <View
                              style={[styles.trendTrack, { backgroundColor: theme.surfaceBorder }]}>
                              <View
                                style={[
                                  styles.trendBar,
                                  {
                                    height:
                                      point.average != null
                                        ? Math.max(4, ((point.average + 3) / 6) * 32)
                                        : 2,
                                    backgroundColor:
                                      point.average != null
                                        ? theme.accentSecondary
                                        : theme.textMuted,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={[styles.trendWeekday, { color: theme.textMuted }]}>
                              {point.weekday}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

function StateSlider({
  value,
  onChange,
  theme,
}: {
  value: number;
  onChange: (next: number) => void;
  theme: AppTheme;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const pad = 16;
  const usable = Math.max(0, trackWidth - pad * 2);
  const thumbLeft = pad + ((value + 3) / 6) * usable;

  const valueFromEvent = (event: GestureResponderEvent) => {
    if (usable <= 0) return;
    const x = event.nativeEvent.locationX;
    const ratio = Math.min(1, Math.max(0, (x - pad) / usable));
    onChange(Math.round(ratio * 6) - 3);
  };

  return (
    <View style={styles.sliderWrap}>
      <Text style={[styles.stateLabel, { color: theme.text }]}>{moodStateLabel(value)}</Text>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Overall feeling"
        accessibilityValue={{ min: -3, max: 3, now: value, text: moodStateLabel(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') onChange(Math.min(3, value + 1));
          if (event.nativeEvent.actionName === 'decrement') onChange(Math.max(-3, value - 1));
        }}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={valueFromEvent}
        onResponderMove={valueFromEvent}
        style={styles.sliderHit}>
        <View style={styles.sliderInner}>
          <View style={[styles.sliderTrack, { backgroundColor: theme.surfaceBorder }]} />
          <View
            style={[
              styles.sliderFill,
              { backgroundColor: theme.accent, width: Math.max(pad, thumbLeft) },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              {
                left: thumbLeft - 14,
                backgroundColor: theme.accent,
                borderColor: theme.background,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>Very unpleasant</Text>
        <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>Very pleasant</Text>
      </View>
    </View>
  );
}

function FeelingChip({
  label,
  selected,
  theme,
  onPress,
}: {
  label: string;
  selected: boolean;
  theme: AppTheme;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accentTint(theme.mode === 'dark') : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.chipLabel,
          { color: theme.text, fontWeight: selected ? '700' : '600' },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FeelingGroup({
  title,
  ids,
  selected,
  onToggle,
  theme,
}: {
  title: string;
  ids: MoodType[];
  selected: MoodType[];
  onToggle: (id: MoodType) => void;
  theme: AppTheme;
}) {
  return (
    <View style={styles.feelingGroup}>
      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>{title}</Text>
      <View style={styles.chipGrid}>
        {ids.map((id) => (
          <FeelingChip
            key={id}
            label={moodMeta(id).label}
            selected={selected.includes(id)}
            theme={theme}
            onPress={() => onToggle(id)}
          />
        ))}
      </View>
    </View>
  );
}

function DayPanel({
  isToday,
  selectedDateKey,
  dayEntries,
  visibleEntries,
  showAllEntries,
  onBackToToday,
  onToggleAll,
}: {
  isToday: boolean;
  selectedDateKey: string;
  dayEntries: MoodEntry[];
  visibleEntries: MoodEntry[];
  showAllEntries: boolean;
  onBackToToday: () => void;
  onToggleAll: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.dayCol}>
      <Text style={[styles.historyDate, { color: theme.text }]}>
        {isToday ? 'Today’s check-ins' : formatHistoryDate(selectedDateKey)}
      </Text>
      {!isToday ? (
        <Pressable
          onPress={onBackToToday}
          accessibilityRole="button"
          accessibilityLabel="Back to today"
          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
          <Text style={[styles.textBtnLabel, { color: theme.accent }]}>Back to today</Text>
        </Pressable>
      ) : null}
      {dayEntries.length === 0 ? (
        <Text style={[styles.emptyDay, { color: theme.textSecondary }]}>
          No mood check-ins for this day.
        </Text>
      ) : (
        <View>
          {visibleEntries.map((entry, index) => (
            <MoodHistoryRow
              key={entry.id}
              entry={entry}
              showDivider={index < visibleEntries.length - 1}
            />
          ))}
          {dayEntries.length > MOOD_HISTORY_PREVIEW_COUNT ? (
            <Pressable
              onPress={onToggleAll}
              accessibilityRole="button"
              style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
              <Text style={[styles.textBtnLabel, { color: theme.accent }]}>
                {showAllEntries ? 'Show less' : `Show all ${dayEntries.length} check-ins`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

function SupportRecCard({
  rec,
  theme,
  stacked,
  onOpen,
}: {
  rec: MoodSupportRecommendation;
  theme: AppTheme;
  stacked: boolean;
  onOpen: () => void;
}) {
  return (
    <View
      style={[
        styles.recCard,
        stacked && styles.recCardStack,
        { borderColor: theme.surfaceBorder, backgroundColor: theme.backgroundAlt },
      ]}>
      <Text style={styles.recIcon}>{rec.icon}</Text>
      <View style={styles.recCopy}>
        <Text style={[styles.recTitle, { color: theme.text }]}>{rec.title}</Text>
        <Text style={[styles.recBody, { color: theme.textSecondary }]}>{rec.explanation}</Text>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={rec.actionLabel}
          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
          <Text style={[styles.textBtnLabel, { color: theme.accent }]}>{rec.actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PeriodChip({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.periodChip,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.periodChipLabel,
          { color: selected ? theme.selectedForeground : theme.text },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MoodHistoryRow({
  entry,
  showDivider,
}: {
  entry: MoodEntry;
  showDivider: boolean;
}) {
  const theme = useAppTheme();
  const time = formatTimeForDisplay(entry.createdAt);
  const descriptors = getEntryMoods(entry).map((id) => moodMeta(id).label);
  const factors = (entry.tags ?? []).map(factorLabel).filter(Boolean);
  const stateText =
    typeof entry.stateScore === 'number'
      ? moodStateLabel(entry.stateScore)
      : typeof entry.intensity === 'number'
        ? `Intensity ${entry.intensity}/5`
        : null;

  return (
    <View>
      <View style={styles.timelineRow}>
        {time ? <Text style={[styles.entryTime, { color: theme.textMuted }]}>{time}</Text> : null}
        {descriptors.length > 0 ? (
          <Text style={[styles.entryMood, { color: theme.text }]}>{descriptors.join(' · ')}</Text>
        ) : null}
        {stateText ? (
          <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>{stateText}</Text>
        ) : null}
        {factors.length > 0 ? (
          <Text style={[styles.entryMeta, { color: theme.textMuted }]}>{factors.join(' · ')}</Text>
        ) : null}
        {entry.note ? (
          <Text style={[styles.entryNote, { color: theme.textSecondary }]}>{entry.note}</Text>
        ) : null}
      </View>
      {showDivider ? (
        <View style={[styles.timelineDivider, { backgroundColor: theme.surfaceBorder }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  page: {
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  checkIn: {
    width: '100%',
    maxWidth: CHECKIN_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  progress: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: 12,
  },
  question: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 10,
  },
  supportCopy: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 28,
  },
  hint: { ...typography.body, marginBottom: spacing.md },
  selectedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  groupLabel: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: { fontSize: 15, lineHeight: 20 },
  allFeelings: { gap: 18, marginTop: 8, marginBottom: 8 },
  feelingGroup: { gap: 8 },
  sliderWrap: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
  },
  stateLabel: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  sliderHit: { height: 52, justifyContent: 'center' },
  sliderInner: { height: 28, justifyContent: 'center' },
  sliderTrack: { height: 8, borderRadius: 999 },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 10,
    height: 8,
    borderRadius: 999,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    top: 0,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  endpointLabel: { ...typography.bodySmall, fontWeight: '600', flexShrink: 1 },
  stepNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: 12,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    width: 240,
    maxWidth: '100%',
  },
  textBtn: {
    minHeight: 36,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  textBtnLabel: { ...typography.body, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 88,
    maxHeight: 120,
    marginBottom: 20,
    ...typography.body,
    fontSize: 16,
  },
  savedInline: { marginTop: 28, gap: 6 },
  savedTitle: { ...typography.body, fontWeight: '700' },
  savedDetail: { ...typography.body },
  supportArea: { marginTop: 12, gap: 8 },
  supportTitle: { ...typography.body, fontWeight: '700' },
  recs: { flexDirection: 'row', gap: spacing.sm },
  recsStack: { flexDirection: 'column' },
  recCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
  },
  recCardStack: { flex: 0, width: '100%' },
  recIcon: { fontSize: 16, lineHeight: 22 },
  recCopy: { flex: 1, minWidth: 0, gap: 2 },
  recTitle: { ...typography.bodySmall, fontWeight: '700' },
  recBody: { ...typography.bodySmall },
  section: { marginTop: 56 },
  sectionTitle: { ...typography.h2, marginBottom: 8 },
  sectionSub: { ...typography.body, fontSize: 16, lineHeight: 24, marginBottom: 16, maxWidth: 640 },
  historyWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginTop: 8,
  },
  calendarCol: {
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
    marginBottom: spacing.md,
  },
  calendarColWide: {
    width: 360,
    flexShrink: 0,
    marginTop: 8,
  },
  dayCol: { flex: 1, minWidth: 0, maxWidth: 620, marginTop: 8 },
  historyDate: { ...typography.h3, marginBottom: 6 },
  emptyDay: { ...typography.body, marginTop: 8 },
  timelineRow: { paddingVertical: 12, gap: 4 },
  entryTime: { ...typography.bodySmall },
  entryMood: { ...typography.body, fontWeight: '700' },
  entryMeta: { ...typography.bodySmall },
  entryNote: { ...typography.body },
  timelineDivider: { height: StyleSheet.hairlineWidth },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  periodChip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    minHeight: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  periodChipLabel: { ...typography.bodySmall, fontWeight: '700' },
  sparse: { ...typography.body, maxWidth: 520 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    maxWidth: 720,
  },
  stat: { flexGrow: 1, flexBasis: 200, minWidth: 160, maxWidth: 340, gap: 4 },
  statLabel: { ...typography.bodySmall, fontWeight: '600' },
  statValue: { ...typography.body, fontWeight: '700' },
  sentences: { marginTop: spacing.lg, gap: 8, maxWidth: 720 },
  sentence: { ...typography.body },
  trend: { marginTop: spacing.lg, maxWidth: 420 },
  trendLabel: { ...typography.bodySmall, marginBottom: spacing.xs },
  trendRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  trendCol: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4 },
  trendTrack: {
    width: '100%',
    maxWidth: 24,
    height: 32,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBar: { width: '100%', borderRadius: 6 },
  trendWeekday: { ...typography.caption, fontSize: 11 },
  pressed: { opacity: 0.88 },
});
