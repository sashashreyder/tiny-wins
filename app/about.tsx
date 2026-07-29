import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { brandNames, spacing, typography } from '@/lib/theme';
import { disclaimer } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AboutScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <AppShell title="Build in Public">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>💜</Text>
          <Text style={[styles.headline, { color: theme.text }]}>
            Built in public by someone with ADHD
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            "I'm building tiny tools for my ADHD brain because I keep forgetting water, tasks,
            tiny wins, and why I walked downstairs."
          </Text>

          <SectionHeader title="Why this exists" />
          <GlassCard>
            <Text style={{ color: theme.textSecondary, ...typography.body }}>
              Regular productivity apps feel too rigid, boring, or judgmental. Many ADHD apps force
              long quizzes and paywalls before giving help. This tool shows tiny progress without shame.
            </Text>
          </GlassCard>

          <SectionHeader title="What makes it different" />
          {[
            'Rewards starting, not only finishing',
            'No streak punishment — returns over streaks',
            'Visual garden proof that your day counted',
            '10-second versions of every tool',
            'Warm tone, not clinical or productivity-bro',
          ].map((item) => (
            <GlassCard key={item} style={styles.bullet}>
              <Text style={{ color: theme.text }}>✨ {item}</Text>
            </GlassCard>
          ))}

          <SectionHeader title="What's coming next" />
          <GlassCard>
            <Text style={{ color: theme.textSecondary, ...typography.body }}>
              • Real printable downloads{'\n'}
              • Push notification gentle reminders{'\n'}
              • Cloud sync & optional auth{'\n'}
              • Pay-what-you-want printables{'\n'}
              • Native mobile app (same codebase){'\n'}
              • Community-suggested tiny tools
            </Text>
          </GlassCard>

          <SectionHeader title="Follow the build journey" />
          <GlassCard>
            <Text style={{ color: theme.textMuted, ...typography.body }}>
              Social links coming soon — TikTok / Instagram / newsletter placeholders.
            </Text>
          </GlassCard>

          <SectionHeader title="Suggest a tiny tool" />
          <GlassCard>
            <Text style={{ color: theme.textSecondary, ...typography.body }}>
              Feature request form coming soon. For now, this prototype explores the full vision.
            </Text>
          </GlassCard>

          <Text style={[styles.brands, { color: theme.textMuted }]}>
            Also known as: {brandNames.slice(1).join(' · ')}
          </Text>

          <GlassCard>
            <Text style={{ color: theme.textMuted, ...typography.caption, textAlign: 'center' }}>
              {disclaimer}
            </Text>
          </GlassCard>

          <GradientButton label="Back to dashboard" onPress={() => router.push('/dashboard')} />
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
  sub: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg, fontStyle: 'italic' },
  bullet: { marginBottom: spacing.xs },
  brands: { ...typography.caption, textAlign: 'center', marginVertical: spacing.lg },
});
