import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, StatusBar, Image, Modal, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD } from '@/constants';
import { Badge } from '@/components/UI';
import { JobPost } from '@/types';

const URGENCY_DISPLAY: Record<string, { iconName: string; label: string; variant: 'danger' | 'warning' | 'info' }> = {
  today:    { iconName: 'flash',            label: 'Urgente — necesitan hoy', variant: 'danger'  },
  week:     { iconName: 'calendar-outline', label: 'Esta semana',             variant: 'warning' },
  flexible: { iconName: 'time-outline',     label: 'Sin prisa, flexible',     variant: 'info'    },
};

export function JobDetailScreen({ route, navigation }: any) {
  const { job } = route.params as { job: JobPost };
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const isWorker = user?.role === 'worker';
  const clientName = (job as any).client?.full_name as string | undefined;

  useEffect(() => {
    if (!isWorker) return;
    supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('worker_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setApplied(true); });
  }, []);

  const category = CATEGORIES.find(c => c.id === job.trade_category);
  const urgencyBase = URGENCY_DISPLAY[job.urgency] ?? URGENCY_DISPLAY.flexible;
  const urgencyDetail = (job as any).urgency_detail;
  const urgency = {
    ...urgencyBase,
    label: urgencyDetail ? `${urgencyBase.label} · ${urgencyDetail}` : urgencyBase.label,
  };

  const handleApply = async () => {
    if (!message.trim()) {
      Alert.alert('Escribe un mensaje', 'Cuéntale al cliente por qué eres la persona indicada para este trabajo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('job_applications').insert({
      job_id: job.id,
      worker_id: user?.id,
      message: message.trim(),
      status: 'pending',
    });
    setLoading(false);
    if (error) {
      if (error.code === '23505') {
        setApplied(true);
        Alert.alert('Ya aplicaste', 'Ya enviaste una aplicación para este trabajo anteriormente');
      } else {
        Alert.alert('Error al aplicar', error.message);
      }
    } else {
      setApplied(true);
      Alert.alert(
        'Aplicación enviada',
        'El cliente podrá ver tu perfil y contactarte por WhatsApp si estás interesado.',
        [{ text: 'Entendido' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.headerRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del trabajo</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={[styles.catIconWrap, { backgroundColor: category?.color ?? '#F1F5F9' }]}>
            <Ionicons
              name={(category?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
              size={26}
              color={category?.textColor ?? COLORS.textSecondary}
            />
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{job.municipality}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(job.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          {/* Presupuesto + conteo de aplicaciones */}
          {((job.budget_min || job.budget_max) || ((job as any).applications_count > 0)) && (
            <View style={styles.heroStatsRow}>
              {(job.budget_min || job.budget_max) && (
                <View style={styles.heroStat}>
                  <Ionicons name="cash-outline" size={14} color={COLORS.success} />
                  <Text style={styles.heroStatBudget}>
                    ${job.budget_min?.toLocaleString('es-CO')} – ${job.budget_max?.toLocaleString('es-CO')} COP
                  </Text>
                </View>
              )}
              {(job as any).applications_count > 0 && (
                <View style={styles.heroStat}>
                  <Ionicons name="people-outline" size={14} color={COLORS.textTertiary} />
                  <Text style={styles.heroStatCount}>
                    {(job as any).applications_count} {(job as any).applications_count === 1 ? 'aplicó' : 'aplicaron'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Cliente que publicó */}
          {clientName && (
            <TouchableOpacity
              style={styles.clientRow}
              onPress={() => navigation.navigate('ClientProfile', { clientId: job.client_id })}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={14} color={COLORS.primary} />
              <Text style={styles.clientLink}>Publicado por {clientName}</Text>
              <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          <Badge
            label={urgency.label}
            variant={urgency.variant}
            iconName={urgency.iconName as keyof typeof Ionicons.glyphMap}
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Descripción del trabajo</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Fotos */}
        {job.photos && job.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>Fotos del problema ({job.photos.length})</Text>
            <View style={styles.photosGrid}>
              {job.photos.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.photoThumbWrap}
                  onPress={() => setSelectedPhoto(url)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input del mensaje (trabajador, aún no aplicó) */}
        {isWorker && !applied && (
          <View style={styles.applyCard}>
            <View style={styles.applyCardHeader}>
              <Ionicons name="send-outline" size={18} color={COLORS.primary} />
              <Text style={styles.applyTitle}>Tu mensaje al cliente</Text>
            </View>
            <Text style={styles.applyHint}>
              Preséntate: experiencia relevante, disponibilidad y precio estimado
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Ej: Hola, soy plomero con 8 años de experiencia. He trabajado casos similares y puedo ir hoy en la tarde. Mi cobro sería aproximadamente..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              value={message}
              onChangeText={setMessage}
            />
          </View>
        )}

        {/* Banner: ya aplicó */}
        {applied && (
          <View style={styles.appliedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <View style={styles.appliedTextWrap}>
              <Text style={styles.appliedTitle}>Aplicación enviada</Text>
              <Text style={styles.appliedSub}>El cliente revisará tu perfil y te contactará si estás disponible.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón sticky inferior */}
      {isWorker && !applied && (
        <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={[styles.applyBtn, (loading || !message.trim()) && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={styles.applyBtnText}>Enviando aplicación...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.applyBtnText}>
                  {message.trim() ? 'Aplicar a este trabajo' : 'Escribe un mensaje para aplicar'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Modal foto ampliada */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.photoModal}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={() => setSelectedPhoto(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.photoModalImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    ...SHADOW_SM,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text },
  scrollContent: { paddingBottom: 32 },
  heroCard: {
    backgroundColor: COLORS.card, padding: 20,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  catIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    ...SHADOW_SM,
  },
  jobTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 10, lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  metaDot: { color: COLORS.textTertiary, marginHorizontal: 2 },
  heroStatsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginTop: 10, flexWrap: 'wrap',
  },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatBudget: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  heroStatCount: { fontSize: 13, color: COLORS.textTertiary },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  clientLink: { fontSize: 12, color: COLORS.primary, fontWeight: '600', flex: 1 },
  section: {
    backgroundColor: COLORS.card, padding: 16,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    marginTop: 8,
  },
  secTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 24 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: {
    width: '48%', aspectRatio: 4 / 3,
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  photoThumb: { width: '100%', height: '100%' },
  applyCard: {
    backgroundColor: COLORS.card, margin: 12,
    borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  applyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  applyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  applyHint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginBottom: 12 },
  messageInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.text, minHeight: 110, textAlignVertical: 'top',
    backgroundColor: COLORS.background,
  },
  stickyBar: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
    ...SHADOW_MD,
    shadowColor: '#000',
  },
  applyBtn: {
    height: 50, borderRadius: 14, backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW_MD,
    shadowColor: COLORS.primary,
  },
  applyBtnDisabled: { opacity: 0.45 },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  photoModal: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoModalClose: {
    position: 'absolute', top: 52, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  photoModalImg: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.75,
  },
  appliedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    margin: 12, padding: 16, borderRadius: 16,
    backgroundColor: COLORS.successBg,
    borderWidth: 0.5, borderColor: '#86EFAC',
  },
  appliedTextWrap: { flex: 1 },
  appliedTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginBottom: 2 },
  appliedSub: { fontSize: 13, color: COLORS.success, lineHeight: 18, opacity: 0.85 },
});
