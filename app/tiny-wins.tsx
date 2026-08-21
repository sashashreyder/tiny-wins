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

function formatCountedSummary(count: number, isToday: boolean): string {
  if (count === 0) {
    return isToday ? 'Nothing counted yet' : 'Nothing counted';
  }
  const noun = count === 1 ? 'thing' : 'things';
  return isToday ? `${count} ${noun} counted today` : `${count} ${noun} counted`;
}

function categoryLabel(category: TinyWinCategory): string {
  return category.replace('-', ' ');
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
    selectDate(shiftDateKey(selectedDateKey, -1));
  };

  const goToNextDay = () => {
    const next = shiftDateKey(selectedDateKey, 1);
    if (next > todayKey) return;
    selectDate(next);
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
            <Text style={[styles.headline, { color: theme.text }]}>Tiny is real.</Text>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>
              Log small actions. Starting counts. Finishing optional.
            </Text>

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
                <View style={styles.dateTextWrap}>
                  <Text style={[styles.dateTitle, { color: theme.text }]}>
                    {formatWeekdayLongDate(selectedDateKey)}
                  </Text>
                  <Text style={[styles.dateHint, { color: theme.textMuted }]}>
                    {calendarOpen ? 'Tap to hide calendar' : 'Tap to browse history'}
                  </Text>
                </View>
                <Text style={styles.calendarIcon}>{calendarOpen ? '📅 ▴' : '📅'}</Text>
              </Pressable>
              <Text style={[styles.countSummary, { color: theme.textSecondary }]}>
                {formatCountedSummary(selectedCount, isToday)}
              </Text>

              <View style={styles.dayNav}>
                <Pressable
                  onPress={goToPreviousDay}
                  accessibilityRole="button"
                  accessibilityLabel="Previous day"
                  style={({ pressed }) => [
                    styles.dayNavBtn,
                    { borderColor: theme.surfaceBorder, backgroundColor: theme.backgroundAlt },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.dayNavLabel, { color: theme.text }]}>‹ Prev</Text>
                </Pressable>
                <Pressable
                  onPress={goToToday}
                  accessibilityRole="button"
                  accessibilityLabel="Today"
                  style={({ pressed }) => [
                    styles.dayNavBtn,
                    {
                      borderColor: isToday ? theme.accent : theme.surfaceBorder,
                      backgroundColor: isToday ? theme.accentTertiary : theme.backgroundAlt,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.dayNavLabel, { color: theme.text }]}>Today</Text>
                </Pressable>
                <Pressable
                  onPress={isToday ? undefined : goToNextDay}
                  disabled={isToday}
                  accessibilityRole="button"
                  accessibilityLabel="Next day"
                  accessibilityState={{ disabled: isToday }}
                  style={({ pressed }) => [
                    styles.dayNavBtn,
                    { borderColor: theme.surfaceBorder, backgroundColor: theme.backgroundAlt },
                    isToday && styles.navDisabled,
                    pressed && !isToday && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.dayNavLabel,
                      { color: isToday ? theme.textMuted : theme.text },
                    ]}>
                    Next ›
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

            <View style={styles.hardDayBlock}>
              {isToday ? (
                <>
                  <Text style={[styles.hardDayQuestion, { color: theme.text }]}>Hard day?</Text>
                  <TagPill
                    label={selectedIsHard ? 'Hard day marked ✓' : 'Mark today as a hard day'}
                    selected={selectedIsHard}
                    onPress={() => setHardDay(todayKey, !selectedIsHard)}
                  />
                  <Text style={[styles.hardDayHint, { color: theme.textMuted }]}>
                    Small things deserve extra credit on hard days.
                  </Text>
                </>
              ) : (
                <Text style={[styles.hardDayHint, { color: theme.textSecondary }]}>
                  {selectedIsHard ? 'Hard day ✓' : 'Not marked as a hard day'}
                </Text>
              )}
            </View>

            {isToday ? (
              <>
                <SectionHeader title="Add a tiny win" />
                <Text style={[styles.subhead, { color: theme.text }]}>Quick log</Text>
                <Text style={[styles.helper, { color: theme.textMuted }]}>
                  Pick a category, then tap something that counted.
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
                <View style={styles.pillGrid}>
                  {tinyWinTemplates[category].map((title) => (
                    <TagPill key={title} label={title} onPress={() => logWin(title)} />
                  ))}
                </View>

                <Text style={[styles.subhead, { color: theme.text }]}>Add your own</Text>
                <Text style={[styles.helper, { color: theme.textMuted }]}>
                  Anything small that mattered counts.
                </Text>
                <GlassCard>
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
                </GlassCard>
              </>
            ) : (
              <GradientButton
                label="Back to today to log a win →"
                onPress={goToToday}
                variant="secondary"
                small
              />
            )}

            <SectionHeader
              title={isToday ? 'Today’s wins' : 'Wins from this day'}
              subtitle={formatCountedSummary(selectedCount, isToday)}
            />
            {activitiesForSelectedDay.length === 0 ? (
              <GlassCard>
                <Text style={{ color: theme.text, fontWeight: '600' }}>
                  {isToday
                    ? 'Nothing counted yet — and the day is not over.'
                    : 'Nothing was logged on this day.'}
                </Text>
                {!isToday ? (
                  <Text style={{ color: theme.textMuted, marginTop: 4, ...typography.bodySmall }}>
                    That does not mean nothing happened.
                  </Text>
                ) : null}
              </GlassCard>
            ) : (
              activitiesForSelectedDay.map((entry) => (
                <DayTimelineRow key={entry.id} entry={entry} />
              ))
            )}

            <SupportiveMessage message="Progress is not only finished projects." />
          </View>
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

function DayTimelineRow({ entry }: { entry: ActivityEntry }) {
  const theme = useAppTheme();
  const time = formatTimeForDisplay(entry.createdAt);
  const source = activitySourceLabels[entry.source];
  const emoji = activitySourceEmojis[entry.source];
  const showXp = typeof entry.xp === 'number' && entry.xp > 0;
  const meta = [source, showXp ? `+${entry.xp} XP` : null].filter(Boolean).join(' · ');

  return (
    <GlassCard style={styles.winRow}>
      <View style={styles.winText}>
        {time ? (
          <Text style={{ color: theme.textMuted, ...typography.caption }}>{time}</Text>
        ) : null}
        <Text style={{ color: theme.text, fontWeight: '600' }}>
          {emoji} {entry.title}
        </Text>
        {meta ? (
          <Text style={{ color: theme.textMuted, ...typography.caption }}>{meta}</Text>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  page: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  headline: { ...typography.h1 },
  sub: { ...typography.body, marginBottom: spacing.sm },
  dateCard: { marginBottom: spacing.xs },
  todayEyebrow: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  dateTextWrap: { flex: 1, minWidth: 0 },
  dateTitle: { ...typography.h3 },
  dateHint: { ...typography.caption, marginTop: 2 },
  calendarIcon: { fontSize: 18 },
  countSummary: { ...typography.bodySmall, marginTop: spacing.xs },
  dayNav: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dayNavBtn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  dayNavLabel: { ...typography.caption, fontWeight: '700' },
  navDisabled: { opacity: 0.45 },
  calendarSlot: { marginTop: spacing.md },
  hardDayBlock: { gap: spacing.xs, marginBottom: spacing.sm },
  hardDayQuestion: { ...typography.bodySmall, fontWeight: '700' },
  hardDayHint: { ...typography.caption },
  helper: { ...typography.caption, marginBottom: spacing.xs },
  subhead: { ...typography.h3, marginTop: spacing.xs },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  winRow: { marginBottom: spacing.xs },
  winText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.88 },
});
