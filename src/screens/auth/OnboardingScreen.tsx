import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pickAndUploadAvatar } from '@/lib/storage';
import { getAuthUser, upsertOnboardingUser, upsertWorkerOnboarding } from '@/services';
import { isValidColombianPhone, formatPhone } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM } from '@/constants';
import { Avatar } from '@/components/UI';
import { MunicipioSearch } from '@/components/MunicipioSearch';
import { UserRole } from '@/types';

export function OnboardingScreen({ navigation, route }: any) {
  const { role } = route.params as { role: UserRole };
  const { setIsNewUser, refreshUser } = useAuth();

  const [name, setName]                   = useState('');
  const [municipality, setMunicipality]   = useState('');
  const [whatsapp, setWhatsapp]           = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [bio, setBio]                     = useState('');
  const [experience, setExperience]       = useState('');
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading]             = useState(false);

  const isWorker = role === 'worker';

  const toggleTrade = (id: string) => {
    setSelectedTrades(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handlePickPhoto = async () => {
    if (uploadingPhoto) return;
    const authUser = await getAuthUser();
    if (!authUser) return;
    setUploadingPhoto(true);
    const url = await pickAndUploadAvatar(authUser.id);
    if (url) setAvatarUrl(url);
    setUploadingPhoto(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !municipality) {
      Alert.alert('Campos requeridos', 'Por favor completa tu nombre y municipio');
      return;
    }
    if (isWorker && selectedTrades.length === 0) {
      Alert.alert('Selecciona oficios', 'Elige al menos un oficio que ofrezcas');
      return;
    }
    if (isWorker && whatsapp && !isValidColombianPhone(whatsapp)) {
      Alert.alert('Número inválido', 'El número de WhatsApp debe tener 10 dígitos y empezar por 3. Ej: 3101234567');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Términos requeridos', 'Debes aceptar los Términos y Política de Privacidad para continuar');
      return;
    }

    setLoading(true);
    try {
      const authUser = await getAuthUser();
      if (!authUser) return;

      await upsertOnboardingUser({
        id: authUser.id,
        phone: authUser.phone,
        full_name: name.trim(),
        role,
        municipality,
        avatar_url: avatarUrl,
        verified_phone: true,
        verified_id: false,
      });

      if (isWorker) {
        await upsertWorkerOnboarding({
          user_id: authUser.id,
          trades: selectedTrades,
          bio: bio.trim(),
          experience_years: parseInt(experience) || 0,
          whatsapp_number: whatsapp ? formatPhone(whatsapp) : authUser.phone?.replace('+57', '') ?? '',
          available: true,
          membership_tier: 'free',
          municipality,
          full_name: name.trim(),
          avatar_url: avatarUrl,
          photos: [],
        });
      }

      await refreshUser();
      setIsNewUser(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>
            {isWorker
              ? 'Los clientes verán esta información al buscarte'
              : 'Cuéntanos un poco sobre ti'}
          </Text>
        </View>

        {/* Foto de perfil */}
        <View style={styles.avatarSection}>
          {uploadingPhoto ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <Avatar
              name={name || 'U'}
              size={82}
              avatarUrl={avatarUrl ?? undefined}
              onPress={handlePickPhoto}
            />
          )}
          <View style={styles.avatarHintRow}>
            <Ionicons name="camera-outline" size={13} color={COLORS.primary} />
            <Text style={styles.avatarHint}>
              {avatarUrl ? 'Foto agregada · toca para cambiar' : 'Agrega una foto (opcional)'}
            </Text>
          </View>
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

          {isWorker && (
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
                  maxLength={10}
                />
              </View>
              {whatsapp.length > 0 && !isValidColombianPhone(whatsapp) && (
                <Text style={styles.fieldError}>
                  Debe tener 10 dígitos y empezar por 3
                </Text>
              )}

              <Text style={[styles.label, { marginTop: 4 }]}>¿Qué oficios ofreces?</Text>
              <View style={styles.tradesGrid}>
                {CATEGORIES.map(cat => {
                  const active = selectedTrades.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.tradeChip, { backgroundColor: cat.color }, active && styles.tradeChipSelected]}
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
                      {active && <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />}
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

        {/* Aceptar términos */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAcceptedTerms(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
            {acceptedTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text
              style={styles.termsLink}
              onPress={() => navigation.navigate('Terms')}
            >
              Términos y Política de Privacidad
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.btn, (loading || !acceptedTerms) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading || !acceptedTerms}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Entrar a InstaJobs</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
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
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarLoading: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  avatarHint: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  form: { paddingHorizontal: 24, gap: 0 },
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
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  prefix: {
    height: 50, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  prefixText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  fieldError: { fontSize: 12, color: COLORS.danger, marginBottom: 14, marginTop: 4 },
  tradesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent',
  },
  tradeChipSelected: { borderColor: COLORS.primary },
  tradeText: { fontSize: 12, color: COLORS.text },
  tradeTextSelected: { fontWeight: '700', color: COLORS.primaryDark },
  termsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 24, marginTop: 8, marginBottom: 4,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
    backgroundColor: COLORS.white,
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingTop: 16 },
  btn: {
    height: 54, borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
