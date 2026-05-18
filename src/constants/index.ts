export const COLORS = {
  // Azul Primario
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  // Naranja Acento
  accent: '#FF6B00',
  accentLight: '#FFF7ED',
  // Neutros
  white: '#FFFFFF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  // Texto — Azul Oscuro/Negro Azulado
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  // Semánticos
  success: '#15803D',
  successBg: '#DCFCE7',
  warning: '#A16207',
  warningBg: '#FEF9C3',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  whatsapp: '#25D366',
  star: '#F59E0B',
};

export const SHADOW_SM = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
};

export const SHADOW_MD = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.13,
  shadowRadius: 12,
  elevation: 8,
};

export const SHADOW_LG = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 18,
  elevation: 14,
};

export const SHADOW_PRIMARY = {
  shadowColor: '#2563EB',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 8,
};

export const SHADOW_HEADER = {
  shadowColor: '#1D4ED8',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.22,
  shadowRadius: 8,
  elevation: 10,
};

export const CATEGORIES = [
  // Construcción y mantenimiento
  { id: 'plomeria',          label: 'Plomería',             iconName: 'water-outline',        color: '#DBEAFE', textColor: '#1E40AF' },
  { id: 'electricidad',      label: 'Electricidad',          iconName: 'flash-outline',        color: '#FEF9C3', textColor: '#A16207' },
  { id: 'construccion',      label: 'Construcción',          iconName: 'hammer-outline',       color: '#FFE4E6', textColor: '#9F1239' },
  { id: 'pintura',           label: 'Pintura',               iconName: 'brush-outline',        color: '#EDE9FE', textColor: '#5B21B6' },
  { id: 'jardineria',        label: 'Jardinería',            iconName: 'leaf-outline',         color: '#DCFCE7', textColor: '#14532D' },
  { id: 'techos',            label: 'Techos',                iconName: 'layers-outline',       color: '#FFEDD5', textColor: '#9A3412' },
  { id: 'albanileria',       label: 'Albañilería',           iconName: 'build-outline',        color: '#F1F5F9', textColor: '#334155' },
  { id: 'puertas',           label: 'Puertas / Ventanas',    iconName: 'grid-outline',         color: '#FEF3C7', textColor: '#92400E' },
  { id: 'repello',           label: 'Repello',               iconName: 'construct-outline',    color: '#E0F2FE', textColor: '#075985' },
  { id: 'carpinteria',       label: 'Carpintería',           iconName: 'cut-outline',          color: '#FEF3C7', textColor: '#92400E' },
  { id: 'soldadura',         label: 'Soldadura',             iconName: 'flame-outline',        color: '#F8FAFC', textColor: '#334155' },
  // Servicios del hogar
  { id: 'aseo',              label: 'Aseo del hogar',        iconName: 'shirt-outline',        color: '#F5F3FF', textColor: '#4C1D95' },
  { id: 'electrodomesticos', label: 'Electrodomésticos',     iconName: 'snow-outline',         color: '#ECFEFF', textColor: '#155E75' },
  { id: 'cerrajeria',        label: 'Cerrajería',            iconName: 'lock-closed-outline',  color: '#F3F4F6', textColor: '#374151' },
  { id: 'fumigacion',        label: 'Fumigación',            iconName: 'bug-outline',          color: '#ECFDF5', textColor: '#064E3B' },
  // Servicios generales
  { id: 'fletes',            label: 'Mudanzas / Fletes',     iconName: 'car-outline',          color: '#FFF3E0', textColor: '#9A3412' },
  { id: 'mecanica',          label: 'Mecánica',              iconName: 'settings-outline',     color: '#F0FDF4', textColor: '#065F46' },
  { id: 'cuidado',           label: 'Cuidado de personas',   iconName: 'heart-outline',        color: '#FFF0F3', textColor: '#881337' },
  { id: 'tecnologia',        label: 'Tecnología / Sistemas', iconName: 'laptop-outline',       color: '#EFF6FF', textColor: '#1E3A8A' },
  { id: 'ayudante',          label: 'Ayudante día',          iconName: 'people-outline',       color: '#F0FDF4', textColor: '#14532D' },
];


export const URGENCY_OPTIONS = [
  { id: 'today',    label: 'Hoy',         description: 'Necesito alguien hoy', iconName: 'flash' },
  { id: 'week',     label: 'Esta semana', description: 'Esta semana',           iconName: 'calendar-outline' },
  { id: 'flexible', label: 'Flexible',   description: 'Sin prisa',             iconName: 'time-outline' },
];
