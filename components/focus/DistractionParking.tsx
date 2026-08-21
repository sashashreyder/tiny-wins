import type { RefObject } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard } from '@/components/design-system/GlassCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { FocusDistraction } from '@/types';

const PARKED_LIST_MAX_HEIGHT = 136;

export function formatParkedTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parkedCountLabel(count: number): string {
  return count === 1 ? '1 distraction parked' : `${count} distractions parked`;
}

export function DistractionParking({
  input,
  onChangeInput,
  onPark,
  parked,
  inputRef,
  stacked,
}: {
  input: string;
  onChangeInput: (value: string) => void;
  onPark: () => void;
  parked: FocusDistraction[];
  inputRef: RefObject<TextInput | null>;
  stacked?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <GlassCard style={styles.parkingCard}>
      <Text style={[styles.parkingTitle, { color: theme.text }]}>Distraction parking</Text>
      <Text style={[styles.parkingCopy, { color: theme.textSecondary }]}>
        Write it down, then return to your task.
      </Text>

      <View style={[styles.parkRow, stacked && styles.parkRowStacked]}>
        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={onChangeInput}
          placeholder="Reply to Sam, look up that book..."
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Park a distraction"
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={onPark}
          style={[
            styles.input,
            styles.parkInput,
            stacked && styles.parkInputStacked,
            { color: theme.text, borderColor: theme.surfaceBorder },
          ]}
        />
        <GradientButton
          label="Park it"
          onPress={onPark}
          small
          style={stacked ? styles.parkButtonStacked : styles.parkButton}
        />
      </View>

      {parked.length > 0 ? (
        <View style={styles.parkedBlock}>
          <Text style={[styles.parkedHeading, { color: theme.textMuted }]}>
            Parked distractions · {parked.length}
          </Text>
          <ScrollView
            style={styles.parkedList}
            contentContainerStyle={styles.parkedListContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator>
            {parked.map((item) => (
              <View key={item.id} style={styles.parkedItem}>
                <Text style={[styles.parkedTime, { color: theme.textMuted }]}>
                  {formatParkedTime(item.createdAt)}
                </Text>
                <Text style={[styles.parkedText, { color: theme.text }]}>{item.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  parkingCard: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  parkingTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  parkingCopy: {
    ...typography.bodySmall,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  parkRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  parkRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  parkInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 40,
    marginBottom: 0,
    paddingVertical: 8,
  },
  parkInputStacked: {
    minWidth: 0,
    width: '100%',
  },
  parkButton: {
    minWidth: 88,
    minHeight: 40,
    flexShrink: 0,
  },
  parkButtonStacked: {
    minHeight: 40,
    alignSelf: 'flex-start',
    minWidth: 96,
  },
  parkedBlock: {
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  parkedHeading: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: 6,
  },
  parkedList: {
    maxHeight: PARKED_LIST_MAX_HEIGHT,
    flexGrow: 0,
  },
  parkedListContent: {
    paddingBottom: 2,
  },
  parkedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  parkedTime: {
    ...typography.caption,
    fontVariant: ['tabular-nums'],
    width: 40,
    marginTop: 2,
  },
  parkedText: {
    ...typography.bodySmall,
    flex: 1,
    minWidth: 0,
  },
});
