import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SHADOW_SM } from '@/constants';
import { Avatar, StarRating } from '@/components/UI';
import { Review } from '@/types';
import { fetchReviewsByTarget } from '@/services';

export function MyRatingsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = async () => {
    if (!user?.id) return;
    const data = await fetchReviewsByTarget(user.id);
    setReviews(data);
  };

  useEffect(() => {
    loadReviews().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis calificaciones</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={reviews.length === 0 ? styles.emptyContainer : styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {reviews.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="star-outline" size={32} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>Sin calificaciones aún</Text>
              <Text style={styles.emptyText}>
                Las reseñas aparecerán aquí cuando los clientes te califiquen
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.avgNum}>{avgRating.toFixed(1)}</Text>
                  <StarRating rating={avgRating} size={16} />
                  <Text style={styles.totalText}>{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.summaryRight}>
                  {distribution.map(({ star, count, pct }) => (
                    <View key={star} style={styles.distRow}>
                      <Text style={styles.distStar}>{star}</Text>
                      <Ionicons name="star" size={11} color={COLORS.star} />
                      <View style={styles.distBar}>
                        <View style={[styles.distFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.distCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {reviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerRow}>
                      <Avatar name={review.reviewer?.full_name ?? 'C'} size={34} />
                      <View>
                        <Text style={styles.reviewerName}>
                          {review.reviewer?.full_name ?? 'Cliente'}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                    <StarRating rating={review.rating} size={13} />
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewText}>{review.comment}</Text>
                  ) : null}
                </View>
              ))}
            </>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 12 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW_SM,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textAlign: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 19 },
  summaryCard: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 18,
    flexDirection: 'row', gap: 20, marginBottom: 14,
    borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW_SM,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  avgNum: { fontSize: 40, fontWeight: '800', color: COLORS.text, lineHeight: 44 },
  totalText: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  summaryRight: { flex: 1, justifyContent: 'center', gap: 5 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  distStar: { fontSize: 11, color: COLORS.textSecondary, width: 8 },
  distBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: COLORS.borderLight, overflow: 'hidden',
  },
  distFill: { height: '100%', backgroundColor: COLORS.star, borderRadius: 3 },
  distCount: { fontSize: 11, color: COLORS.textTertiary, width: 14, textAlign: 'right' },
  reviewCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW_SM,
  },
  reviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  reviewDate: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
  reviewText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
