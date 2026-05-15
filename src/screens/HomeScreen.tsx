import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD } from '@/constants';
import { WorkerCard } from '@/components/WorkerCard';
import { JobCard } from '@/components/JobCard';
import { WorkerProfile, JobPost } from '@/types';

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isWorker = user?.role === 'worker';

  const filteredWorkers = searchQuery.trim()
    ? workers.filter(w => {
        const q = searchQuery.toLowerCase();
        const nameMatch = w.full_name.toLowerCase().includes(q);
        const tradeMatch = w.trades.some(t => {
          const label = CATEGORIES.find(c => c.id === t)?.label ?? t;
          return label.toLowerCase().includes(q);
        });
        return nameMatch || tradeMatch;
      })
    : workers;

  const filteredJobs = searchQuery.trim()
    ? jobs.filter(j => {
        const q = searchQuery.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
        );
      })
    : jobs;

  useEffect(() => { if (user?.municipality) loadData(); }, [activeCategory, user?.municipality, user?.role]);

  const loadData = async () => {
    if (!isWorker) {
      let query = supabase
        .from('worker_profiles').select('*')
        .eq('municipality', user?.municipality ?? '')
        .eq('available', true)
        .order('membership_tier', { ascending: false })
        .limit(10);
      if (activeCategory) query = query.contains('trades', [activeCategory]);
      const { data } = await query;
      setWorkers(data ?? []);
    } else {
      let query = supabase
        .from('job_posts').select('*, client:users(full_name, municipality)')
        .eq('municipality', user?.municipality ?? '')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20);
      if (activeCategory) query = query.eq('trade_category', activeCategory);
      const { data } = await query;
      setJobs(data ?? []);

      if (data?.length) {
        const jobIds = data.map((j: any) => j.id);
        const { data: apps } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('worker_id', user?.id)
          .in('job_id', jobIds);
        setAppliedJobIds(new Set((apps ?? []).map((a: any) => a.job_id)));
      } else {
        setAppliedJobIds(new Set());
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.logo}>InstaJobs</Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={styles.locText}>{user?.municipality ?? 'Tu zona'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
      >
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={17} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={isWorker ? '¿Qué tipo de trabajo buscas?' : '¿Qué oficio necesitas hoy?'}
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={17} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

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

        <Text style={styles.catsLabel}>Categorías</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <TouchableOpacity
            style={[styles.catChip, activeCategory === null && styles.catChipActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Ionicons
              name="apps-outline"
              size={18}
              color={activeCategory === null ? COLORS.primary : COLORS.textTertiary}
            />
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

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {isWorker ? 'Trabajos disponibles cerca' : 'Trabajadores disponibles'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.sectionLinkRow}>
            <Text style={styles.sectionLink}>Ver todos</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {isWorker
            ? filteredJobs.map(job => (
                <JobCard
                  key={job.id} job={job}
                  onPress={() => navigation.navigate('JobDetail', { job })}
                  showApply
                  applied={appliedJobIds.has(job.id)}
                  onApply={() => navigation.navigate('JobDetail', { job })}
                />
              ))
            : filteredWorkers.map(worker => (
                <WorkerCard
                  key={worker.id} worker={worker}
                  onPress={() => navigation.navigate('WorkerProfile', { worker })}
                />
              ))
          }

          {((isWorker && filteredJobs.length === 0) || (!isWorker && filteredWorkers.length === 0)) && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={32} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery.trim()
                  ? 'Sin resultados'
                  : isWorker ? 'No hay trabajos disponibles' : 'No hay trabajadores cerca'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? 'Intenta con otro término de búsqueda'
                  : 'Prueba con otra categoría o municipio'}
              </Text>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  logo: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 12, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 2 },
  urgentBanner: {
    marginHorizontal: 12, marginBottom: 10,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...SHADOW_SM,
  },
  urgentIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW_SM,
  },
  urgentText: { flex: 1 },
  urgentTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  urgentSub: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  urgentBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
  },
  urgentBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  catsLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    paddingHorizontal: 12, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  categories: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  catChip: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    minWidth: 62,
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
  sectionLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  sectionLink: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textTertiary },
});
