import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GradientButton } from '@/components/design-system/Buttons';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { RewardCard } from '@/components/design-system/Cards';
import { XPBadge } from '@/components/design-system/Progress';
import { AppModal } from '@/components/design-system/Modal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function RewardsScreen() {
  const theme = useAppTheme();
  const rewards = useAppStore((s) => s.rewards);
  const xpTotal = useAppStore((s) => s.xpTotal);
  const claimReward = useAppStore((s) => s.claimReward);
  const addCustomReward = useAppStore((s) => s.addCustomReward);

  const [showModal, setShowModal] = useState(false);
  const [claimedName, setClaimedName] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCost, setCustomCost] = useState('30');

  const handleClaim = (id: string, title: string) => {
    claimReward(id);
    setClaimedName(title);
    setShowModal(true);
  };

  return (
    <AppShell title="Rewards">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Celebrate effort, not perfection.</Text>
          <XPBadge xp={xpTotal} size="lg" />

          <SectionHeader title="Reward shop" subtitle="Spending XP should feel cozy, not punishing" />
          <View style={styles.grid}>
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                {...reward}
                unlocked={reward.unlocked || xpTotal >= reward.cost}
                onClaim={() => handleClaim(reward.id, reward.title)}
              />
            ))}
          </View>

          <SectionHeader title="Create personal reward" />
          <GlassCard>
            <TextInput
              value={customTitle}
              onChangeText={setCustomTitle}
              placeholder="Reward name"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
            />
            <TextInput
              value={customCost}
              onChangeText={setCustomCost}
              placeholder="Cost in XP"
              keyboardType="number-pad"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.surfaceBorder }]}
            />
            <GradientButton
              label="Add reward"
              onPress={() => {
                if (customTitle.trim()) {
                  addCustomReward({
                    title: customTitle.trim(),
                    cost: parseInt(customCost, 10) || 30,
                    category: 'custom',
                    icon: '⭐',
                    description: 'Personal reward',
                  });
                  setCustomTitle('');
                }
              }}
              small
            />
          </GlassCard>
        </ScrollView>

        <AppModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          title="Reward claimed ✨"
          message={`Enjoy your ${claimedName}. You earned this.`}
        />
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, ...typography.body },
});
