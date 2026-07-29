import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useReducedMotion } from '@/hooks/useAppTheme';
import { getGardenLevel, getGardenStage } from '@/lib/recommendations';
import { colors, radii, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard } from '@/components/design-system/GlassCard';

function Firefly({ x, y, delay }: { x: number; y: number; delay: number }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 + delay }),
        withTiming(0.3, { duration: 1200 + delay }),
      ),
      -1,
      true,
    );
  }, [delay, opacity, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
      <Svg width={8} height={8}>
        <Circle cx={4} cy={4} r={3} fill={colors.warningPeach} />
      </Svg>
    </Animated.View>
  );
}

export function GardenScene({ height = 220, compact }: { height?: number; compact?: boolean }) {
  const theme = useAppTheme();
  const xpTotal = useAppStore((s) => s.xpTotal);
  const gardenItems = useAppStore((s) => s.gardenItems);
  const stage = getGardenStage(xpTotal);
  const level = getGardenLevel(xpTotal);

  const showSprout = xpTotal >= 25;
  const showPlant = xpTotal >= 50;
  const showTree = xpTotal >= 100;
  const showFlowers = xpTotal >= 150;
  const showPond = xpTotal >= 250;
  const showHouse = xpTotal >= 400;
  const showStars = xpTotal >= 600;

  return (
    <View style={[styles.scene, { height }]}>
      <Svg width="100%" height={height} viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={400} height={140} fill={theme.mode === 'dark' ? '#1A1830' : '#EDE7FF'} />
        <Ellipse cx={200} cy={130} rx={220} ry={60} fill={theme.mode === 'dark' ? '#2A2845' : '#D4C4FF'} opacity={0.5} />
        <Ellipse cx={200} cy={170} rx={240} ry={70} fill={theme.mode === 'dark' ? '#3D3855' : '#C8B6FF'} opacity={0.35} />
        <Path
          d="M0 160 Q200 130 400 160 L400 220 L0 220 Z"
          fill={theme.mode === 'dark' ? '#4A4560' : '#9BF6C3'}
          opacity={0.45}
        />
        <Path
          d="M40 170 Q120 150 200 165 T360 170 L360 220 L40 220 Z"
          fill={theme.mode === 'dark' ? '#5A5570' : '#7DE2D1'}
          opacity={0.35}
        />

        {showPond ? (
          <Ellipse cx={300} cy={185} rx={35} ry={12} fill={colors.aqua} opacity={0.7} />
        ) : null}

        {showSprout ? (
          <Path d="M120 165 Q120 140 125 130 Q130 140 130 165 Z" fill={colors.successMint} />
        ) : null}

        {showPlant ? (
          <>
            <Path d="M180 168 Q175 130 190 115 Q195 130 188 168 Z" fill="#7DE2D1" />
            <Path d="M195 168 Q200 125 210 110 Q215 125 205 168 Z" fill={colors.successMint} />
          </>
        ) : null}

        {showTree ? (
          <>
            <Rect x={248} y={145} width={8} height={30} fill="#8B7355" />
            <Circle cx={252} cy={130} r={28} fill={colors.softLilac} opacity={0.9} />
          </>
        ) : null}

        {showFlowers ? (
          <>
            <Circle cx={90} cy={175} r={6} fill={colors.softCoral} />
            <Circle cx={105} cy={180} r={5} fill={colors.periwinkle} />
            <Circle cx={320} cy={178} r={6} fill={colors.aqua} />
          </>
        ) : null}

        {showHouse ? (
          <>
            <Rect x={60} y={150} width={40} height={30} fill={colors.cardDark} opacity={0.8} />
            <Path d="M55 150 L80 125 L105 150 Z" fill={colors.softCoral} opacity={0.85} />
          </>
        ) : null}

        {showStars ? (
          <>
            <Circle cx={50} cy={40} r={2} fill={colors.warmCream} />
            <Circle cx={120} cy={25} r={1.5} fill={colors.warmCream} />
            <Circle cx={340} cy={35} r={2} fill={colors.warmCream} />
            <Circle cx={280} cy={20} r={1.5} fill={colors.aqua} />
          </>
        ) : null}

        {gardenItems.slice(-3).map((item, i) => (
          <Circle
            key={item.id}
            cx={150 + i * 40}
            cy={178 - i * 5}
            r={4}
            fill={item.type.includes('water') ? colors.aqua : colors.softCoral}
          />
        ))}
      </Svg>

      {!compact && showStars ? (
        <>
          <Firefly x={60} y={50} delay={0} />
          <Firefly x={280} y={70} delay={400} />
          <Firefly x={180} y={40} delay={800} />
        </>
      ) : null}

      {!compact ? (
        <View style={styles.overlay}>
          <Text style={[styles.stage, { color: theme.text }]}>{stage}</Text>
          <Text style={[styles.level, { color: theme.textSecondary }]}>
            Level {level.level}: {level.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function GardenPreview() {
  const theme = useAppTheme();
  const router = useRouter();
  const xpTotal = useAppStore((s) => s.xpTotal);
  const xpToNext = useAppStore((s) => {
    const { getXpToNextLevel } = require('@/lib/recommendations');
    return getXpToNextLevel(s.xpTotal);
  });

  return (
    <GlassCard onPress={() => router.push('/garden' as never)} glow>
      <Text style={[styles.previewTitle, { color: theme.text }]}>
        Your garden grows from invisible effort
      </Text>
      <GardenScene height={160} compact />
      <Text style={[styles.previewMeta, { color: theme.textSecondary }]}>
        {xpToNext > 0 ? `${xpToNext} XP until your next garden item` : 'Your world is blooming ✨'}
        {' · '}{xpTotal} total XP
      </Text>
    </GlassCard>
  );
}

export function ThemeToggle() {
  const theme = useAppTheme();
  const profile = useAppStore((s) => s.userProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const modes = ['light', 'dark', 'system'] as const;

  return (
    <View style={styles.toggleRow}>
      {modes.map((mode) => (
        <Pressable
          key={mode}
          onPress={() => updateProfile({ theme: mode })}
          style={[
            styles.toggleBtn,
            {
              backgroundColor: profile?.theme === mode ? theme.accentTertiary : theme.surface,
              borderColor: theme.surfaceBorder,
            },
          ]}>
          <Text style={{ color: theme.text, textTransform: 'capitalize', fontWeight: '600' }}>
            {mode}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function EnergySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const theme = useAppTheme();
  const { energyOptions } = require('@/data/content');

  return (
    <View style={styles.energyGrid}>
      {energyOptions.map((opt: { id: string; label: string; emoji: string }) => (
        <Pressable
          key={opt.id}
          onPress={() => onChange(opt.id)}
          style={[
            styles.energyBtn,
            {
              backgroundColor: value === opt.id ? theme.accentTertiary : theme.surface,
              borderColor: value === opt.id ? theme.accent : theme.surfaceBorder,
            },
          ]}>
          <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: radii.lg, overflow: 'hidden', position: 'relative' },
  overlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  stage: { ...typography.caption, fontWeight: '700' },
  level: { ...typography.caption },
  previewTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
  previewMeta: { ...typography.caption, marginTop: spacing.sm },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  energyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  energyBtn: {
    width: '47%',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
});
