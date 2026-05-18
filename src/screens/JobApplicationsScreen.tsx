import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendPushNotification } from '@/lib/notifications';
import {
  fetchJobById, completeJob,
  fetchJobApplicationsWithWorkers, acceptApplication, rejectApplication,
} from '@/services';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD } from '@/constants';
import { Avatar, Badge, StarRating } from '@/components/UI';

const JOB_STATUS_LABEL: Record<string, string> = {
  open:        'Abierto',
  in_progress: 'En progreso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};

export function JobApplicationsScreen({ route, navigation }: any) {
  const { jobId = '' } = (route.params ?? {}) as { jobId?: string };
  const insets = useSafeAreaInsets();

  const [job, setJob]                   = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [jobData, appsWithWorkers] = await Promise.all([
      fetchJobById(jobId),
      fetchJobApplicationsWithWorkers(jobId),
    ]);
    setJob(jobData);
    setApplications(appsWithWorkers);
  }, [jobId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Clientes ven nuevas postulaciones en tiempo real
  useRealtimeChannel(`job_apps_${jobId}`, 'job_applications', 'INSERT', load, `job_id=eq.${jobId}`);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAccept = (appId: string, workerName: string) => {
    Alert.alert(
      'Aceptar postulante',
      `¿Contratar a ${workerName}? El trabajo pasará a "En progreso".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setActionLoading(appId);
            const app = applications.find(a => a.id === appId);
            try {
              await acceptApplication(appId, jobId);
            } catch (e: any) {
              Alert.alert('No disponible', e.message ?? 'No se pudo contratar al trabajador');
              setActionLoading(null);
              return;
            }
            if (app?.worker_id) {
              sendPushNotification(
                app.worker_id,
                '¡Fuiste contratado!',
                `El cliente te eligió para: ${job?.title ?? 'un trabajo'}`,
                { screen: 'MyApplications' },
              );
            }
            await load();
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const handleReject = (appId: string, workerName: string) => {
    Alert.alert(
      'Rechazar postulante',
      `¿Rechazar a ${workerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(appId);
            const app = applications.find(a => a.id === appId);
            await rejectApplication(appId);
            if (app?.worker_id) {
              sendPushNotification(
                app.worker_id,
                'Postulación no seleccionada',
                `El cliente eligió a otro trabajador para: ${job?.title ?? 'un trabajo'}`,
                { screen: 'MyApplications' },
              );
            }
            await load();
            setActionLoading(null);
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    const accepted = applications.find(a => a.status === 'accepted');
    if (!accepted) {
      Alert.alert('Sin trabajador asignado', 'Debes contratar a un trabajador antes de completar el trabajo.');
      return;
    }
    Alert.alert(
      'Marcar como completado',
      '¿El trabajo ya fue realizado? Podrás dejar una reseña al trabajador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            await completeJob(jobId);
            setJob((prev: any) => ({ ...prev, status: 'completed' }));
            if (accepted?.worker_id) {
              sendPushNotification(
                accepted.worker_id,
                'Trabajo completado',
                `El cliente marcó "${job?.title ?? 'tu trabajo'}" como completado. ¡Revisa si recibiste una reseña!`,
                { screen: 'MyApplications' },
              );
            }
            if (accepted?.worker) {
              navigation.navigate('Review', {
                jobId,
                jobTitle: job?.title ?? '',
                reviewedId: accepted.worker.user_id,
                reviewedName: accepted.worker.full_name,
              });
            }
          },
        },
      ]
    );
  };

  const cat = job ? CATEGORIES.find(c => c.id === job.trade_category) : null;
  const acceptedApp = applications.find(a => a.status === 'accepted');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.headerRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Postulantes</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            contentContainerStyle={styles.scroll}
          >
            {/* Tarjeta del trabajo */}
            {job && (
              <View style={styles.jobCard}>
                <View style={[styles.jobIcon, { backgroundColor: cat?.color ?? '#F1F5F9' }]}>
                  <Ionicons
                    name={(cat?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={cat?.textColor ?? COLORS.textSecondary}
                  />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                  <View style={styles.jobMeta}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textTertiary} />
                    <Text style={styles.jobMetaText}>{job.municipality}</Text>
                    <Text style={styles.dot}>·</Text>
                    <Text style={[styles.jobMetaText, { color: job.status === 'in_progress' ? COLORS.primary : COLORS.textTertiary }]}>
                      {JOB_STATUS_LABEL[job.status] ?? job.status}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Conteo */}
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                {applications.length === 0
                  ? 'Nadie ha postulado aún'
                  : `${applications.length} postulante${applications.length !== 1 ? 's' : ''}`}
              </Text>
              {job?.status === 'in_progress' && acceptedApp && (
                <Badge label="Trabajador contratado" variant="success" iconName="checkmark-circle" />
              )}
            </View>

            {applications.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={32} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>Sin postulantes aún</Text>
                <Text style={styles.emptyText}>Los trabajadores de tu zona verán tu publicación y podrán aplicar</Text>
              </View>
            ) : (
              applications.map(app => {
                const worker = app.worker;
                const tradeLabels = (worker?.trades ?? [])
                  .map((t: string) => CATEGORIES.find(c => c.id === t)?.label ?? t)
                  .slice(0, 2).join(' · ');
                const isLoading = actionLoading === app.id;
                const isOpen = job?.status === 'open';

                return (
                  <View key={app.id} style={[styles.appCard, app.status === 'accepted' && styles.appCardAccepted]}>
                    {/* Cabecera del postulante */}
                    <TouchableOpacity
                      style={styles.workerRow}
                      onPress={() => worker && navigation.navigate('WorkerProfile', { worker: { ...worker, id: worker.user_id } })}
                      activeOpacity={0.75}
                    >
                      <Avatar name={worker?.full_name ?? 'T'} size={46} avatarUrl={worker?.avatar_url} />
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{worker?.full_name ?? 'Trabajador'}</Text>
                        {tradeLabels ? <Text style={styles.workerTrade}>{tradeLabels}</Text> : null}
                        <View style={styles.workerMeta}>
                          {worker?.municipality && (
                            <>
                              <Ionicons name="location-outline" size={11} color={COLORS.textTertiary} />
                              <Text style={styles.workerMetaText}>{worker.municipality}</Text>
                            </>
                          )}
                          {worker?.rating !== undefined && (
                            <StarRating rating={worker.rating} count={worker.reviews_count} size={11} />
                          )}
                        </View>
                      </View>
                      <Badge
                        label={app.status === 'accepted' ? 'Aceptado' : app.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}
                      />
                    </TouchableOpacity>

                    {/* Mensaje */}
                    <View style={styles.messageBox}>
                      <Text style={styles.messageLabel}>Mensaje del postulante</Text>
                      <Text style={styles.messageText}>{app.message}</Text>
                    </View>

                    {/* Acciones */}
                    {isOpen && app.status === 'pending' && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleReject(app.id, worker?.full_name ?? 'este trabajador')}
                          disabled={!!actionLoading}
                          activeOpacity={0.8}
                        >
                          {isLoading
                            ? <ActivityIndicator size="small" color={COLORS.danger} />
                            : <Text style={styles.rejectBtnText}>Rechazar</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(app.id, worker?.full_name ?? 'este trabajador')}
                          disabled={!!actionLoading}
                          activeOpacity={0.85}
                        >
                          {isLoading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Ionicons name="checkmark" size={15} color="#fff" /><Text style={styles.acceptBtnText}>Contratar</Text></>}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Botón sticky: Completar trabajo */}
          {job?.status === 'in_progress' && (
            <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
              <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.completeBtnText}>Marcar trabajo como completado</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 12, paddingBottom: 32 },
  jobCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 12,
    ...SHADOW_SM,
  },
  jobIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { fontSize: 11, color: COLORS.textTertiary },
  dot: { fontSize: 11, color: COLORS.textTertiary },
  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  countText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 19 },
  appCard: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 14,
    marginBottom: 12, borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  appCardAccepted: { borderColor: '#86EFAC', borderWidth: 1.5 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  workerTrade: { fontSize: 12, color: COLORS.primary, fontWeight: '500', marginTop: 1 },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  workerMetaText: { fontSize: 11, color: COLORS.textTertiary },
  messageBox: {
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  messageLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  messageText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1, height: 40, borderRadius: 11,
    borderWidth: 1.5, borderColor: COLORS.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.danger },
  acceptBtn: {
    flex: 2, height: 40, borderRadius: 11,
    backgroundColor: COLORS.success,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    ...SHADOW_SM,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stickyBar: {
    backgroundColor: COLORS.card, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: COLORS.border, ...SHADOW_MD, shadowColor: '#000',
  },
  completeBtn: {
    height: 50, borderRadius: 14, backgroundColor: COLORS.success,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW_MD, shadowColor: COLORS.success,
  },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
