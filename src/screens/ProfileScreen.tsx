import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { pickAndUploadAvatar } from '@/lib/storage';
import { COLORS, SHADOW_MD, SHADOW_SM } from '@/constants';
import { Avatar, Badge, Divider } from '@/components/UI';

type MenuItem = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  highlight?: boolean;
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
    supabase
      .from('worker_profiles')
      .select('available')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setAvailable(data.available); });
  }, [user, isWorker]);

  const toggleAvailable = async (val: boolean) => {
    setAvailable(val);
    await supabase.from('worker_profiles').update({ available: val }).eq('user_id', user?.id);
  };

  const handleChangePhoto = async () => {
    if (uploadingPhoto || !user) return;
    setUploadingPhoto(true);
    const url = await pickAndUploadAvatar(user.id);
    if (url) {
      await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
      if (isWorker) {
        await supabase.from('worker_profiles').update({ avatar_url: url }).eq('user_id', user.id);
      }
      await refreshUser();
    }
    setUploadingPhoto(false);
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      iconName: 'create-outline',
      label: 'Editar perfil',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      iconName: 'briefcase-outline',
      label: isWorker ? 'Mis trabajos realizados' : 'Mis publicaciones',
      onPress: () => navigation.navigate('MyActivity'),
    },
    {
      iconName: 'star-outline',
      label: 'Mis calificaciones',
      onPress: () => navigation.navigate('MyRatings'),
    },
    {
      iconName: 'notifications-outline',
      label: 'Notificaciones',
      onPress: () => navigation.navigate('ComingSoon', {
        title: 'Notificaciones',
        description: 'Recibirás alertas en tiempo real cuando alguien aplique a tus trabajos o te contacte. Disponible en la próxima actualización.',
        iconName: 'notifications-outline',
      }),
    },
    {
      iconName: 'shield-checkmark-outline',
      label: 'Verificar identidad',
      onPress: () => navigation.navigate('ComingSoon', {
        title: 'Verificar identidad',
        description: 'Podrás subir una foto de tu cédula para obtener el badge de identidad verificada y generar más confianza en los clientes.',
        iconName: 'shield-checkmark-outline',
      }),
    },
    {
      iconName: 'diamond-outline',
      label: 'Membresía Premium',
      onPress: () => navigation.navigate('ComingSoon', {
        title: 'Membresía Premium',
        description: isWorker
          ? 'Aparece primero en todas las búsquedas y consigue más clientes. Disponible próximamente por $29.900/mes.'
          : 'Publicaciones destacadas sin límites. Disponible próximamente por $19.900/mes.',
        iconName: 'diamond-outline',
      }),
      highlight: true,
    },
    {
      iconName: 'help-circle-outline',
      label: 'Ayuda y soporte',
      onPress: () => navigation.navigate('Help'),
    },
    {
      iconName: 'document-text-outline',
      label: 'Términos y privacidad',
      onPress: () => navigation.navigate('Terms'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight }}>
        <View style={styles.profileCard}>
          {uploadingPhoto ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <Avatar
              name={user?.full_name ?? 'U'}
              size={68}
              avatarUrl={user?.avatar_url}
              onPress={handleChangePhoto}
            />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name}</Text>
            <View style={styles.muniRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.profileMuni}>{user?.municipality}</Text>
            </View>
            <View style={styles.roleChip}>
              <Ionicons
                name={isWorker ? 'hammer-outline' : 'person-outline'}
                size={13}
                color={isWorker ? COLORS.primaryDark : '#1D4ED8'}
              />
              <Text style={[styles.roleChipText, { color: isWorker ? COLORS.primaryDark : '#1D4ED8' }]}>
                {isWorker ? 'Trabajador' : 'Cliente'}
              </Text>
            </View>
            <View style={styles.badgesRow}>
              {user?.verified_phone && <Badge label="Celular" variant="success" iconName="checkmark-circle" />}
              {user?.verified_id
                ? <Badge label="Cédula" variant="success" iconName="checkmark-circle" />
                : <Badge label="Verificar cédula" variant="warning" iconName="alert-circle" />
              }
            </View>
          </View>
        </View>

        {isWorker && (
          <View style={styles.availCard}>
            <View style={[styles.availIconWrap, { backgroundColor: available ? COLORS.successBg : COLORS.borderLight }]}>
              <Ionicons
                name={available ? 'checkmark-circle' : 'pause-circle'}
                size={22}
                color={available ? COLORS.success : COLORS.textTertiary}
              />
            </View>
            <View style={styles.availInfo}>
              <Text style={styles.availTitle}>Disponible para trabajar</Text>
              <Text style={styles.availSub}>
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

        <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.85}>
          <View style={styles.premiumIconWrap}>
            <Ionicons name="diamond" size={22} color="#A16207" />
          </View>
          <View style={styles.premiumText}>
            <Text style={styles.premiumTitle}>Hazte Premium</Text>
            <Text style={styles.premiumSub}>
              {isWorker
                ? 'Aparece primero y consigue más clientes · $29.900/mes'
                : 'Publicaciones destacadas sin límites · $19.900/mes'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A16207" />
        </TouchableOpacity>

        <Divider style={{ marginVertical: 4 }} />

        <View style={styles.menu}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, item.highlight && styles.menuItemHighlight]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, item.highlight && styles.menuIconWrapHighlight]}>
                <Ionicons
                  name={item.iconName}
                  size={18}
                  color={item.highlight ? COLORS.primaryDark : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.menuLabel, item.highlight && styles.menuLabelHighlight]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Divider />

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

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
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  profileCard: {
    backgroundColor: COLORS.card, flexDirection: 'row', gap: 14,
    padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    alignItems: 'center',
    ...SHADOW_SM,
  },
  avatarLoading: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  muniRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  profileMuni: { fontSize: 13, color: COLORS.textSecondary },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 8,
    backgroundColor: COLORS.primaryLight,
  },
  roleChipText: { fontSize: 12, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  availCard: {
    backgroundColor: COLORS.card, flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: 12,
  },
  availIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  availInfo: { flex: 1 },
  availTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  availSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  premiumBanner: {
    margin: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...SHADOW_SM,
  },
  premiumIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumText: { flex: 1 },
  premiumTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  premiumSub: { fontSize: 11, color: '#A16207', marginTop: 2, lineHeight: 16 },
  menu: { backgroundColor: COLORS.card, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  menuItemHighlight: { backgroundColor: COLORS.primaryLight },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconWrapHighlight: { backgroundColor: '#FED7AA' },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  menuLabelHighlight: { color: COLORS.primaryDark, fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16,
  },
  signOutText: { fontSize: 14, color: COLORS.danger, fontWeight: '600' },
  version: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', paddingBottom: 32 },
});
