import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD, SHADOW_HEADER } from '@/constants';
import { fetchOpenJobs, fetchAvailableWorkers, fetchAppliedJobIds } from '@/services';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { WorkerCard } from '@/components/WorkerCard';
import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton, WorkerCardSkeleton } from '@/components/SkeletonCard';
import { WorkerProfile, JobPost } from '@/types';

const SKELETON_COUNT = 3;

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HomeScreen({ navigation }: any) {
  const { user, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const isFirstLoad = useRef(true);

  const isWorker = user?.role === 'worker';
  const displayName = (() => {
    const parts = (user?.full_name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length <= 2) return parts.join(' ');
    return `${parts[0]} ${parts[2]}`;
  })();
  const unreadCount = useUnreadCount();

  const loadData = useCallback(async () => {
    setNetworkError(false);
    try {
      if (!isWorker) {
        const result = await fetchAvailableWorkers({
          municipality: user?.municipality ?? '',
          category: activeCategory ?? undefined,
        });
        setWorkers(result.data);
      } else {
        const result = await fetchOpenJobs({
          municipality: user?.municipality ?? '',
          category: activeCategory ?? undefined,
        });
        setJobs(result.data);
        if (result.data.length && user?.id) {
          const ids = await fetchAppliedJobIds(user.id, result.data.map(j => j.id));
          setAppliedJobIds(ids);
        } else {
          setAppliedJobIds(new Set());
        }
      }
    } catch {
      setNetworkError(true);
    }
  }, [isWorker, user?.municipality, user?.id, activeCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    if (authLoading) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadData().finally(() => setLoading(false));
    } else {
      loadData();
    }
  }, [loadData, authLoading]);

  useRealtimeChannel('home_job_posts', 'job_posts', 'INSERT', loadData);

  const resultCount = isWorker ? jobs.length : workers.length;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting} numberOfLines={1}>
            {getGreeting()}{displayName ? `, ${displayName}` : ''}
          </Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.locText}>{user?.municipality ?? 'Tu zona'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 8 }}
      >
        {/* Search bar — navega a Search */}
        <TouchableOpacity
          style={styles.searchWrap}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.85}
        >
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={17} color={COLORS.textTertiary} />
            <Text style={styles.searchPlaceholder}>
              {isWorker ? '¿Qué tipo de trabajo buscas?' : '¿Qué oficio necesitas hoy?'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Banner publicar trabajo (solo clientes) */}
        {!isWorker && (
          <TouchableOpacity
            style={styles.urgentBanner}
            onPress={() => navigation.navigate('PostJob')}
            activeOpacity={0.8}
          >
            <View style={styles.urgentIconWrap}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.urgentText}>
              <Text style={styles.urgentTitle}>¿Necesitas a alguien hoy?</Text>
              <Text style={styles.urgentSub}>Publica trabajo urgente en 30 seg</Text>
            </View>
            <View style={styles.urgentBtn}>
              <Text style={styles.urgentBtnText}>Publicar</Text>
              <Ionicons name="chevron-forward" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Categorías */}
        <Text style={styles.catsLabel}>Categorías</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <TouchableOpacity
            style={[styles.catChip, activeCategory === null && styles.catChipActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Ionicons name="apps-outline" size={18} color={activeCategory === null ? COLORS.primary : COLORS.textTertiary} />
            <Text style={[styles.catName, activeCategory === null && styles.catNameActive]}>Todos</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setActiveCategory(active ? null : cat.id)}
              >
                <Ionicons
                  name={cat.iconName as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={active ? COLORS.primary : COLORS.textTertiary}
                />
                <Text style={[styles.catName, active && styles.catNameActive]} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sección resultados */}
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionTitle}>
              {isWorker ? 'Trabajos disponibles' : 'Trabajadores disponibles'}
            </Text>
            {!loading && resultCount > 0 && (
              <Text style={styles.sectionCount}>
                {resultCount} {isWorker ? 'trabajo' : 'trabajador'}{resultCount !== 1 ? 's' : ''}{user?.municipality ? ` en ${user.municipality}` : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.sectionLinkRow}>
            <Text style={styles.sectionLink}>Ver todos</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {networkError ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cloud-offline-outline" size={32} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>Sin conexión</Text>
              <Text style={styles.emptyText}>Verifica tu internet e intenta de nuevo</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={15} color={COLORS.primary} />
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <>
              {Array.from({ length: SKELETON_COUNT }).map((_, i) =>
                isWorker
                  ? <JobCardSkeleton key={i} />
                  : <WorkerCardSkeleton key={i} />
              )}
            </>
          ) : (
            <>
              {isWorker
                ? jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      compact
                      onPress={() => navigation.navigate('JobDetail', { job })}
                      showApply
                      applied={appliedJobIds.has(job.id)}
                      onApply={() => navigation.navigate('JobDetail', { job })}
                    />
                  ))
                : workers.map(worker => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      compact
                      onPress={() => navigation.navigate('WorkerProfile', { worker })}
                    />
                  ))
              }

              {resultCount === 0 && (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name={activeCategory ? 'filter-outline' : 'map-outline'}
                      size={32}
                      color={COLORS.textTertiary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {activeCategory
                      ? 'Sin resultados en esta categoría'
                      : isWorker ? 'No hay trabajos en tu zona aún' : 'No hay trabajadores cerca aún'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {activeCategory
                      ? 'Prueba con otra categoría o mira todos'
                      : 'Amplía tu búsqueda desde el buscador'}
                  </Text>
                  {activeCategory && (
                    <TouchableOpacity style={styles.retryBtn} onPress={() => setActiveCategory(null)} activeOpacity={0.8}>
                      <Ionicons name="apps-outline" size={15} color={COLORS.primary} />
                      <Text style={styles.retryText}>Ver todas las categorías</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    zIndex: 10,
    ...SHADOW_HEADER,
  },
  greeting: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  locText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute', top: -1, right: -1,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  notifBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  searchWrap: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOW_SM,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: COLORS.textTertiary },
  urgentBanner: {
    marginHorizontal: 12, marginBottom: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...SHADOW_MD,
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
  },
  urgentIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...SHADOW_SM,
  },
  urgentText: { flex: 1 },
  urgentTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  urgentSub: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  urgentBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  urgentBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  catsLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    paddingHorizontal: 12, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  categories: { paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  catChip: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', minWidth: 64,
    ...SHADOW_SM,
  },
  catChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  catName: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  catNameActive: { color: COLORS.primaryDark, fontWeight: '700' },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  sectionLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  sectionLink: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4, textAlign: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
