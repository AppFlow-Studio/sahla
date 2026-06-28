export type PrayerTime = {
  name: string;
  time: string;
  icon: string;
  isActive: boolean;
};

export type EventItem = {
  id: string;
  time: string;
  title: string;
  category: string;
};

export type FeaturedProgram = {
  badge: string;
  title: string;
  subtitle: string;
};

export type QuickAction = {
  id: string;
  icon: string;
  label: string;
};

export const MOCK_GREETING = 'Assalamu Alaikum Di';

export const MOCK_CURRENT_TIME = '4:01 PM';

export const MOCK_HIJRI_DATE = 'Ramadan 13, 1447';

export const MOCK_NEXT_PRAYER = {
  name: 'Maghrib',
  timeRemaining: '1h 53m',
  type: 'iqamah' as const,
};

export const MOCK_PRAYER_TIMES: PrayerTime[] = [
  { name: 'Fajr', time: '5:02 AM', icon: 'weather-sunset-up', isActive: false },
  { name: 'Dhuhr', time: '1:05 PM', icon: 'white-balance-sunny', isActive: false },
  { name: 'Asr', time: '4:45 PM', icon: 'weather-sunny', isActive: false },
  { name: 'Maghrib', time: '7:38 PM', icon: 'weather-sunset-down', isActive: true },
  { name: 'Isha', time: '9:05 PM', icon: 'moon-waning-crescent', isActive: false },
];

export const MOCK_EVENTS_DATE = 'MAR 9, 2026';

export const MOCK_EVENTS: EventItem[] = [
  { id: '1', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
  { id: '2', time: '6:30 PM', title: 'Sisters Halaqa Circle', category: 'Education' },
  { id: '3', time: '8:00 PM', title: 'Youth Quran Night', category: 'Quran Study' },
];

export const MOCK_FEATURED: FeaturedProgram = {
  badge: 'Featured',
  title: 'Weekend Islamic School',
  subtitle: 'Saturdays & Sundays · 10:00 AM – 1:00 PM',
};

export const MOCK_QUICK_ACTIONS: QuickAction[] = [
  { id: 'donate', icon: 'heart', label: 'DONATE' },
  { id: 'volunteer', icon: 'account-group', label: 'VOLUNTEER' },
  { id: 'advertise', icon: 'bullhorn', label: 'ADVERTISE' },
  { id: 'prayers', icon: 'clock', label: 'PRAYERS' },
];

export type ProgramItem = {
  id: string;
  title: string;
  date: string;
  category: string;
  icon: string;
};

export const MOCK_PROGRAMS: ProgramItem[] = [
  { id: 'p1', title: 'MAS SI Soccer Program', date: 'April 10 • 6pm', category: 'Sports & Youth', icon: 'soccer' },
  { id: 'p2', title: 'Quranic Wisdoms', date: 'April 11 • 6pm', category: 'Quran Study', icon: 'book-open-page-variant' },
  { id: 'p3', title: 'Soulful Saturdays', date: 'April 30 • 6pm', category: 'Kids', icon: 'account-child' },
];

export type RecommendedItem = {
  id: string;
  title: string;
  category: string;
  icon: string;
};

export const MOCK_RECOMMENDED: RecommendedItem[] = [
  { id: 'r1', title: 'Advanced Tajweed & Reading', category: 'Quran Study', icon: 'book-open-variant' },
  { id: 'r2', title: 'Young Brother Qiyam', category: 'Spirituality & Tazkiyah', icon: 'weather-night' },
];

export type CommunityPartner = {
  id: string;
  name: string;
  address: string;
  icon: string;
};

export type JummahSlot = {
  id: string;
  title: string;
  speaker: string;
  qualifications: string;
  time: string;
  icon: string;
  description: string;
  avatar: string;
  isCurrent?: boolean;
};

export const MOCK_JUMMAH_DATE = 'Friday, March 22, 2026';

export const MOCK_JUMMAH_SCHEDULE: JummahSlot[] = [
  {
    id: 'j1',
    title: 'Jummah 1',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat · MA Islamic Studies, Al-Azhar',
    time: '12:15 pm',
    icon: 'weather-sunny',
    description:
      'Reflections on patience and trust in Allah through trials. A khutbah drawing lessons from Surah Al-Asr and the seerah.',
    avatar: 'https://i.pravatar.cc/200?img=68',
  },
  {
    id: 'j2',
    title: 'Jummah 2',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat · MA Islamic Studies, Al-Azhar',
    time: '1:15 pm',
    icon: 'weather-sunset-up',
    description:
      'The importance of brotherhood in the ummah — practical steps from the sunnah to strengthen our community bonds.',
    avatar: 'https://i.pravatar.cc/200?img=68',
    isCurrent: true,
  },
  {
    id: 'j3',
    title: 'Jummah 3',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat · MA Islamic Studies, Al-Azhar',
    time: '2:15 pm',
    icon: 'weather-sunset-down',
    description:
      'Preparing the heart for Ramadan — a reminder on sincere intentions and spiritual readiness.',
    avatar: 'https://i.pravatar.cc/200?img=68',
  },
  {
    id: 'j4',
    title: 'Jummah 4',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat · MA Islamic Studies, Al-Azhar',
    time: '3:15 pm',
    icon: 'moon-waning-crescent',
    description:
      'Lessons from the prophets on perseverance and hope. Closing reflections on gratitude and the remembrance of Allah.',
    avatar: 'https://i.pravatar.cc/200?img=68',
  },
];

export const MOCK_COMMUNITY_PARTNER: CommunityPartner = {
  id: 'cp1',
  name: 'Sandwich City',
  address: '1805 Forest Ave @ Richmond Ave.,\nStaten Island, NY 10303',
  icon: 'food',
};
