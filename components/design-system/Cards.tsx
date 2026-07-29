import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { ToolDefinition } from '@/types';
import { GlassCard } from './GlassCard';

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <GlassCard onPress={() => router.push(tool.route as never)} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{tool.icon}</Text>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{tool.title}</Text>
          <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>
            {tool.description}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {tool.estimatedTime} · {tool.bestFor}
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

export function TrackerCard({
  title,
  subtitle,
  emoji,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  emoji: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <GlassCard onPress={onPress} style={styles.tracker}>
      <Text style={styles.trackerEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.desc, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
    </GlassCard>
  );
}

export function TinyQuestCard({
  quest,
  onComplete,
  onSmaller,
  onAnother,
}: {
  quest: string;
  onComplete: () => void;
  onSmaller: () => void;
  onAnother: () => void;
}) {
  const theme = useAppTheme();
  return (
    <GlassCard glow style={styles.quest}>
      <Text style={[styles.questLabel, { color: theme.textSecondary }]}>Your tiny quest</Text>
      <Text style={[styles.questText, { color: theme.text }]}>{quest}</Text>
      <View style={styles.questActions}>
        <Pressable onPress={onComplete} style={[styles.questBtn, { backgroundColor: theme.accentSecondary }]}>
          <Text style={styles.questBtnText}>I did it ✨</Text>
        </Pressable>
        <Pressable onPress={onSmaller} style={[styles.questBtnGhost, { borderColor: theme.surfaceBorder }]}>
          <Text style={{ color: theme.text }}>Make it smaller</Text>
        </Pressable>
        <Pressable onPress={onAnother}>
          <Text style={{ color: theme.textSecondary, ...typography.bodySmall }}>Give me another</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

export function RewardCard({
  title,
  cost,
  icon,
  unlocked,
  claimed,
  onClaim,
}: {
  title: string;
  cost: number;
  icon: string;
  unlocked: boolean;
  claimed?: boolean;
  onClaim?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <GlassCard
      style={{
        ...styles.reward,
        ...(!unlocked ? { opacity: 0.6 } : {}),
      }}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>
        {claimed ? 'Claimed ✓' : unlocked ? `${cost} XP` : `Unlock at ${cost} XP`}
      </Text>
      {unlocked && !claimed && onClaim ? (
        <Pressable onPress={onClaim} style={[styles.claimBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.claimText}>Claim</Text>
        </Pressable>
      ) : null}
    </GlassCard>
  );
}

export function PrintableCard({
  title,
  description,
  cost,
  unlocked,
  onPreview,
  onUnlock,
}: {
  title: string;
  description: string;
  cost: number;
  unlocked: boolean;
  onPreview: () => void;
  onUnlock: () => void;
}) {
  const theme = useAppTheme();
  return (
    <GlassCard style={styles.printable}>
      <View style={[styles.printablePreview, { backgroundColor: theme.accentTertiary + '33' }]}>
        <Text style={{ fontSize: 32 }}>📄</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: theme.textSecondary }]}>{description}</Text>
      <View style={styles.printableActions}>
        <Pressable onPress={onPreview} style={[styles.smallBtn, { borderColor: theme.surfaceBorder }]}>
          <Text style={{ color: theme.text }}>Preview</Text>
        </Pressable>
        {!unlocked ? (
          <Pressable onPress={onUnlock} style={[styles.smallBtn, { backgroundColor: theme.accentSecondary }]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>{cost === 0 ? 'Free' : `${cost} XP`}</Text>
          </Pressable>
        ) : (
          <Text style={{ color: theme.accentSecondary, fontWeight: '700' }}>Unlocked ✓</Text>
        )}
      </View>
    </GlassCard>
  );
}

export function AchievementBadge({
  title,
  description,
  unlocked,
}: {
  title: string;
  description: string;
  unlocked: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: unlocked ? theme.surface : theme.backgroundAlt,
          borderColor: unlocked ? theme.accentTertiary : theme.surfaceBorder,
          opacity: unlocked ? 1 : 0.55,
        },
      ]}>
      <Text style={styles.badgeEmoji}>{unlocked ? '🏅' : '🔒'}</Text>
      <Text style={[styles.badgeTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  icon: { fontSize: 28 },
  content: { flex: 1 },
  title: { ...typography.h3, marginBottom: 4 },
  desc: { ...typography.bodySmall },
  meta: { marginTop: spacing.xs },
  metaText: { ...typography.caption },
  tracker: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  trackerEmoji: { fontSize: 32 },
  quest: { marginVertical: spacing.md },
  questLabel: { ...typography.caption, marginBottom: spacing.xs },
  questText: { ...typography.h2, marginBottom: spacing.md },
  questActions: { gap: spacing.sm },
  questBtn: { borderRadius: 999, padding: spacing.sm, alignItems: 'center' },
  questBtnText: { fontWeight: '700', color: '#211A3A' },
  questBtnGhost: { borderRadius: 999, padding: spacing.sm, alignItems: 'center', borderWidth: 1 },
  reward: { width: '47%', marginBottom: spacing.sm, alignItems: 'center' },
  locked: { opacity: 0.6 },
  claimBtn: { marginTop: spacing.sm, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6 },
  claimText: { fontWeight: '700', color: '#211A3A' },
  printable: { marginBottom: spacing.md },
  printablePreview: {
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  printableActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
  smallBtn: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1 },
  badge: { width: '47%', padding: spacing.sm, borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm },
  badgeEmoji: { fontSize: 24, marginBottom: 4 },
  badgeTitle: { ...typography.bodySmall, fontWeight: '700' },
});
