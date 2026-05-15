import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './UI';
import { COLORS, CATEGORIES, SHADOW_MD } from '@/constants';
import { JobPost } from '@/types';

interface JobCardProps {
  job: JobPost;
  onPress: () => void;
  showApply?: boolean;
  onApply?: () => void;
  applied?: boolean;
}

type UrgencyKey = 'today' | 'week' | 'flexible';

const URGENCY_CONFIG: Record<UrgencyKey, {
  label: string;
  variant: 'danger' | 'warning' | 'info';
  iconName: keyof typeof Ionicons.glyphMap;
}> = {
  today:    { label: 'Urgente · Hoy',    variant: 'danger',  iconName: 'flash' },
  week:     { label: 'Esta semana',      variant: 'warning', iconName: 'calendar-outline' },
  flexible: { label: 'Flexible',         variant: 'info',    iconName: 'time-outline' },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} días`;
};

export function JobCard({ job, onPress, showApply, onApply, applied }: JobCardProps) {
  const category = CATEGORIES.find(c => c.id === job.trade_category);
  const urgencyBase = URGENCY_CONFIG[job.urgency as UrgencyKey] ?? URGENCY_CONFIG.flexible;
  const detail = (job as any).urgency_detail;
  const urgency = {
    ...urgencyBase,
    label: detail ? `${urgencyBase.label} · ${detail}` : urgencyBase.label,
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: category?.color ?? '#F1F5F9' }]}>
          <Ionicons
            name={(category?.iconName ?? 'construct-outline') as keyof typeof Ionicons.glyphMap}
            size={20}
            color={category?.textColor ?? COLORS.textSecondary}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.municipality}>{job.municipality}</Text>
          </View>
          {(job as any).client?.full_name && (
            <View style={styles.clientRow}>
              <Ionicons name="person-circle-outline" size={11} color={COLORS.textTertiary} />
              <Text style={styles.clientName}>{(job as any).client.full_name}</Text>
            </View>
          )}
        </View>
        <Badge label={urgency.label} variant={urgency.variant} iconName={urgency.iconName} />
      </View>

      <Text style={styles.description} numberOfLines={2}>{job.description}</Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="time-outline" size={11} color={COLORS.textTertiary} />
          <Text style={styles.time}>{timeAgo(job.created_at)}</Text>
        </View>
        {job.photos && job.photos.length > 0 && (
          <View style={styles.photosChip}>
            <Ionicons name="camera-outline" size={11} color={COLORS.primary} />
            <Text style={styles.photosChipText}>{job.photos.length} foto{job.photos.length > 1 ? 's' : ''}</Text>
          </View>
        )}
        {job.budget_min && job.budget_max && (
          <View style={styles.budgetRow}>
            <Ionicons name="cash-outline" size={11} color={COLORS.success} />
            <Text style={styles.budget}>
              ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
            </Text>
          </View>
        )}
        {job.applications_count !== undefined && (
          <View style={styles.appsRow}>
            <Ionicons name="people-outline" size={11} color={COLORS.textTertiary} />
            <Text style={styles.apps}>{job.applications_count}</Text>
          </View>
        )}
      </View>

      {showApply && (
        applied ? (
          <View style={styles.appliedChip}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.appliedChipText}>Ya aplicaste</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
            <Text style={styles.applyText}>Aplicar a este trabajo</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    ...SHADOW_MD,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  municipality: { fontSize: 11, color: COLORS.textSecondary },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  clientName: { fontSize: 11, color: COLORS.textTertiary },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time: { fontSize: 11, color: COLORS.textTertiary },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  budget: { fontSize: 11, color: COLORS.success, fontWeight: '500' },
  photosChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  photosChipText: { fontSize: 11, color: COLORS.primary, fontWeight: '500' },
  appsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  apps: { fontSize: 11, color: COLORS.textTertiary },
  applyBtn: {
    marginTop: 10,
    height: 40, borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  applyText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  appliedChip: {
    marginTop: 10, height: 40, borderRadius: 10,
    backgroundColor: COLORS.successBg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  appliedChipText: { fontSize: 13, fontWeight: '600', color: COLORS.success },
});
