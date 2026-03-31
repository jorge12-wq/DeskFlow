import type { ComponentType } from 'react';
import {
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  Coins,
  FileText,
  Globe,
  GraduationCap,
  Handshake,
  Headphones,
  KeyRound,
  Layers3,
  Lock,
  Monitor,
  Package,
  PauseCircle,
  RefreshCw,
  Settings2,
  Shield,
  ShoppingCart,
  Target,
  Ticket,
  Trophy,
  UserRound,
  Users,
  Warehouse,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';

type IconComponent = ComponentType<{ className?: string; size?: number }>;

export interface IconOption {
  value: string;
  label: string;
  icon: IconComponent;
}

const ICONS: Record<string, IconComponent> = {
  award: Award,
  'badge-check': BadgeCheck,
  'bar-chart-3': BarChart3,
  'book-open': BookOpen,
  bot: Bot,
  building2: Building2,
  calendar: Calendar,
  'check-circle-2': CheckCircle2,
  clock3: Clock3,
  coins: Coins,
  'file-text': FileText,
  globe: Globe,
  'graduation-cap': GraduationCap,
  handshake: Handshake,
  headphones: Headphones,
  'key-round': KeyRound,
  layers3: Layers3,
  lock: Lock,
  monitor: Monitor,
  package: Package,
  'pause-circle': PauseCircle,
  'refresh-cw': RefreshCw,
  settings2: Settings2,
  shield: Shield,
  'shopping-cart': ShoppingCart,
  target: Target,
  ticket: Ticket,
  trophy: Trophy,
  'user-round': UserRound,
  users: Users,
  warehouse: Warehouse,
  workflow: Workflow,
  wrench: Wrench,
  zap: Zap,
};

const ALIASES: Record<string, string> = {
  '⚙': 'settings2',
  '⚙️': 'settings2',
  '🏢': 'building2',
  '💻': 'monitor',
  '👥': 'users',
  '👤': 'user-round',
  '🛒': 'shopping-cart',
  '🔧': 'wrench',
  '📦': 'package',
  '🏥': 'shield',
  '📚': 'book-open',
  '🎓': 'graduation-cap',
  '🔒': 'lock',
  '💰': 'coins',
  '📊': 'bar-chart-3',
  '📅': 'calendar',
  '🔄': 'refresh-cw',
  '📄': 'file-text',
  '✅': 'badge-check',
  '🔐': 'lock',
  '🔑': 'key-round',
  '⏳': 'clock3',
  '🛠': 'wrench',
  '🛠️': 'wrench',
  '📞': 'headphones',
  '🤝': 'handshake',
  '🎯': 'target',
  '⚡': 'zap',
  '🏆': 'trophy',
  '🥇': 'trophy',
  '🥈': 'award',
  '🥉': 'award',
  '🎖': 'award',
  '🎖️': 'award',
  '🌐': 'globe',
  '🎫': 'ticket',
};

export const HELPDESK_ICON_OPTIONS: IconOption[] = [
  { value: 'building2', label: 'Corporativo', icon: Building2 },
  { value: 'monitor', label: 'Tecnologia', icon: Monitor },
  { value: 'users', label: 'Personas', icon: Users },
  { value: 'shopping-cart', label: 'Compras', icon: ShoppingCart },
  { value: 'wrench', label: 'Soporte', icon: Wrench },
  { value: 'package', label: 'Logistica', icon: Package },
  { value: 'shield', label: 'Seguridad', icon: Shield },
  { value: 'book-open', label: 'Conocimiento', icon: BookOpen },
  { value: 'graduation-cap', label: 'Capacitacion', icon: GraduationCap },
  { value: 'lock', label: 'Accesos', icon: Lock },
  { value: 'coins', label: 'Finanzas', icon: Coins },
  { value: 'bar-chart-3', label: 'Analitica', icon: BarChart3 },
];

export const WAIT_REASON_ICON_OPTIONS: IconOption[] = [
  { value: 'clock3', label: 'Espera general', icon: Clock3 },
  { value: 'user-round', label: 'Cliente', icon: UserRound },
  { value: 'building2', label: 'Proveedor', icon: Building2 },
  { value: 'monitor', label: 'Equipo', icon: Monitor },
  { value: 'lock', label: 'Acceso', icon: Lock },
  { value: 'calendar', label: 'Agenda', icon: Calendar },
  { value: 'badge-check', label: 'Aprobacion', icon: BadgeCheck },
  { value: 'refresh-cw', label: 'Actualizacion', icon: RefreshCw },
  { value: 'file-text', label: 'Documentacion', icon: FileText },
  { value: 'coins', label: 'Presupuesto', icon: Coins },
  { value: 'package', label: 'Entrega', icon: Package },
  { value: 'key-round', label: 'Licencia', icon: KeyRound },
  { value: 'users', label: 'Seguimiento', icon: Users },
  { value: 'wrench', label: 'Resolucion tecnica', icon: Wrench },
  { value: 'headphones', label: 'Contacto', icon: Headphones },
  { value: 'handshake', label: 'Coordinacion', icon: Handshake },
  { value: 'target', label: 'Objetivo', icon: Target },
  { value: 'settings2', label: 'Configuracion', icon: Settings2 },
];

function normalizeToken(token?: string | null) {
  if (!token) return '';
  const raw = token.trim().toLowerCase();
  return ALIASES[token] ?? ALIASES[raw] ?? raw;
}

export function getIconComponent(token?: string | null, fallback = 'layers3') {
  const normalized = normalizeToken(token);
  return ICONS[normalized] ?? ICONS[fallback] ?? Layers3;
}

export function TokenIcon({
  token,
  fallback = 'layers3',
  className,
  size = 18,
}: {
  token?: string | null;
  fallback?: string;
  className?: string;
  size?: number;
}) {
  const Icon = getIconComponent(token, fallback);
  return <Icon className={className} size={size} />;
}
