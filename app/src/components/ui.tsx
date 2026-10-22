import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, type } from '@/theme';

// Ícones de linha fina no estilo iOS (Ionicons). Os nomes usados no app são
// traduzidos aqui; esportes sem equivalente continuam no MaterialCommunityIcons.
const IOS: Record<string, string> = {
  account: 'person',
  'account-circle-outline': 'person-circle-outline',
  'account-group': 'people',
  'account-group-outline': 'people-outline',
  'account-multiple-outline': 'people-outline',
  'account-off-outline': 'person-remove-outline',
  'account-outline': 'person-outline',
  'account-check': 'checkmark',
  'account-plus': 'person-add-outline',
  'arrow-left': 'chevron-back',
  'arrow-right': 'arrow-forward',
  'arrow-top-right': 'arrow-forward',
  'bell-outline': 'notifications-outline',
  'bell-sleep-outline': 'notifications-off-outline',
  bookmark: 'bookmark',
  'bookmark-outline': 'bookmark-outline',
  'cake-variant-outline': 'calendar-number-outline',
  calendar: 'calendar-outline',
  'calendar-blank-outline': 'calendar-clear-outline',
  'calendar-remove': 'close-circle-outline',
  cash: 'cash-outline',
  'cash-remove': 'pricetag-outline',
  check: 'checkmark',
  'check-bold': 'checkmark',
  'check-decagram': 'checkmark-circle',
  'chevron-down': 'chevron-down',
  'chevron-right': 'chevron-forward',
  'city-variant-outline': 'business-outline',
  'clock-check-outline': 'time-outline',
  'clock-outline': 'time-outline',
  close: 'close',
  'close-circle': 'close-circle',
  'cog-outline': 'settings-outline',
  'comment-processing-outline': 'chatbubble-outline',
  'crosshairs-gps': 'locate-outline',
  'crosshairs-question': 'locate-outline',
  crown: 'ribbon-outline',
  cup: 'cafe-outline',
  directions: 'navigate-outline',
  earth: 'globe-outline',
  'email-outline': 'mail-outline',
  'flask-outline': 'flask-outline',
  'format-list-bulleted': 'list-outline',
  gift: 'gift-outline',
  'gift-off-outline': 'gift-outline',
  'gift-outline': 'gift-outline',
  'hand-wave-outline': 'hand-left-outline',
  heart: 'heart',
  'heart-outline': 'heart-outline',
  history: 'receipt-outline',
  'home-roof': 'home-outline',
  'home-variant': 'home',
  'home-variant-outline': 'home-outline',
  'lightning-bolt': 'flash-outline',
  lock: 'lock-closed',
  'lock-outline': 'lock-closed-outline',
  logout: 'log-out-outline',
  magnify: 'search-outline',
  'map-marker': 'location',
  'map-marker-check': 'location',
  'map-marker-check-outline': 'location-outline',
  'map-marker-distance': 'navigate-outline',
  'map-marker-multiple': 'map-outline',
  'map-marker-off': 'location-outline',
  'map-marker-outline': 'location-outline',
  'map-marker-radius': 'radio-outline',
  'map-marker-radius-outline': 'location-outline',
  'map-outline': 'map-outline',
  'map-search-outline': 'map-outline',
  'medical-bag': 'medkit-outline',
  minus: 'remove',
  moon: 'moon-outline',
  sun: 'sunny-outline',
  phone: 'phone-portrait-outline',
  play: 'play',
  'play-circle-outline': 'play-circle-outline',
  plus: 'add',
  pulse: 'pulse-outline',
  'radiobox-marked': 'checkmark-circle',
  'radiobox-blank': 'ellipse-outline',
  restore: 'refresh-outline',
  'school-outline': 'school-outline',
  send: 'arrow-up',
  'share-variant': 'share-outline',
  'shield-check-outline': 'shield-checkmark-outline',
  'shoe-sneaker': 'footsteps-outline',
  'signal-cellular-2': 'bar-chart-outline',
  star: 'star',
  'star-outline': 'star-outline',
  'star-four-points': 'sparkles',
  'star-four-points-outline': 'sparkles-outline',
  'stadium-variant': 'business-outline',
  'stop-circle-outline': 'stop-circle-outline',
  'storefront-outline': 'storefront-outline',
  'swap-horizontal': 'swap-horizontal-outline',
  'ticket-outline': 'ticket-outline',
  'ticket-percent': 'ticket-outline',
  'ticket-percent-outline': 'ticket-outline',
  'timer-outline': 'timer-outline',
  'timer-sand-empty': 'hourglass-outline',
  trophy: 'trophy-outline',
  'wallet-outline': 'wallet-outline',
  // esportes
  soccer: 'football-outline',
  basketball: 'basketball-outline',
  tennis: 'tennisball-outline',
  'tennis-ball': 'tennisball-outline',
  'run-fast': 'walk-outline',
  run: 'walk-outline',
};

