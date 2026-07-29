import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { GlassCard, SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { SupportiveMessage } from '@/components/design-system/Feedback';
import { AppModal } from '@/components/design-system/Modal';
import { TagPill } from '@/components/design-system/Tags';
import { TinyQuestCard } from '@/components/design-system/Cards';
import { stuckTypes } from '@/data/content';
import { getSupportiveMessage, getTinyQuests } from '@/lib/recommendations';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { StuckType } from '@/types';

export default function CantStartScreen() {
  const theme = useAppTheme();
  const completeQuest = useAppStore((s) => s.completeCantStartQuest);
  const profile = useAppStore((s) => s.userProfile);

  const [stuckType, setStuckType] = useState<StuckType | null>(null);
  const [questIndex, setQuestIndex] = useState(0);
  const [smallerMode, setSmallerMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const quests = useMemo(() => {
    if (!stuckType) return [];
    return getTinyQuests(stuckType, profile?.energyLevel);
  }, [stuckType, profile?.energyLevel]);

  const quest = quests[questIndex] ?? '';
  const displayQuest = smallerMode
    ? quest.split('.')[0] + '. That\'s literally it.'
    : quest;

  const handleComplete = () => {
    completeQuest(quest, stuckType!);
    setMessage(getSupportiveMessage('start'));
    setShowSuccess(true);
  };

  return (
    <AppShell title="I Can't Start">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Starting is a task too.</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            No pressure. Pick what kind of stuck you're in.
          </Text>

          {!stuckType ? (
            <>
              <SectionHeader title="What kind of stuck is it?" />
              <ScrollView horizontal={false} contentContainerStyle={styles.pillGrid}>
                {stuckTypes.map((type) => (
                  <TagPill
                    key={type.id}
                    label={type.label}
                    onPress={() => {
                      setStuckType(type.id);
                      setQuestIndex(0);
                      setSmallerMode(false);
                    }}
                  />
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <GlassCard style={styles.stuckSelected}>
                <Text style={{ color: theme.textSecondary, ...typography.caption }}>Stuck type</Text>
                <Text style={{ color: theme.text, ...typography.body, fontWeight: '600' }}>
                  {stuckTypes.find((s) => s.id === stuckType)?.label}
                </Text>
              </GlassCard>

              <TinyQuestCard
                quest={displayQuest}
                onComplete={handleComplete}
                onSmaller={() => setSmallerMode(true)}
                onAnother={() => setQuestIndex((i) => (i + 1) % quests.length)}
              />

              <SupportiveMessage message="Your only job is the next tiny step. Not the whole thing." />
            </>
          )}
        </ScrollView>

        <AppModal
          visible={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="That counts."
          message={message}
          primaryAction={{
            label: 'Log another win',
            onPress: () => {
              setShowSuccess(false);
              setStuckType(null);
            },
          }}
        />
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stuckSelected: { marginBottom: spacing.md },
});
