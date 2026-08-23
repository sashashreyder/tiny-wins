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
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { MoodButton, TagPill } from '@/components/design-system/Tags';
import { MonthCalendar } from '@/components/tiny-wins/MonthCalendar';
import { moodOptions, moodTags } from '@/data/content';
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
  formatIntensity,
  getIntensityTrend,
  groupMoodsByDate,
  moodCountByDate,
  moodMeta,
  summarizeMoodPatterns,
} from '@/lib/moodHistory';
import { getMoodSupportRecommendations, MoodSupportRecommendation } from '@/lib/moodSupport';
import { AppTheme, radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { MoodEntry, MoodType } from '@/types';

const CHECKIN_MAX_WIDTH = 780;
const PAGE_MAX_WIDTH = 1080;
const HISTORY_WIDE = 900;
const NO_HARD_DAYS: Record<string, boolean> = {};

type SavedCheckIn = {
  mood: MoodType;
  intensity: number;
  tags: string[];
};

function formatHistoryDate(dateKey: string, isToday: boolean): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  const formatted = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return isToday ? `${formatted} · Today` : formatted;
}

export default function MoodScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= HISTORY_WIDE;
  const addMood = useAppStore((s) => s.addMood);
  const moodEntries = useAppStore((s) => s.moodEntries);

  const todayKey = todayLocalDateKey();
  const [mood, setMood] = useState<MoodType>('okay-ish');
  const [intensity, setIntensity] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => monthFromDateKey(todayKey));
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [patternDays, setPatternDays] = useState<7 | 30>(7);
  const [savedCheckIn, setSavedCheckIn] = useState<SavedCheckIn | null>(null);

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
    () => (patternDays === 7 && !patterns.sparse ? getIntensityTrend(moodEntries, 7, todayKey) : []),
    [moodEntries, patternDays, patterns.sparse, todayKey],
  );

  const recommendations = savedCheckIn
    ? getMoodSupportRecommendations(savedCheckIn.mood, savedCheckIn.tags)
    : [];

  useEffect(() => {
    setShowAllEntries(false);
  }, [selectedDateKey]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const selectDate = (dateKey: string) => {
    if (dateKey > todayKey) return;
    setSelectedDateKey(dateKey);
    setVisibleMonth(monthFromDateKey(dateKey));
  };

  const goToToday = () => {
    selectDate(todayKey);
  };

  const save = () => {
    addMood({ mood, intensity, tags, note: note || undefined });
    setSavedCheckIn({ mood, intensity, tags });
    setNote('');
    setTags([]);
    selectDate(todayKey);
  };

  const savedMeta = savedCheckIn ? moodMeta(savedCheckIn.mood) : null;

  const calendar = calendarOpen ? (
    <View style={[styles.calendarCol, isWide && styles.calendarColWide]}>
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
  ) : null;

  const dateControls = (
    <View style={styles.dateBlock}>
      <Text style={[styles.historyDate, { color: theme.text }]}>
        {formatHistoryDate(selectedDateKey, isToday)}
      </Text>
      <View style={styles.historyControls}>
        {!isToday ? (
          <Pressable
            onPress={goToToday}
            accessibilityRole="button"
            accessibilityLabel="Back to today"
            style={({ pressed }) => [styles.headerLink, pressed && styles.pressed]}>
            <Text style={[styles.headerLinkLabel, { color: theme.accent }]}>Back to today</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => setCalendarOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: calendarOpen }}
          accessibilityLabel={calendarOpen ? 'Hide calendar' : 'Show calendar'}
          style={({ pressed }) => [styles.headerLink, pressed && styles.pressed]}>
          <Text style={[styles.headerLinkLabel, { color: theme.textMuted }]}>
            {calendarOpen ? 'Hide calendar' : 'Show calendar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const dayList = (
    <View style={styles.dayList}>
      {dayEntries.length === 0 ? (
        <View>
          <Text style={[styles.emptyDay, { color: theme.textSecondary }]}>
            {isToday ? 'Nothing logged yet today.' : 'Nothing was logged on this day.'}
          </Text>
          {!isToday ? (
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              Choose another date to look back.
            </Text>
          ) : null}
        </View>
      ) : (
        <>
          {visibleEntries.map((entry, index) => (
            <MoodHistoryRow
              key={entry.id}
              entry={entry}
              showDivider={index < visibleEntries.length - 1}
            />
          ))}
          {dayEntries.length > MOOD_HISTORY_PREVIEW_COUNT ? (
            <Pressable
              onPress={() => setShowAllEntries((open) => !open)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.timelineToggle, pressed && styles.pressed]}>
              <Text style={[styles.timelineToggleLabel, { color: theme.accent }]}>
                {showAllEntries
                  ? 'Show less'
                  : `Show all ${dayEntries.length} check-ins`}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <AppShell title="Mood Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.page}>
            <View style={styles.checkIn}>
              <Text style={[styles.headline, { color: theme.text }]}>How does your brain feel?</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Check in as often as you want. This is for noticing, not judging.
              </Text>

              <View style={styles.moodGrid}>
                {moodOptions.map((opt) => (
                  <MoodButton
                    key={opt.id}
                    label={opt.label}
                    emoji={opt.emoji}
                    selected={mood === opt.id}
                    onPress={() => setMood(opt.id)}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>
                Intensity · {intensity} / 5
              </Text>
              <View style={styles.intensityCluster}>
                <View style={styles.intensityRow}>
                  <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>mild</Text>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TagPill
                      key={n}
                      label={String(n)}
                      selected={intensity === n}
                      accentSelected
                      onPress={() => setIntensity(n)}
                    />
                  ))}
                  <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>intense</Text>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>
                What might be affecting it?
              </Text>
              <View style={styles.pillGrid}>
                {moodTags.map((tag) => (
                  <TagPill
                    key={tag}
                    label={tag}
                    selected={tags.includes(tag)}
                    accentSelected
                    onPress={() => toggleTag(tag)}
                  />
                ))}
              </View>

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Optional note..."
                placeholderTextColor={theme.textMuted}
                multiline
                style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
              />

              <GradientButton
                label="Save mood check-in"
                onPress={save}
                style={isWide ? styles.saveDesktop : undefined}
              />
            </View>

            {savedCheckIn && savedMeta ? (
              <View
                style={[
                  styles.support,
                  { borderColor: theme.surfaceBorder, backgroundColor: theme.surface },
                ]}>
                <Text style={[styles.supportTitle, { color: theme.text }]}>Want some support?</Text>
                <Text style={[styles.supportLogged, { color: theme.textSecondary }]}>
                  You logged {savedMeta.emoji} {savedMeta.label} · {savedCheckIn.intensity}/5
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
                  onPress={() => setSavedCheckIn(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss support suggestions"
                  style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}>
                  <Text style={[styles.notNowLabel, { color: theme.textMuted }]}>Not now</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title="History" />
              {isWide ? (
                <View style={styles.historyWide}>
                  {calendar}
                  <View style={styles.dayCol}>
                    {dateControls}
                    {dayList}
                  </View>
                </View>
              ) : (
                <View>
                  {dateControls}
                  {calendar}
                  {dayList}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Patterns"
                subtitle="What showed up — not why, and not a diagnosis."
              />
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
                  Keep checking in. Patterns will appear once there’s a little more data.
                </Text>
              ) : (
                <View>
                  <View style={styles.statsGrid}>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Most logged</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.topMoods[0]
                          ? `${patterns.topMoods[0].emoji} ${patterns.topMoods[0].label} · ${patterns.topMoods[0].count}`
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Average intensity
                      </Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.averageIntensity != null
                          ? `${formatIntensity(patterns.averageIntensity)} / 5`
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Common factors
                      </Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.topFactors.length > 0
                          ? patterns.topFactors.map((factor) => factor.label).join(' · ')
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                        Multiple check-in days
                      </Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {patterns.multiCheckInDays}{' '}
                        {patterns.multiCheckInDays === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sentences}>
                    {patterns.sentences.map((sentence) => (
                      <Text key={sentence} style={[styles.sentence, { color: theme.textSecondary }]}>
                        {sentence}
                      </Text>
                    ))}
                  </View>
                  {trend.length > 0 ? (
                    <View style={styles.trend}>
                      <Text style={[styles.trendLabel, { color: theme.textMuted }]}>
                        Average intensity, last 7 days
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
                                    height: point.average
                                      ? Math.max(4, (point.average / 5) * 32)
                                      : 2,
                                    backgroundColor: point.average
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
        <Text style={[styles.recBody, { color: theme.textSecondary }]} numberOfLines={1}>
          {rec.explanation}
        </Text>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={rec.actionLabel}
          style={({ pressed }) => [styles.recAction, pressed && styles.pressed]}>
          <Text style={[styles.recActionLabel, { color: theme.accent }]}>{rec.actionLabel}</Text>
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
  const meta = moodMeta(entry.mood);
  const time = formatTimeForDisplay(entry.createdAt);
  const factors = (entry.tags ?? []).filter(Boolean);

  return (
    <View>
      <View style={styles.timelineRow}>
        <View style={styles.entryText}>
          {time ? (
            <Text style={[styles.entryTime, { color: theme.textMuted }]}>{time}</Text>
          ) : null}
          <Text style={[styles.entryMood, { color: theme.text }]}>
            {meta.emoji} {meta.label} · Intensity {entry.intensity}/5
          </Text>
          {factors.length > 0 ? (
            <Text style={[styles.entryMeta, { color: theme.textMuted }]}>
              {factors.join(' · ')}
            </Text>
          ) : null}
          {entry.note ? (
            <Text style={[styles.entryNote, { color: theme.textSecondary }]}>{entry.note}</Text>
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
  scroll: { paddingBottom: spacing.xl },
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
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.md },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  intensityCluster: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  intensityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  endpointLabel: { ...typography.caption, fontWeight: '600' },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    minHeight: 64,
    maxHeight: 80,
    marginBottom: spacing.md,
    ...typography.body,
  },
  saveDesktop: {
    alignSelf: 'flex-start',
    width: 280,
  },
  support: {
    marginTop: 36,
    maxWidth: CHECKIN_MAX_WIDTH,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  supportTitle: { ...typography.bodySmall, fontWeight: '700' },
  supportLogged: { ...typography.caption, marginTop: 2, marginBottom: spacing.sm },
  recs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recsStack: {
    flexDirection: 'column',
  },
  recCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 8,
  },
  recCardStack: {
    flex: 0,
    width: '100%',
  },
  recIcon: { fontSize: 16, lineHeight: 20, marginTop: 1 },
  recCopy: { flex: 1, minWidth: 0, gap: 1 },
  recTitle: { ...typography.caption, fontWeight: '700' },
  recBody: { ...typography.caption },
  recAction: {
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
    marginTop: 2,
  },
  recActionLabel: { ...typography.caption, fontWeight: '700' },
  notNow: {
    alignSelf: 'flex-start',
    marginTop: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  notNowLabel: { ...typography.caption, fontWeight: '700' },
  section: { marginTop: 36 },
  historyWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  calendarCol: {
    width: '100%',
    maxWidth: 360,
    marginBottom: spacing.sm,
  },
  calendarColWide: {
    width: 360,
    flexShrink: 0,
    marginBottom: 0,
  },
  dayCol: {
    flex: 1,
    minWidth: 0,
    maxWidth: 620,
  },
  dateBlock: {
    marginBottom: spacing.sm,
  },
  historyDate: { ...typography.h3 },
  historyControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  headerLink: {
    minHeight: 32,
    justifyContent: 'center',
  },
  headerLinkLabel: { ...typography.caption, fontWeight: '700' },
  dayList: {
    minWidth: 0,
  },
  emptyDay: { ...typography.bodySmall },
  emptyHint: { ...typography.caption, marginTop: 2 },
  timelineRow: {
    paddingVertical: 8,
  },
  entryText: { minWidth: 0, gap: 2 },
  entryTime: { ...typography.caption },
  entryMood: { ...typography.bodySmall, fontWeight: '700' },
  entryMeta: { ...typography.caption },
  entryNote: { ...typography.bodySmall },
  timelineDivider: { height: StyleSheet.hairlineWidth },
  timelineToggle: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    minHeight: 32,
    justifyContent: 'center',
  },
  timelineToggleLabel: { ...typography.caption, fontWeight: '700' },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  periodChip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodChipLabel: { ...typography.caption, fontWeight: '700' },
  sparse: { ...typography.bodySmall },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    maxWidth: 720,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 160,
    maxWidth: 340,
    gap: 2,
  },
  statLabel: { ...typography.caption, fontWeight: '600' },
  statValue: { ...typography.bodySmall, fontWeight: '700' },
  sentences: { marginTop: spacing.sm, gap: 4, maxWidth: 720 },
  sentence: { ...typography.bodySmall },
  trend: { marginTop: spacing.md, maxWidth: 420 },
  trendLabel: { ...typography.caption, marginBottom: spacing.xs },
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
  trendBar: {
    width: '100%',
    borderRadius: 6,
  },
  trendWeekday: { ...typography.caption, fontSize: 11 },
  pressed: { opacity: 0.88 },
});
