import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pickAndUploadAvatar, pickAndUploadWorkPhoto } from '@/lib/storage';
import {
  fetchWorkerProfileForEdit, updateUser, updateWorkerAvatar,
  updateWorkerProfileData, updateWorkerPhotos,
} from '@/services';
import { isValidColombianPhone, formatPhone } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD } from '@/constants';
import { Avatar } from '@/components/UI';
import { MunicipioSearch } from '@/components/MunicipioSearch';

const MAX_PHOTOS = 4;

export function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isWorker = user?.role === 'worker';

  const [name, setName] = useState(user?.full_name ?? '');
  const [municipality, setMunicipality] = useState(user?.municipality ?? '');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(isWorker);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [uploadingWorkPhotoIdx, setUploadingWorkPhotoIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isWorker || !user?.id) return;
    fetchWorkerProfileForEdit(user.id)
      .then(data => {
        if (data) {
          setWhatsapp(data.whatsapp_number ?? '');
          setSelectedTrades(data.trades ?? []);
          setBio(data.bio ?? '');
          setExperience(data.experience_years?.toString() ?? '');
          setWorkPhotos(data.photos ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const toggleTrade = (id: string) =>
    setSelectedTrades(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );

  const handleChangePhoto = async () => {
    if (uploadingPhoto || !user) return;
    setUploadingPhoto(true);
    const url = await pickAndUploadAvatar(user.id);
    if (url) {
      await updateUser(user.id, { avatar_url: url });
      if (isWorker) await updateWorkerAvatar(user.id, url);
      setAvatarUrl(url);
      await refreshUser();
    }
    setUploadingPhoto(false);
  };

  const handleAddWorkPhoto = async () => {
    if (uploadingWorkPhotoIdx !== null || !user) return;
    if (workPhotos.length >= MAX_PHOTOS) {
      Alert.alert('Límite alcanzado', 'Puedes subir máximo 4 fotos de trabajo');
      return;
    }
    const idx = workPhotos.length;
    setUploadingWorkPhotoIdx(idx);
    const url = await pickAndUploadWorkPhoto(user.id, idx);
    if (url) {
      const updated = [...workPhotos, url];
      setWorkPhotos(updated);
      await updateWorkerPhotos(user.id, updated);
    }
    setUploadingWorkPhotoIdx(null);
  };

  const handleRemoveWorkPhoto = (idx: number) => {
    Alert.alert('Eliminar foto', '¿Seguro que quieres eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          const updated = workPhotos.filter((_, i) => i !== idx);
          setWorkPhotos(updated);
          if (user) await updateWorkerPhotos(user.id, updated);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim() || !municipality) {
      Alert.alert('Campos requeridos', 'Completa tu nombre y municipio');
      return;
    }
    if (isWorker && selectedTrades.length === 0) {
      Alert.alert('Selecciona oficios', 'Elige al menos un oficio que ofreces');
      return;
    }
    if (isWorker && whatsapp && !isValidColombianPhone(whatsapp)) {
      Alert.alert('Número inválido', 'El WhatsApp debe tener 10 dígitos y empezar por 3. Ej: 3101234567');
      return;
    }
    setSaving(true);
    try {
      await updateUser(user!.id, { full_name: name.trim(), municipality });
      if (isWorker) {
        await updateWorkerProfileData(user!.id, {
          full_name: name.trim(),
          municipality,
          whatsapp_number: formatPhone(whatsapp),
          trades: selectedTrades,
          bio: bio.trim(),
          experience_years: parseInt(experience) || 0,
        });
      }
      await refreshUser();
      Alert.alert('Perfil actualizado', 'Los cambios se guardaron correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          {uploadingPhoto ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <Avatar
              name={name || user?.full_name || 'U'}
              size={82}
              avatarUrl={avatarUrl}
              onPress={handleChangePhoto}
            />
          )}
          <Text style={styles.avatarHint}>Toca para cambiar la foto</Text>
        </View>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre completo"
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
              />
            </View>

            <Text style={[styles.label, { marginTop: 4 }]}>Oficios que ofreces</Text>
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
                    <Text style={[styles.tradeText, { color: cat.textColor }, active && styles.tradeTextSelected]}>
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

            <Text style={styles.label}>Sobre mí</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Cuéntales a los clientes sobre tu experiencia y forma de trabajo..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
            />

            <Text style={styles.label}>Fotos de tu trabajo</Text>
            <Text style={styles.photoHint}>
              Muestra ejemplos de lo que haces · Máximo {MAX_PHOTOS} fotos
            </Text>
            <View style={styles.photosGrid}>
              {workPhotos.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.photoSlot}
                  onPress={() => handleRemoveWorkPhoto(i)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: url }} style={styles.photoImg} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                  <View style={styles.photoRemoveOverlay}>
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
              {workPhotos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={styles.photoSlotAdd}
                  onPress={handleAddWorkPhoto}
                  activeOpacity={0.75}
                  disabled={uploadingWorkPhotoIdx !== null}
                >
                  {uploadingWorkPhotoIdx !== null ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={26} color={COLORS.textTertiary} />
                      <Text style={styles.photoAddText}>Agregar</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  form: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarLoading: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: 12, color: COLORS.textTertiary, marginTop: 8 },
  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 8, marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.card,
    marginBottom: 16, ...SHADOW_SM,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  textarea: { height: 96, textAlignVertical: 'top' },
  chipScroll: { marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.card,
  },
  chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.primaryDark, fontWeight: '700' },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prefix: {
    height: 50, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  prefixText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  tradesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent',
  },
  tradeChipSelected: { borderColor: COLORS.primary },
  tradeText: { fontSize: 12, fontWeight: '500' },
  tradeTextSelected: { fontWeight: '700' },
  photoHint: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 12, marginTop: -4 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoSlot: {
    width: '47%', aspectRatio: 4 / 3,
    borderRadius: 12, overflow: 'hidden',
    ...SHADOW_SM,
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemoveOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 36, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoSlotAdd: {
    width: '47%', aspectRatio: 4 / 3,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, borderStyle: 'dashed',
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoAddText: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
  saveBtn: {
    height: 54, borderRadius: 16, backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, ...SHADOW_MD, shadowColor: COLORS.primary,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
