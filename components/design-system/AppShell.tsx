import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { brandNames, radii, spacing, typography } from '@/lib/theme';
import { XPBadge } from './Progress';
import { useAppStore } from '@/store/useAppStore';

const mainNav = [
  { route: '/dashboard', label: 'Home', icon: '🏡' },
  { route: '/tools', label: 'Tools', icon: '🧰' },
  { route: '/garden', label: 'Garden', icon: '🪴' },
  { route: '/progress', label: 'Proof', icon: '📊' },
  { route: '/settings', label: 'More', icon: '⚙️' },
];

const TOP_LEVEL_MOBILE_ROUTES = new Set([
  '/dashboard',
  '/tools',
  '/garden',
  '/progress',
  '/settings',
]);

const sidebarNav = [
  { route: '/dashboard', label: 'Dashboard', icon: '🏡' },
  { route: '/cant-start', label: "Can't Start", icon: '🌱' },
  { route: '/tiny-wins', label: 'Tiny Wins', icon: '✨' },
  { route: '/focus', label: 'Focus', icon: '⏱️' },
  { route: '/mood', label: 'Mood', icon: '💭' },
  { route: '/sleep', label: 'Sleep', icon: '🌙' },
  { route: '/water', label: 'Water', icon: '💧' },
  { route: '/self-care', label: 'Self-Care', icon: '🫶' },
  { route: '/home-care', label: 'Home Care', icon: '🏠' },
  { route: '/rewards', label: 'Rewards', icon: '🎁' },
  { route: '/garden', label: 'Garden', icon: '🪴' },
  { route: '/printables', label: 'Printables', icon: '📄' },
  { route: '/progress', label: 'Proof', icon: '📊' },
  { route: '/journal', label: 'Brain Dump', icon: '📝' },
  { route: '/tools', label: 'Tool Library', icon: '🧰' },
  { route: '/settings', label: 'Settings', icon: '⚙️' },
  { route: '/about', label: 'About', icon: '💜' },
];

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const theme = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const xpToday = useAppStore((s) => s.xpToday);
  const showMobileBack = !isWide && Boolean(title) && !TOP_LEVEL_MOBILE_ROUTES.has(pathname);

  const handleMobileBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard' as never);
    }
  };

  const NavItem = ({ route, label, icon }: { route: string; label: string; icon: string }) => {
    const active = pathname === route || pathname.startsWith(route + '/');
    return (
      <Pressable
        onPress={() => router.push(route as never)}
        style={[
          isWide ? styles.sidebarItem : styles.tabItem,
          active && { backgroundColor: theme.accentTertiary + '44' },
        ]}>
        <Text style={styles.navIcon}>{icon}</Text>
        <Text
          style={[
            isWide ? styles.sidebarLabel : styles.tabLabel,
            { color: active ? theme.text : theme.textMuted },
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  if (isWide) {
    return (
      <View
        style={[
          styles.shell,
          styles.wideShell,
          { backgroundColor: theme.background },
        ]}>
        <View
          style={[
            styles.sidebar,
            {
              backgroundColor: theme.sidebar,
              borderColor: theme.surfaceBorder,
              paddingTop: insets.top + spacing.md,
            },
          ]}>
          <Text style={[styles.brand, { color: theme.text }]}>{brandNames[0]}</Text>
          <Text style={[styles.brandSub, { color: theme.textMuted }]}>Make tiny progress visible</Text>
          <View style={{ marginVertical: spacing.sm }}>
            <XPBadge xp={xpToday} size="sm" />
          </View>
          <View style={styles.sidebarNav}>
            {sidebarNav.map((item) => (
              <NavItem key={item.route} {...item} />
            ))}
          </View>
        </View>
        <View style={styles.main}>
          {title ? (
            <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
              <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>
            </View>
          ) : null}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.shell, { backgroundColor: theme.background }]}>
      {title ? (
        <View
          style={[
            styles.mobileTop,
            {
              paddingTop: insets.top + spacing.sm,
              backgroundColor: theme.background,
              borderColor: theme.surfaceBorder,
            },
          ]}>
          {showMobileBack ? (
            <Pressable
              onPress={handleMobileBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={styles.backBtn}>
              <Text style={[styles.backArrow, { color: theme.text }]}>←</Text>
            </Pressable>
          ) : null}
          <Text
            style={[styles.pageTitle, styles.mobilePageTitle, { color: theme.text }]}
            numberOfLines={1}>
            {title}
          </Text>
          <XPBadge xp={xpToday} size="sm" />
        </View>
      ) : null}
      <View style={[styles.content, { paddingBottom: 80 + insets.bottom }]}>{children}</View>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.tabBar,
            borderColor: theme.surfaceBorder,
            paddingBottom: insets.bottom + spacing.xs,
          },
        ]}>
        {mainNav.map((item) => (
          <NavItem key={item.route} {...item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  wideShell: {
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    borderRightWidth: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  brand: { ...typography.h3, fontWeight: '700' },
  brandSub: { ...typography.caption, marginTop: 2, marginBottom: spacing.sm },
  sidebarNav: { gap: 2 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  sidebarLabel: { ...typography.bodySmall, fontWeight: '600' },
  main: { flex: 1, minWidth: 0 },
  topBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  mobileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  pageTitle: { ...typography.h2 },
  mobilePageTitle: {
    flex: 1,
    minWidth: 0,
  },
  content: { flex: 1 },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabLabel: { ...typography.caption, fontSize: 10 },
  navIcon: { fontSize: 18 },
});
