import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { sendOtp } from '@/services';

export function PhoneScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Número inválido', 'Ingresa tu número celular de 10 dígitos');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(cleaned);
      navigation.navigate('OTP', { phone: cleaned });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const isValid = phone.replace(/\D/g, '').length >= 10;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <Image
            source={require('../../../assets/logoinsta.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Tu número celular</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un código de verificación por SMS
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.flag}>🇨🇴</Text>
              <Text style={styles.prefixText}>+57</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="310 123 4567"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>

          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.note}>Solo Colombia por ahora · Internacional próximamente</Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSend}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={styles.btnText}>Enviando...</Text>
            ) : (
              <>
                <Text style={styles.btnText}>Enviar código</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  inner: { flex: 1, paddingHorizontal: 24 },
  back: { paddingVertical: 16, alignSelf: 'flex-start' },
  logoWrap: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logo: { width: 260, height: 104 },
  content: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 32 },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  prefix: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    borderRightWidth: 1,
    borderRightColor: COLORS.primaryBorder,
  },
  flag: { fontSize: 20 },
  prefixText: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },
  input: {
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.text,
    letterSpacing: 2,
  },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  note: { fontSize: 12, color: COLORS.textTertiary },
  bottomArea: { paddingBottom: 36 },
  btn: {
    height: 54, borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
