import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/design-system/ScreenContainer';
import { OnboardingGrid } from '@/components/onboarding/OnboardingGrid';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import {
  OnboardingOptionCard,
  OnboardingVibeCard,
} from '@/components/onboarding/OnboardingOptionCard';
import {
  energyOptions,
  gardenVibeOptions,
  problemOptions,
  supportStyleOptions,
} from '@/data/content';
import { useAppStore } from '@/store/useAppStore';
import {
  EnergyLevel,
  GardenVibe,
  StruggleId,
  SupportStyle,
  UserProfile,
} from '@/types';

const GRID_GAP_MOBILE = 10;
const GRID_GAP_DESKTOP = 16;

function toggleOrderedSelection<T extends string>(
  current: T[],
  id: T,
  max: number,
): T[] {
  if (current.includes(id)) {
    const next = current.filter((item) => item !== id);
    return next.length === 0 ? current : next;
  }
  if (current.length >= max) return current;
  return [...current, id];
}

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const { width: viewportWidth } = useWindowDimensions();

  const isWide = viewportWidth >= 768;
  const gridGap = isWide ? GRID_GAP_DESKTOP : GRID_GAP_MOBILE;

  const [step, setStep] = useState(0);
  const [selectedStruggles, setSelectedStruggles] = useState<StruggleId[]>(['cant-start']);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('low');
  const [supportStyles, setSupportStyles] = useState<SupportStyle[]>(['tiny-steps']);
  const [gardenVibe, setGardenVibe] = useState<GardenVibe>('lilac-greenhouse');

  const mainStruggle = selectedStruggles[0];
  const secondaryStruggles = selectedStruggles.slice(1);

  const struggleColumns = isWide ? 4 : 2;
  const energyColumns = 2;
  const supportColumns = isWide ? 3 : 2;
  const vibeColumns = isWide ? 4 : 2;

  const struggleRole = (id: StruggleId): 'Main' | 'Also' | undefined => {
    if (selectedStruggles[0] === id) return 'Main';
    if (selectedStruggles.includes(id)) return 'Also';
    return undefined;
  };

  const canContinue = useMemo(() => {
    if (step === 0) return selectedStruggles.length >= 1;
    if (step === 2) return supportStyles.length >= 1;
    return true;
  }, [step, selectedStruggles.length, supportStyles.length]);

  const finish = () => {
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      mainStruggle,
      secondaryStruggles,
      energyLevel,
      supportStyle: supportStyles[0],
      supportStyles,
      gardenVibe,
      theme: 'system',
      onboardingComplete: true,
      lowEnergyMode: energyLevel === 'low' || energyLevel === 'empty-battery',
      reducedMotion: false,
      waterGoal: 5,
      focusDuration: 10,
      claimWithoutSpending: false,
      createdAt: new Date().toISOString(),
    };
    completeOnboarding(profile);
    router.replace('/dashboard');
  };

  const goNext = () => {
    if (step === 4) finish();
    else setStep(step + 1);
  };

  const goBack = () => setStep(step - 1);

  if (step === 4) {
    return (
      <ScreenContainer>
        <OnboardingLayout
          stepIndex={step}
          completion
          title="Your tiny support space is ready"
          completionBody="You can start with tools that match your brain today — and update your preferences anytime."
          showBack
          onBack={goBack}
          onContinue={finish}
          continueLabel="Get started"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {step === 0 && (
        <OnboardingLayout
          stepIndex={step}
          title="What feels hardest today?"
          subtitle="Pick 1 main struggle. Optional: add up to 2 more."
          hint="Your first choice becomes the main struggle."
          showBack={false}
          onContinue={goNext}
          canContinue={canContinue}>
          <OnboardingGrid columns={struggleColumns} gap={gridGap}>
            {problemOptions.map((opt) => (
              <OnboardingOptionCard
                key={opt.id}
                label={opt.label}
                emoji={opt.emoji}
                selected={selectedStruggles.includes(opt.id)}
                badge={struggleRole(opt.id)}
                onPress={() =>
                  setSelectedStruggles((prev) => toggleOrderedSelection(prev, opt.id, 3))
                }
              />
            ))}
          </OnboardingGrid>
        </OnboardingLayout>
      )}

      {step === 1 && (
        <OnboardingLayout
          stepIndex={step}
          title="What is your energy usually like?"
          subtitle="Pick the one that feels most true most often."
          showBack
          onBack={goBack}
          onContinue={goNext}
          canContinue={canContinue}>
          <OnboardingGrid columns={energyColumns} gap={gridGap}>
            {energyOptions.map((opt) => (
              <OnboardingOptionCard
                key={opt.id}
                label={opt.label}
                emoji={opt.emoji}
                selected={energyLevel === opt.id}
                onPress={() => setEnergyLevel(opt.id as EnergyLevel)}
              />
            ))}
          </OnboardingGrid>
        </OnboardingLayout>
      )}

      {step === 2 && (
        <OnboardingLayout
          stepIndex={step}
          title="What kind of support helps most?"
          subtitle="Choose up to 3 that usually help."
          showBack
          onBack={goBack}
          onContinue={goNext}
          canContinue={canContinue}>
          <OnboardingGrid columns={supportColumns} gap={gridGap}>
            {supportStyleOptions.map((opt) => (
              <OnboardingOptionCard
                key={opt.id}
                label={opt.label}
                selected={supportStyles.includes(opt.id as SupportStyle)}
                onPress={() =>
                  setSupportStyles((prev) =>
                    toggleOrderedSelection(prev, opt.id as SupportStyle, 3),
                  )
                }
              />
            ))}
          </OnboardingGrid>
        </OnboardingLayout>
      )}

      {step === 3 && (
        <OnboardingLayout
          stepIndex={step}
          title="Choose your garden vibe"
          showBack
          onBack={goBack}
          onContinue={goNext}
          canContinue={canContinue}>
          <OnboardingGrid columns={vibeColumns} gap={gridGap}>
            {gardenVibeOptions.map((opt) => (
              <OnboardingVibeCard
                key={opt.id}
                label={opt.label}
                emoji={opt.emoji}
                selected={gardenVibe === opt.id}
                onPress={() => setGardenVibe(opt.id as GardenVibe)}
              />
            ))}
          </OnboardingGrid>
        </OnboardingLayout>
      )}
    </ScreenContainer>
  );
}
