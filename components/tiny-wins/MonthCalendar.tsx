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
}) {
  const theme = useAppTheme();
  const weekStartsOn = getWeekStartsOn();
  const weekdayLabels = getWeekdayLabels(weekStartsOn);
  const cells = buildMonthGrid(year, monthIndex, weekStartsOn);

  return (
    <View style={styles.wrap}>
      <View style={styles.monthNav}>
        <Pressable
          onPress={onPrevMonth}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={({ pressed }) => [styles.monthBtn, pressed && styles.pressed]}>
          <Text style={[styles.monthChevron, { color: theme.text }]}>{'‹'}</Text>
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.text }]}>
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

      <View style={styles.weekRow}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekday, { color: theme.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>

      {chunkWeeks(cells).map((week) => (
        <View key={week[0]?.dateKey} style={styles.weekRow}>
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
                })}
                style={({ pressed }) => [
                  styles.cell,
                  isSelected && {
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                  },
                  isToday && !isSelected && {
                    borderColor: theme.accentSecondary,
                  },
                  pressed && !isFuture && styles.pressed,
                ]}>
                <View style={styles.cellTop}>
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
                </View>
                {count > 0 ? (
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
                ) : (
                  <Text style={styles.countPlaceholder}> </Text>
                )}
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
}: {
  dateKey: string;
  count: number;
  isHard: boolean;
  isToday: boolean;
  isFuture: boolean;
}): string {
  const parts = [dateKey];
  if (isToday) parts.push('today');
  if (isFuture) parts.push('future, unavailable');
  if (count > 0) parts.push(`${count} ${count === 1 ? 'thing' : 'things'} counted`);
  if (isHard) parts.push('hard day');
  return parts.join(', ');
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'stretch',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
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
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
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
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dayNumber: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
  },
  hardMark: {
    fontSize: 10,
    lineHeight: 12,
  },
  count: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  countPlaceholder: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 1,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.35 },
});
