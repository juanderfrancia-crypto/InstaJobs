import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CATEGORIES, SHADOW_SM } from '@/constants';
import { fetchClientProfileData } from '@/services';
import { Avatar, Badge, StarRating } from '@/components/UI';

export function ClientProfileScreen({ route, navigation }: any) {
  const { clientId } = route.params as { clientId: string };
  const insets = useSafeAreaInsets();

  const [client, setClient]       = useState<any>(null);
  const [jobStats, setJobStats]   = useState({ total: 0, completed: 0, cancelled: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [reviews, setReviews]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchClientProfileData(clientId)
      .then(({ client, allJobs, recentJobs, reviews }) => {
        setClient(client);
        setRecentJobs(recentJobs);
        setReviews(reviews);
        setJobStats({
          total:     allJobs.length,
          completed: allJobs.filter((j: any) => j.status === 'completed').length,
          cancelled: allJobs.filter((j: any) => j.status === 'cancelled').length,
        });
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const completionRate = jobStats.total > 0
    ? Math.round((jobStats.completed / jobStats.total) * 100)
    : null;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const memberSince = client?.created_at
    ? new Date(client.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '';

  const rateColor = completionRate === null ? COLORS.textTertiary
    : completionRate >= 70 ? COLORS.success
    : completionRate >= 40 ? '#D97706'
    : COLORS.danger;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.headerRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del cliente</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !client ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero */}
          <View style={styles.heroCard}>
            <Avatar name={client.full_name} size={72} avatarUrl={client.avatar_url} />
            <Text style={styles.name}>{client.full_name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.locationText}>{client.municipality}</Text>
            </View>
            <View style={styles.roleChip}>
              <Ionicons name="person-outline" size={13} color="#1D4ED8" />
              <Text style={styles.roleChipText}>Cliente</Text>
            </View>
            <View style={styles.badgesRow}>
              {client.verified_phone && (
                <Badge label="Celular verificado" variant="success" iconName="checkmark-circle" />
              )}
              {client.verified_id && (
                <Badge label="Cédula verificada" variant="success" iconName="checkmark-circle" />
              )}
              {!client.verified_phone && !client.verified_id && (
                <Badge label="Sin verificar" variant="warning" iconName="alert-circle" />
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statNumber}>{jobStats.total}</Text>
              <Text style={styles.statLabel}>Publicados</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
              <Text style={[styles.statNumber, { color: COLORS.success }]}>{jobStats.completed}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={20} color={rateColor} />
              <Text style={[styles.statNumber, { color: rateColor }]}>
                {completionRate !== null ? `${completionRate}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Tasa cierre</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={20} color={COLORS.star ?? '#F59E0B'} />
              <Text style={[styles.statNumber, { color: COLORS.star ?? '#F59E0B' }]}>
                {avgRating !== null ? avgRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.statLabel}>{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Miembro desde */}
          <View style={styles.memberRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.memberText}>Miembro desde {memberSince}</Text>
          </View>

          {/* Trabajos activos */}
          {recentJobs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trabajos activos</Text>
              {recentJobs.map(job => {
                const cat = CATEGORIES.find(c => c.id === job.trade_category);
                return (
                  <TouchableOpacity
                    key={job.id}
                    style={styles.jobRow}
                    onPress={() => navigation.navigate('JobDetail', { job })}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.jobIcon, { backgroundColor: cat?.color ?? '#F1F5F9' }]}>
                      <Ionicons
                        name={(cat?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={cat?.textColor ?? COLORS.textSecondary}
                      />
                    </View>
                    <View style={styles.jobInfo}>
                      <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                      <Text style={styles.jobMeta}>{job.municipality}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Reseñas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Reseñas de trabajadores {reviews.length > 0 ? `(${reviews.length})` : ''}
            </Text>
            {reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Ionicons name="star-outline" size={24} color={COLORS.textTertiary} />
                <Text style={styles.emptyReviewsText}>Sin reseñas aún</Text>
              </View>
            ) : (
              reviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Avatar name={review.reviewer?.full_name ?? 'T'} size={32} />
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>{review.reviewer?.full_name ?? 'Trabajador'}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <StarRating rating={review.rating} size={13} />
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

        </ScrollView>
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
  errorText: { fontSize: 14, color: COLORS.textTertiary },
  scroll: { paddingBottom: 40 },

  heroCard: {
    backgroundColor: COLORS.card, padding: 24,
    alignItems: 'center', gap: 8,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, backgroundColor: '#DBEAFE',
  },
  roleChipText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },

  statsGrid: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    marginTop: 12, marginHorizontal: 12, borderRadius: 18,
    borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM, overflow: 'hidden',
  },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4,
    borderRightWidth: 0.5, borderRightColor: COLORS.border,
  },
  statNumber: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textTertiary, textAlign: 'center' },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  memberText: { fontSize: 12, color: COLORS.textTertiary },

  section: {
    backgroundColor: COLORS.card, marginTop: 8,
    borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },

  jobRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  jobIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  jobMeta: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },

  emptyReviews: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyReviewsText: { fontSize: 13, color: COLORS.textTertiary },

  reviewCard: {
    paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewMeta: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  reviewDate: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
});
