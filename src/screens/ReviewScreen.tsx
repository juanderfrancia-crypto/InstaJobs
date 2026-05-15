import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, SHADOW_SM, SHADOW_MD } from '@/constants';
import { Avatar } from '@/components/UI';

export function ReviewScreen({ route, navigation }: any) {
  const { jobId, jobTitle, reviewedId, reviewedName } = route.params as {
    jobId: string;
    jobTitle: string;
    reviewedId: string;
    reviewedName: string;
  };
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Selecciona una calificación', 'Toca las estrellas para calificar el trabajo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('reviews').insert({
      job_id:      jobId,
      reviewer_id: user?.id,
      reviewed_id: reviewedId,
      rating,
      comment:     comment.trim() || null,
    });
    setLoading(false);
    if (error) {
      if (error.code === '23505') {
        Alert.alert('Ya calificaste', 'Ya dejaste una reseña para este trabajo');
        navigation.goBack();
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      Alert.alert(
        'Reseña enviada',
        'Gracias por calificar. Tu opinión ayuda a otros a tomar mejores decisiones.',
        [{ text: 'Listo', onPress: () => navigation.popToTop() }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.headerRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calificar trabajador</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Quién se califica */}
        <View style={styles.workerCard}>
          <Avatar name={reviewedName} size={60} />
          <Text style={styles.workerName}>{reviewedName}</Text>
          <Text style={styles.jobLabel} numberOfLines={1}>"{jobTitle}"</Text>
        </View>

        {/* Estrellas */}
        <View style={styles.starsCard}>
          <Text style={styles.starsTitle}>¿Cómo fue el trabajo?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={42}
                  color={star <= rating ? COLORS.star ?? '#F59E0B' : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
          )}
        </View>

        {/* Comentario */}
        <View style={styles.commentCard}>
          <Text style={styles.commentTitle}>
            Comentario <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Cuéntanos cómo fue la experiencia, puntualidad, calidad del trabajo..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            value={comment}
            onChangeText={setComment}
            maxLength={400}
          />
          <Text style={styles.charCount}>{comment.length}/400</Text>
        </View>

      </ScrollView>

      {/* Botón sticky */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
          activeOpacity={0.85}
        >
          <Ionicons name="star" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {loading ? 'Enviando...' : 'Publicar reseña'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Omitir por ahora</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    ...SHADOW_SM,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text },
  scroll: { padding: 16, paddingBottom: 32 },
  workerCard: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 8, marginBottom: 14,
    borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW_SM,
  },
  workerName: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  jobLabel: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  starsCard: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 12, marginBottom: 14,
    borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW_SM,
  },
  starsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.star ?? '#F59E0B' },
  commentCard: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW_SM,
  },
  commentTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  optional: { fontWeight: '400', color: COLORS.textTertiary },
  commentInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.text, minHeight: 100, textAlignVertical: 'top',
    backgroundColor: COLORS.background,
  },
  charCount: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'right', marginTop: 6 },
  stickyBar: {
    backgroundColor: COLORS.card, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: COLORS.border, ...SHADOW_MD, shadowColor: '#000',
    gap: 8,
  },
  submitBtn: {
    height: 50, borderRadius: 14, backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...SHADOW_MD, shadowColor: COLORS.primary,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 6 },
  skipText: { fontSize: 13, color: COLORS.textTertiary },
});
