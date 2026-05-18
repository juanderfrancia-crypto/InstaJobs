import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, URGENCY_OPTIONS, SHADOW_SM, SHADOW_MD } from '@/constants';
import { MunicipioSearch } from '@/components/MunicipioSearch';
import { pickAndUploadJobPhoto } from '@/lib/storage';
import { createJob, updateJob } from '@/services';

const MAX_PHOTOS = 4;

const FLEX_DURATIONS = ['1-2 días', '3-5 días', '1 semana', '2 semanas', '1 mes o más'];

const getWeekDays = () => {
  const days = [];
  const NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: `${NAMES[d.getDay()]} ${d.getDate()}`,
      value: `${NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    });
  }
  return days;
};

export function PostJobScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const editJob = (route?.params as any)?.job;
  const isEditing = !!editJob?.id;

  const [category, setCategory] = useState(editJob?.trade_category ?? '');
  const [title, setTitle] = useState(editJob?.title ?? '');
  const [description, setDescription] = useState(editJob?.description ?? '');
  const [municipality, setMunicipality] = useState(editJob?.municipality ?? user?.municipality ?? '');
  const [workersNeeded, setWorkersNeeded] = useState<number>(editJob?.workers_needed ?? 1);
  const [urgency, setUrgency] = useState(editJob?.urgency ?? 'today');
  const [urgencyDetail, setUrgencyDetail] = useState(editJob?.urgency_detail ?? '');
  const [budgetMin, setBudgetMin] = useState(editJob?.budget_min ? String(editJob.budget_min) : '');
  const [budgetMax, setBudgetMax] = useState(editJob?.budget_max ? String(editJob.budget_max) : '');
  const [jobPhotos, setJobPhotos] = useState<string[]>(editJob?.photos ?? []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!category || !title.trim() || !description.trim() || !municipality) {
      Alert.alert('Campos requeridos', 'Por favor completa categoría, título, descripción y municipio');
      return;
    }
    setLoading(true);
    if (isEditing) {
      try {
        await updateJob(editJob.id, {
          trade_category: category,
          title: title.trim(),
          description: description.trim(),
          municipality,
          urgency,
          urgency_detail: urgencyDetail || null,
          budget_min: budgetMin ? parseInt(budgetMin) : null,
          budget_max: budgetMax ? parseInt(budgetMax) : null,
          workers_needed: workersNeeded,
          photos: jobPhotos,
        });
        navigation.goBack();
      } catch (e: any) {
        Alert.alert('Error al guardar', e.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await createJob({
          client_id: user?.id,
          trade_category: category,
          title: title.trim(),
          description: description.trim(),
          municipality,
          urgency,
          urgency_detail: urgencyDetail || null,
          budget_min: budgetMin ? parseInt(budgetMin) : null,
          budget_max: budgetMax ? parseInt(budgetMax) : null,
          workers_needed: workersNeeded,
          status: 'open',
          photos: jobPhotos,
        });
        setCategory('');
        setTitle('');
        setDescription('');
        setBudgetMin('');
        setBudgetMax('');
        Alert.alert(
          'Trabajo publicado',
          'Los trabajadores de tu zona ya pueden ver tu publicación',
          [{ text: 'Ver mis publicaciones', onPress: () => navigation.navigate('MyActivity') }]
        );
      } catch (e: any) {
        Alert.alert('Error al publicar', e?.message ?? 'No se pudo publicar el trabajo');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddPhoto = async () => {
    if (uploadingPhoto || !user) return;
    if (jobPhotos.length >= MAX_PHOTOS) {
      Alert.alert('Límite alcanzado', 'Puedes agregar máximo 4 fotos');
      return;
    }
    setUploadingPhoto(true);
    const url = await pickAndUploadJobPhoto(user.id);
    if (url) setJobPhotos(prev => [...prev, url]);
    setUploadingPhoto(false);
  };

  const handleRemovePhoto = (idx: number) => {
    setJobPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {canGoBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{isEditing ? 'Editar publicación' : 'Publicar trabajo'}</Text>
          <Text style={styles.headerSub}>
            {isEditing ? 'Actualiza los detalles de tu publicación' : 'Los trabajadores de tu zona lo verán de inmediato'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Tipo de oficio *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, { backgroundColor: cat.color }, active && styles.catChipSelected]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.iconName as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={active ? COLORS.primaryDark : cat.textColor}
                />
                <Text style={[styles.catText, { color: cat.textColor }, active && styles.catTextSelected]}>
                  {cat.label}
                </Text>
                {active && <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Título del trabajo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Arreglo de tubería rota en baño"
          placeholderTextColor={COLORS.textTertiary}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        <Text style={styles.sectionLabel}>Descripción detallada *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe el trabajo: qué necesitas, en qué condición está, si tienes materiales, acceso, etc."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionLabel}>Municipio *</Text>
        <MunicipioSearch value={municipality} onChange={setMunicipality} />

        <Text style={styles.sectionLabel}>¿Cuántos trabajadores necesitas? *</Text>
        <View style={styles.vacantesRow}>
          {[1, 2, 3, 4, 5, 10].map(n => {
            const active = workersNeeded === n;
            const label = n === 10 ? '10+' : String(n);
            return (
              <TouchableOpacity
                key={n}
                style={[styles.vacanteChip, active && styles.vacanteChipActive]}
                onPress={() => setWorkersNeeded(n)}
                activeOpacity={0.8}
              >
                <Text style={[styles.vacanteText, active && styles.vacanteTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Urgencia</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map(opt => {
            const active = urgency === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.urgChip, active && styles.urgChipSelected]}
                onPress={() => { setUrgency(opt.id); setUrgencyDetail(''); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.iconName as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={active ? COLORS.primaryDark : COLORS.textTertiary}
                />
                <Text style={[styles.urgText, active && styles.urgTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detalle: Esta semana → elige el día */}
        {urgency === 'week' && (
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>¿Para qué día lo necesitas?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detailScroll}>
              {getWeekDays().map(day => {
                const active = urgencyDetail === day.value;
                return (
                  <TouchableOpacity
                    key={day.value}
                    style={[styles.detailChip, active && styles.detailChipActive]}
                    onPress={() => setUrgencyDetail(active ? '' : day.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.detailChipText, active && styles.detailChipTextActive]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Detalle: Flexible → elige duración */}
        {urgency === 'flexible' && (
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>¿Cuánto tiempo aproximado dura el trabajo?</Text>
            <View style={styles.durationGrid}>
              {FLEX_DURATIONS.map(dur => {
                const active = urgencyDetail === dur;
                return (
                  <TouchableOpacity
                    key={dur}
                    style={[styles.detailChip, active && styles.detailChipActive]}
                    onPress={() => setUrgencyDetail(active ? '' : dur)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.detailChipText, active && styles.detailChipTextActive]}>
                      {dur}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>
          Presupuesto{' '}
          <Text style={styles.optional}>(opcional)</Text>
        </Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetField}>
            <Text style={styles.budgetPrefix}>$</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="Mínimo"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
              value={budgetMin}
              onChangeText={setBudgetMin}
            />
          </View>
          <Ionicons name="remove-outline" size={18} color={COLORS.textTertiary} />
          <View style={styles.budgetField}>
            <Text style={styles.budgetPrefix}>$</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="Máximo"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
              value={budgetMax}
              onChangeText={setBudgetMax}
            />
          </View>
          <Text style={styles.budgetSuffix}>COP</Text>
        </View>

        <Text style={styles.sectionLabel}>
          Fotos del problema{' '}
          <Text style={styles.optional}>(opcional)</Text>
        </Text>
        <Text style={styles.photoHint}>Muestra qué necesitas — una imagen vale más que mil palabras</Text>
        <View style={styles.photosGrid}>
          {jobPhotos.map((url, i) => (
            <TouchableOpacity
              key={i}
              style={styles.photoSlot}
              onPress={() => handleRemovePhoto(i)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: url }} style={styles.photoImg} contentFit="cover" cachePolicy="memory-disk" transition={200} />
              <View style={styles.photoRemoveOverlay}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
          {jobPhotos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={styles.photoSlotAdd}
              onPress={handleAddPhoto}
              activeOpacity={0.75}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color={COLORS.textTertiary} />
                  <Text style={styles.photoAddText}>Agregar foto</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handlePost}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={styles.btnText}>{isEditing ? 'Guardando...' : 'Publicando...'}</Text>
          ) : (
            <>
              <Ionicons name={isEditing ? 'checkmark' : 'flash'} size={18} color="#fff" />
              <Text style={styles.btnText}>{isEditing ? 'Guardar cambios' : 'Publicar y buscar trabajadores'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  form: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 10, marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  optional: {
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.card,
    marginBottom: 16,
    ...SHADOW_SM,
  },
  textarea: { height: 96, textAlignVertical: 'top' },
  catScroll: { marginBottom: 16 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    marginRight: 8, borderWidth: 1.5, borderColor: 'transparent',
  },
  catChipSelected: { borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '500' },
  catTextSelected: { fontWeight: '700' },
  muniScroll: { marginBottom: 16 },
  muniChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.card,
  },
  muniChipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  muniText: { fontSize: 12, color: COLORS.textSecondary },
  muniTextSelected: { color: COLORS.primaryDark, fontWeight: '600' },
  vacantesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  vacanteChip: {
    flex: 1, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card, ...SHADOW_SM,
  },
  vacanteChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  vacanteText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  vacanteTextActive: { color: COLORS.primaryDark, fontWeight: '800' },
  urgencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  urgChip: {
    flex: 1, paddingVertical: 12, gap: 5,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', backgroundColor: COLORS.card,
    ...SHADOW_SM,
  },
  urgChipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  urgText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  urgTextSelected: { color: COLORS.primaryDark, fontWeight: '700' },
  detailBox: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    ...SHADOW_SM,
  },
  detailLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10 },
  detailScroll: { marginHorizontal: -4 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background, marginRight: 8,
  },
  detailChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  detailChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  detailChipTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  budgetField: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 11, backgroundColor: COLORS.card,
  },
  budgetPrefix: { fontSize: 14, color: COLORS.textSecondary, marginRight: 4 },
  budgetInput: { flex: 1, fontSize: 14, color: COLORS.text },
  budgetSuffix: { fontSize: 12, color: COLORS.textSecondary },
  photoHint: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 12, marginTop: -4 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  photoSlot: {
    width: '47%', aspectRatio: 4 / 3,
    borderRadius: 12, overflow: 'hidden', ...SHADOW_SM,
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemoveOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 34, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoSlotAdd: {
    width: '47%', aspectRatio: 4 / 3,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, borderStyle: 'dashed',
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  photoAddText: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '500' },
  btn: {
    height: 54, borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 12,
    ...SHADOW_MD,
    shadowColor: COLORS.primary,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
