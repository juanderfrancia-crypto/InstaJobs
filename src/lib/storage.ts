import { Alert } from 'react-native';
import { supabase } from './supabase';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

async function uploadBuffer(
  userId: string,
  uri: string,
  path: string,
): Promise<string | null> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_PHOTO_BYTES) {
    Alert.alert('Foto muy grande', 'El tamaño máximo es 8 MB. Elige una imagen más pequeña.');
    return null;
  }
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function pickAndUploadJobPhoto(userId: string): Promise<string | null> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  const { uri } = result.assets[0];
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  return uploadBuffer(userId, uri, `${userId}/jobs/photo_${Date.now()}.${ext}`);
}

export async function pickAndUploadWorkPhoto(userId: string, index: number): Promise<string | null> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  const { uri } = result.assets[0];
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  return uploadBuffer(userId, uri, `${userId}/work/photo_${index}_${Date.now()}.${ext}`);
}

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
  });

  if (result.canceled || !result.assets[0]) return null;
  const { uri } = result.assets[0];
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  return uploadBuffer(userId, uri, `${userId}/avatar.${ext}`);
}
