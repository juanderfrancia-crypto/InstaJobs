import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export async function pickAndUploadJobPhoto(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const uri = result.assets[0].uri;
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const path = `${userId}/jobs/photo_${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function pickAndUploadWorkPhoto(userId: string, index: number): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const uri = result.assets[0].uri;
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const path = `${userId}/work/photo_${index}_${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
  });

  if (result.canceled || !result.assets[0]) return null;

  const uri = result.assets[0].uri;
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
