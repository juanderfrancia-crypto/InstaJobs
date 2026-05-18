import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { fetchWorkerChats, fetchClientChats } from '@/services';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_HEADER } from '@/constants';
import { Avatar, Badge } from '@/components/UI';
import { ChatRowSkeleton } from '@/components/SkeletonCard';

const SKELETON_COUNT = 4;

type ContactItem = {
  id: string;
  name: string;
  subtitle: string;
  phone?: string;
  avatarUrl?: string;
  jobTitle: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  pending:  { label: 'Pendiente',  variant: 'warning' },
  accepted: { label: 'Aceptado',   variant: 'success' },
  rejected: { label: 'Rechazado',  variant: 'danger'  },
};

const STATUS_ORDER: Record<string, number> = { accepted: 0, pending: 1, rejected: 2 };

const formatTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(diffMs / 86400000);
  if (days === 1) return 'ayer';
  return `${days}d`;
};

export function ChatsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isWorker = user?.role === 'worker';
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    if (isWorker) {
      const data = await fetchWorkerChats(user.id);
      setContacts(data.map((app: any) => ({
        id: app.id,
        name: app.job?.client?.full_name ?? 'Cliente',
        subtitle: app.job?.municipality ?? '',
        phone: app.job?.client?.phone?.replace('+57', '').replace(/\D/g, ''),
        avatarUrl: app.job?.client?.avatar_url ?? undefined,
        jobTitle: app.job?.title ?? 'Trabajo',
        status: app.status,
        createdAt: app.created_at,
      })));
    } else {
      const { jobs, applications, workerProfiles } = await fetchClientChats(user.id);
      if (!jobs.length) { setContacts([]); return; }
      const workerMap: Record<string, any> = Object.fromEntries(
        workerProfiles.map((w: any) => [w.user_id, w])
      );
      const jobMap: Record<string, string> = Object.fromEntries(
        jobs.map((j: any) => [j.id, j.title])
      );
      setContacts(applications.map((app: any) => {
        const wp = workerMap[app.worker_id];
        const tradeLabels = (wp?.trades ?? [])
          .map((t: string) => CATEGORIES.find(c => c.id === t)?.label ?? t)
          .slice(0, 2).join(' · ');
        return {
          id: app.id,
          name: wp?.full_name ?? 'Trabajador',
          subtitle: tradeLabels,
          phone: wp?.whatsapp_number?.replace(/\D/g, ''),
          avatarUrl: wp?.avatar_url ?? undefined,
          jobTitle: jobMap[app.job_id] ?? 'Trabajo',
          status: app.status,
          createdAt: app.created_at,
        };
      }));
    }
  }, [user, isWorker]);

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, [loadContacts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  const openWhatsApp = useCallback((phone: string | undefined, name: string) => {
    if (!phone) {
      Alert.alert('Sin número de WhatsApp', `${name} no ha registrado su número de WhatsApp.`);
      return;
    }
    Linking.openURL(
      `https://wa.me/57${phone}?text=Hola ${name}, te escribo desde InstaJobs para continuar con lo del trabajo.`
    );
  }, []);

  const sortedContacts = useMemo(() =>
    [...contacts].sort((a, b) => (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1)),
  [contacts]);

  const acceptedCount = useMemo(() =>
    contacts.filter(c => c.status === 'accepted').length,
  [contacts]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Conversaciones</Text>
          <Text style={styles.headerSub}>
            {loading
              ? 'Cargando...'
              : contacts.length === 0
                ? (isWorker ? 'Aplica a trabajos para conectar' : 'Publica para recibir aplicaciones')
                : `${contacts.length} contacto${contacts.length !== 1 ? 's' : ''}${acceptedCount > 0 ? ` · ${acceptedCount} activo${acceptedCount !== 1 ? 's' : ''}` : ''}`
            }
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerIcon}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
        </View>
        <Text style={styles.infoText}>
          {isWorker
            ? 'Tus aplicaciones a trabajos. Toca cualquiera para continuar por WhatsApp.'
            : 'Trabajadores que aplicaron a tus publicaciones. Toca para contactar.'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 12 },
          !loading && sortedContacts.length === 0 && styles.emptyFlex,
        ]}
      >
        {/* Skeleton */}
        {loading && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ChatRowSkeleton key={i} />
        ))}

        {/* Empty state */}
        {!loading && sortedContacts.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>
              {isWorker ? 'Aún no has aplicado a ningún trabajo' : 'Nadie ha aplicado aún'}
            </Text>
            <Text style={styles.emptyText}>
              {isWorker
                ? 'Encuentra trabajos disponibles y aplica para verlos aquí'
                : 'Publica un trabajo para recibir aplicaciones de trabajadores'}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate(isWorker ? 'Home' : 'Post')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isWorker ? 'briefcase-outline' : 'add-circle-outline'}
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.emptyBtnText}>
                {isWorker ? 'Ver trabajos disponibles' : 'Publicar un trabajo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact cards */}
        {!loading && sortedContacts.map(contact => {
          const sc = STATUS_CONFIG[contact.status] ?? STATUS_CONFIG.pending;
          const isAccepted = contact.status === 'accepted';
          const isRejected = contact.status === 'rejected';
          return (
            <TouchableOpacity
              key={contact.id}
              style={[
                styles.card,
                isAccepted && styles.cardAccepted,
                isRejected && styles.cardRejected,
              ]}
              onPress={() => openWhatsApp(contact.phone, contact.name)}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Avatar name={contact.name} size={52} avatarUrl={contact.avatarUrl} />
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
                    <Text style={styles.time}>{formatTime(contact.createdAt)}</Text>
                  </View>
                  {contact.subtitle ? (
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{contact.subtitle}</Text>
                  ) : null}
                  <View style={styles.jobRow}>
                    <Ionicons name="briefcase-outline" size={11} color={COLORS.textTertiary} />
                    <Text style={styles.jobTitle} numberOfLines={1}>{contact.jobTitle}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Badge label={sc.label} variant={sc.variant} />
                    {contact.phone && !isAccepted && (
                      <View style={styles.waChip}>
                        <Ionicons name="logo-whatsapp" size={12} color="#16A34A" />
                        <Text style={styles.waChipText}>WhatsApp</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Botón WA prominente solo para aceptados */}
              {isAccepted && (
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => openWhatsApp(contact.phone, contact.name)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={styles.waBtnText}>Continuar por WhatsApp</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 10,
    ...SHADOW_HEADER,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  infoBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderBottomWidth: 1, borderBottomColor: '#D1FAE5',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  infoBannerIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 17 },

  listContent: { padding: 12, paddingTop: 14 },
  emptyFlex: { flexGrow: 1 },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 48,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW_SM,
  },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 6, textAlign: 'center',
  },
  emptyText: {
    fontSize: 13, color: COLORS.textTertiary,
    textAlign: 'center', lineHeight: 19,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    marginBottom: 10,
    ...SHADOW_SM,
  },
  cardAccepted: {
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  cardRejected: { opacity: 0.55 },

  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  time: { fontSize: 11, color: COLORS.textTertiary, marginLeft: 8 },
  cardSubtitle: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobTitle: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  waChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FFF4', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  waChipText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },

  waBtn: {
    marginTop: 12,
    height: 40, borderRadius: 10,
    backgroundColor: COLORS.whatsapp,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  waBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
