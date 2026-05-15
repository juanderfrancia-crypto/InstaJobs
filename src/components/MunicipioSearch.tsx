import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchMunicipios, MunicipioItem } from '@/constants/colombiaMunicipios';
import { COLORS, SHADOW_SM, SHADOW_MD } from '@/constants';

interface Props {
  value: string;
  onChange: (municipio: string) => void;
  placeholder?: string;
  label?: string;
}

export function MunicipioSearch({ value, onChange, placeholder = 'Escribe tu municipio o ciudad...', label }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<MunicipioItem[]>([]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    setResults(searchMunicipios(text));
    setOpen(text.length >= 2);
  };

  const handleSelect = (item: MunicipioItem) => {
    onChange(item.municipio);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const startEditing = () => {
    onChange('');
    setQuery('');
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      {value ? (
        <TouchableOpacity style={styles.selected} onPress={startEditing} activeOpacity={0.8}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <View style={styles.selectedTexts}>
            <Text style={styles.selectedValue} numberOfLines={1}>{value}</Text>
            <Text style={styles.selectedHint}>Toca para cambiar</Text>
          </View>
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={16} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={handleChangeText}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setOpen(false); }}>
              <Ionicons name="close-circle" size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {open && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item, i) => (
            <TouchableOpacity
              key={`${item.municipio}-${item.departamento}-${i}`}
              style={[styles.dropItem, i < results.length - 1 && styles.dropItemBorder]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={14} color={COLORS.textTertiary} style={{ marginTop: 1 }} />
              <View style={styles.dropTexts}>
                <Text style={styles.dropMun}>{item.municipio}</Text>
                <Text style={styles.dropDep}>{item.departamento}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <View style={styles.emptyDrop}>
          <Text style={styles.emptyText}>No se encontraron resultados para "{query}"</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 99 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 12, height: 50,
    backgroundColor: COLORS.card,
    ...SHADOW_SM,
  },
  searchIcon: { marginRight: 8 },
  input: {
    flex: 1, fontSize: 15, color: COLORS.text,
  },
  selected: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: COLORS.primaryLight,
    ...SHADOW_SM,
  },
  selectedTexts: { flex: 1 },
  selectedValue: { fontSize: 15, fontWeight: '600', color: COLORS.primaryDark },
  selectedHint: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  dropdown: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', marginTop: 6, marginBottom: 8,
    ...SHADOW_MD,
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dropItemBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  dropTexts: { flex: 1 },
  dropMun: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dropDep: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },
  emptyDrop: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 16, marginTop: 6, marginBottom: 8,
    ...SHADOW_SM,
  },
  emptyText: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center' },
});
