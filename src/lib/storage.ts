import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permiso requerido',
      'Necesitamos acceso a tu galería. Actívalo en Configuración > Aplicaciones > InstaJobs.',
    );
    return false;
  }
  return true;
}

async function uploadBase64(
  base64: string,
  path: string,
  ext: string,
): Promise<string | null> {
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  const binaryStr = atob(base64);
  if (binaryStr.length > MAX_PHOTO_BYTES) {
    Alert.alert('Foto muy grande', 'El tamaño máximo es 8 MB. Elige una imagen más pequeña.');
    return null;
  }
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: mimeType, upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  if (!(await requestMediaPermission())) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS === 'ios',
    aspect: [1, 1],
    quality: 0.75,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
  return uploadBase64(asset.base64, `${userId}/avatar.${ext}`, ext);
}

export async function pickAndUploadWorkPhoto(userId: string, index: number): Promise<string | null> {
  if (!(await requestMediaPermission())) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS === 'ios',
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
  return uploadBase64(asset.base64, `${userId}/work/photo_${index}_${Date.now()}.${ext}`, ext);
}

export async function pickAndUploadJobPhoto(userId: string): Promise<string | null> {
  if (!(await requestMediaPermission())) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS === 'ios',
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
  return uploadBase64(asset.base64, `${userId}/jobs/photo_${Date.now()}.${ext}`, ext);
}