export function Icon({ name, size = 22, color }: { name: string; size?: number; color?: string }) {
  const c = color ?? colors.ink;
  const ion = IOS[name];
  if (ion) return <Ionicons name={ion as React.ComponentProps<typeof Ionicons>['name']} size={size} color={c} />;
  return <MaterialCommunityIcons name={name as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={size} color={c} />;
}

// Logo: K∞RTA — o infinito substitui os dois "O"
export function Logo({ size = 28, color }: { size?: number; color?: string }) {
  const c = color ?? colors.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: size, fontWeight: '900', color: c, letterSpacing: -0.5 }}>K</Text>
      <View style={{ marginHorizontal: -size * 0.02, marginTop: size * 0.04 }}>
        <MaterialCommunityIcons name="infinity" size={size * 1.2} color={c} />
      </View>
      <Text style={{ fontSize: size, fontWeight: '900', color: c, letterSpacing: -0.5 }}>RTA</Text>
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  bottomSpace = 32,
  header,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  bottomSpace?: number;
  header?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const content = padded ? { paddingHorizontal: spacing.xl } : undefined;
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }, style]}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[content, { paddingBottom: bottomSpace + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
    </View>
  );
}

// Barra de navegação no estilo iOS: voltar à esquerda, título centralizado
export function Header({ title, right, onBack }: { title?: string; right?: React.ReactNode; onBack?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, height: 48 }}>
      <Pressable
        hitSlop={10}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minWidth: 70, opacity: pressed ? 0.5 : 1 })}
      >
        <Icon name="arrow-left" size={26} color={colors.brand} />
      </Pressable>
      <Text style={[type.headline, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ minWidth: 70, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  bg,
  size = 40,
  badge,
}: {
  icon: string;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={icon} size={size * 0.5} color={color ?? colors.ink} />
      {!!badge && (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.brand,
            borderWidth: 2,
            borderColor: bg ?? colors.fill,
          }}
        />
      )}
    </Pressable>
  );
}

type Variant = 'primary' | 'inverse' | 'secondary' | 'plain' | 'danger' | 'light';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const v = {
    primary: { bg: colors.brand, fg: colors.onBrand },
    inverse: { bg: colors.inverse, fg: colors.onInverse },
    secondary: { bg: colors.fill, fg: colors.ink },
    plain: { bg: 'transparent', fg: colors.brand },
    danger: { bg: colors.fill, fg: colors.danger },
    light: { bg: colors.white, fg: colors.black },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: small ? 36 : 52,
          paddingHorizontal: small ? 16 : 20,
          borderRadius: radius.pill,
          backgroundColor: v.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.35 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={small ? 16 : 19} color={v.fg} />}
          <Text style={{ color: v.fg, fontWeight: '600', fontSize: small ? 15 : 17 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          height: 34,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.inverse : colors.fill,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={15} color={selected ? colors.onInverse : colors.inkSoft} />}
      <Text style={{ fontWeight: '600', fontSize: 14, color: selected ? colors.onInverse : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

// Controle segmentado do iOS
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 10, padding: 2 }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? colors.elevated : 'transparent' }}
          >
            <Text style={{ fontWeight: sel ? '600' : '500', fontSize: 14, color: colors.ink }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const base = [{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

// Lista agrupada estilo Ajustes do iPhone
export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const itens = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' }, style]}>
      {itens.map((c, i) => (
        <View key={i}>
          {i > 0 && <View style={{ height: 0.5, backgroundColor: colors.line, marginLeft: 52 }} />}
          {c}
        </View>
      ))}
    </View>
  );
}

export function ListItem({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  right,
  chevron = !!onPress,
  destructive,
}: {
  icon?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 14, paddingVertical: 10, gap: 12, backgroundColor: pressed ? colors.fill : 'transparent' })}>
      {icon && (
        <View style={{ width: 26, alignItems: 'center' }}>
          <Icon name={icon} size={21} color={destructive ? colors.danger : iconColor ?? colors.brand} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: destructive ? colors.danger : colors.ink }} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[type.small, { marginTop: 1 }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {!!value && <Text style={{ fontSize: 16, color: colors.muted }}>{value}</Text>}
      {right}
      {chevron && <Icon name="chevron-right" size={18} color={colors.muted} />}
    </Pressable>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.md }}>
      <Text style={type.title}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: colors.brand, fontSize: 16 }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Avatar monocromático: iniciais sobre fundo neutro
