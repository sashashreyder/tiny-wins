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
import { AppModal } from '@/components/design-system/Modal';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { MonthCalendar } from '@/components/tiny-wins/MonthCalendar';
import { FeelingGroup, MORE_MOOD_TAGS, PRIMARY_MOOD_TAGS } from '@/data/content';
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
  feelingGroupForScore,
  feelingGroupLabels,
  feelingsByGroup,
  moreFeelings,
  moodStateLabel,
  primaryFeelings,
} from '@/lib/moodState';
import { getMoodSupportRecommendations, MoodSupportRecommendation } from '@/lib/moodSupport';
import { AppTheme, radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { MoodEntry, MoodType } from '@/types';

const CHECKIN_MAX_WIDTH = 680;
const PAGE_MAX_WIDTH = 1080;
const HISTORY_WIDE = 900;
const NO_HARD_DAYS: Record<string, boolean> = {};
const FEELING_TABS: FeelingGroup[] = ['pleasant', 'mixed', 'unpleasant'];

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

function formatFeelingList(ids: MoodType[]): string {
  return ids.map((id) => moodMeta(id).label).join(' · ');
}

export default function MoodScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HISTORY_WIDE;
  const overlayPlacement = width >= 720 ? 'center' : 'bottom';
  const addMood = useAppStore((s) => s.addMood);
  const moodEntries = useAppStore((s) => s.moodEntries);

  const todayKey = todayLocalDateKey();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stateScore, setStateScore] = useState(0);
  const [feelings, setFeelings] = useState<MoodType[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
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
  const [feelingsOpen, setFeelingsOpen] = useState(false);
  const [browseOtherFeelings, setBrowseOtherFeelings] = useState(false);
  const [feelingTab, setFeelingTab] = useState<FeelingGroup>('mixed');
  const [impactsOpen, setImpactsOpen] = useState(false);

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
  const suggestedFeelings = useMemo(() => primaryFeelings(stateScore), [stateScore]);
  const extraFeelings = useMemo(() => moreFeelings(stateScore), [stateScore]);
  const overlayFeelings = browseOtherFeelings
    ? feelingsByGroup(feelingTab)
    : extraFeelings;
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

  const openFeelingsMore = () => {
    setBrowseOtherFeelings(false);
    setFeelingTab(feelingGroupForScore(stateScore));
    setFeelingsOpen(true);
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
    setFeelingsOpen(false);
    setImpactsOpen(false);
  };

  const resetCheckIn = () => {
    setSavedCheckIn(null);
    setSupportOpen(false);
    setStep(1);
    setStateScore(0);
    setFeelings([]);
    setTags([]);
    setNote('');
    setBrowseOtherFeelings(false);
  };

  const question =
    step === 1
      ? 'How are you feeling right now?'
      : step === 2
        ? 'What best describes this feeling?'
        : step === 3
          ? 'What’s having the biggest impact on you right now?'
          : 'Anything else you want to remember?';
  const supportCopy =
    step === 1
      ? 'Start with the overall feeling.'
      : step === 2
        ? 'Choose anything that fits.'
        : step === 3
          ? 'Choose anything that feels relevant.'
          : 'Optional.';

  const savedLabels = savedCheckIn ? formatFeelingList(savedCheckIn.feelings) : '';

  return (
    <AppShell title="Mood Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={[styles.checkIn, { minHeight: isWide ? 520 : 420 }]}>
              {savedCheckIn ? (
                <>
                  <View>
                    <Text style={[styles.savedTitle, { color: theme.text }]}>✓ Logged</Text>
                    {savedLabels ? (
                      <Text style={[styles.savedDetail, { color: theme.text }]}>{savedLabels}</Text>
                    ) : null}
                    <Text style={[styles.savedState, { color: theme.textSecondary }]}>
                      {moodStateLabel(savedCheckIn.stateScore)}
                    </Text>
                  </View>
                  <View style={styles.loggedBody}>
                    {supportOpen ? (
                      <View style={styles.supportList}>
                        {recommendations.map((rec) => (
                          <SupportRecRow
                            key={rec.id}
                            rec={rec}
                            theme={theme}
                            onOpen={() => router.push(rec.route as never)}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.stepNav}>
                    <Pressable
                      onPress={resetCheckIn}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                      <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>Done</Text>
                    </Pressable>
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
                      <View />
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View>
                    {step <= 3 ? (
                      <Text style={[styles.progress, { color: theme.textMuted }]}>{step} of 3</Text>
                    ) : null}
                    <Text style={[styles.question, { color: theme.text }]}>{question}</Text>
                    <Text style={[styles.supportCopy, { color: theme.textSecondary }]}>
                      {supportCopy}
                    </Text>
                  </View>

                  <View style={styles.stepBody}>
                    {step === 1 ? (
                      <StateSlider value={stateScore} onChange={setStateScore} theme={theme} />
                    ) : null}

                    {step === 2 ? (
                      <View>
                        <View style={styles.chipGrid}>
                          {suggestedFeelings.map((option) => (
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
                          onPress={openFeelingsMore}
                          accessibilityRole="button"
                          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                          <Text style={[styles.textBtnLabel, { color: theme.accent }]}>
                            More feelings
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {step === 3 ? (
                      <View>
                        <View style={styles.chipGrid}>
                          {PRIMARY_MOOD_TAGS.map((tag) => (
                            <FeelingChip
                              key={tag}
                              label={tag}
                              selected={tags.includes(tag)}
                              theme={theme}
                              onPress={() => toggleTag(tag)}
                            />
                          ))}
                        </View>
                        <Pressable
                          onPress={() => setImpactsOpen(true)}
                          accessibilityRole="button"
                          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                          <Text style={[styles.textBtnLabel, { color: theme.accent }]}>More</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {step === 4 ? (
                      <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Optional note..."
                        placeholderTextColor={theme.textMuted}
                        multiline
                        style={[
                          styles.input,
                          { color: theme.text, borderColor: theme.surfaceBorder },
                        ]}
                      />
                    ) : null}
                  </View>

                  <View>
                    <View style={styles.summarySlot}>
                      {step === 2 && feelings.length > 0 ? (
                        <View>
                          <Text style={[styles.summaryKicker, { color: theme.textMuted }]}>
                            Selected
                          </Text>
                          <Text style={[styles.summaryText, { color: theme.text }]}>
                            {formatFeelingList(feelings)}
                          </Text>
                        </View>
                      ) : null}
                      {step === 3 && tags.length > 0 ? (
                        <View>
                          <Text style={[styles.summaryKicker, { color: theme.textMuted }]}>
                            Selected
                          </Text>
                          <Text style={[styles.summaryText, { color: theme.text }]}>
                            {tags.join(' · ')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.stepNav}>
                      {step > 1 ? (
                        <Pressable
                          onPress={() => setStep((current) => (current - 1) as 1 | 2 | 3)}
                          accessibilityRole="button"
                          style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                          <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>Back</Text>
                        </Pressable>
                      ) : (
                        <View />
                      )}
                      {step < 4 ? (
                        <GradientButton
                          label="Continue"
                          onPress={() => setStep((current) => (current + 1) as 2 | 3 | 4)}
                          small
                          style={styles.primaryBtn}
                        />
                      ) : (
                        <GradientButton
                          label="Log check-in"
                          onPress={save}
                          small
                          style={styles.primaryBtn}
                        />
                      )}
                    </View>
                  </View>
                </>
              )}
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

      <AppModal
        visible={feelingsOpen}
        onClose={() => setFeelingsOpen(false)}
        title="More feelings"
        wide
        placement={overlayPlacement}
        primaryAction={{ label: 'Done', onPress: () => setFeelingsOpen(false) }}>
        <ScrollView style={styles.overlayScroll} keyboardShouldPersistTaps="handled">
          {browseOtherFeelings ? (
            <View style={styles.tabRow}>
              {FEELING_TABS.map((group) => {
                const selected = feelingTab === group;
                return (
                  <Pressable
                    key={group}
                    onPress={() => setFeelingTab(group)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.tab,
                      {
                        borderColor: selected ? theme.accent : theme.surfaceBorder,
                        backgroundColor: selected ? accentTint(theme.mode === 'dark') : 'transparent',
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: theme.text, fontWeight: selected ? '700' : '600' },
                      ]}>
                      {feelingGroupLabels[group]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.chipGrid}>
            {overlayFeelings.map((option) => (
              <FeelingChip
                key={option.id}
                label={option.label}
                selected={feelings.includes(option.id)}
                theme={theme}
                onPress={() => toggleFeeling(option.id)}
              />
            ))}
          </View>
          {!browseOtherFeelings ? (
            <Pressable
              onPress={() => {
                setFeelingTab(feelingGroupForScore(stateScore));
                setBrowseOtherFeelings(true);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
              <Text style={[styles.textBtnLabel, { color: theme.accent }]}>
                Add a different feeling
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </AppModal>

      <AppModal
        visible={impactsOpen}
        onClose={() => setImpactsOpen(false)}
        title="More"
        wide
        placement={overlayPlacement}
        primaryAction={{ label: 'Done', onPress: () => setImpactsOpen(false) }}>
        <ScrollView style={styles.overlayScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.chipGrid}>
            {MORE_MOOD_TAGS.map((tag) => (
              <FeelingChip
                key={tag}
                label={tag}
                selected={tags.includes(tag)}
                theme={theme}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </ScrollView>
      </AppModal>
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

function SupportRecRow({
  rec,
  theme,
  onOpen,
}: {
  rec: MoodSupportRecommendation;
  theme: AppTheme;
  onOpen: () => void;
}) {
  return (
    <View style={[styles.recRow, { borderColor: theme.surfaceBorder }]}>
      <Text style={[styles.recTitle, { color: theme.text }]}>
        {rec.icon} {rec.title}
      </Text>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={rec.actionLabel}
        style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
        <Text style={[styles.textBtnLabel, { color: theme.accent }]}>{rec.actionLabel}</Text>
      </Pressable>
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
    justifyContent: 'space-between',
    gap: spacing.lg,
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
  },
  stepBody: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  summarySlot: {
    minHeight: 52,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  summaryKicker: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryText: {
    ...typography.body,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: { fontSize: 15, lineHeight: 20 },
  sliderWrap: {
    width: '100%',
    maxWidth: 600,
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
  },
  primaryBtn: {
    alignSelf: 'flex-end',
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
    ...typography.body,
    fontSize: 16,
  },
  savedTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  savedDetail: { ...typography.body, fontWeight: '700', marginBottom: 4 },
  savedState: { ...typography.body },
  loggedBody: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  supportList: { gap: 8 },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recTitle: { ...typography.body, fontWeight: '700', flex: 1, minWidth: 0 },
  overlayScroll: { maxHeight: 320 },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabLabel: { fontSize: 14, lineHeight: 18 },
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
