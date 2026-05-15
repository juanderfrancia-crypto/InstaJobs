import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { COLORS, SHADOW_SM } from '@/constants';

export function OTPScreen({ navigation, route }: any) {
  const { phone } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (val: string, idx: number) => {
    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (newCode.every(d => d !== '') && newCode.join('').length === 6) {
      verify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const verify = async (otp: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: `+57${phone}`,
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Código incorrecto', 'Verifica el código e intenta de nuevo');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
    // AuthProvider detecta si es usuario nuevo y navega automáticamente
  };

  const handleResend = async () => {
    await supabase.auth.signInWithOtp({ phone: `+57${phone}` });
    Alert.alert('Código reenviado', 'Revisa tus mensajes SMS');
  };

  const isComplete = code.every(d => d !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses" size={30} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Código de verificación</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos enviado al{'\n'}
          <Text style={styles.phone}>+57 {phone}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={ref => { if (ref) inputs.current[idx] = ref; }}
              style={[styles.codeInput, digit !== '' && styles.codeInputFilled, loading && styles.codeInputLoading]}
              value={digit}
              onChangeText={val => handleChange(val.slice(-1), idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.resend} onPress={handleResend}>
          <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
          <Text style={styles.resendText}>¿No llegó el código? <Text style={styles.resendLink}>Reenviar</Text></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btn, (!isComplete || loading) && styles.btnDisabled]}
          onPress={() => verify(code.join(''))}
          disabled={!isComplete || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={styles.btnText}>Verificando...</Text>
          ) : (
            <>
              <Text style={styles.btnText}>Verificar</Text>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, paddingHorizontal: 24 },
  back: { paddingVertical: 16, alignSelf: 'flex-start' },
  content: { flex: 1, paddingTop: 8 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    ...SHADOW_SM,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 36 },
  phone: { fontWeight: '700', color: COLORS.text },
  codeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  codeInput: {
    width: 48, height: 58, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700',
    color: COLORS.text, backgroundColor: COLORS.background,
    ...SHADOW_SM,
  },
  codeInputFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  codeInputLoading: { opacity: 0.6 },
  resend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  resendText: { fontSize: 13, color: COLORS.textSecondary },
  resendLink: { color: COLORS.primary, fontWeight: '700' },
  bottom: { paddingBottom: 36 },
  btn: {
    height: 54, borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
