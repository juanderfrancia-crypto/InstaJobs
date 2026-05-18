import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, StatusBar, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { pickAndUploadAvatar } from '@/lib/storage';
import { fetchWorkerAvailability, updateWorkerAvailability, updateWorkerAvatar, updateUser } from '@/services';
import { COLORS, SHADOW_MD, SHADOW_SM, SHADOW_HEADER } from '@/constants';
import { Badge } from '@/components/UI';

const PHOTO_SIZE = Math.floor(Dimensions.get('window').width / 2) - 24;
const AVATAR_COLORS = ['#FED7AA', '#BFDBFE', '#BBF7D0', '#DDD6FE', '#FDE68A'];
const AVATAR_TEXT   = ['#9A3412', '#1E40AF', '#14532D', '#5B21B6', '#92400E'];

type MenuItem = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export function ProfileScreen({ navigation }: any) {
  const { user, signOut, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [available, setAvailable] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const isWorker = user?.role === 'worker';

  useEffect(() => {
    if (!isWorker || !user) return;
    fetchWorkerAvailability(user.id).then(val => setAvailable(val));
  }, [user, isWorker]);

  const toggleAvailable = useCallback(async (val: boolean) => {
    setAvailable(val);
    await updateWorkerAvailability(user?.id ?? '', val);
  }, [user?.id]);

  const handleChangePhoto = useCallback(async () => {
    if (uploadingPhoto || !user) return;
    setUploadingPhoto(true);
    const url = await pickAndUploadAvatar(user.id);
    if (url) {
      await updateUser(user.id, { avatar_url: url });
      if (isWorker) await updateWorkerAvatar(user.id, url);
      await refreshUser();
    }
    setUploadingPhoto(false);
  }, [uploadingPhoto, user, isWorker, refreshUser]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const handlePremium = useCallback(() => {
    navigation.navigate('ComingSoon', {
      title: 'Membresía Premium',
      description: isWorker
        ? 'Aparece primero en todas las búsquedas y consigue más clientes. Disponible próximamente por $29.900/mes.'
        : 'Publicaciones destacadas sin límites. Disponible próximamente por $19.900/mes.',
      iconName: 'diamond-outline',
    });
  }, [navigation, isWorker]);

  const menuSections: MenuSection[] = [
    {
      title: 'Mi cuenta',
      items: [
        {
          iconName: 'create-outline',
          label: 'Editar perfil',
          onPress: () => navigation.navigate('EditProfile'),
          iconBg: '#DBEAFE', iconColor: '#1D4ED8',
        },
        {
          iconName: 'briefcase-outline',
          label: isWorker ? 'Mis trabajos realizados' : 'Mis publicaciones',
          onPress: () => navigation.navigate('MyActivity'),
          iconBg: '#FFF7ED', iconColor: '#FF6B00',
        },
        ...(isWorker ? [{
          iconName: 'send-outline' as keyof typeof Ionicons.glyphMap,
          label: 'Mis postulaciones',
          onPress: () => navigation.navigate('MyApplications'),
          iconBg: '#DCFCE7', iconColor: '#16A34A',
        }] : []),
        {
          iconName: 'star-outline',
          label: 'Mis calificaciones',
          onPress: () => navigation.navigate('MyRatings'),
          iconBg: '#FEF9C3', iconColor: '#A16207',
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          iconName: 'notifications-outline',
          label: 'Notificaciones',
          onPress: () => navigation.navigate('ComingSoon', {
            title: 'Notificaciones',
            description: 'Recibirás alertas en tiempo real cuando alguien aplique a tus trabajos o te contacte. Disponible en la próxima actualización.',
            iconName: 'notifications-outline',
          }),
          iconBg: '#EDE9FE', iconColor: '#7C3AED',
        },
        {
          iconName: 'shield-checkmark-outline',
          label: 'Verificar identidad',
          onPress: () => navigation.navigate('ComingSoon', {
            title: 'Verificar identidad',
            description: 'Podrás subir una foto de tu cédula para obtener el badge de identidad verificada y generar más confianza en los clientes.',
            iconName: 'shield-checkmark-outline',
          }),
          iconBg: '#ECFDF5', iconColor: '#059669',
        },
        {
          iconName: 'diamond-outline',
          label: 'Membresía Premium',
          onPress: handlePremium,
          iconBg: '#FEF3C7', iconColor: '#D97706',
          highlight: true,
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          iconName: 'help-circle-outline',
          label: 'Ayuda y soporte',
          onPress: () => navigation.navigate('Help'),
          iconBg: '#F1F5F9', iconColor: '#64748B',
        },
        {
          iconName: 'document-text-outline',
          label: 'Términos y privacidad',
          onPress: () => navigation.navigate('Terms'),
          iconBg: '#F1F5F9', iconColor: '#64748B',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>Mi perfil</Text>
          {user?.full_name ? (
            <Text style={styles.headerSub}>{user.full_name}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Foto */}
          <TouchableOpacity
            style={styles.avatarHalf}
            onPress={handleChangePhoto}
            activeOpacity={0.85}
            disabled={uploadingPhoto}
          >
            <View>
              <View style={styles.squarePhoto}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : user?.avatar_url ? (
                  <Image
                    source={{ uri: user.avatar_url }}
                    style={styles.squarePhotoImg}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={150}
                  />
                ) : (
                  <View style={[styles.squarePhotoImg, { backgroundColor: AVATAR_COLORS[0] }]}>
                    <Text style={[styles.squareInitials, { color: AVATAR_TEXT[0] }]}>
                      {(user?.full_name ?? 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              {/* Botón cámara fuera del overflow:hidden */}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerV} />

          {/* Info */}
          <View style={styles.infoHalf}>
            <Text style={styles.profileName} numberOfLines={2}>{user?.full_name}</Text>
            <View style={styles.muniRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.profileMuni} numberOfLines={1}>{user?.municipality}</Text>
            </View>
            <View style={[
              styles.roleChip,
              { backgroundColor: isWorker ? COLORS.primaryLight : '#DBEAFE' },
            ]}>
              <Ionicons
                name={isWorker ? 'hammer-outline' : 'person-outline'}
                size={12}
                color={isWorker ? COLORS.primaryDark : '#1D4ED8'}
              />
              <Text style={[styles.roleChipText, { color: isWorker ? COLORS.primaryDark : '#1D4ED8' }]}>
                {isWorker ? 'Trabajador' : 'Cliente'}
              </Text>
            </View>
            <View style={styles.badgesRow}>
              {user?.verified_phone && (
                <Badge label="Celular" variant="success" iconName="checkmark-circle" />
              )}
              {user?.verified_id
                ? <Badge label="Cédula" variant="success" iconName="checkmark-circle" />
                : <Badge label="Sin cédula" variant="warning" iconName="alert-circle" />
              }
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={13} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disponibilidad (solo trabajadores) */}
        {isWorker && (
          <View style={[styles.availCard, available && styles.availCardActive]}>
            <View style={[
              styles.availIconWrap,
              { backgroundColor: available ? COLORS.successBg : COLORS.borderLight },
            ]}>
              <Ionicons
                name={available ? 'checkmark-circle' : 'pause-circle'}
                size={22}
                color={available ? COLORS.success : COLORS.textTertiary}
              />
            </View>
            <View style={styles.availInfo}>
              <Text style={styles.availTitle}>Disponible para trabajar</Text>
              <Text style={[
                styles.availSub,
                { color: available ? COLORS.success : COLORS.textTertiary },
              ]}>
                {available ? 'Los clientes pueden contactarte' : 'Modo no disponible activo'}
              </Text>
            </View>
            <Switch
              value={available}
              onValueChange={toggleAvailable}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        )}

        {/* Premium banner */}
        <TouchableOpacity style={styles.premiumBanner} onPress={handlePremium} activeOpacity={0.85}>
          <View style={styles.premiumIconWrap}>
            <Ionicons name="diamond" size={22} color="#D97706" />
          </View>
          <View style={styles.premiumText}>
            <Text style={styles.premiumTitle}>Hazte Premium</Text>
            <Text style={styles.premiumSub}>
              {isWorker
                ? 'Aparece primero y consigue más clientes · $29.900/mes'
                : 'Publicaciones destacadas sin límites · $19.900/mes'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#D97706" />
        </TouchableOpacity>

        {/* Secciones del menú */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[
                    styles.menuItem,
                    ii < section.items.length - 1 && styles.menuItemBorder,
                    item.highlight && styles.menuItemHighlight,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.iconName} size={18} color={item.iconColor} />
                  </View>
                  <Text style={[styles.menuLabel, item.highlight && styles.menuLabelHighlight]}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Cerrar sesión */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: COLORS.danger }]}>Cerrar sesión</Text>
              <Ionicons name="chevron-forward" size={15} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>InstaJobs v1.0.0</Text>
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
    zIndex: 10,
    ...SHADOW_HEADER,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  profileCard: {
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    margin: 12,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOW_MD,
  },
  avatarHalf: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingLeft: 8,
    paddingRight: 10,
  },
  squarePhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  squarePhotoImg: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareInitials: {
    fontSize: PHOTO_SIZE * 0.32,
    fontWeight: '700',
  },
  cameraBtn: {
    position: 'absolute', bottom: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  dividerV: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 16,
  },
  infoHalf: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingLeft: 14,
    paddingRight: 12,
    gap: 6,
  },
  profileName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  muniRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  profileMuni: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20,
  },
  roleChipText: { fontSize: 11, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    marginTop: 2,
  },
  editBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  availCard: {
    backgroundColor: COLORS.card,
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
    marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    gap: 12,
    ...SHADOW_SM,
  },
  availCardActive: {
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  availIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  availInfo: { flex: 1 },
  availTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  availSub: { fontSize: 12, marginTop: 2 },

  premiumBanner: {
    marginHorizontal: 12, marginBottom: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5, borderColor: '#FDE68A',
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...SHADOW_MD,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.15,
  },
  premiumIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumText: { flex: 1 },
  premiumTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  premiumSub: { fontSize: 11, color: '#A16207', marginTop: 2, lineHeight: 16 },

  sectionWrap: { marginHorizontal: 12, marginBottom: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8, paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOW_SM,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  menuItemHighlight: { backgroundColor: '#FFFBEB' },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  menuLabelHighlight: { color: '#92400E', fontWeight: '600' },

  version: {
    fontSize: 11, color: COLORS.textTertiary,
    textAlign: 'center', paddingBottom: 8, paddingTop: 4,
  },
});
