import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES } from '@/constants';
import { MunicipioSearch } from '@/components/MunicipioSearch';
import { UserRole } from '@/types';

export function OnboardingScreen({ navigation, route }: any) {
  const { role } = route.params as { role: UserRole };
  const { setIsNewUser, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTrade = (id: string) => {
    setSelectedTrades(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !municipality) {
      Alert.alert('Campos requeridos', 'Por favor completa tu nombre y municipio');
      return;
    }
    if (role === 'worker' && selectedTrades.length === 0) {
      Alert.alert('Selecciona oficios', 'Elige al menos un oficio que ofrezcas');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      phone: user.phone,
      full_name: name.trim(),
      role,
      municipality,
      verified_phone: true,
      verified_id: false,
    });

    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }

    if (role === 'worker') {
      await supabase.from('worker_profiles').upsert({
        user_id: user.id,
        trades: selectedTrades,
        bio: bio.trim(),
        experience_years: parseInt(experience) || 0,
        whatsapp_number: whatsapp || user.phone?.replace('+57', '') || '',
        available: true,
        membership_tier: 'free',
        municipality,
        full_name: name.trim(),
        photos: [],
      });
    }
    await refreshUser();
    setLoading(false);
    setIsNewUser(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>
            {role === 'worker'
              ? 'Los clientes verán esta información al buscarte'
              : 'Cuéntanos un poco sobre ti'}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Carlos Andrés López"
            placeholderTextColor={COLORS.textTertiary}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Municipio o ciudad</Text>
          <MunicipioSearch value={municipality} onChange={setMunicipality} />

          {role === 'worker' && (
            <>
              <Text style={styles.label}>WhatsApp de contacto</Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefix}>
                  <Text style={styles.prefixText}>+57</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="310 123 4567"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                />
              </View>

              <Text style={[styles.label, { marginTop: 4 }]}>¿Qué oficios ofreces?</Text>
              <View style={styles.tradesGrid}>
                {CATEGORIES.map(cat => {
                  const active = selectedTrades.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.tradeChip,
                        { backgroundColor: cat.color },
                        active && styles.tradeChipSelected,
                      ]}
                      onPress={() => toggleTrade(cat.id)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={cat.iconName as keyof typeof Ionicons.glyphMap}
                        size={14}
                        color={active ? COLORS.primaryDark : cat.textColor}
                      />
                      <Text style={[styles.tradeText, active && styles.tradeTextSelected]}>
                        {cat.label}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Años de experiencia</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 5"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                maxLength={2}
                value={experience}
                onChangeText={setExperience}
              />

              <Text style={styles.label}>Cuéntanos sobre ti</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Ej: Plomero con 8 años de experiencia en instalación de redes hidráulicas..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
                value={bio}
                onChangeText={setBio}
              />
            </>
          )}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <Text style={styles.btnText}>Guardando...</Text>
              : (
                <>
                  <Text style={styles.btnText}>Entrar a InstaJobs</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingTop: 28, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  form: { paddingHorizontal: 24, paddingTop: 20, gap: 0 },
  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.white,
    marginBottom: 20,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  textarea: { height: 96, textAlignVertical: 'top' },
  chipScroll: { marginBottom: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.white,
  },
  chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.primaryDark, fontWeight: '700' },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  prefix: {
    height: 50, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  prefixText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  tradesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent',
  },
  tradeChipSelected: { borderColor: COLORS.primary },
  tradeText: { fontSize: 12, color: COLORS.text },
  tradeTextSelected: { fontWeight: '700', color: COLORS.primaryDark },
  bottom: { paddingHorizontal: 24, paddingTop: 8 },
  btn: {
    height: 54, borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
