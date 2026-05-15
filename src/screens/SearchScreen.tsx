import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM } from '@/constants';
import { MunicipioSearch } from '@/components/MunicipioSearch';
import { WorkerCard } from '@/components/WorkerCard';
import { JobCard } from '@/components/JobCard';
import { WorkerProfile, JobPost } from '@/types';

export function SearchScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isWorker = user?.role === 'worker';

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality ?? '');
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    if (isWorker) {
      let q = supabase
        .from('job_posts')
        .select('*, client:users(full_name, municipality)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(30);
      if (selectedMunicipality) q = q.eq('municipality', selectedMunicipality);
      if (selectedCategory) q = q.eq('trade_category', selectedCategory);
      if (query.trim()) q = q.ilike('title', `%${query.trim()}%`);
      const { data } = await q;
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
    } else {
      let q = supabase
        .from('worker_profiles')
        .select('*')
        .eq('available', true)
        .order('membership_tier', { ascending: false })
        .limit(30);
      if (selectedMunicipality) q = q.eq('municipality', selectedMunicipality);
      if (selectedCategory) q = q.contains('trades', [selectedCategory]);
      if (query.trim()) q = q.ilike('full_name', `%${query.trim()}%`);
      const { data } = await q;
      setWorkers(data ?? []);
    }

    setSearched(true);
    setLoading(false);
  };

  const resultCount = isWorker ? jobs.length : workers.length;
  const hasResults = searched && resultCount > 0;
  const isEmpty = searched && resultCount === 0;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>
          {isWorker ? 'Buscar trabajos' : 'Buscar trabajadores'}
        </Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={isWorker ? 'Título del trabajo...' : 'Nombre del trabajador...'}
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={17} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.filterLabel}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Ionicons
              name="apps-outline"
              size={13}
              color={!selectedCategory ? COLORS.primaryDark : COLORS.textSecondary}
            />
            <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedCategory(active ? '' : cat.id)}
              >
                <Ionicons
                  name={cat.iconName as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={active ? COLORS.primaryDark : COLORS.textSecondary}
                />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.muniFilterRow}>
          <Text style={styles.filterLabel}>Municipio</Text>
          {selectedMunicipality ? (
            <TouchableOpacity onPress={() => setSelectedMunicipality('')} style={styles.todosBtn}>
              <Text style={styles.todosBtnText}>Ver todos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 14 }}>
          <MunicipioSearch
            value={selectedMunicipality}
            onChange={setSelectedMunicipality}
            placeholder="Filtrar por municipio (opcional)"
          />
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, loading && { opacity: 0.7 }]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={styles.searchBtnText}>
            {loading ? 'Buscando...' : isWorker ? 'Buscar trabajos' : 'Buscar trabajadores'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results} contentContainerStyle={[styles.resultsContent, { paddingBottom: tabBarHeight }]}>
        {hasResults && (
          <Text style={styles.resultsCount}>
            {resultCount} resultado{resultCount !== 1 ? 's' : ''}
            {selectedMunicipality ? ` en ${selectedMunicipality}` : ' en todos los municipios'}
          </Text>
        )}

        {isEmpty && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={30} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>Intenta con otros filtros o amplía el municipio</Text>
          </View>
        )}

        {!searched && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={isWorker ? 'briefcase-outline' : 'people-outline'}
                size={30}
                color={COLORS.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {isWorker ? 'Encuentra trabajos' : 'Encuentra trabajadores'}
            </Text>
            <Text style={styles.emptyText}>
              Usa los filtros de arriba y toca Buscar
            </Text>
          </View>
        )}

        {isWorker
          ? jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
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
                onPress={() => navigation.navigate('WorkerProfile', { worker })}
              />
            ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  filters: {
    backgroundColor: COLORS.card,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    ...SHADOW_SM,
  },
  filterLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 14, marginTop: 10, marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, marginBottom: 8,
    backgroundColor: COLORS.background, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  chipScroll: { paddingLeft: 12 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    marginRight: 8, backgroundColor: COLORS.white,
  },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primaryDark, fontWeight: '600' },
  muniFilterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, marginTop: 10, marginBottom: 8,
  },
  todosBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  todosBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  searchBtn: {
    marginHorizontal: 12, marginTop: 10,
    height: 44, borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  results: { flex: 1 },
  resultsContent: { padding: 12 },
  resultsCount: {
    fontSize: 12, color: COLORS.textTertiary, fontWeight: '500',
    marginBottom: 10,
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.card, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14,
    ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center' },
});
