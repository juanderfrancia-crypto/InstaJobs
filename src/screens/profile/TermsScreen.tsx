import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

const SECTIONS = [
  {
    title: '1. Descripción del servicio',
    body: 'InstaJobs es una plataforma de conexión entre trabajadores independientes y clientes en municipios de Colombia. La plataforma actúa exclusivamente como intermediario digital y no es parte de ningún acuerdo laboral o de prestación de servicios entre usuarios.',
  },
  {
    title: '2. Usuarios y cuentas',
    body: 'El acceso se verifica mediante número celular colombiano (OTP). Cada número de celular corresponde a una sola cuenta. Eres responsable de mantener la confidencialidad de tu sesión. InstaJobs se reserva el derecho de suspender cuentas que violen estos términos.',
  },
  {
    title: '3. Responsabilidad de los usuarios',
    body: 'Los trabajadores son responsables de la calidad y seguridad de los servicios que prestan. Los clientes son responsables de brindar información veraz sobre el trabajo a realizar. InstaJobs no garantiza la calidad de los servicios ni el pago por los mismos.',
  },
  {
    title: '4. Pagos y comisiones',
    body: 'InstaJobs no cobra comisión sobre los trabajos realizados. Los acuerdos de pago son directamente entre clientes y trabajadores. La membresía Premium es un servicio de visibilidad opcional y no garantiza la consecución de contratos.',
  },
  {
    title: '5. Datos personales',
    body: 'Recopilamos número de celular, nombre, municipio y datos del perfil. Esta información se usa exclusivamente para operar la plataforma. No vendemos datos a terceros. Los datos se almacenan en servidores seguros de Supabase (con certificación SOC 2).',
  },
  {
    title: '6. Comunicaciones',
    body: 'El contacto entre usuarios se realiza mediante WhatsApp. InstaJobs no almacena ni tiene acceso al contenido de esas conversaciones. Los usuarios son responsables del contenido de sus comunicaciones.',
  },
  {
    title: '7. Prohibiciones',
    body: 'Está prohibido: publicar información falsa o engañosa, usar la plataforma para actividades ilegales, acosar a otros usuarios, crear cuentas múltiples para manipular calificaciones, o hacer scraping del contenido de la plataforma.',
  },
  {
    title: '8. Modificaciones',
    body: 'InstaJobs puede modificar estos términos en cualquier momento. Los cambios serán notificados a través de la aplicación. El uso continuado de la plataforma implica la aceptación de los términos vigentes.',
  },
  {
    title: '9. Jurisdicción',
    body: 'Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se resolverá ante los tribunales competentes de la República de Colombia.',
  },
];

export function TermsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y privacidad</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Última actualización: Mayo 2026</Text>

        {SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textTertiary} />
          <Text style={styles.footerText}>
            Tus datos están protegidos y nunca serán vendidos a terceros.
          </Text>
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
  content: { padding: 20, paddingBottom: 40 },
  updated: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: COLORS.border, marginTop: 4,
  },
  footerText: { flex: 1, fontSize: 13, color: COLORS.textTertiary, lineHeight: 18 },
});
