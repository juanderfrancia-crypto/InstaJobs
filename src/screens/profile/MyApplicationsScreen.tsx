import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Linking, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD } from '@/constants';
import { cancelApplication, fetchWorkerApplications } from '@/services';

type AppStatus = 'pending' | 'accepted' | 'rejected';

interface ApplicationItem {
  id: string;
  status: AppStatus;
  message: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    municipality: string;
    trade_category: string;
    status: string;
    client: { full_name: string; phone: string };
  };
}

const STATUS_CONFIG: Record<AppStatus, {
  label: string; color: string; bg: string;
  iconName: keyof typeof Ionicons.glyphMap;
}> = {
  pending:  { label: 'En espera',        color: COLORS.warning,      bg: COLORS.warningBg,   iconName: 'time-outline'     },
  accepted: { label: 'Contratado',       color: COLORS.success,      bg: COLORS.successBg,   iconName: 'checkmark-circle' },
  rejected: { label: 'No seleccionado',  color: COLORS.textTertiary, bg: COLORS.borderLight, iconName: 'close-circle'     },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} días`;
};

export function MyApplicationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchWorkerApplications(user.id);
    setApplications(data as any);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Trabajadores ven cambios de estado (aceptado/rechazado) en tiempo real
  useRealtimeChannel(
    `my_apps_${user?.id}`,
    'job_applications',
    'UPDATE',
    load,
    user?.id ? `worker_id=eq.${user.id}` : undefined,
  );

  const handleCancel = (applicationId: string) => {
    Alert.alert(
      'Cancelar postulación',
      '¿Seguro? Retirarás tu aplicación para este trabajo.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelApplication(applicationId, user?.id ?? '');
              setApplications(prev => prev.filter(a => a.id !== applicationId));
            } catch {
              Alert.alert('Error', 'No se pudo cancelar la postulación');
            }
          },
        },
      ]
    );
  };

  const handleWhatsApp = (phone: string, jobTitle: string) => {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('57') ? clean : `57${clean}`;
    const msg = encodeURIComponent(`Hola, soy el trabajador que contrataste para "${jobTitle}" en InstaJobs. ¿Cuándo podemos coordinar?`);
    Linking.openURL(`https://wa.me/${number}?text=${msg}`);
  };

  const pending  = applications.filter(a => a.status === 'pending');
  const accepted = applications.filter(a => a.status === 'accepted');
  const rejected = applications.filter(a => a.status === 'rejected');

  const renderCard = (item: ApplicationItem) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const category = CATEGORIES.find(c => c.id === item.job?.trade_category);
    const isAccepted = item.status === 'accepted';
    const isPending = item.status === 'pending';

    return (
      <View key={item.id} style={[styles.card, isAccepted && styles.cardAccepted]}>
        <View style={styles.cardHeader}>
          <View style={[styles.catIcon, { backgroundColor: category?.color ?? '#F1F5F9' }]}>
            <Ionicons
              name={(category?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
              size={18}
              color={category?.textColor ?? COLORS.textSecondary}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.job?.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color={COLORS.textTertiary} />
              <Text style={styles.metaText}>{item.job?.municipality}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Ionicons name="person-circle-outline" size={11} color={COLORS.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.job?.client?.full_name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.iconName} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.messageWrap}>
          <Text style={styles.messageLabel}>Tu mensaje:</Text>
          <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          {isAccepted && item.job?.client?.phone && (
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => handleWhatsApp(item.job.client.phone, item.job.title)}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={15} color="#fff" />
              <Text style={styles.whatsappText}>Contactar cliente</Text>
            </TouchableOpacity>
          )}
        </View>

        {isPending && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancel(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-outline" size={14} color={COLORS.danger} />
            <Text style={styles.cancelBtnText}>Cancelar postulación</Text>
          </TouchableOpacity>
        )}

        {isAccepted && (
          <View style={styles.acceptedBanner}>
            <Ionicons name="star" size={13} color={COLORS.success} />
            <Text style={styles.acceptedBannerText}>
              El cliente te eligió. Coordina por WhatsApp y haz un excelente trabajo para obtener una buena reseña.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSection = (title: string, items: ApplicationItem[], emptyText: string) => (
    items.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title} ({items.length})</Text>
        {items.map(renderCard)}
      </View>
    ) : null
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis postulaciones</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        {!loading && applications.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="send-outline" size={30} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin postulaciones aún</Text>
            <Text style={styles.emptyText}>Cuando apliques a trabajos aparecerán aquí con su estado</Text>
          </View>
        )}

        {renderSection('Contratado', accepted, '')}
        {renderSection('En espera de respuesta', pending, '')}
        {renderSection('No seleccionado', rejected, '')}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
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
  scrollContent: { padding: 12, paddingBottom: 32 },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8, marginTop: 4, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 0.5, borderColor: COLORS.border,
    padding: 14, marginBottom: 10,
    ...SHADOW_MD,
  },
  cardAccepted: { borderColor: '#86EFAC', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: COLORS.textTertiary },
  metaDot: { color: COLORS.textTertiary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  messageWrap: {
    backgroundColor: COLORS.background, borderRadius: 10,
    padding: 10, marginBottom: 10,
  },
  messageLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textTertiary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 },
  messageText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 11, color: COLORS.textTertiary },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.whatsapp, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    ...SHADOW_SM,
    shadowColor: COLORS.whatsapp,
  },
  whatsappText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  acceptedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.successBg, borderRadius: 10,
    padding: 10, marginTop: 10,
  },
  acceptedBannerText: { flex: 1, fontSize: 12, color: COLORS.success, lineHeight: 17 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    marginTop: 10, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerBg,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.danger },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', paddingHorizontal: 32 },
});
