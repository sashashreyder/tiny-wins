import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
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
import { AppTheme, radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { ActivityEntry, TinyWinCategory } from '@/types';

const CONTENT_MAX_WIDTH = 1040;
const WIDE_BREAKPOINT = 900;
const CUSTOM_FORM_MAX_WIDTH = 620;
const TIMELINE_MAX_WIDTH = 800;
const TIMELINE_PREVIEW_COUNT = 5;
const categories = Object.keys(tinyWinTemplates) as TinyWinCategory[];

type LogMode = 'quick' | 'custom';

function formatCountedSummary(count: number, isToday: boolean): string {
  if (count === 0) {
    return isToday ? 'Nothing counted yet' : 'Nothing counted';
  }
  const noun = count === 1 ? 'thing' : 'things';
  return isToday ? `${count} ${noun} counted today` : `${count} ${noun} counted`;
}

function categoryLabel(category: string): string {
  const spaced = category.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatNavDay(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function timelineMeta(entry: ActivityEntry): string {
  const sourceLabel =
    entry.source === 'tiny-win' && entry.category
      ? categoryLabel(entry.category)
      : activitySourceLabels[entry.source];
  const showXp = typeof entry.xp === 'number' && entry.xp > 0;
  return [sourceLabel, showXp ? `+${entry.xp} XP` : null].filter(Boolean).join(' · ');
}

export default function TinyWinsScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
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
  const [hardWhyOpen, setHardWhyOpen] = useState(false);
  const [category, setCategory] = useState<TinyWinCategory>('self-care');
  const [custom, setCustom] = useState('');
  const [note, setNote] = useState('');
  const [showAllWins, setShowAllWins] = useState(false);

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
  const visibleWins =
    showAllWins || activitiesForSelectedDay.length <= TIMELINE_PREVIEW_COUNT
      ? activitiesForSelectedDay
      : activitiesForSelectedDay.slice(0, TIMELINE_PREVIEW_COUNT);
  const previousDateKey = shiftDateKey(selectedDateKey, -1);
  const nextDateKey = shiftDateKey(selectedDateKey, 1);
  const nextIsFuture = nextDateKey > todayKey;
  const nextVisibleMonth = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
  const canGoNextMonth = !isMonthAfterDateKey(
    nextVisibleMonth.year,
    nextVisibleMonth.monthIndex,
    todayKey,
  );

  useEffect(() => {
    setShowAllWins(false);
  }, [selectedDateKey]);

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

            <GlassCard
              style={
                calendarOpen ? [styles.dateCard, styles.dateCardWithCalendar] : styles.dateCard
              }>
              <View style={isWide ? styles.dateTopWide : styles.dateTopStack}>
                <Pressable
                  onPress={toggleCalendar}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: calendarOpen }}
                  accessibilityLabel={`${formatWeekdayLongDate(selectedDateKey)}. ${calendarOpen ? 'Hide calendar' : 'View calendar'}`}
                  style={({ pressed }) => [styles.dateSummary, pressed && styles.pressed]}>
                  <View style={styles.dateLine}>
                    <Text style={[styles.dateTitle, { color: theme.text }]}>
                      {formatWeekdayLongDate(selectedDateKey)}
                    </Text>
                    {isToday ? (
                      <Text style={[styles.todayStatus, { color: theme.textMuted }]}> · Today</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.countSummary, { color: theme.textSecondary }]}>
                    {formatCountedSummary(selectedCount, isToday)}
                  </Text>
                  <Text style={[styles.calendarAction, { color: theme.accent }]}>
                    {calendarOpen ? 'Hide calendar ↑' : 'View calendar ↓'}
                  </Text>
                </Pressable>

                {isToday ? (
                  <HardDayPanel
                    theme={theme}
                    selected={selectedIsHard}
                    whyOpen={hardWhyOpen}
                    onToggle={() => setHardDay(todayKey, !selectedIsHard)}
                    onToggleWhy={() => setHardWhyOpen((open) => !open)}
                    wide={isWide}
                  />
                ) : selectedIsHard ? (
                  <Text style={[styles.pastHard, { color: theme.textSecondary }]}>♥ Hard day</Text>
                ) : null}
              </View>

              <View style={styles.dayNav}>
                <Pressable
                  onPress={goToPreviousDay}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Previous day, ${formatNavDay(previousDateKey)}`}
                  style={({ pressed }) => [styles.dayNavSide, pressed && styles.pressed]}>
                  <Text style={[styles.dayNavLabel, { color: theme.text }]} numberOfLines={1}>
                    ← {formatNavDay(previousDateKey)}
                  </Text>
                </Pressable>
                {!isToday ? (
                  <Pressable
                    onPress={goToToday}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Back to today"
                    style={({ pressed }) => [styles.dayNavCenter, pressed && styles.pressed]}>
                    <Text style={[styles.dayNavLabel, { color: theme.accent }]} numberOfLines={1}>
                      Back to today
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.dayNavCenter} />
                )}
                <Pressable
                  onPress={nextIsFuture ? undefined : goToNextDay}
                  disabled={nextIsFuture}
                  hitSlop={8}
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
            </GlassCard>

            {calendarOpen ? (
              <GlassCard
                style={isWide ? [styles.calendarPanel, styles.calendarPanelWide] : styles.calendarPanel}>
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
              </GlassCard>
            ) : null}

            {isToday ? (
              <View style={styles.section}>
                <SectionHeader title="Add a tiny win" />
                <View style={[styles.tabs, !isWide && styles.tabsMobile]}>
                  <ModeTab
                    label="Quick add"
                    selected={logMode === 'quick'}
                    onPress={() => setLogMode('quick')}
                    theme={theme}
                  />
                  <ModeTab
                    label="Write my own"
                    selected={logMode === 'custom'}
                    onPress={() => setLogMode('custom')}
                    theme={theme}
                  />
                </View>

                {logMode === 'quick' ? (
                  <View style={styles.modeBody}>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>What kind of win?</Text>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>
                      Pick a category to see quick options.
                    </Text>
                    <View style={styles.pillGrid}>
                      {categories.map((cat) => (
                        <CategoryChip
                          key={cat}
                          label={categoryLabel(cat)}
                          selected={category === cat}
                          onPress={() => setCategory(cat)}
                          theme={theme}
                        />
                      ))}
                    </View>
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>Quick options</Text>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>
                      Tap one to count it.
                    </Text>
                    <View style={styles.pillGrid}>
                      {tinyWinTemplates[category].map((title) => (
                        <QuickOptionButton
                          key={title}
                          title={title}
                          onPress={() => logWin(title)}
                          theme={theme}
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.modeBody, isWide && styles.customFormWide]}>
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
                      style={styles.logButton}
                    />
                  </View>
                )}
              </View>
            ) : (
              <Pressable
                onPress={goToToday}
                accessibilityRole="button"
                accessibilityLabel="Back to today to log a win"
                style={({ pressed }) => [styles.backToToday, pressed && styles.pressed]}>
                <Text style={[styles.backToTodayLabel, { color: theme.accent }]}>
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
                  {visibleWins.map((entry, index) => (
                    <DayTimelineRow
                      key={entry.id}
                      entry={entry}
                      showDivider={index < visibleWins.length - 1}
                    />
                  ))}
                  {activitiesForSelectedDay.length > TIMELINE_PREVIEW_COUNT ? (
                    <Pressable
                      onPress={() => setShowAllWins((open) => !open)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.timelineToggle, pressed && styles.pressed]}>
                      <Text style={[styles.timelineToggleLabel, { color: theme.accent }]}>
                        {showAllWins
                          ? 'Show less ↑'
                          : `Show all ${activitiesForSelectedDay.length} wins ↓`}
                      </Text>
                    </Pressable>
                  ) : null}
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

function HardDayPanel({
  theme,
  selected,
  whyOpen,
  onToggle,
  onToggleWhy,
  wide,
}: {
  theme: AppTheme;
  selected: boolean;
  whyOpen: boolean;
  onToggle: () => void;
  onToggleWhy: () => void;
  wide: boolean;
}) {
  return (
    <View style={[styles.hardDayPanel, wide && styles.hardDayPanelWide]}>
      <Text style={[styles.hardDayTitle, { color: theme.text }]}>Hard day?</Text>
      <Text style={[styles.hardDayHint, { color: theme.textMuted }]}>
        When basic things took more effort than usual.
      </Text>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={selected ? 'Hard day marked' : 'Mark today as hard'}
        style={({ pressed }) => [
          styles.hardBtn,
          {
            borderColor: selected ? theme.accent : theme.surfaceBorder,
            backgroundColor: selected ? theme.accent : theme.surface,
          },
          pressed && styles.pressed,
        ]}>
        <View style={styles.hardBtnInner}>
          <Text
            style={[
              styles.hardBtnLabel,
              { color: theme.text, opacity: selected ? 0 : 1 },
            ]}>
            Mark today as hard
          </Text>
          <Text
            style={[
              styles.hardBtnLabel,
              styles.hardBtnOverlay,
              { color: theme.selectedForeground, opacity: selected ? 1 : 0 },
            ]}>
            ✓ Hard day marked
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onToggleWhy}
        accessibilityRole="button"
        accessibilityState={{ expanded: whyOpen }}
        hitSlop={6}
        style={({ pressed }) => [pressed && styles.pressed]}>
        <Text style={[styles.whyLink, { color: theme.accent }]}>Why? →</Text>
      </Pressable>
      {whyOpen ? (
        <Text style={[styles.whyBody, { color: theme.textSecondary }]}>
          Some days take more effort than others. Marking a hard day helps the app recognize that
          small actions may have taken more energy than usual.
        </Text>
      ) : null}
    </View>
  );
}

function ModeTab({
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
        styles.modeTab,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.modeTabLabel,
          { color: selected ? theme.selectedForeground : theme.text },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CategoryChip({
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
        styles.categoryChip,
        {
          backgroundColor: selected ? theme.accent : theme.surface,
          borderColor: selected ? theme.accent : theme.surfaceBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.categoryLabel,
          { color: selected ? theme.selectedForeground : theme.textSecondary },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuickOptionButton({
  title,
  onPress,
  theme,
}: {
  title: string;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Log ${title}`}
      style={({ pressed }) => [
        styles.quickOption,
        {
          backgroundColor: theme.surface,
          borderColor: theme.accentSecondary,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.quickOptionLabel, { color: theme.text }]}>+ {title}</Text>
    </Pressable>
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
  const emoji = activitySourceEmojis[entry.source];
  const meta = timelineMeta(entry);

  return (
    <View>
      <View style={styles.timelineRow}>
        <View style={[styles.timelineDot, { backgroundColor: theme.accent }]} />
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
  intro: { marginBottom: spacing.xl },
  headline: { ...typography.h1 },
  sub: { ...typography.body, marginTop: spacing.xs },
  dateCard: { marginBottom: spacing.xl },
  dateCardWithCalendar: { marginBottom: spacing.sm },
  dateTopWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  dateTopStack: { gap: spacing.sm },
  dateSummary: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
  },
  dateLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  dateTitle: { ...typography.h3 },
  todayStatus: { ...typography.bodySmall, fontWeight: '600' },
  countSummary: { ...typography.bodySmall, marginTop: 2 },
  calendarAction: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  hardDayPanel: { gap: 4 },
  hardDayPanelWide: {
    width: 236,
    flexShrink: 0,
  },
  hardDayTitle: { ...typography.bodySmall, fontWeight: '700' },
  hardDayHint: { ...typography.caption },
  hardBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: radii.full,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  hardBtnInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hardBtnLabel: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  hardBtnOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  whyLink: { ...typography.caption, fontWeight: '700', marginTop: 4 },
  whyBody: { ...typography.caption, marginTop: 4 },
  pastHard: { ...typography.caption, fontWeight: '700', marginTop: 2 },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    minHeight: 40,
  },
  dayNavSide: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayNavRight: { alignItems: 'flex-end' },
  dayNavCenter: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNavLabel: { ...typography.caption, fontWeight: '600' },
  navDisabled: { opacity: 0.45 },
  calendarPanel: {
    width: '100%',
    marginBottom: spacing.xl,
    alignSelf: 'stretch',
  },
  calendarPanelWide: {
    width: 400,
    maxWidth: 400,
    alignSelf: 'flex-start',
  },
  section: { marginBottom: spacing.xl },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  tabsMobile: { alignSelf: 'stretch' },
  modeTab: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTabLabel: { ...typography.caption, fontWeight: '700' },
  modeBody: { gap: spacing.xs },
  customFormWide: {
    width: '100%',
    maxWidth: CUSTOM_FORM_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  fieldLabel: { ...typography.bodySmall, fontWeight: '700', marginTop: spacing.sm },
  helper: { ...typography.caption, marginBottom: 2 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  quickOption: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  quickOptionLabel: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  logButton: {
    alignSelf: 'flex-start',
    minWidth: 168,
    maxWidth: 220,
  },
  backToToday: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: spacing.xl,
    minHeight: 44,
    justifyContent: 'center',
  },
  backToTodayLabel: { ...typography.bodySmall, fontWeight: '700' },
  emptyDay: { paddingVertical: spacing.sm },
  emptyTitle: { ...typography.body, fontWeight: '600' },
  emptySub: { ...typography.bodySmall, marginTop: 4 },
  timeline: {
    marginTop: spacing.xs,
    width: '100%',
    maxWidth: TIMELINE_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  winText: { flex: 1, minWidth: 0, gap: 1 },
  timelineTime: { ...typography.caption },
  timelineTitle: { ...typography.body, fontWeight: '700' },
  timelineMeta: { ...typography.caption },
  timelineDivider: { height: StyleSheet.hairlineWidth, marginLeft: 20 },
  timelineToggle: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  timelineToggleLabel: { ...typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.88 },
});
