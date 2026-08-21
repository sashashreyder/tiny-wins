import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { TagPill } from '@/components/design-system/Tags';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { MonthCalendar } from '@/components/tiny-wins/MonthCalendar';
import { tinyWinTemplates } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  activitySourceEmojis,
  activitySourceLabels,
  buildActivityTimeline,
  groupActivitiesByDate,
} from '@/lib/activityTimeline';
import {
  dateFromDateKey,
  formatTimeForDisplay,
  formatWeekdayLongDate,
  isMonthAfterDateKey,
  monthFromDateKey,
  shiftDateKey,
  shiftMonth,
  todayLocalDateKey,
} from '@/lib/dateUtils';
import { radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { ActivityEntry, TinyWinCategory } from '@/types';

const CONTENT_MAX_WIDTH = 1040;
const categories = Object.keys(tinyWinTemplates) as TinyWinCategory[];

type LogMode = 'quick' | 'custom';

function formatCountedSummary(count: number, isToday: boolean): string {
  if (count === 0) {
    return isToday ? 'Nothing counted yet' : 'Nothing counted';
  }
  const noun = count === 1 ? 'thing' : 'things';
  return isToday ? `${count} ${noun} counted today` : `${count} ${noun} counted`;
}

function categoryLabel(category: TinyWinCategory): string {
  const spaced = category.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatNavDay(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function TinyWinsScreen() {
  const theme = useAppTheme();
  const addTinyWin = useAppStore((s) => s.addTinyWin);
  const setHardDay = useAppStore((s) => s.setHardDay);
  const dayMetadata = useAppStore((s) => s.dayMetadata);
  const tinyWins = useAppStore((s) => s.tinyWins);
  const waterEntries = useAppStore((s) => s.waterEntries);
  const sleepEntries = useAppStore((s) => s.sleepEntries);
  const moodEntries = useAppStore((s) => s.moodEntries);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const selfCareChecks = useAppStore((s) => s.selfCareChecks);
  const homeCareTasks = useAppStore((s) => s.homeCareTasks);

  const todayKey = todayLocalDateKey();
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => monthFromDateKey(todayKey));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [logMode, setLogMode] = useState<LogMode>('quick');
  const [category, setCategory] = useState<TinyWinCategory>('self-care');
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');

  const activityTimeline = useMemo(
    () =>
      buildActivityTimeline({
        tinyWins,
        waterEntries,
        sleepEntries,
        moodEntries,
        focusSessions,
        selfCareChecks,
        homeCareTasks,
      }),
    [
      tinyWins,
      waterEntries,
      sleepEntries,
      moodEntries,
      focusSessions,
      selfCareChecks,
      homeCareTasks,
    ],
  );

  const activitiesByDate = useMemo(
    () => groupActivitiesByDate(activityTimeline),
    [activityTimeline],
  );

  const activityCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [dateKey, entries] of Object.entries(activitiesByDate)) {
      counts[dateKey] = entries.length;
    }
    return counts;
  }, [activitiesByDate]);

  const hardDayByDate = useMemo(() => {
    const marks: Record<string, boolean> = {};
    for (const [dateKey, meta] of Object.entries(dayMetadata ?? {})) {
      if (meta?.isHardDay) marks[dateKey] = true;
    }
    return marks;
  }, [dayMetadata]);

  const isToday = selectedDateKey === todayKey;
  const selectedCount = activityCountByDate[selectedDateKey] ?? 0;
  const activitiesForSelectedDay = activitiesByDate[selectedDateKey] ?? [];
  const selectedIsHard = dayMetadata?.[selectedDateKey]?.isHardDay ?? false;
  const previousDateKey = shiftDateKey(selectedDateKey, -1);
  const nextDateKey = shiftDateKey(selectedDateKey, 1);
  const nextIsFuture = nextDateKey > todayKey;
  const nextVisibleMonth = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
  const canGoNextMonth = !isMonthAfterDateKey(
    nextVisibleMonth.year,
    nextVisibleMonth.monthIndex,
    todayKey,
  );

  const selectDate = (dateKey: string) => {
    if (dateKey > todayKey) return;
    setSelectedDateKey(dateKey);
    setVisibleMonth(monthFromDateKey(dateKey));
  };

  const goToToday = () => {
    selectDate(todayKey);
  };

  const goToPreviousDay = () => {
    selectDate(previousDateKey);
  };

  const goToNextDay = () => {
    if (nextIsFuture) return;
    selectDate(nextDateKey);
  };

  const toggleCalendar = () => {
    setCalendarOpen((open) => {
      if (!open) setVisibleMonth(monthFromDateKey(selectedDateKey));
      return !open;
    });
  };

  const logWin = (title: string) => {
    addTinyWin(title, category, selectedIsHard, note || undefined);
    setNote('');
    setCustom('');
  };

  return (
    <AppShell title="Tiny Wins">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.page}>
            <View style={styles.intro}>
              <Text style={[styles.headline, { color: theme.text }]}>Tiny is real.</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Log small actions. Starting counts. Finishing optional.
              </Text>
            </View>

            <GlassCard style={styles.dateCard}>
              {isToday ? (
                <Text style={[styles.todayEyebrow, { color: theme.accent }]}>TODAY</Text>
              ) : null}
              <Pressable
                onPress={toggleCalendar}
                accessibilityRole="button"
                accessibilityState={{ expanded: calendarOpen }}
                accessibilityLabel={`${formatWeekdayLongDate(selectedDateKey)}. ${calendarOpen ? 'Hide' : 'Show'} calendar`}
                style={({ pressed }) => [styles.dateRow, pressed && styles.pressed]}>
                <Text style={[styles.dateTitle, { color: theme.text }]} numberOfLines={1}>
                  {formatWeekdayLongDate(selectedDateKey)}
                </Text>
                <Text style={styles.calendarIcon}>{calendarOpen ? '📅 ▴' : '📅'}</Text>
              </Pressable>
              <Text style={[styles.countSummary, { color: theme.textSecondary }]}>
                {formatCountedSummary(selectedCount, isToday)}
              </Text>

              {isToday ? (
                <View style={styles.hardDayInCard}>
                  <Pressable
                    onPress={() => setHardDay(todayKey, !selectedIsHard)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedIsHard }}
                    accessibilityLabel={selectedIsHard ? 'Hard day marked' : 'Mark today as a hard day'}
                    style={({ pressed }) => [
                      styles.hardChip,
                      {
                        borderColor: selectedIsHard ? theme.accent : theme.surfaceBorder,
                        backgroundColor: selectedIsHard ? theme.accentTertiary : 'transparent',
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.hardChipLabel, { color: theme.text }]}>
                      {selectedIsHard ? '♥ Hard day marked' : '♡ Hard day'}
                    </Text>
                  </Pressable>
                  <Text style={[styles.hardDayHint, { color: theme.textMuted }]}>
                    Small things deserve extra credit on hard days.
                  </Text>
                </View>
              ) : selectedIsHard ? (
                <Text style={[styles.hardDayHint, { color: theme.textSecondary }]}>♥ Hard day</Text>
              ) : null}

              <View style={styles.dayNav}>
                <Pressable
                  onPress={goToPreviousDay}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Previous day, ${formatNavDay(previousDateKey)}`}
                  style={({ pressed }) => [styles.dayNavSide, pressed && styles.pressed]}>
                  <Text style={[styles.dayNavLabel, { color: theme.text }]} numberOfLines={1}>
                    ← {formatNavDay(previousDateKey)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={goToToday}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Today"
                  style={({ pressed }) => [
                    styles.dayNavToday,
                    isToday && { backgroundColor: theme.accentTertiary },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.dayNavLabel,
                      { color: theme.text, fontWeight: isToday ? '700' : '600' },
                    ]}>
                    Today
                  </Text>
                </Pressable>
                <Pressable
                  onPress={nextIsFuture ? undefined : goToNextDay}
                  disabled={nextIsFuture}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Next day, ${formatNavDay(nextDateKey)}`}
                  accessibilityState={{ disabled: nextIsFuture }}
                  style={({ pressed }) => [
                    styles.dayNavSide,
                    styles.dayNavRight,
                    nextIsFuture && styles.navDisabled,
                    pressed && !nextIsFuture && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.dayNavLabel,
                      { color: nextIsFuture ? theme.textMuted : theme.text },
                    ]}
                    numberOfLines={1}>
                    {formatNavDay(nextDateKey)} →
                  </Text>
                </Pressable>
              </View>

              {calendarOpen ? (
                <View style={styles.calendarSlot}>
                  <MonthCalendar
                    year={visibleMonth.year}
                    monthIndex={visibleMonth.monthIndex}
                    selectedDateKey={selectedDateKey}
                    todayKey={todayKey}
                    activityCountByDate={activityCountByDate}
                    hardDayByDate={hardDayByDate}
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
              ) : null}
            </GlassCard>

            {isToday ? (
              <View style={styles.section}>
                <SectionHeader title="Add a tiny win" />
                <View
                  style={[
                    styles.modeSwitch,
                    { borderColor: theme.surfaceBorder, backgroundColor: theme.surface },
                  ]}>
                  <Pressable
                    onPress={() => setLogMode('quick')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: logMode === 'quick' }}
                    style={({ pressed }) => [
                      styles.modeBtn,
                      logMode === 'quick' && { backgroundColor: theme.accentTertiary },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.modeLabel,
                        { color: theme.text, fontWeight: logMode === 'quick' ? '700' : '600' },
                      ]}>
                      Quick log
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setLogMode('custom')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: logMode === 'custom' }}
                    style={({ pressed }) => [
                      styles.modeBtn,
                      logMode === 'custom' && { backgroundColor: theme.accentTertiary },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.modeLabel,
                        { color: theme.text, fontWeight: logMode === 'custom' ? '700' : '600' },
                      ]}>
                      Add my own
                    </Text>
                  </Pressable>
                </View>

                {logMode === 'quick' ? (
                  <View style={styles.modeBody}>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>What kind of win?</Text>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>
                      Pick a category to see quick options.
                    </Text>
                    <View style={styles.pillGrid}>
                      {categories.map((cat) => (
                        <TagPill
                          key={cat}
                          label={categoryLabel(cat)}
                          selected={category === cat}
                          onPress={() => setCategory(cat)}
                        />
                      ))}
                    </View>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>Quick options</Text>
                    <View style={styles.pillGrid}>
                      {tinyWinTemplates[category].map((title) => (
                        <TagPill key={title} label={title} onPress={() => logWin(title)} />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.modeBody}>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>
                      Anything small that mattered counts.
                    </Text>
                    <TextInput
                      value={custom}
                      onChangeText={setCustom}
                      placeholder="What did you do?"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                    />
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="Optional note"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
                    />
                    <GradientButton
                      label="Log tiny win"
                      onPress={() => custom.trim() && logWin(custom.trim())}
                      small
                    />
                  </View>
                )}
              </View>
            ) : (
              <Pressable
                onPress={goToToday}
                accessibilityRole="button"
                accessibilityLabel="Back to today to log a win"
                style={({ pressed }) => [
                  styles.backToToday,
                  { borderColor: theme.surfaceBorder },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.backToTodayLabel, { color: theme.text }]}>
                  Back to today to log a win →
                </Text>
              </Pressable>
            )}

            <View style={styles.section}>
              <SectionHeader title={isToday ? 'Today’s wins' : 'Wins from this day'} />
              {activitiesForSelectedDay.length === 0 ? (
                <View style={styles.emptyDay}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    {isToday
                      ? 'Nothing counted yet — and the day is not over.'
                      : 'Nothing was logged on this day.'}
                  </Text>
                  {!isToday ? (
                    <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                      That does not mean nothing happened.
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.timeline}>
                  {activitiesForSelectedDay.map((entry, index) => (
                    <DayTimelineRow
                      key={entry.id}
                      entry={entry}
                      showDivider={index < activitiesForSelectedDay.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>

            <SupportiveMessage message="Progress is not only finished projects." />
          </View>
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

function DayTimelineRow({
  entry,
  showDivider,
}: {
  entry: ActivityEntry;
  showDivider: boolean;
}) {
  const theme = useAppTheme();
  const time = formatTimeForDisplay(entry.createdAt);
  const source = activitySourceLabels[entry.source];
  const emoji = activitySourceEmojis[entry.source];
  const showXp = typeof entry.xp === 'number' && entry.xp > 0;
  const meta = [source, showXp ? `+${entry.xp} XP` : null].filter(Boolean).join(' · ');

  return (
    <View>
      <View style={styles.timelineRow}>
        <View style={[styles.timelineDot, { backgroundColor: theme.accentTertiary }]} />
        <View style={styles.winText}>
          {time ? (
            <Text style={[styles.timelineTime, { color: theme.textMuted }]}>{time}</Text>
          ) : null}
          <Text style={[styles.timelineTitle, { color: theme.text }]}>
            {emoji} {entry.title}
          </Text>
          {meta ? (
            <Text style={[styles.timelineMeta, { color: theme.textMuted }]}>{meta}</Text>
          ) : null}
        </View>
      </View>
      {showDivider ? (
        <View style={[styles.timelineDivider, { backgroundColor: theme.surfaceBorder }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  page: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  intro: { marginBottom: spacing.lg },
  headline: { ...typography.h1 },
  sub: { ...typography.body, marginTop: spacing.xs },
  dateCard: { marginBottom: spacing.lg },
  todayEyebrow: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  dateTitle: { ...typography.h3, flex: 1, minWidth: 0 },
  calendarIcon: { fontSize: 18 },
  countSummary: { ...typography.bodySmall, marginTop: 2 },
  hardDayInCard: { marginTop: spacing.sm, gap: 4 },
  hardChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  hardChipLabel: { ...typography.caption, fontWeight: '700' },
  hardDayHint: { ...typography.caption },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    minHeight: 44,
  },
  dayNavSide: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayNavRight: { alignItems: 'flex-end' },
  dayNavToday: {
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  dayNavLabel: { ...typography.caption, fontWeight: '600' },
  navDisabled: { opacity: 0.45 },
  calendarSlot: { marginTop: spacing.md },
  section: { marginBottom: spacing.lg },
  modeSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.full,
    padding: 3,
    marginBottom: spacing.md,
  },
  modeBtn: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
  },
  modeLabel: { ...typography.caption, fontWeight: '600' },
  modeBody: { gap: spacing.xs },
  fieldLabel: { ...typography.bodySmall, fontWeight: '700', marginTop: spacing.xs },
  helper: { ...typography.caption, marginBottom: spacing.xs },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  backToToday: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: spacing.lg,
  },
  backToTodayLabel: { ...typography.bodySmall, fontWeight: '700' },
  emptyDay: { paddingVertical: spacing.sm },
  emptyTitle: { ...typography.body, fontWeight: '600' },
  emptySub: { ...typography.bodySmall, marginTop: 4 },
  timeline: { marginTop: spacing.xs },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  winText: { flex: 1, minWidth: 0, gap: 2 },
  timelineTime: { ...typography.caption },
  timelineTitle: { ...typography.body, fontWeight: '600' },
  timelineMeta: { ...typography.caption },
  timelineDivider: { height: StyleSheet.hairlineWidth, marginLeft: 20 },
  pressed: { opacity: 0.88 },
});
