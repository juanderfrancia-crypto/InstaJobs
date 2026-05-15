import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, StatusBar, Image, Dimensions, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { COLORS, CATEGORIES, SHADOW_SM, SHADOW_MD } from '@/constants';
import { Avatar, StarRating, Badge } from '@/components/UI';
import { WorkerProfile, Review } from '@/types';

const AVATAR_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'];

export function WorkerProfileScreen({ route, navigation }: any) {
  const { worker: initialWorker } = route.params as { worker: WorkerProfile };
  const insets = useSafeAreaInsets();
  const [worker, setWorker] = useState(initialWorker);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<'info' | 'reviews'>('info');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadWorker();
    loadReviews();
  }, []);

  const loadWorker = async () => {
    const { data } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('user_id', initialWorker.user_id)
      .single();
    if (data) setWorker(data);
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, reviewer:users(full_name)')
      .eq('reviewed_id', initialWorker.user_id)
      .order('created_at', { ascending: false })
      .limit(20);
    setReviews(data ?? []);
  };

  const handleWhatsApp = () => {
    const num = worker.whatsapp_number.replace(/\D/g, '');
    Linking.openURL(
      `https://wa.me/57${num}?text=Hola ${worker.full_name}, te encontré en InstaJobs y quisiera consultarte sobre un trabajo.`
    );
  };

  const tradeItems = worker.trades.map(
    t => CATEGORIES.find(c => c.id === t) ?? { id: t, label: t, iconName: 'construct-outline', color: '#F1F5F9', textColor: '#334155' }
  );

  const initials = worker.full_name
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const bgColor = AVATAR_COLORS[worker.full_name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cover photo */}
        <View style={[styles.coverWrap, { paddingTop: insets.top }]}>
          {worker.avatar_url ? (
            <Image source={{ uri: worker.avatar_url }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: bgColor }]}>
              <Text style={styles.coverInitials}>{initials}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { top: insets.top + 10 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.coverBadges}>
            <Badge
              label={worker.available ? 'Disponible' : 'En obra'}
              variant={worker.available ? 'success' : 'warning'}
            />
            {worker.membership_tier === 'premium' && (
              <Badge label="Pro" variant="info" iconName="diamond" />
            )}
          </View>
        </View>

        {/* Name & stats */}
        <View style={styles.heroBody}>
          <Text style={styles.heroName}>{worker.full_name}</Text>
          <View style={styles.heroLocationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.heroLocation}>{worker.municipality}</Text>
          </View>
          <Text style={styles.heroTrades}>{tradeItems.map(t => t.label).join(' · ')}</Text>
          {worker.experience_years > 0 && (
            <View style={styles.expRow}>
              <Ionicons name="briefcase-outline" size={13} color={COLORS.textTertiary} />
              <Text style={styles.heroExp}>{worker.experience_years} años de experiencia</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{worker.rating?.toFixed(1) ?? '–'}</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{worker.jobs_completed ?? 0}</Text>
              <Text style={styles.statLabel}>Trabajos</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{worker.reviews_count ?? 0}</Text>
              <Text style={styles.statLabel}>Reseñas</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaBar}>
          <Badge label="Celular verificado" variant="success" iconName="checkmark-circle" />
          {worker.verified_id
            ? <Badge label="Cédula verificada" variant="success" iconName="checkmark-circle" />
            : <Badge label="Sin verificar cédula" variant="warning" iconName="alert-circle" />
          }
          {worker.membership_tier === 'premium' && (
            <Badge label="Pro" variant="info" iconName="diamond" />
          )}
        </View>

        <View style={styles.tabs}>
          {(['info', 'reviews'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Ionicons
                name={t === 'info' ? 'person-outline' : 'star-outline'}
                size={15}
                color={tab === t ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'info' ? 'Información' : `Reseñas (${reviews.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'info' ? (
          <View style={styles.content}>
            {worker.bio ? (
              <>
                <Text style={styles.secTitle}>Sobre mí</Text>
                <Text style={styles.bio}>{worker.bio}</Text>
              </>
            ) : null}

            <Text style={styles.secTitle}>Servicios que ofrece</Text>
            <View style={styles.servicesGrid}>
              {tradeItems.map((cat, i) => (
                <View key={i} style={[styles.serviceChip, { backgroundColor: cat.color }]}>
                  <Ionicons name={cat.iconName as keyof typeof Ionicons.glyphMap} size={14} color={cat.textColor} />
                  <Text style={[styles.serviceText, { color: cat.textColor }]}>{cat.label}</Text>
                </View>
              ))}
            </View>

            {worker.photos && worker.photos.length > 0 && (
              <>
                <Text style={styles.secTitle}>
                  Fotos de trabajo ({worker.photos.length})
                </Text>
                <View style={styles.photosGrid}>
                  {worker.photos.map((url: string, i: number) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.photoThumbWrap}
                      onPress={() => setSelectedPhoto(url)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.photoThumb}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <View style={styles.emptyReviewsIcon}>
                  <Ionicons name="star-outline" size={28} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyReviewsTitle}>Sin reseñas aún</Text>
                <Text style={styles.emptyReviewsText}>
                  Es un trabajador nuevo en InstaJobs. Sé el primero en contratarlo y dejar una reseña.
                </Text>
              </View>
            ) : (
              reviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerRow}>
                      <Avatar name={review.reviewer?.full_name ?? 'C'} size={30} />
                      <Text style={styles.reviewerName}>{review.reviewer?.full_name ?? 'Cliente'}</Text>
                    </View>
                    <StarRating rating={review.rating} size={13} />
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedPhoto} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.photoModal}>
          <TouchableOpacity
            style={styles.photoModalClose}
            onPress={() => setSelectedPhoto(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.photoModalImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.waBtnText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  coverWrap: { position: 'relative', backgroundColor: '#1a1a1a' },
  cover: { width: '100%', height: 280 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverInitials: { fontSize: 72, fontWeight: '800', color: '#fff', opacity: 0.9 },
  backBtn: {
    position: 'absolute', left: 14,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  coverBadges: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', gap: 6,
  },
  heroBody: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  heroName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  heroLocation: { fontSize: 13, color: COLORS.textTertiary },
  heroTrades: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 6 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  heroExp: { fontSize: 12, color: COLORS.textTertiary },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 16, width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textTertiary, marginTop: 3 },
  statDiv: { width: 1, height: 32, backgroundColor: COLORS.border },
  metaBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  content: { padding: 16 },
  secTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 6,
  },
  bio: { fontSize: 14, color: COLORS.text, lineHeight: 21, marginBottom: 16 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  serviceText: { fontSize: 12, fontWeight: '600' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  photoThumbWrap: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  photoThumb: { width: '100%', height: '100%' },
  emptyReviews: { alignItems: 'center', paddingVertical: 40 },
  emptyReviewsIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, ...SHADOW_SM,
  },
  emptyReviewsTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  emptyReviewsText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center' },
  reviewCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  reviewText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  reviewDate: { fontSize: 11, color: COLORS.textTertiary, marginTop: 6 },
  photoModal: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoModalClose: {
    position: 'absolute', top: 52, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  photoModalImg: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.75,
  },
  footer: {
    paddingHorizontal: 12, paddingTop: 10,
    backgroundColor: COLORS.card,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  waBtn: {
    height: 52, borderRadius: 16,
    backgroundColor: COLORS.whatsapp,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW_MD,
    shadowColor: COLORS.whatsapp,
  },
  waBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
