import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/design-system/AppShell';
import { SectionHeader } from '@/components/design-system/GlassCard';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { PrintableCard } from '@/components/design-system/Cards';
import { AppModal } from '@/components/design-system/Modal';
import { printableTemplates } from '@/data/content';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

export default function PrintablesScreen() {
  const theme = useAppTheme();
  const xpTotal = useAppStore((s) => s.xpTotal);
  const claimedPrintables = useAppStore((s) => s.claimedPrintables);
  const unlockPrintable = useAppStore((s) => s.unlockPrintable);
  const spendXP = useAppStore((s) => s.spendXP);

  const [modal, setModal] = useState<{ title: string; preview: boolean } | null>(null);

  const sections = [
    { title: 'Free / unlocked', items: printableTemplates.filter((p) => p.cost === 0 || claimedPrintables.includes(p.id)) },
    { title: 'Unlock with XP', items: printableTemplates.filter((p) => p.cost > 0 && p.cost < 999 && !claimedPrintables.includes(p.id)) },
    { title: 'Coming soon', items: printableTemplates.filter((p) => p.category === 'coming-soon') },
  ];

  const handleUnlock = (id: string, cost: number, title: string) => {
    if (cost === 0 || spendXP(cost)) {
      unlockPrintable(id);
      setModal({ title, preview: false });
    }
  };

  return (
    <AppShell title="Printables">
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.headline, { color: theme.text }]}>Digital reward library</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            Unlock cozy printables with XP. Downloads coming soon.
          </Text>

          {sections.map((section) =>
            section.items.length ? (
              <View key={section.title}>
                <SectionHeader title={section.title} />
                {section.items.map((item) => (
                  <PrintableCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    cost={item.cost}
                    unlocked={item.cost === 0 || claimedPrintables.includes(item.id) || xpTotal >= item.cost}
                    onPreview={() => setModal({ title: item.title, preview: true })}
                    onUnlock={() => handleUnlock(item.id, item.cost, item.title)}
                  />
                ))}
              </View>
            ) : null,
          )}
        </ScrollView>

        <AppModal
          visible={!!modal}
          onClose={() => setModal(null)}
          title={modal?.preview ? 'Preview' : 'Printable unlocked'}
          message={
            modal?.preview
              ? `${modal.title} — full preview page coming soon.`
              : `${modal?.title} — file download coming soon.`
          }
        />
      </ScreenContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headline: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body, marginBottom: spacing.lg },
});
