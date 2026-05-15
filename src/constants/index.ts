export const COLORS = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FFF7ED',
  primaryBorder: '#FDBA74',
  white: '#FFFFFF',
  background: '#F5F5F3',
  card: '#FFFFFF',
  border: '#E8E8E4',
  borderLight: '#F0F0EC',
  text: '#1C1C1A',
  textSecondary: '#6B6B67',
  textTertiary: '#A8A8A4',
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
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};

export const SHADOW_MD = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.09,
  shadowRadius: 8,
  elevation: 4,
};

export const SHADOW_LG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.13,
  shadowRadius: 14,
  elevation: 7,
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
  { id: 'carpinteria',       label: 'Carpintería',           iconName: 'cut-outline',          color: '#FFF7ED', textColor: '#9A3412' },
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
