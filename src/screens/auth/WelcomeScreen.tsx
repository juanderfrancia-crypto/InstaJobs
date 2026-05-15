import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_MD } from '@/constants';

const FEATURES = [
  { iconName: 'location' as const,  text: 'Trabajadores cerca de ti' },
  { iconName: 'star' as const,      text: 'Con calificaciones reales' },
  { iconName: 'flash' as const,     text: 'Contacto inmediato por WhatsApp' },
];

export function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.hero}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../assets/logoinsta.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tagline}>
          Conectamos oficios con personas{'\n'}en tu mismo municipio
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.iconName} size={18} color="#fff" />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
            <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.6)" />
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <View style={styles.phoneNote}>
          <Ionicons name="phone-portrait-outline" size={15} color="rgba(255,255,255,0.95)" />
          <Text style={styles.phoneNoteText}>
            Solo tu número de celular · Sin contraseñas
          </Text>
        </View>
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={() => navigation.navigate('Phone')}
          activeOpacity={0.85}
        >
          <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primary} />
          <Text style={styles.mainBtnText}>Ingresar o registrarse</Text>
        </TouchableOpacity>
        <Text style={styles.terms}>
          Al continuar aceptas los{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Terms')}>Términos de uso</Text>
          {' '}y la{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Terms')}>Política de privacidad</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  logoWrapper: {
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  logoImage: {
    width: 240,
    height: 120,
    borderRadius: 24,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  features: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    marginBottom: 28,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 14, color: '#fff', fontWeight: '500', flex: 1 },
  bottom: { paddingHorizontal: 24, paddingBottom: 36, gap: 12 },
  phoneNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9,
    alignSelf: 'center',
  },
  phoneNoteText: { fontSize: 12, color: 'rgba(255,255,255,0.95)', fontWeight: '500' },
  mainBtn: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW_MD,
  },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  terms: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  link: { color: '#fff', textDecorationLine: 'underline' },
});
