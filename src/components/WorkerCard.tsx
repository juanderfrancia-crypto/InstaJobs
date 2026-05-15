import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, StarRating } from './UI';
import { COLORS, CATEGORIES, SHADOW_MD, SHADOW_SM } from '@/constants';
import { WorkerProfile } from '@/types';

interface WorkerCardProps {
  worker: WorkerProfile;
  onPress: () => void;
}

export function WorkerCard({ worker, onPress }: WorkerCardProps) {
  const tradeLabels = worker.trades
    .map(t => CATEGORIES.find(c => c.id === t)?.label ?? t)
    .join(' · ');

  const handleWhatsApp = () => {
    const number = worker.whatsapp_number.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/57${number}?text=Hola ${worker.full_name}, te encontré en InstaJobs y quisiera consultarte sobre un trabajo.`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.top}>
        <Avatar name={worker.full_name} size={64} avatarUrl={worker.avatar_url} />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.full_name}</Text>
            {worker.membership_tier === 'premium' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={9} color="#A16207" />
                <Text style={styles.premiumText}>Pro</Text>
              </View>
            )}
          </View>

          <Text style={styles.trade} numberOfLines={1}>{tradeLabels}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={11} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{worker.municipality}</Text>
            <Text style={styles.dot}>·</Text>
            {worker.reviews_count > 0
              ? <StarRating rating={worker.rating ?? 0} count={worker.reviews_count} size={11} />
              : <View style={styles.newBadge}><Text style={styles.newBadgeText}>Nuevo</Text></View>
            }
          </View>

          <View style={styles.availRow}>
            <View style={[styles.availDot, {
              backgroundColor: worker.available ? COLORS.success : COLORS.textTertiary,
            }]} />
            <Text style={[styles.availText, {
              color: worker.available ? COLORS.success : COLORS.textTertiary,
            }]}>
              {worker.available ? 'Disponible ahora' : 'En obra'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.profileBtn} onPress={onPress} activeOpacity={0.8}>
          <Ionicons name="person-outline" size={14} color={COLORS.primary} />
          <Text style={styles.profileBtnText}>Ver perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={16} color="#fff" />
          <Text style={styles.waBtnText}>Contactar por WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    ...SHADOW_MD,
  },
  top: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  info: { flex: 1, justifyContent: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF9C3', paddingHorizontal: 7,
    paddingVertical: 2, borderRadius: 10,
  },
  premiumText: { fontSize: 10, color: '#A16207', fontWeight: '700' },
  trade: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: COLORS.textTertiary },
  dot: { fontSize: 11, color: COLORS.textTertiary },
  newBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primaryDark },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  profileBtn: {
    height: 38, borderRadius: 11,
    borderWidth: 1.5, borderColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingHorizontal: 14,
  },
  profileBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  waBtn: {
    flex: 1, height: 38, borderRadius: 11,
    backgroundColor: COLORS.whatsapp,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
