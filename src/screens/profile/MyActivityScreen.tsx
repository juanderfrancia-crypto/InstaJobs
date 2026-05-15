import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM } from '@/constants';
import { Badge } from '@/components/UI';

const APP_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  pending:  { label: 'Pendiente',    variant: 'warning' },
  accepted: { label: 'Aceptado',     variant: 'success' },
  rejected: { label: 'Rechazado',    variant: 'danger'  },
};

const JOB_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  open:        { label: 'Abierto',      variant: 'success' },
  in_progress: { label: 'En progreso',  variant: 'info'    },
  completed:   { label: 'Completado',   variant: 'default' },
  cancelled:   { label: 'Cancelado',    variant: 'danger'  },
};

const ACTIVE_STATUSES   = ['open', 'in_progress'];
const HISTORY_STATUSES  = ['completed', 'cancelled'];

export function MyActivityScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWorker = user?.role === 'worker';

  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [items, setItems] = useState<any[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    if (isWorker) {
      const { data } = await supabase
        .from('job_applications')
        .select('id, status, message, created_at, job:job_posts(*, client:users(full_name))')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });
      setItems(data ?? []);
    } else {
      const statuses = tab === 'active' ? ACTIVE_STATUSES : HISTORY_STATUSES;
      const { data } = await supabase
        .from('job_posts')
        .select('*')
        .eq('client_id', user.id)
        .in('status', statuses)
        .order('created_at', { ascending: false });
      setItems(data ?? []);

      if (tab === 'active' && data?.length) {
        const jobIds = data.map((j: any) => j.id);
        const { data: apps } = await supabase
          .from('job_applications')
          .select('job_id')
          .in('job_id', jobIds)
          .eq('status', 'pending');
        const counts: Record<string, number> = {};
        (apps ?? []).forEach((a: any) => {
          counts[a.job_id] = (counts[a.job_id] ?? 0) + 1;
        });
        setPendingCounts(counts);
      } else {
        setPendingCounts({});
      }
    }
  }, [user, isWorker, tab]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

  const getCategoryIcon = (tradeId: string) =>
    CATEGORIES.find(c => c.id === tradeId);

  const handleArchiveJob = (id: string, title: string) => {
    Alert.alert(
      'Mover a historial',
      `¿Quieres archivar "${title}"? Podrás verla en el historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('job_posts')
              .update({ status: 'cancelled' })
              .eq('id', id);
            if (error) {
              Alert.alert('Error', 'No se pudo archivar la publicación');
            } else {
              setItems(prev => prev.filter(i => i.id !== id));
            }
          },
        },
      ]
    );
  };

  const handleDeletePermanent = (id: string, title: string) => {
    Alert.alert(
      'Eliminar definitivamente',
      `¿Seguro? Esto borrará "${title}" para siempre y no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('job_posts').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar la publicación');
            } else {
              setItems(prev => prev.filter(i => i.id !== id));
            }
          },
        },
      ]
    );
  };

  const renderWorkerItem = (item: any) => {
    const job = item.job;
    if (!job) return null;
    const sc = APP_STATUS[item.status] ?? APP_STATUS.pending;
    const cat = getCategoryIcon(job.trade_category);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate('JobDetail', { job })}
        activeOpacity={0.75}
      >
        <View style={[styles.catIcon, { backgroundColor: cat?.color ?? '#F1F5F9' }]}>
          <Ionicons
            name={(cat?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
            size={18}
            color={cat?.textColor ?? COLORS.textSecondary}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{job.title}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
            <Text style={styles.cardMetaText}>{job.municipality}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.cardMetaText}>{formatDate(item.created_at)}</Text>
          </View>
          {job.client?.full_name && (
            <View style={styles.cardMeta}>
              <Ionicons name="person-circle-outline" size={12} color={COLORS.textTertiary} />
              <Text style={styles.cardMetaText}>{job.client.full_name}</Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <Badge label={sc.label} variant={sc.variant} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
      </TouchableOpacity>
    );
  };

  const renderClientItem = (item: any) => {
    const sc = JOB_STATUS[item.status] ?? JOB_STATUS.open;
    const cat = getCategoryIcon(item.trade_category);
    const isHistory = tab === 'history';
    const pending = pendingCounts[item.id] ?? 0;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, isHistory && styles.cardMuted, pending > 0 && styles.cardHighlight]}
        onPress={() => isHistory
          ? navigation.navigate('JobDetail', { job: item })
          : navigation.navigate('JobApplications', { jobId: item.id })
        }
        activeOpacity={0.75}
      >
        <View style={styles.catIconWrap}>
          <View style={[styles.catIcon, { backgroundColor: cat?.color ?? '#F1F5F9', opacity: isHistory ? 0.6 : 1 }]}>
            <Ionicons
              name={(cat?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
              size={18}
              color={cat?.textColor ?? COLORS.textSecondary}
            />
          </View>
          {pending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pending}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, isHistory && styles.cardTitleMuted]} numberOfLines={2}>
            {item.title}
          </Text>
          {pending > 0 && (
            <Text style={styles.pendingText}>
              {pending} postulante{pending !== 1 ? 's' : ''} nuevo{pending !== 1 ? 's' : ''} esperando respuesta
            </Text>
          )}
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
            <Text style={styles.cardMetaText}>{item.municipality}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.cardMetaText}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.cardFooter}>
            <Badge label={sc.label} variant={sc.variant} />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, isHistory ? styles.actionBtnDanger : styles.actionBtnArchive]}
          onPress={() => isHistory
            ? handleDeletePermanent(item.id, item.title)
            : handleArchiveJob(item.id, item.title)
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isHistory ? 'trash-outline' : 'archive-outline'}
            size={17}
            color={isHistory ? COLORS.danger : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isWorker ? 'Mis trabajos' : 'Mis publicaciones'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs (solo para clientes) */}
      {!isWorker && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
            onPress={() => setTab('active')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash-outline"
              size={14}
              color={tab === 'active' ? COLORS.primary : COLORS.textTertiary}
            />
            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
            onPress={() => setTab('history')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={tab === 'history' ? COLORS.primary : COLORS.textTertiary}
            />
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Historial</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    isWorker ? 'briefcase-outline'
                    : tab === 'history' ? 'time-outline'
                    : 'document-text-outline'
                  }
                  size={32}
                  color={COLORS.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {isWorker
                  ? 'Aún no has aplicado a ningún trabajo'
                  : tab === 'history'
                  ? 'Tu historial está vacío'
                  : 'No has publicado ningún trabajo'}
              </Text>
              <Text style={styles.emptyText}>
                {isWorker
                  ? 'Ve al inicio y aplica a los trabajos disponibles en tu zona'
                  : tab === 'history'
                  ? 'Las publicaciones archivadas o completadas aparecerán aquí'
                  : 'Publica tu primer trabajo y recibe aplicaciones de trabajadores'}
              </Text>
            </View>
          ) : (
            items.map(item => isWorker ? renderWorkerItem(item) : renderClientItem(item))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 8, gap: 8,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textTertiary },
  tabTextActive: { color: COLORS.primaryDark },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 19 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  cardMuted: { opacity: 0.75 },
  catIconWrap: { position: 'relative', flexShrink: 0 },
  catIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingBadge: {
    position: 'absolute', top: -5, right: -5,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: COLORS.card,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  cardHighlight: { borderColor: COLORS.primary, borderWidth: 1.5 },
  pendingText: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 3 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 19 },
  cardTitleMuted: { color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 12, color: COLORS.textTertiary },
  dot: { color: COLORS.textTertiary, marginHorizontal: 1 },
  cardFooter: { flexDirection: 'row', marginTop: 2 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionBtnArchive: { backgroundColor: COLORS.borderLight ?? '#F1F5F9' },
  actionBtnDanger: { backgroundColor: COLORS.dangerBg },
});
