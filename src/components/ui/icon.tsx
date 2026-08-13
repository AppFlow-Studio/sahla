import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Ban,
  BatteryFull,
  Bell,
  Book,
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarHeart,
  Camera,
  Check,
  Clapperboard,
  ClipboardCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePlus,
  CircleX,
  Clock,
  Compass,
  CloudSun,
  CloudUpload,
  CreditCard,
  Delete,
  Ellipsis,
  Eye,
  Fingerprint,
  Flag,
  Goal,
  FileText,
  Funnel,
  Globe,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  ImagePlus,
  Images,
  Info,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  MessageSquareText,
  Mic,
  Minus,
  Moon,
  Pencil,
  Phone,
  Play,
  Plus,
  Receipt,
  Repeat,
  Search,
  School,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SignalHigh,
  Search,
  Star,
  Store,
  UserPlus,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Undo2,
  User,
  Users,
  Utensils,
  Wifi,
  X,
  type LucideProps,
} from 'lucide-react-native';

/**
 * Central icon registry.
 *
 * Maps the kebab-case names that used to be passed to @expo/vector-icons
 * (Ionicons / MaterialCommunityIcons / Feather / AntDesign) onto a single,
 * consistent Lucide family so every icon in the app shares one stroke weight
 * and visual language. Call sites stay almost identical — `<Ionicons name="x">`
 * simply becomes `<Icon name="x">`.
 *
 * To add an icon: import it above and add a `name -> Component` entry below.
 *
 * NOTE: brand glyphs (Apple/Google logos, Visa/Mastercard/Amex cards) are
 * intentionally absent — Lucide ships no brand icons, so those few call sites
 * stay on @expo/vector-icons on purpose.
 */
const ICONS: Record<string, ComponentType<LucideProps>> = {
  // actions
  add: Plus,
  remove: Minus,
  'add-circle-outline': CirclePlus,
  close: X,
  search: Search,
  'close-circle': CircleX,
  check: Check,
  checkmark: Check,
  'check-circle': CircleCheck,
  'checkmark-circle': CircleCheck,
  'alert-circle': CircleAlert,
  'alert-circle-outline': CircleAlert,
  'ban-outline': Ban,
  'trash-outline': Trash2,
  'pencil-outline': Pencil,
  pencil: Pencil,
  'flag-outline': Flag,
  'shield-checkmark': ShieldCheck,
  'eye-outline': Eye,
  'arrow-undo-circle': Undo2,
  'paper-plane-outline': Send,
  send: Send,
  'ellipsis-horizontal': Ellipsis,
  'information-outline': Info,
  'cloud-upload-outline': CloudUpload,
  'image-plus': ImagePlus,

  // notifications & bookmarks
  bell: Bell,
  'bell-outline': Bell,
  notifications: Bell,
  'notifications-outline': Bell,
  bookmark: Bookmark,
  'bookmark-outline': Bookmark,
  star: Star,
  'star-outline': Star,
  'calendar-star': CalendarCheck,

  // navigation
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  'chevron-back': ChevronLeft,
  'chevron-forward': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  right: ChevronRight,

  // people
  person: User,
  'person-outline': User,
  user: User,
  account: User,
  'people-outline': Users,
  'account-group': Users,
  'account-child': Baby,

  // payments
  card: CreditCard,
  'card-outline': CreditCard,
  'receipt-outline': Receipt,

  // media & content
  'image-outline': ImageIcon,
  'images-outline': Images,
  'camera-outline': Camera,
  play: Play,
  heart: Heart,
  'heart-outline': Heart,
  'book-outline': Book,
  'book-open-variant': BookOpen,
  'book-open-page-variant': BookOpen,

  // security
  'lock-closed': Lock,
  'lock-closed-outline': Lock,

  // time & calendar
  'calendar-outline': Calendar,
  clock: Clock,
  time: Clock,
  'time-outline': Clock,

  // weather (prayer times)
  'weather-sunny': Sun,
  'white-balance-sunny': Sun,
  'weather-sunset-up': Sunrise,
  'weather-sunset-down': Sunset,
  'weather-night': Moon,
  'moon-waning-crescent': Moon,
  'weather-partly-cloudy': CloudSun,

  // contact
  phone: Phone,
  'email-outline': Mail,
  'message-text-outline': MessageSquareText,
  'message-outline': MessageSquare,

  // misc
  'megaphone-outline': Megaphone,
  bullhorn: Megaphone,
  'funnel-outline': Funnel,
  funnel: Funnel,
  storefront: Store,
  'storefront-outline': Store,
  'school-outline': School,
  school: School,
  'microphone-outline': Mic,
  'briefcase-outline': Briefcase,
  'map-marker-outline': MapPin,
  compass: Compass,
  'backspace-outline': Delete,
  food: Utensils,
  soccer: Goal,
  wifi: Wifi,
  'wifi-outline': Wifi,
  cellular: SignalHigh,
  'battery-full': BatteryFull,

  // actions cont.
  search: Search,

  // profile menu rows
  'user-plus': UserPlus,
  'shopping-bag': ShoppingBag,
  'file-text': FileText,
  'clipboard-check': ClipboardCheck,
  repeat: Repeat,
  shield: Shield,
  settings: Settings,
  clapperboard: Clapperboard,
  globe: Globe,
  'graduation-cap': GraduationCap,
  'calendar-heart': CalendarHeart,
  fingerprint: Fingerprint,
};

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName | (string & {});
  size?: number;
  color?: string;
  /** App-wide stroke weight for the soft, rounded look. Tune here to restyle every icon at once. */
  strokeWidth?: number;
  /** Lucide glyphs are outline by default; pass a color to render a filled glyph (e.g. a "liked" heart). */
  fill?: string;
  style?: LucideProps['style'];
};

export function Icon({ name, size = 24, color = '#000', strokeWidth = 2, fill = 'none', style }: IconProps) {
  const Glyph = ICONS[name];
  if (!Glyph) {
    if (__DEV__) {
      console.warn(`[Icon] no mapping for "${name}" — add it in src/components/ui/icon.tsx`);
    }
    return null;
  }
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} fill={fill} style={style} />;
}

export default Icon;
