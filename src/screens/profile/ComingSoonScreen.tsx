import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_MD } from '@/constants';

export function ComingSoonScreen({ route, navigation }: any) {
  const { title, description, iconName = 'construct-outline' } = route.params ?? {};
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>

        <View style={styles.badge}>
          <Ionicons name="time-outline" size={14} color={COLORS.primary} />
          <Text style={styles.badgeText}>Próximamente</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.btnText}>Volver al perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, ...SHADOW_MD, shadowColor: COLORS.primary,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: COLORS.text,
    textAlign: 'center', marginBottom: 12, letterSpacing: -0.3,
  },
  desc: {
    fontSize: 15, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    marginBottom: 36,
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  btnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
