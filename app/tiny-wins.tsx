import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
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
import { FloatingPanel, OverlayAnchor } from '@/components/tiny-wins/FloatingPanel';
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
  const [calendarAnchor, setCalendarAnchor] = useState<OverlayAnchor | undefined>();
  const [whyAnchor, setWhyAnchor] = useState<OverlayAnchor | undefined>();
  const calendarTriggerRef = useRef<View>(null);
  const whyTriggerRef = useRef<View>(null);

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
    if (calendarOpen) {
      setCalendarOpen(false);
      return;
    }
    setHardWhyOpen(false);
    setVisibleMonth(monthFromDateKey(selectedDateKey));
    const node = calendarTriggerRef.current;
    if (node?.measureInWindow) {
      node.measureInWindow((x, y, width, height) => {
        setCalendarAnchor({ x, y, width, height });
        setCalendarOpen(true);
      });
      return;
    }
    setCalendarOpen(true);
  };

  const toggleHardWhy = () => {
    if (hardWhyOpen) {
      setHardWhyOpen(false);
      return;
    }
    setCalendarOpen(false);
    const node = whyTriggerRef.current;
    if (node?.measureInWindow) {
      node.measureInWindow((x, y, width, height) => {
        setWhyAnchor({ x, y, width, height });
        setHardWhyOpen(true);
      });
      return;
    }
    setHardWhyOpen(true);
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
              <View style={isWide ? styles.dateTopWide : styles.dateTopStack}>
                <View ref={calendarTriggerRef} collapsable={false} style={styles.dateSummary}>
                  <Pressable
                    onPress={toggleCalendar}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: calendarOpen }}
                    accessibilityLabel={`${formatWeekdayLongDate(selectedDateKey)}. ${calendarOpen ? 'Hide calendar' : 'View calendar'}`}
                    style={({ pressed }) => [styles.dateSummaryPress, pressed && styles.pressed]}>
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
                </View>

                {isToday ? (
                  <HardDayPanel
                    theme={theme}
                    selected={selectedIsHard}
                    whyOpen={hardWhyOpen}
                    whyRef={whyTriggerRef}
                    onToggle={() => setHardDay(todayKey, !selectedIsHard)}
                    onToggleWhy={toggleHardWhy}
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

            <FloatingPanel
              visible={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              anchor={calendarAnchor}
              panelWidth={392}
              isWide={isWide}
              align="left">
              <View
                style={[
                  styles.calendarPopover,
                  {
                    backgroundColor: theme.backgroundAlt,
                    borderColor: theme.surfaceBorder,
                    shadowColor: theme.text,
                  },
                ]}>
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
            </FloatingPanel>

            <FloatingPanel
              visible={hardWhyOpen}
              onClose={() => setHardWhyOpen(false)}
              anchor={whyAnchor}
              panelWidth={300}
              isWide={isWide}
              align="right">
              <View
                style={[
                  styles.whyPopover,
                  {
                    backgroundColor: theme.backgroundAlt,
                    borderColor: theme.surfaceBorder,
                    shadowColor: theme.text,
                  },
                ]}>
                <Text style={[styles.whyBody, { color: theme.textSecondary }]}>
                  Some days take more effort than others. Marking a hard day helps the app
                  recognize that small actions may have taken more energy than usual.
                </Text>
              </View>
            </FloatingPanel>

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
  whyRef,
  onToggle,
  onToggleWhy,
  wide,
}: {
  theme: AppTheme;
  selected: boolean;
  whyOpen: boolean;
  whyRef: RefObject<View | null>;
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
        accessibilityLabel={selected ? 'Hard day marked' : 'Mark as hard day'}
        style={({ pressed }) => [
          styles.hardBtn,
          {
            borderColor: selected ? theme.accent : theme.surfaceBorder,
            backgroundColor: theme.surface,
          },
          pressed && styles.pressed,
        ]}>
        <Text
          numberOfLines={1}
          style={[styles.hardBtnLabel, { color: selected ? theme.accent : theme.text }]}>
          {selected ? '✓ Hard day marked' : '♡ Mark as hard day'}
        </Text>
      </Pressable>
      <View ref={whyRef} collapsable={false}>
        <Pressable
          onPress={onToggleWhy}
          accessibilityRole="button"
          accessibilityState={{ expanded: whyOpen }}
          hitSlop={6}
          style={({ pressed }) => [styles.whyLinkHit, pressed && styles.pressed]}>
          <Text style={[styles.whyLink, { color: theme.accent }]}>Why? →</Text>
        </Pressable>
      </View>
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
  dateCard: { marginBottom: spacing.xl, zIndex: 2 },
  dateTopWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  dateTopStack: { gap: spacing.sm },
  dateSummary: {
    flex: 1,
    minWidth: 0,
  },
  dateSummaryPress: {
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
    width: 190,
    flexShrink: 0,
  },
  hardDayTitle: { ...typography.bodySmall, fontWeight: '700' },
  hardDayHint: { ...typography.caption },
  hardBtn: {
    width: 186,
    height: 40,
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  hardBtnLabel: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  whyLinkHit: { alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  whyLink: { ...typography.caption, fontWeight: '700' },
  whyPopover: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  whyBody: { ...typography.caption },
  calendarPopover: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 16,
  },
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
