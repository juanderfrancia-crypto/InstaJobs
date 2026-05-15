import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_SM } from '@/constants';

const FAQS = [
  {
    q: '¿Cómo contacto a un trabajador?',
    a: 'Busca el trabajador en la pantalla de inicio o en "Buscar", abre su perfil y toca el botón "Contactar por WhatsApp". Se abrirá una conversación directa en WhatsApp.',
  },
  {
    q: '¿Cómo publico un trabajo?',
    a: 'Toca el botón central "+" en la barra inferior o el banner "¿Necesitas a alguien hoy?" en el inicio. Completa el formulario con el tipo de oficio, descripción y urgencia.',
  },
  {
    q: '¿Cómo activo mi disponibilidad?',
    a: 'En tu perfil encontrarás el toggle "Disponible para trabajar". Actívalo para que los clientes puedan contactarte. Desactívalo cuando estés ocupado.',
  },
  {
    q: '¿Cómo aparezco primero en las búsquedas?',
    a: 'Los trabajadores con membresía Premium aparecen primero en el inicio y en las búsquedas. La opción Premium estará disponible muy pronto.',
  },
  {
    q: '¿Cómo verifico mi cédula?',
    a: 'La verificación de identidad estará disponible en una próxima actualización. Esto aumentará la confianza de los clientes en tu perfil.',
  },
  {
    q: '¿InstaJobs cobra comisión?',
    a: 'No. InstaJobs conecta directamente a trabajadores y clientes. El pago del trabajo se acuerda y se realiza directamente entre las partes, sin intermediarios.',
  },
];

export function HelpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const openSupport = () => {
    Linking.openURL(
      'https://wa.me/573001234567?text=Hola, necesito ayuda con InstaJobs.'
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y soporte</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.supportCard} onPress={openSupport} activeOpacity={0.85}>
          <View style={styles.supportIconWrap}>
            <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
          </View>
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Soporte por WhatsApp</Text>
            <Text style={styles.supportSub}>Respondemos en menos de 24 horas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#25D366" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>

        {FAQS.map((faq, idx) => {
          const open = openIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.faqItem, open && styles.faqItemOpen]}
              onPress={() => setOpenIdx(open ? null : idx)}
              activeOpacity={0.75}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQ, open && styles.faqQOpen]}>{faq.q}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={open ? COLORS.primary : COLORS.textTertiary}
                />
              </View>
              {open && <Text style={styles.faqA}>{faq.a}</Text>}
            </TouchableOpacity>
          );
        })}

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>InstaJobs v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  supportCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#86EFAC',
    borderRadius: 16, padding: 16, marginBottom: 24,
    ...SHADOW_SM,
  },
  supportIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  supportText: { flex: 1 },
  supportTitle: { fontSize: 15, fontWeight: '700', color: '#166534' },
  supportSub: { fontSize: 12, color: '#166534', opacity: 0.75, marginTop: 2 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border,
    ...SHADOW_SM,
  },
  faqItemOpen: { borderColor: COLORS.primary },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20 },
  faqQOpen: { color: COLORS.primary },
  faqA: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginTop: 10 },
  versionRow: { alignItems: 'center', marginTop: 24 },
  versionText: { fontSize: 12, color: COLORS.textTertiary },
});
