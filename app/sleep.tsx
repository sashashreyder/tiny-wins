import { useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
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
import { AppModal } from '@/components/design-system/Modal';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { MonthCalendar } from '@/components/tiny-wins/MonthCalendar';
import { sleepTags, wakeFeelings } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  dateFromDateKey,
  isMonthAfterDateKey,
  monthFromDateKey,
  shiftMonth,
  todayLocalDateKey,
} from '@/lib/dateUtils';
import {
  SleepDraft,
  buildSleepFields,
  durationMinutesFromClocks,
  emptySleepDraft,
  factorLabel,
  formatClockLabel,
  formatDurationMinutes,
  draftFromEntry,
  getSleepDurationMinutes,
  getSleepFactors,
  getSleepType,
  getWakeFeelings,
  parseClock,
  qualityLabel,
  sleepCountByDate,
  groupSleepByDate,
  summarizeSleepPatterns,
  typeLabel,
  wakeFeelingLabel,
} from '@/lib/sleepHistory';
import { AppTheme, radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { SleepEntry, SleepSessionType, WakeFeeling } from '@/types';

const PAGE_MAX_WIDTH = 1080;
const LOG_MAX_WIDTH = 680;
const HISTORY_WIDE = 900;
const TIME_ROW_WIDE = 720;
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

function validateDraft(draft: SleepDraft): string | null {
  if (!parseClock(draft.fellAsleep)) return 'Enter a fall-asleep time as HH:MM.';
  if (!parseClock(draft.woke)) return 'Enter a wake time as HH:MM.';
  if (draft.wentToBed.trim() && !parseClock(draft.wentToBed)) {
    return 'Went to bed needs HH:MM, or leave it blank.';
  }
  const duration = durationMinutesFromClocks(draft.fellAsleep, draft.woke);
  if (duration == null) return 'Wake time needs to be after fall-asleep time.';
  return null;
}

export default function SleepScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isHistoryWide = width >= HISTORY_WIDE;
  const isTimeRow = width >= TIME_ROW_WIDE;
  const isDesktop = width >= 720;
  const overlayPlacement = width >= 720 ? 'center' : 'bottom';

  const addSleep = useAppStore((s) => s.addSleep);
  const updateSleep = useAppStore((s) => s.updateSleep);
  const deleteSleep = useAppStore((s) => s.deleteSleep);
  const sleepEntries = useAppStore((s) => s.sleepEntries);

  const todayKey = todayLocalDateKey();
  const [draft, setDraft] = useState<SleepDraft>(() => emptySleepDraft(todayKey));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{
    durationLabel: string;
    qualityLabel: string;
    dateKey: string;
  } | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => monthFromDateKey(todayKey));
  const [patternDays, setPatternDays] = useState<7 | 30>(7);
  const [editing, setEditing] = useState<SleepEntry | null>(null);
  const [editDraft, setEditDraft] = useState<SleepDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SleepEntry | null>(null);

  const patchDraft = (patch: Partial<SleepDraft>) => {
    setDraft((current) => ({ ...current, ...patch, wakeDateKey: todayKey }));
    setError(null);
  };

  const durationMinutes = durationMinutesFromClocks(draft.fellAsleep, draft.woke);

  const byDate = useMemo(() => groupSleepByDate(sleepEntries), [sleepEntries]);
  const countByDate = useMemo(() => sleepCountByDate(sleepEntries), [sleepEntries]);
  const dayEntries = byDate[selectedDateKey] ?? [];
  const isToday = selectedDateKey === todayKey;
  const nextVisibleMonth = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
  const canGoNextMonth = !isMonthAfterDateKey(
    nextVisibleMonth.year,
    nextVisibleMonth.monthIndex,
    todayKey,
  );
  const patterns = useMemo(
    () => summarizeSleepPatterns(sleepEntries, patternDays, todayKey),
    [sleepEntries, patternDays, todayKey],
  );

  const selectDate = (dateKey: string) => {
    if (dateKey > todayKey) return;
    setSelectedDateKey(dateKey);
    setVisibleMonth(monthFromDateKey(dateKey));
  };

  const save = () => {
    const next = { ...draft, wakeDateKey: todayKey };
    const message = validateDraft(next);
    if (message) {
      setError(message);
      return;
    }
    const fields = buildSleepFields(next);
    addSleep(fields);
    setSaved({
      durationLabel: formatDurationMinutes(fields.durationMinutes ?? durationMinutes),
      qualityLabel: qualityLabel(fields.quality),
      dateKey: fields.dateKey ?? todayKey,
    });
    setError(null);
  };

  const resetLog = () => {
    setDraft(emptySleepDraft(todayKey));
    setSaved(null);
    setError(null);
  };

  const openEdit = (entry: SleepEntry) => {
    setEditing(entry);
    setEditDraft(draftFromEntry(entry));
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editing || !editDraft) return;
    const message = validateDraft(editDraft);
    if (message) {
      setEditError(message);
      return;
    }
    updateSleep(editing.id, buildSleepFields(editDraft));
    setEditing(null);
    setEditDraft(null);
    setEditError(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteSleep(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <AppShell title="Sleep Tracker">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.page}>
            <View style={styles.log}>
              <Text style={[styles.headline, { color: theme.text }]}>Sleep Tracker</Text>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                Notice your sleep patterns over time.
              </Text>

              {saved ? (
                <View style={styles.savedBox}>
                  <Text style={[styles.savedTitle, { color: theme.text }]}>✓ Sleep logged</Text>
                  <Text style={[styles.savedDetail, { color: theme.textSecondary }]}>
                    {saved.durationLabel} · {saved.qualityLabel} quality
                  </Text>
                  <View style={styles.savedActions}>
                    <Pressable
                      onPress={resetLog}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                      <Text style={[styles.textBtnLabel, { color: theme.textMuted }]}>Done</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => selectDate(saved.dateKey)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                      <Text style={[styles.textBtnLabel, { color: theme.accent }]}>
                        View in history
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.blockTitle, { color: theme.text }]}>Log sleep</Text>
                  <SleepEditor
                    draft={draft}
                    onChange={patchDraft}
                    wideTimes={isTimeRow}
                    durationMinutes={durationMinutes}
                  />
                  {error ? (
                    <Text style={[styles.error, { color: theme.accent }]}>{error}</Text>
                  ) : null}
                  <GradientButton
                    label="Save sleep"
                    onPress={save}
                    small
                    accessibilityLabel="Save sleep"
                    style={isDesktop ? styles.saveDesktop : styles.saveMobile}
                  />
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
              {isHistoryWide ? (
                <View style={styles.historyWide}>
                  <View style={styles.calendarColWide}>
                    <SleepCalendar
                      year={visibleMonth.year}
                      monthIndex={visibleMonth.monthIndex}
                      selectedDateKey={selectedDateKey}
                      todayKey={todayKey}
                      countByDate={countByDate}
                      canGoNextMonth={canGoNextMonth}
                      onSelectDate={selectDate}
                      onPrevMonth={() =>
                        setVisibleMonth((month) => shiftMonth(month.year, month.monthIndex, -1))
                      }
                      onNextMonth={() => {
                        const next = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
                        if (isMonthAfterDateKey(next.year, next.monthIndex, todayKey)) return;
                        setVisibleMonth(next);
                      }}
                    />
                  </View>
                  <DayPanel
                    isToday={isToday}
                    selectedDateKey={selectedDateKey}
                    dayEntries={dayEntries}
                    onBackToToday={() => selectDate(todayKey)}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                </View>
              ) : (
                <View>
                  <View style={styles.calendarCol}>
                    <SleepCalendar
                      year={visibleMonth.year}
                      monthIndex={visibleMonth.monthIndex}
                      selectedDateKey={selectedDateKey}
                      todayKey={todayKey}
                      countByDate={countByDate}
                      canGoNextMonth={canGoNextMonth}
                      onSelectDate={selectDate}
                      onPrevMonth={() =>
                        setVisibleMonth((month) => shiftMonth(month.year, month.monthIndex, -1))
                      }
                      onNextMonth={() => {
                        const next = shiftMonth(visibleMonth.year, visibleMonth.monthIndex, 1);
                        if (isMonthAfterDateKey(next.year, next.monthIndex, todayKey)) return;
                        setVisibleMonth(next);
                      }}
                    />
                  </View>
                  <DayPanel
                    isToday={isToday}
                    selectedDateKey={selectedDateKey}
                    dayEntries={dayEntries}
                    onBackToToday={() => selectDate(todayKey)}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Patterns</Text>
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
                  Keep logging sleep. Patterns will appear once there’s a little more data.
                </Text>
              ) : (
                <View>
                  <View style={styles.facts}>
                    <FactRow
                      label="Average sleep"
                      value={formatDurationMinutes(patterns.averageDurationMinutes)}
                    />
                    <FactRow
                      label="Average quality"
                      value={
                        patterns.averageQuality != null
                          ? `${patterns.averageQuality} / 5`
                          : '—'
                      }
                    />
                    {patterns.typicalFallAsleep ? (
                      <FactRow label="Typical fall-asleep time" value={patterns.typicalFallAsleep} />
                    ) : null}
                    {patterns.typicalWake ? (
                      <FactRow label="Typical wake time" value={patterns.typicalWake} />
                    ) : null}
                    <FactRow label="Main sleep sessions" value={String(patterns.mainCount)} />
                    <FactRow label="Naps" value={String(patterns.napCount)} />
                    <FactRow
                      label="Most common wake feelings"
                      value={
                        patterns.topFeelings.length > 0
                          ? patterns.topFeelings
                              .map((item) => `${item.label} · ${item.count}`)
                              .join('\n')
                          : '—'
                      }
                    />
                    <FactRow
                      label="Common factors"
                      value={
                        patterns.topFactors.length > 0
                          ? patterns.topFactors
                              .map((item) => `${item.label} · ${item.count}`)
                              .join('\n')
                          : '—'
                      }
                    />
                  </View>
                  {patterns.facts.length > 0 ? (
                    <View style={styles.sentences}>
                      {patterns.facts.map((sentence) => (
                        <Text
                          key={sentence}
                          style={[styles.sentence, { color: theme.textSecondary }]}>
                          {sentence}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>

      <AppModal
        visible={editing != null && editDraft != null}
        onClose={() => {
          setEditing(null);
          setEditDraft(null);
          setEditError(null);
        }}
        title="Edit sleep"
        wide
        placement={overlayPlacement}
        secondaryAction={{
          label: 'Cancel',
          onPress: () => {
            setEditing(null);
            setEditDraft(null);
            setEditError(null);
          },
        }}
        primaryAction={{ label: 'Save changes', onPress: saveEdit }}>
        {editDraft ? (
          <ScrollView style={styles.overlayScroll} keyboardShouldPersistTaps="handled">
            <SleepEditor
              draft={editDraft}
              onChange={(patch) => {
                setEditDraft((current) => (current ? { ...current, ...patch } : current));
                setEditError(null);
              }}
              wideTimes={false}
              durationMinutes={durationMinutesFromClocks(editDraft.fellAsleep, editDraft.woke)}
            />
            {editError ? (
              <Text style={[styles.error, { color: theme.accent }]}>{editError}</Text>
            ) : null}
          </ScrollView>
        ) : null}
      </AppModal>

      <AppModal
        visible={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        title="Delete this sleep log?"
        message="This can’t be undone."
        placement={overlayPlacement}
        secondaryAction={{ label: 'Cancel', onPress: () => setPendingDelete(null) }}
        primaryAction={{ label: 'Delete', onPress: confirmDelete }}
      />
    </AppShell>
  );
}

function SleepEditor({
  draft,
  onChange,
  wideTimes,
  durationMinutes,
}: {
  draft: SleepDraft;
  onChange: (patch: Partial<SleepDraft>) => void;
  wideTimes: boolean;
  durationMinutes: number | null;
}) {
  const theme = useAppTheme();
  const toggleFeeling = (id: WakeFeeling) => {
    onChange({
      wakeFeelings: draft.wakeFeelings.includes(id)
        ? draft.wakeFeelings.filter((item) => item !== id)
        : [...draft.wakeFeelings, id],
    });
  };
  const toggleFactor = (tag: string) => {
    onChange({
      factors: draft.factors.includes(tag)
        ? draft.factors.filter((item) => item !== tag)
        : [...draft.factors, tag],
    });
  };

  return (
    <View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Sleep type</Text>
      <View style={styles.chipRow}>
        {(['main', 'nap'] as SleepSessionType[]).map((type) => (
          <ChoiceChip
            key={type}
            label={typeLabel(type)}
            selected={draft.type === type}
            onPress={() => onChange({ type })}
            theme={theme}
          />
        ))}
      </View>

      <View style={[styles.timeGroup, wideTimes && styles.timeGroupWide]}>
        <TimeField
          label="Went to bed"
          hint="optional"
          value={draft.wentToBed}
          onChange={(wentToBed) => onChange({ wentToBed })}
          compact={wideTimes}
        />
        <TimeField
          label="Fell asleep"
          value={draft.fellAsleep}
          onChange={(fellAsleep) => onChange({ fellAsleep })}
          compact={wideTimes}
        />
        <TimeField
          label="Woke up"
          value={draft.woke}
          onChange={(woke) => onChange({ woke })}
          compact={wideTimes}
        />
      </View>
      <Text style={[styles.duration, { color: theme.text }]}>
        {durationMinutes != null
          ? `${formatDurationMinutes(durationMinutes)} asleep`
          : 'Sleep duration'}
      </Text>
      <Text style={[styles.hint, { color: theme.textMuted }]}>Approximate times are fine.</Text>

      <Text style={[styles.blockLabel, { color: theme.text }]}>Sleep quality</Text>
      <QualitySlider value={draft.quality} onChange={(quality) => onChange({ quality })} theme={theme} />

      <Text style={[styles.blockLabel, { color: theme.text }]}>
        How did you feel when you woke up?
      </Text>
      <View style={styles.chipRow}>
        {wakeFeelings.map((feeling) => (
          <ChoiceChip
            key={feeling.id}
            label={feeling.label}
            selected={draft.wakeFeelings.includes(feeling.id)}
            onPress={() => toggleFeeling(feeling.id)}
            theme={theme}
          />
        ))}
      </View>

      <Text style={[styles.blockLabel, { color: theme.text }]}>
        Anything that may have affected it?
      </Text>
      <View style={styles.chipRow}>
        {sleepTags.map((tag) => (
          <ChoiceChip
            key={tag}
            label={tag}
            selected={draft.factors.includes(tag)}
            onPress={() => toggleFactor(tag)}
            theme={theme}
          />
        ))}
        {draft.factors
          .filter((tag) => !(sleepTags as readonly string[]).includes(tag) && tag !== 'unknown')
          .map((tag) => (
            <ChoiceChip
              key={tag}
              label={factorLabel(tag)}
              selected
              onPress={() => toggleFactor(tag)}
              theme={theme}
            />
          ))}
      </View>

      <Text style={[styles.blockLabel, { color: theme.text }]}>Anything you want to remember?</Text>
      <TextInput
        value={draft.note}
        onChangeText={(note) => onChange({ note })}
        placeholder="Optional note"
        placeholderTextColor={theme.textMuted}
        multiline
        style={[styles.note, { color: theme.text, borderColor: theme.surfaceBorder }]}
      />
    </View>
  );
}

function TimeField({
  label,
  hint,
  value,
  onChange,
  compact,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  compact: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.timeField, compact && styles.timeFieldCompact]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
        {hint ? ` · ${hint}` : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="23:30"
        placeholderTextColor={theme.textMuted}
        accessibilityLabel={label}
        {...(Platform.OS === 'web'
          ? ({ type: 'time' } as object)
          : { keyboardType: 'numbers-and-punctuation' as const, maxLength: 5 })}
        style={[
          styles.timeInput,
          compact && styles.timeInputCompact,
          { color: theme.text, borderColor: theme.surfaceBorder },
        ]}
      />
    </View>
  );
}

function QualitySlider({
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
  const thumbLeft = pad + ((value - 1) / 4) * usable;

  const valueFromEvent = (event: GestureResponderEvent) => {
    if (usable <= 0) return;
    const x = event.nativeEvent.locationX;
    const ratio = Math.min(1, Math.max(0, (x - pad) / usable));
    onChange(Math.round(ratio * 4) + 1);
  };

  return (
    <View style={styles.sliderWrap}>
      <Text style={[styles.qualityNow, { color: theme.text }]}>{qualityLabel(value)}</Text>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Sleep quality"
        accessibilityValue={{ min: 1, max: 5, now: value, text: qualityLabel(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') onChange(Math.min(5, value + 1));
          if (event.nativeEvent.actionName === 'decrement') onChange(Math.max(1, value - 1));
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
        <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>rough</Text>
        <Text style={[styles.endpointLabel, { color: theme.textMuted }]}>restful</Text>
      </View>
    </View>
  );
}

function ChoiceChip({
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

function SleepCalendar({
  year,
  monthIndex,
  selectedDateKey,
  todayKey,
  countByDate,
  canGoNextMonth,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  monthIndex: number;
  selectedDateKey: string;
  todayKey: string;
  countByDate: Record<string, number>;
  canGoNextMonth: boolean;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <MonthCalendar
      year={year}
      monthIndex={monthIndex}
      selectedDateKey={selectedDateKey}
      todayKey={todayKey}
      activityCountByDate={countByDate}
      hardDayByDate={NO_HARD_DAYS}
      markerMode="dot"
      compact
      activityNoun={{ one: 'sleep log', other: 'sleep logs' }}
      onSelectDate={onSelectDate}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      canGoNextMonth={canGoNextMonth}
    />
  );
}

function DayPanel({
  isToday,
  selectedDateKey,
  dayEntries,
  onBackToToday,
  onEdit,
  onDelete,
}: {
  isToday: boolean;
  selectedDateKey: string;
  dayEntries: SleepEntry[];
  onBackToToday: () => void;
  onEdit: (entry: SleepEntry) => void;
  onDelete: (entry: SleepEntry) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.dayCol}>
      <Text style={[styles.historyDate, { color: theme.text }]}>
        {isToday ? 'Today' : formatHistoryDate(selectedDateKey)}
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
          No sleep logs for this day.
        </Text>
      ) : (
        dayEntries.map((entry, index) => (
          <SleepHistoryRow
            key={entry.id}
            entry={entry}
            showDivider={index < dayEntries.length - 1}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry)}
          />
        ))
      )}
    </View>
  );
}

function SleepHistoryRow({
  entry,
  showDivider,
  onEdit,
  onDelete,
}: {
  entry: SleepEntry;
  showDivider: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const type = getSleepType(entry);
  const start = formatClockLabel(entry.fellAsleepAt ?? entry.sleepTime);
  const end = formatClockLabel(entry.wokeAt ?? entry.wakeTime);
  const duration = formatDurationMinutes(getSleepDurationMinutes(entry));
  const feelings = getWakeFeelings(entry).map(wakeFeelingLabel).filter(Boolean);
  const factors = getSleepFactors(entry).map(factorLabel).filter(Boolean);

  return (
    <View>
      <View style={styles.timelineRow}>
        <Text style={[styles.entryTitle, { color: theme.text }]}>{typeLabel(type)}</Text>
        {start || end ? (
          <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>
            {start ?? '—'} → {end ?? '—'}
          </Text>
        ) : null}
        <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>{duration}</Text>
        <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>
          Quality: {qualityLabel(entry.quality)}
        </Text>
        {feelings.length > 0 ? (
          <Text style={[styles.entryMeta, { color: theme.textMuted }]}>{feelings.join(' · ')}</Text>
        ) : null}
        {factors.length > 0 ? (
          <Text style={[styles.entryMeta, { color: theme.textMuted }]}>{factors.join(' · ')}</Text>
        ) : null}
        {entry.note ? (
          <Text style={[styles.entryNote, { color: theme.textSecondary }]}>{entry.note}</Text>
        ) : null}
        <View style={styles.rowActions}>
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit sleep log"
            style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
            <Text style={[styles.rowActionLabel, { color: theme.accent }]}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete sleep log"
            style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
            <Text style={[styles.rowActionLabel, { color: theme.textMuted }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {showDivider ? (
        <View style={[styles.timelineDivider, { backgroundColor: theme.surfaceBorder }]} />
      ) : null}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.factRow}>
      <Text style={[styles.factLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.factValue, { color: theme.text }]}>{value}</Text>
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
  log: {
    width: '100%',
    maxWidth: LOG_MAX_WIDTH,
    alignSelf: 'flex-start',
  },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  blockTitle: { ...typography.h2, marginBottom: spacing.md },
  blockLabel: {
    ...typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  label: { ...typography.caption, marginBottom: 4, fontWeight: '600' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: { fontSize: 14, lineHeight: 18 },
  timeGroup: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    maxWidth: '100%',
  },
  timeGroupWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  timeField: {
    width: '100%',
    minWidth: 0,
  },
  timeFieldCompact: {
    flex: 1,
    maxWidth: 160,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    ...typography.body,
    minWidth: 0,
  },
  timeInputCompact: {
    maxWidth: 160,
  },
  duration: {
    ...typography.body,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  hint: { ...typography.caption, marginTop: 4 },
  sliderWrap: {
    width: '100%',
    maxWidth: 420,
    marginBottom: spacing.sm,
  },
  qualityNow: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  sliderHit: { height: 48, justifyContent: 'center' },
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
    marginTop: 8,
  },
  endpointLabel: { ...typography.caption, fontWeight: '600' },
  note: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 64,
    maxHeight: 96,
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  error: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.sm },
  saveDesktop: {
    alignSelf: 'flex-start',
    width: 240,
    maxWidth: '100%',
  },
  saveMobile: {
    alignSelf: 'stretch',
    width: '100%',
  },
  savedBox: {
    gap: 6,
    marginTop: spacing.xs,
  },
  savedTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  savedDetail: { ...typography.body, fontWeight: '600' },
  savedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  textBtn: {
    minHeight: 36,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  textBtnLabel: { ...typography.body, fontWeight: '700' },
  section: { marginTop: 56 },
  sectionTitle: { ...typography.h2, marginBottom: 8 },
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
  timelineRow: { paddingVertical: 12, gap: 3 },
  entryTitle: { ...typography.body, fontWeight: '700' },
  entryMeta: { ...typography.bodySmall },
  entryNote: { ...typography.bodySmall },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 4,
  },
  rowActionLabel: { ...typography.bodySmall, fontWeight: '700' },
  timelineDivider: { height: StyleSheet.hairlineWidth },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodChip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    minHeight: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  periodChipLabel: { ...typography.bodySmall, fontWeight: '700' },
  sparse: { ...typography.body, maxWidth: 520 },
  facts: {
    gap: 10,
    maxWidth: 520,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  factLabel: { ...typography.bodySmall, fontWeight: '600', flex: 1, minWidth: 0 },
  factValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  sentences: { marginTop: spacing.lg, gap: 8, maxWidth: 640 },
  sentence: { ...typography.body },
  overlayScroll: { maxHeight: 420 },
  pressed: { opacity: 0.88 },
});
