import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_MD } from '@/constants';
import { UserRole } from '@/types';

const ROLES = [
  {
    id: 'client' as UserRole,
    iconName: 'home' as const,
    iconBg: '#DBEAFE',
    iconColor: '#1E40AF',
    title: 'Necesito un trabajador',
    desc: 'Busco personas de confianza para trabajos en mi casa, finca o negocio',
  },
  {
    id: 'worker' as UserRole,
    iconName: 'construct' as const,
    iconBg: '#FFEDD5',
    iconColor: COLORS.primaryDark,
    title: 'Ofrezco mis servicios',
    desc: 'Soy trabajador independiente y quiero conseguir más clientes en mi zona',
  },
];

export function RoleScreen({ navigation }: any) {
  const [selected, setSelected] = useState<UserRole | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>¿Cómo quieres usar{'\n'}InstaJobs?</Text>
        <Text style={styles.subtitle}>Puedes cambiar esto después en tu perfil</Text>

        <View style={styles.cards}>
          {ROLES.map(role => {
            const active = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.card, active && styles.cardSelected]}
                onPress={() => setSelected(role.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: role.iconBg }]}>
                  <Ionicons name={role.iconName} size={28} color={role.iconColor} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                    {role.title}
                  </Text>
                  <Text style={styles.cardDesc}>{role.desc}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          onPress={() => selected && navigation.navigate('Onboarding', { role: selected })}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 36 },
  title: {
    fontSize: 28, fontWeight: '800', color: COLORS.text,
    marginBottom: 8, lineHeight: 34, letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 32 },
  cards: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 14,
    ...SHADOW_MD,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  cardIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardTitleActive: { color: COLORS.primaryDark },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  radio: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bottom: { paddingHorizontal: 24, paddingBottom: 36 },
  btn: {
    height: 54, borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
