import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, RefreshControl, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SHADOW_SM, SHADOW_HEADER } from '@/constants';
import {
  fetchNotifications,
  markAllNotificationsRead,
  AppNotification,
} from '@/services';

const formatTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(diffMs / 86400000);
  if (days === 1) return 'ayer';
  return `hace ${days}d`;
};

const getNotifConfig = (title: string): {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
} => {
  const t = title.toLowerCase();
  if (t.includes('contratado') || t.includes('aceptado'))
    return { iconName: 'checkmark-circle-outline', iconBg: '#DCFCE7', iconColor: '#16A34A' };
  if (t.includes('postulación') || t.includes('nueva postulacion') || t.includes('aplicó'))
    return { iconName: 'person-add-outline', iconBg: '#DBEAFE', iconColor: '#1D4ED8' };
  if (t.includes('completado'))
    return { iconName: 'ribbon-outline', iconBg: '#FEF9C3', iconColor: '#A16207' };
  if (t.includes('seleccionada') || t.includes('rechazado') || t.includes('no seleccionada'))
    return { iconName: 'close-circle-outline', iconBg: '#FEE2E2', iconColor: '#DC2626' };
  return { iconName: 'notifications-outline', iconBg: COLORS.borderLight, iconColor: COLORS.textSecondary };
};

function NotifSkeleton() {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={skelStyles.card}>
          <View style={skelStyles.circle} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[skelStyles.line, { width: '65%' }]} />
            <View style={[skelStyles.line, { width: '90%', height: 11 }]} />
            <View style={[skelStyles.line, { width: '28%', height: 10 }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const skelStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: COLORS.card, padding: 14, marginBottom: 2,
  },
  circle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.borderLight, flexShrink: 0,
  },
  line: {
    height: 13, borderRadius: 6,
    backgroundColor: COLORS.borderLight,
  },
});

export function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const load = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchNotifications(user.id);
    setNotifications(data);
  }, [user?.id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Marcar todas como leídas al abrir la pantalla
  useEffect(() => {
    if (!user?.id || loading) return;
    if (notifications.some(n => !n.read)) {
      markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handlePress = useCallback((notif: AppNotification) => {
    const data = notif.data ?? {};
    if (data.screen === 'JobApplications' && data.jobId) {
      navigation.navigate('JobApplications', { jobId: data.jobId, jobTitle: data.jobTitle ?? '' });
    } else if (data.screen === 'MyApplications') {
      navigation.navigate('MyApplications');
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notificaciones</Text>
          {!loading && (
            <Text style={styles.subtitle}>
              {notifications.length === 0
                ? 'Sin notificaciones aún'
                : `${notifications.length} notificación${notifications.length !== 1 ? 'es' : ''}`}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={[
          styles.content,
          !loading && notifications.length === 0 && styles.emptyFlex,
        ]}
      >
        {loading && <NotifSkeleton />}

        {!loading && notifications.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={32} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin notificaciones aún</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán las alertas sobre tus trabajos y postulaciones
            </Text>
          </View>
        )}

        {!loading && notifications.length > 0 && (
          <View style={styles.listCard}>
            {notifications.map((notif, i) => {
              const cfg = getNotifConfig(notif.title);
              const isLast = i === notifications.length - 1;
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notifRow,
                    !isLast && styles.notifRowBorder,
                    !notif.read && styles.notifRowUnread,
                  ]}
                  onPress={() => handlePress(notif)}
                  activeOpacity={notif.data?.screen ? 0.7 : 1}
                >
                  {/* Indicador de no leído */}
                  {!notif.read && <View style={styles.unreadDot} />}

                  <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
                    <Ionicons name={cfg.iconName} size={18} color={cfg.iconColor} />
                  </View>

                  <View style={styles.notifContent}>
                    <View style={styles.notifTop}>
                      <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <Text style={styles.notifTime}>{formatTime(notif.created_at)}</Text>
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                    {notif.data?.screen && (
                      <View style={styles.notifLink}>
                        <Text style={styles.notifLinkText}>Ver detalle</Text>
                        <Ionicons name="chevron-forward" size={11} color={COLORS.primary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  content: { padding: 12, paddingTop: 14 },
  emptyFlex: { flexGrow: 1 },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 48,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW_SM,
  },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 6, textAlign: 'center',
  },
  emptyText: {
    fontSize: 13, color: COLORS.textTertiary,
    textAlign: 'center', lineHeight: 19,
  },

  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
    position: 'relative',
  },
  notifRowBorder: {
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  notifRowUnread: {
    backgroundColor: '#EFF6FF',
  },
  unreadDot: {
    position: 'absolute', left: 5, top: 18,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1,
  },
  notifTitleUnread: { fontWeight: '700' },
  notifTime: { fontSize: 11, color: COLORS.textTertiary, marginLeft: 8, flexShrink: 0 },
  notifBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  notifLink: {
    flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2,
  },
  notifLinkText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
});
