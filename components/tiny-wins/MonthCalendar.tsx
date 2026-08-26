import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  MonthGridCell,
  buildMonthGrid,
  formatMonthYear,
  getWeekStartsOn,
  getWeekdayLabels,
} from '@/lib/dateUtils';
import { radii, spacing, typography } from '@/lib/theme';

function chunkWeeks(cells: MonthGridCell[]): MonthGridCell[][] {
  const weeks: MonthGridCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function MonthCalendar({
  year,
  monthIndex,
  selectedDateKey,
  todayKey,
  activityCountByDate,
  hardDayByDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canGoNextMonth,
  markerMode = 'count',
  activityNoun = { one: 'thing counted', other: 'things counted' },
  compact = false,
}: {
  year: number;
  monthIndex: number;
  selectedDateKey: string;
  todayKey: string;
  activityCountByDate: Record<string, number>;
  hardDayByDate: Record<string, boolean>;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNextMonth: boolean;
  markerMode?: 'count' | 'dot';
  activityNoun?: { one: string; other: string };
  compact?: boolean;
}) {
  const theme = useAppTheme();
  const weekStartsOn = getWeekStartsOn();
  const weekdayLabels = getWeekdayLabels(weekStartsOn);
  const cells = buildMonthGrid(year, monthIndex, weekStartsOn);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.monthNav, compact && styles.monthNavCompact]}>
        <Pressable
          onPress={onPrevMonth}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={({ pressed }) => [
            styles.monthBtn,
            compact && styles.monthBtnCompact,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.monthChevron, { color: theme.text }]}>{'‹'}</Text>
        </Pressable>
        <Text style={[styles.monthTitle, compact && styles.monthTitleCompact, { color: theme.text }]}>
          {formatMonthYear(year, monthIndex)}
        </Text>
        <Pressable
          onPress={canGoNextMonth ? onNextMonth : undefined}
          disabled={!canGoNextMonth}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canGoNextMonth }}
          style={({ pressed }) => [
            styles.monthBtn,
            compact && styles.monthBtnCompact,
            !canGoNextMonth && styles.disabled,
            pressed && canGoNextMonth && styles.pressed,
          ]}>
          <Text
            style={[
              styles.monthChevron,
              { color: canGoNextMonth ? theme.text : theme.textMuted },
            ]}>
            {'›'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.weekRow, compact && styles.weekRowCompact]}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekday, { color: theme.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>

      {chunkWeeks(cells).map((week) => (
        <View key={week[0]?.dateKey} style={[styles.weekRow, compact && styles.weekRowCompact]}>
          {week.map((cell) => {
            const isFuture = cell.dateKey > todayKey;
            const isSelected = cell.dateKey === selectedDateKey;
            const isToday = cell.dateKey === todayKey;
            const count = activityCountByDate[cell.dateKey] ?? 0;
            const isHard = hardDayByDate[cell.dateKey] === true;
            const muted = !cell.inCurrentMonth || isFuture;

            return (
              <Pressable
                key={cell.dateKey}
                onPress={isFuture ? undefined : () => onSelectDate(cell.dateKey)}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                accessibilityLabel={dayAccessibilityLabel({
                  dateKey: cell.dateKey,
                  count,
                  isHard,
                  isToday,
                  isFuture,
                  activityNoun,
                })}
                style={({ pressed }) => [
                  styles.cell,
                  compact && styles.cellCompact,
                  isSelected && {
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                  },
                  isToday && !isSelected && {
                    borderColor: theme.accentSecondary,
                  },
                  pressed && !isFuture && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected
                        ? theme.selectedForeground
                        : muted
                          ? theme.textMuted
                          : theme.text,
                      fontWeight: isSelected || isToday ? '700' : '500',
                    },
                  ]}>
                  {cell.day}
                </Text>
                {isHard ? (
                  <Text
                    style={[
                      styles.hardMark,
                      { color: isSelected ? theme.selectedForeground : theme.accent },
                    ]}>
                    ♡
                  </Text>
                ) : null}
                {count > 0 && markerMode === 'dot' ? (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected
                          ? theme.selectedForeground
                          : muted
                            ? theme.textMuted
                            : theme.accent,
                      },
                    ]}
                  />
                ) : null}
                {count > 0 && markerMode === 'count' ? (
                  <Text
                    style={[
                      styles.count,
                      {
                        color: isSelected
                          ? theme.selectedForegroundMuted
                          : muted
                            ? theme.textMuted
                            : theme.textSecondary,
                      },
                    ]}>
                    • {count}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function dayAccessibilityLabel({
  dateKey,
  count,
  isHard,
  isToday,
  isFuture,
  activityNoun,
}: {
  dateKey: string;
  count: number;
  isHard: boolean;
  isToday: boolean;
  isFuture: boolean;
  activityNoun: { one: string; other: string };
}): string {
  const parts = [dateKey];
  if (isToday) parts.push('today');
  if (isFuture) parts.push('future, unavailable');
  if (count > 0) parts.push(`${count} ${count === 1 ? activityNoun.one : activityNoun.other}`);
  if (isHard) parts.push('hard day');
  return parts.join(', ');
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'stretch',
  },
  wrapCompact: {
    maxWidth: 360,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthNavCompact: {
    marginBottom: 4,
  },
  monthBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  monthBtnCompact: {
    width: 32,
    height: 32,
  },
  monthChevron: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
  },
  monthTitle: {
    ...typography.h3,
    textAlign: 'center',
    flex: 1,
  },
  monthTitleCompact: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekRowCompact: {
    marginBottom: 2,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    fontWeight: '600',
  },
  cell: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  cellCompact: {
    minHeight: 42,
  },
  dayNumber: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  hardMark: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    lineHeight: 12,
  },
  count: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.35 },
});
