import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { ThemeToggle } from '@/components/garden/GardenScene';
import { gardenVibeOptions } from '@/data/content';
import { disclaimer } from '@/data/content';
import { gardenVibeLabels } from '@/lib/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { GardenVibe } from '@/types';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const profile = useAppStore((s) => s.userProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const resetData = useAppStore((s) => s.resetData);
  const loadDemoData = useAppStore((s) => s.loadDemoData);

  return (
    <AppShell title="Settings">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <SectionHeader title="Theme" />
          <ThemeToggle />

          <SectionHeader title="Garden vibe" />
          <View style={styles.vibeRow}>
            {gardenVibeOptions.map((opt) => (
              <GlassCard
                key={opt.id}
                onPress={() => updateProfile({ gardenVibe: opt.id as GardenVibe })}
                style={{
                  ...styles.vibeChip,
                  ...(profile?.gardenVibe === opt.id
                    ? { borderColor: theme.accent, borderWidth: 2 }
                    : {}),
                }}>
                <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                <Text style={{ color: theme.text, fontSize: 11, textAlign: 'center' }}>
                  {opt.label.split(' ')[0]}
                </Text>
              </GlassCard>
            ))}
          </View>
          {profile?.gardenVibe ? (
            <Text style={{ color: theme.textSecondary, ...typography.caption }}>
              Current: {gardenVibeLabels[profile.gardenVibe]}
            </Text>
          ) : null}

          <SectionHeader title="Preferences" />
          <GlassCard style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>Daily water goal</Text>
              <Text style={{ color: theme.textSecondary }}>{profile?.waterGoal ?? 5} cups</Text>
            </View>
            <View style={styles.stepper}>
              <GradientButton
                label="-"
                onPress={() => updateProfile({ waterGoal: Math.max(1, (profile?.waterGoal ?? 5) - 1) })}
                small
                variant="ghost"
                style={{ minWidth: 44 }}
              />
              <GradientButton
                label="+"
                onPress={() => updateProfile({ waterGoal: (profile?.waterGoal ?? 5) + 1 })}
                small
                variant="ghost"
                style={{ minWidth: 44 }}
              />
            </View>
          </GlassCard>

          {[
            { key: 'lowEnergyMode', label: 'Low energy mode', desc: 'Extra XP for self-care' },
            { key: 'reducedMotion', label: 'Reduced motion', desc: 'Gentler animations' },
            { key: 'claimWithoutSpending', label: 'Claim rewards without spending', desc: 'Emotional support mode' },
          ].map((setting) => (
            <GlassCard key={setting.key} style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{setting.label}</Text>
                <Text style={{ color: theme.textSecondary, ...typography.caption }}>{setting.desc}</Text>
              </View>
              <Switch
                value={!!profile?.[setting.key as keyof typeof profile]}
                onValueChange={(v) => updateProfile({ [setting.key]: v })}
                trackColor={{ true: theme.accentSecondary }}
              />
            </GlassCard>
          ))}

          <SectionHeader title="Data" />
          <GradientButton label="Load demo data" onPress={loadDemoData} variant="secondary" />
          <GradientButton label="Reset all data" onPress={resetData} variant="ghost" />
          <GlassCard>
            <Text style={{ color: theme.textSecondary, ...typography.bodySmall }}>
              Export data — coming soon. Architecture supports JSON export via store snapshot.
            </Text>
          </GlassCard>

          <GlassCard style={styles.disclaimer}>
            <Text style={{ color: theme.textMuted, ...typography.caption, textAlign: 'center' }}>
              {disclaimer}
            </Text>
          </GlassCard>

          <GradientButton label="About / Build in Public" onPress={() => router.push('/about')} variant="ghost" />
        </ScrollView>
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl, gap: spacing.sm },
  vibeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  vibeChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  stepper: { flexDirection: 'row', gap: spacing.xs },
  disclaimer: { marginTop: spacing.md },
});