export function Avatar({ nome, size = 40, ring, destaque }: { nome: string; size?: number; ring?: boolean; destaque?: boolean }) {
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: destaque ? colors.brand : colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: colors.bg,
      }}
    >
      <Text style={{ color: destaque ? colors.onBrand : colors.ink, fontWeight: '600', fontSize: size * 0.38 }}>{iniciais}</Text>
    </View>
  );
}

export function AvatarStack({ nomes, max = 4, size = 26 }: { nomes: string[]; max?: number; size?: number }) {
  const extra = nomes.length - max;
  return (
    <View style={{ flexDirection: 'row' }}>
      {nomes.slice(0, max).map((n, i) => (
        <View key={n + i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar nome={n} size={size} ring />
        </View>
      ))}
      {extra > 0 && (
        <View style={{ marginLeft: -size * 0.3, width: size, height: size, borderRadius: size / 2, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.ink }}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

export function Pill({ label, color, bg, icon }: { label: string; color?: string; bg?: string; icon?: string }) {
  const c = color ?? colors.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: bg ?? colors.fill, alignSelf: 'flex-start' }}>
      {icon && <Icon name={icon} size={12} color={c} />}
      <Text style={{ color: c, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

// Ponto de status (verde = livre, preto = cheio)
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} hitSlop={4}>
          <Icon name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={n <= Math.round(value) ? colors.brand : colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}

export function Field({ label, error, icon, ...props }: TextInputProps & { label?: string; error?: string; icon?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={[type.caption, { marginBottom: 6, marginLeft: 4 }]}>{label}</Text>}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.fill,
          borderRadius: radius.md,
          borderWidth: error ? 1 : 0,
          borderColor: colors.danger,
          paddingHorizontal: 14,
          minHeight: 50,
        }}
      >
        {icon && (
          <View style={{ marginRight: 10 }}>
            <Icon name={icon} size={19} color={colors.muted} />
          </View>
        )}
        <TextInput
          placeholderTextColor={colors.muted}
          selectionColor={colors.brand}
          {...props}
          style={[{ flex: 1, fontSize: 17, color: colors.ink, paddingVertical: 12 }, props.style]}
        />
      </View>
      {error && <Text style={{ color: colors.danger, marginTop: 4, marginLeft: 4, fontSize: 13 }}>{error}</Text>}
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: spacing.xxl, gap: 8 }}>
      <Icon name={icon} size={44} color={colors.muted} />
      <Text style={[type.headline, { textAlign: 'center', marginTop: 4 }]}>{title}</Text>
      {text && <Text style={[type.body, { textAlign: 'center', color: colors.muted, fontSize: 15 }]}>{text}</Text>}
      {action && <View style={{ marginTop: 10 }}>{action}</View>}
    </View>
  );
}

export function Row({ children, style, gap = 8 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: 0.5, backgroundColor: colors.line, marginLeft: inset }} />;
}
