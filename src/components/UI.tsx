import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ViewStyle, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, iconName }: ButtonProps) {
  const bg = variant === 'primary' ? COLORS.primary
    : variant === 'whatsapp' ? COLORS.whatsapp
    : variant === 'secondary' ? COLORS.primaryLight
    : 'transparent';

  const textColor = variant === 'primary' || variant === 'whatsapp' ? '#fff'
    : variant === 'secondary' ? COLORS.primaryDark
    : COLORS.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg },
        variant === 'ghost' && { borderColor: COLORS.primary, borderWidth: 1.5 },
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.btnInner}>
          {iconName && <Ionicons name={iconName} size={18} color={textColor} style={{ marginRight: 6 }} />}
          <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', iconName, style }: BadgeProps) {
  const configs: Record<string, { bg: string; color: string }> = {
    success: { bg: COLORS.successBg, color: COLORS.success },
    warning: { bg: COLORS.warningBg, color: COLORS.warning },
    danger:  { bg: COLORS.dangerBg,  color: COLORS.danger },
    info:    { bg: '#DBEAFE',         color: '#1E40AF' },
    default: { bg: COLORS.borderLight, color: COLORS.textSecondary },
  };
  const { bg, color } = configs[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {iconName && <Ionicons name={iconName} size={9} color={color} style={{ marginRight: 3 }} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── StarRating ───────────────────────────────────────────────────────────────
interface StarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export function StarRating({ rating, count, size = 12 }: StarsProps) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={COLORS.star}
        />
      ))}
      {count !== undefined && (
        <Text style={[styles.starsCount, { fontSize: size - 1 }]}>
          {' '}{rating.toFixed(1)} ({count})
        </Text>
      )}
    </View>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  size?: number;
  colorIndex?: number;
  avatarUrl?: string;
  onPress?: () => void;
}

const AVATAR_COLORS = [
  { bg: '#FED7AA', text: '#9A3412' },
  { bg: '#BFDBFE', text: '#1E40AF' },
  { bg: '#BBF7D0', text: '#14532D' },
  { bg: '#DDD6FE', text: '#5B21B6' },
  { bg: '#FDE68A', text: '#92400E' },
];

export function Avatar({ name, size = 44, colorIndex = 0, avatarUrl, onPress }: AvatarProps) {
  const { bg, text } = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const badgeSize = Math.max(18, size * 0.28);

  const inner = (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.35, color: text }]}>{initials}</Text>
      )}
      {onPress && (
        <View style={[styles.cameraBadge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
          <Ionicons name="camera" size={badgeSize * 0.55} color="#fff" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

// ── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  starsRow: { flexDirection: 'row', alignItems: 'center' },
  starsCount: { color: COLORS.textSecondary, marginLeft: 2 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  sectionAction: { fontSize: 13, color: COLORS.primary },
});
