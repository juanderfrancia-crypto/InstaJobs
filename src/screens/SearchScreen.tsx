import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM } from '@/constants';
import { MunicipioSearch } from '@/components/MunicipioSearch';
import { WorkerCard } from '@/components/WorkerCard';
import { JobCard } from '@/components/JobCard';
import { WorkerProfile, JobPost } from '@/types';
import { fetchOpenJobs, fetchAvailableWorkers, fetchAppliedJobIds } from '@/services';

export function SearchScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isWorker = user?.role === 'worker';

  const [query, setQuery]                         = useState('');
  const [selectedCategory, setSelectedCategory]   = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality ?? '');
  const [workers, setWorkers]                     = useState<WorkerProfile[]>([]);
  const [jobs, setJobs]                           = useState<JobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds]         = useState<Set<string>>(new Set());
  const [searched, setSearched]                   = useState(false);
  const [loading, setLoading]                     = useState(false);
  const [loadingMore, setLoadingMore]             = useState(false);
  const [networkError, setNetworkError]           = useState(false);
  const [page, setPage]                           = useState(0);
  const [hasMore, setHasMore]                     = useState(false);
  const [totalCount, setTotalCount]               = useState(0);

  const doSearch = async (reset: boolean) => {
    const currentPage = reset ? 0 : page;
    reset ? setLoading(true) : setLoadingMore(true);
    setNetworkError(false);
    try {
      if (isWorker) {
        const result = await fetchOpenJobs({
          municipality: selectedMunicipality,
          category:     selectedCategory,
          query,
          page:         currentPage,
        });
        const newJobs = reset ? result.data : [...jobs, ...result.data];
        setJobs(newJobs);
        setHasMore(result.hasMore);
        setTotalCount(result.count);

        if (result.data.length && user?.id) {
          const newIds = await fetchAppliedJobIds(user.id, result.data.map(j => j.id));
          setAppliedJobIds(prev => reset ? newIds : new Set([...prev, ...newIds]));
        } else if (reset) {
          setAppliedJobIds(new Set());
        }
      } else {
        const result = await fetchAvailableWorkers({
          municipality: selectedMunicipality,
          category:     selectedCategory,
          query,
          page:         currentPage,
        });
        setWorkers(prev => reset ? result.data : [...prev, ...result.data]);
        setHasMore(result.hasMore);
        setTotalCount(result.count);
      }

      setPage(reset ? 1 : currentPage + 1);
      setSearched(true);
    } catch {
      setNetworkError(true);
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  };

  const handleSearch   = () => doSearch(true);
  const handleLoadMore = () => doSearch(false);

  const resultCount = isWorker ? jobs.length : workers.length;
  const hasResults  = searched && resultCount > 0;
  const isEmpty     = searched && resultCount === 0;

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

      <ScrollView
        style={styles.results}
        contentContainerStyle={[styles.resultsContent, { paddingBottom: tabBarHeight }]}
      >
        {hasResults && (
          <Text style={styles.resultsCount}>
            {resultCount}{hasMore ? ` de ${totalCount}` : ''} resultado{totalCount !== 1 ? 's' : ''}
            {selectedMunicipality ? ` en ${selectedMunicipality}` : ''}
          </Text>
        )}

        {networkError && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cloud-offline-outline" size={30} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin conexión</Text>
            <Text style={styles.emptyText}>Verifica tu internet e intenta de nuevo</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleSearch} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={15} color={COLORS.primary} />
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!networkError && isEmpty && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={30} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>Intenta con otros filtros o amplía el municipio</Text>
          </View>
        )}

        {!networkError && !searched && (
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
            <Text style={styles.emptyText}>Usa los filtros de arriba y toca Buscar</Text>
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

        {hasMore && !loading && (
          <TouchableOpacity
            style={[styles.loadMoreBtn, loadingMore && { opacity: 0.7 }]}
            onPress={handleLoadMore}
            disabled={loadingMore}
            activeOpacity={0.85}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
                <Text style={styles.loadMoreText}>
                  Cargar más ({totalCount - resultCount} restantes)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    minHeight: 48,
  },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
