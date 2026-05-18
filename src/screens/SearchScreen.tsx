import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD, SHADOW_HEADER, SHADOW_PRIMARY } from '@/constants';
import { MunicipioSearch } from '@/components/MunicipioSearch';
import { WorkerCard } from '@/components/WorkerCard';
import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton, WorkerCardSkeleton } from '@/components/SkeletonCard';
import { WorkerProfile, JobPost } from '@/types';
import { fetchOpenJobs, fetchAvailableWorkers, fetchAppliedJobIds } from '@/services';
import { getDepartamentoByMunicipio, getMunicipiosEnDepartamento } from '@/constants/colombiaMunicipios';

const SKELETON_COUNT = 3;

const QUICK_CATEGORIES = [
  'plomeria', 'electricidad', 'construccion', 'pintura', 'aseo', 'carpinteria',
] as const;

export function SearchScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);
  const isWorker = user?.role === 'worker';

  const [query, setQuery]                               = useState('');
  const [selectedCategory, setSelectedCategory]         = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality ?? '');
  const [searchScope, setSearchScope]                   = useState<'municipality' | 'department'>('municipality');
  const [workers, setWorkers]                           = useState<WorkerProfile[]>([]);
  const [jobs, setJobs]                                 = useState<JobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds]               = useState<Set<string>>(new Set());
  const [searched, setSearched]                         = useState(false);
  const [loading, setLoading]                           = useState(false);
  const [loadingMore, setLoadingMore]                   = useState(false);
  const [networkError, setNetworkError]                 = useState(false);
  const [page, setPage]                                 = useState(0);
  const [hasMore, setHasMore]                           = useState(false);
  const [totalCount, setTotalCount]                     = useState(0);

  const doSearch = useCallback(async (reset: boolean, overrideCategory?: string) => {
    const currentPage = reset ? 0 : page;
    const category = overrideCategory !== undefined ? overrideCategory : selectedCategory;
    const municipalities = searchScope === 'department' && selectedMunicipality
      ? getMunicipiosEnDepartamento(selectedMunicipality)
      : undefined;
    reset ? setLoading(true) : setLoadingMore(true);
    setNetworkError(false);
    try {
      if (isWorker) {
        const result = await fetchOpenJobs({
          municipality: municipalities ? undefined : selectedMunicipality,
          municipalities,
          category,
          query,
          page: currentPage,
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
          municipality: municipalities ? undefined : selectedMunicipality,
          municipalities,
          category,
          query,
          page: currentPage,
        });
        setWorkers(prev => reset ? result.data : [...prev, ...result.data]);
        setHasMore(result.hasMore);
        setTotalCount(result.count);
      }
      setPage(reset ? 1 : currentPage + 1);
      setSearched(true);
      if (reset) {
        setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
      }
    } catch {
      setNetworkError(true);
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  }, [page, selectedCategory, selectedMunicipality, searchScope, query, isWorker, jobs, user?.id]);

  const handleSearch    = useCallback(() => doSearch(true), [doSearch]);
  const handleLoadMore  = useCallback(() => doSearch(false), [doSearch]);

  const handleQuickCategory = useCallback((catId: string) => {
    setSelectedCategory(catId);
    doSearch(true, catId);
  }, [doSearch]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory('');
    setSelectedMunicipality('');
    setSearchScope('municipality');
    setQuery('');
  }, []);

  const departamento = useMemo(
    () => selectedMunicipality ? getDepartamentoByMunicipio(selectedMunicipality) : null,
    [selectedMunicipality],
  );

  const resultCount = isWorker ? jobs.length : workers.length;
  const hasResults  = searched && resultCount > 0;
  const isEmpty     = searched && resultCount === 0 && !loading;
  const hasFilters  = selectedCategory || selectedMunicipality || query;

  const quickCats = useMemo(() =>
    QUICK_CATEGORIES.map(id => CATEGORIES.find(c => c.id === id)!).filter(Boolean),
  []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {isWorker ? 'Buscar trabajos' : 'Buscar trabajadores'}
          </Text>
          <Text style={styles.subtitle}>
            {isWorker
              ? 'Encuentra oportunidades cerca de ti'
              : 'Profesionales verificados en tu zona'}
          </Text>
        </View>
        {hasFilters && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters} activeOpacity={0.8}>
            <Ionicons name="close" size={14} color={COLORS.primary} />
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Panel de filtros */}
      <View style={styles.filters}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={isWorker ? 'Título o descripción del trabajo...' : 'Nombre del trabajador...'}
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

        {/* Categorías */}
        <Text style={styles.filterLabel}>Categoría</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Ionicons
              name="apps-outline"
              size={14}
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
                  size={14}
                  color={active ? COLORS.primaryDark : COLORS.textSecondary}
                />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Municipio */}
        <View style={styles.muniFilterRow}>
          <Text style={styles.filterLabel}>Municipio</Text>
          {selectedMunicipality ? (
            <TouchableOpacity onPress={() => setSelectedMunicipality('')} style={styles.todosBtn}>
              <Text style={styles.todosBtnText}>Ver todos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.muniWrap}>
          <MunicipioSearch
            value={selectedMunicipality}
            onChange={setSelectedMunicipality}
            placeholder="Filtrar por municipio (opcional)"
          />
        </View>

        {/* Toggle de alcance — solo visible cuando hay municipio seleccionado */}
        {selectedMunicipality && departamento && (
          <View style={styles.scopeRow}>
            <TouchableOpacity
              style={[styles.scopeChip, searchScope === 'municipality' && styles.scopeChipActive]}
              onPress={() => setSearchScope('municipality')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="location"
                size={13}
                color={searchScope === 'municipality' ? COLORS.primaryDark : COLORS.textSecondary}
              />
              <Text
                style={[styles.scopeText, searchScope === 'municipality' && styles.scopeTextActive]}
                numberOfLines={1}
              >
                {selectedMunicipality}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scopeChip, searchScope === 'department' && styles.scopeChipActive]}
              onPress={() => setSearchScope('department')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="map-outline"
                size={13}
                color={searchScope === 'department' ? COLORS.primaryDark : COLORS.textSecondary}
              />
              <Text
                style={[styles.scopeText, searchScope === 'department' && styles.scopeTextActive]}
                numberOfLines={1}
              >
                Todo {departamento}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón buscar */}
        <TouchableOpacity
          style={[styles.searchBtn, loading && styles.searchBtnLoading]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={16} color="#fff" />
          )}
          <Text style={styles.searchBtnText}>
            {loading ? 'Buscando...' : isWorker ? 'Buscar trabajos' : 'Buscar trabajadores'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      <ScrollView
        ref={scrollRef}
        style={styles.results}
        contentContainerStyle={[styles.resultsContent, { paddingBottom: tabBarHeight + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Estado inicial — categorías rápidas */}
        {!searched && !loading && (
          <View style={styles.quickSection}>
            <Text style={styles.quickTitle}>
              {isWorker ? 'Oficios más solicitados' : 'Categorías populares'}
            </Text>
            <Text style={styles.quickSubtitle}>Toca una categoría para buscar rápido</Text>
            <View style={styles.quickGrid}>
              {quickCats.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.quickChip, { backgroundColor: cat.color }]}
                  onPress={() => handleQuickCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                    <Ionicons
                      name={cat.iconName as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={cat.textColor}
                    />
                  </View>
                  <Text style={[styles.quickChipLabel, { color: cat.textColor }]} numberOfLines={2}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Skeleton loading */}
        {loading && (
          <>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) =>
              isWorker
                ? <JobCardSkeleton key={i} />
                : <WorkerCardSkeleton key={i} />
            )}
          </>
        )}

        {/* Error de red */}
        {!loading && networkError && (
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

        {/* Sin resultados */}
        {!loading && isEmpty && !networkError && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={30} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>Intenta con otros filtros o amplía el municipio</Text>
            {hasFilters && (
              <TouchableOpacity style={styles.retryBtn} onPress={clearAllFilters} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={15} color={COLORS.primary} />
                <Text style={styles.retryText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Contador de resultados */}
        {!loading && hasResults && (
          <View style={styles.resultsHeader}>
            <View style={styles.resultsCountWrap}>
              <Text style={styles.resultsCountNum}>
                {resultCount}{hasMore ? ` de ${totalCount}` : ''}
              </Text>
              <Text style={styles.resultsCountLabel}>
                {isWorker ? 'trabajo' : 'trabajador'}{totalCount !== 1 ? 's' : ''}
                {searchScope === 'department' && departamento
                  ? ` en ${departamento}`
                  : selectedMunicipality ? ` en ${selectedMunicipality}` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Lista de resultados */}
        {!loading && (
          isWorker
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
        )}

        {/* Cargar más */}
        {!loading && hasMore && (
          <TouchableOpacity
            style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnLoading]}
            onPress={handleLoadMore}
            disabled={loadingMore}
            activeOpacity={0.85}
          >
            {loadingMore ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadMoreText}>Cargando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
                <Text style={styles.loadMoreText}>
                  Ver {totalCount - resultCount} más
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

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 10,
    ...SHADOW_HEADER,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, marginBottom: 2,
  },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  filters: {
    backgroundColor: COLORS.card,
    paddingBottom: 12,
    ...SHADOW_MD,
    shadowOpacity: 0.07,
    zIndex: 5,
  },
  filterLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 14, marginTop: 10, marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    ...SHADOW_SM,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  chipScroll: { paddingHorizontal: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    backgroundColor: COLORS.white,
  },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primaryDark, fontWeight: '600' },
  muniFilterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingRight: 14,
  },
  todosBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  todosBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  muniWrap: { paddingHorizontal: 14 },
  scopeRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 14, paddingTop: 10,
  },
  scopeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    backgroundColor: COLORS.white,
  },
  scopeChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  scopeText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', flexShrink: 1 },
  scopeTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
  searchBtn: {
    marginHorizontal: 12, marginTop: 12,
    height: 46, borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 7,
    ...SHADOW_PRIMARY,
  },
  searchBtnLoading: { opacity: 0.75 },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  results: { flex: 1 },
  resultsContent: { padding: 12, paddingTop: 14 },

  resultsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsCountWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  resultsCountNum: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  resultsCountLabel: { fontSize: 13, color: COLORS.textSecondary },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.card, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14,
    ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  quickSection: { marginBottom: 8 },
  quickTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  quickSubtitle: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 14 },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  quickChip: {
    width: '30.5%',
    borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    ...SHADOW_SM,
  },
  quickIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickChipLabel: {
    fontSize: 11, fontWeight: '600', textAlign: 'center',
  },

  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    minHeight: 48,
  },
  loadMoreBtnLoading: { opacity: 0.7 },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
