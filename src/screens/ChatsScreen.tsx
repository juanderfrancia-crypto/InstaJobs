import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Linking, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { fetchWorkerChats, fetchClientChats } from '@/services';
import { COLORS, CATEGORIES, SHADOW_SM } from '@/constants';
import { Avatar, Badge } from '@/components/UI';

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

export function ChatsScreen() {
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
      const items: ContactItem[] = data.map((app: any) => ({
        id: app.id,
        name: app.job?.client?.full_name ?? 'Cliente',
        subtitle: app.job?.municipality ?? '',
        phone: app.job?.client?.phone?.replace('+57', '').replace(/\D/g, ''),
        avatarUrl: app.job?.client?.avatar_url ?? undefined,
        jobTitle: app.job?.title ?? 'Trabajo',
        status: app.status,
        createdAt: app.created_at,
      }));
      setContacts(items);
    } else {
      const { jobs, applications, workerProfiles } = await fetchClientChats(user.id);
      if (!jobs.length) { setContacts([]); return; }

      const workerMap: Record<string, any> = Object.fromEntries(
        workerProfiles.map((w: any) => [w.user_id, w])
      );
      const jobMap: Record<string, string> = Object.fromEntries(jobs.map((j: any) => [j.id, j.title]));

      const items: ContactItem[] = applications.map((app: any) => {
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
      });
      setContacts(items);
    }
  }, [user, isWorker]);

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, [loadContacts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const openWhatsApp = (phone: string | undefined, name: string) => {
    if (!phone) {
      Alert.alert(
        'Sin número de WhatsApp',
        `${name} no ha registrado su número de WhatsApp. Puedes contactarlo por otro medio.`,
      );
      return;
    }
    const num = phone.replace(/\D/g, '');
    Linking.openURL(
      `https://wa.me/57${num}?text=Hola ${name}, te escribo desde InstaJobs para continuar con lo del trabajo.`
    );
  };

  const formatTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 60) return `hace ${mins}m`;
    if (hours < 24) return `hace ${hours}h`;
    if (days === 1) return 'ayer';
    return `hace ${days}d`;
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Conversaciones</Text>
        <Text style={styles.headerSub}>Contactos de InstaJobs</Text>
      </View>

      <View style={styles.infoBanner}>
        <View style={styles.infoBannerIcon}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
        </View>
        <Text style={styles.infoText}>
          {isWorker
            ? 'Trabajos a los que aplicaste. Toca para continuar por WhatsApp.'
            : 'Trabajadores que aplicaron a tus publicaciones. Toca para contactar.'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={[contacts.length === 0 ? styles.emptyContainer : undefined, { paddingBottom: tabBarHeight }]}
        >
          {contacts.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>
                {isWorker ? 'No has aplicado a ningún trabajo' : 'Nadie ha aplicado aún'}
              </Text>
              <Text style={styles.emptyText}>
                {isWorker
                  ? 'Encuentra trabajos en el inicio y aplica para verlos aquí'
                  : 'Publica un trabajo para recibir aplicaciones de trabajadores'}
              </Text>
            </View>
          ) : (
            contacts.map(contact => {
              const sc = STATUS_CONFIG[contact.status] ?? STATUS_CONFIG.pending;
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.chatRow}
                  onPress={() => openWhatsApp(contact.phone, contact.name)}
                  activeOpacity={0.7}
                >
                  <Avatar name={contact.name} size={46} avatarUrl={contact.avatarUrl} />
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                      <Text style={styles.chatName} numberOfLines={1}>{contact.name}</Text>
                      <Text style={styles.chatTime}>{formatTime(contact.createdAt)}</Text>
                    </View>
                    {contact.subtitle ? (
                      <Text style={styles.chatSubtitle} numberOfLines={1}>{contact.subtitle}</Text>
                    ) : null}
                    <Text style={styles.chatJob} numberOfLines={1}>
                      <Text style={styles.chatJobLabel}>Trabajo: </Text>
                      {contact.jobTitle}
                    </Text>
                    <View style={styles.chatFooter}>
                      <Badge label={sc.label} variant={sc.variant} />
                      {contact.phone ? (
                        <View style={styles.waChip}>
                          <Ionicons name="logo-whatsapp" size={12} color="#25D366" />
                          <Text style={styles.waChipText}>WhatsApp</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {contact.phone && (
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  infoBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
    backgroundColor: '#F0FFF4', borderBottomWidth: 0.5, borderBottomColor: '#86EFAC',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  infoBannerIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 17 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 64,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 19 },
  chatRow: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  chatInfo: { flex: 1, gap: 2 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  chatTime: { fontSize: 11, color: COLORS.textTertiary, marginLeft: 8 },
  chatSubtitle: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  chatJob: { fontSize: 12, color: COLORS.textSecondary },
  chatJobLabel: { fontWeight: '600', color: COLORS.textSecondary },
  chatFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  waChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waChipText: { fontSize: 11, color: '#25D366', fontWeight: '600' },
});
