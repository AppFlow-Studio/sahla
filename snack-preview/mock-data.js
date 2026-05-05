export const MOCK_GREETING = 'Assalamu Alaikum Di';
export const MOCK_CURRENT_TIME = '4:01 PM';
export const MOCK_HIJRI_DATE = 'Ramadan 13, 1447';

export const MOCK_NEXT_PRAYER = {
  name: 'Maghrib',
  timeRemaining: '1h 53m',
  type: 'iqamah',
};

export const MOCK_PRAYER_TIMES = [
  { name: 'Fajr', time: '5:14 AM', icon: 'weather-sunset-up', isActive: false },
  { name: 'Dhuhr', time: '5:14 AM', icon: 'white-balance-sunny', isActive: false },
  { name: 'Asr', time: '5:14 AM', icon: 'weather-sunny', isActive: false },
  { name: 'Maghrib', time: '5:14 AM', icon: 'weather-sunset-down', isActive: true },
  { name: 'Isha', time: '5:14 AM', icon: 'moon-waning-crescent', isActive: false },
];

export const MOCK_EVENTS_DATE = 'MAR 9, 2026';

export const MOCK_EVENTS = [
  { id: '1', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
  { id: '2', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
  { id: '3', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
];

export const MOCK_FEATURED = {
  badge: 'Featured',
  title: 'Weekend Islamic School',
  subtitle: 'Saturdays & Sundays \u00b7 10:00 AM \u2013 1:00 PM',
};

export const MOCK_QUICK_ACTIONS = [
  { id: 'donate', icon: 'heart', label: 'DONATE' },
  { id: 'volunteer', icon: 'account-group', label: 'VOLUNTEER' },
  { id: 'advertise', icon: 'bullhorn', label: 'ADVERTISE' },
  { id: 'prayers', icon: 'clock', label: 'PRAYERS' },
];

export const MOCK_PROGRAMS = [
  { id: 'p1', title: 'MAS SI Soccer Program', date: 'April 10 \u2022 6pm', category: 'Sports & Youth', icon: 'soccer' },
  { id: 'p2', title: 'Quranic Wisdoms', date: 'April 11 \u2022 6pm', category: 'Quran Study', icon: 'book-open-page-variant' },
  { id: 'p3', title: 'Soulful Saturdays', date: 'April 30 \u2022 6pm', category: 'Kids', icon: 'account-child' },
];

export const MOCK_RECOMMENDED = [
  { id: 'r1', title: 'Advanced Tajweed & Reading', category: 'Quran Study', icon: 'book-open-variant' },
  { id: 'r2', title: 'Young Brother Qiyam', category: 'Spirituality & Tazkiyah', icon: 'weather-night' },
];

export const MOCK_COMMUNITY_PARTNER = {
  id: 'cp1',
  name: 'Sandwich City',
  address: '1805 Forest Ave @ Richmond Ave.,\nStaten Island, NY 10303',
  icon: 'food',
};

export const MOCK_JUMMAH_DATE = 'Friday, March 22, 2026';

export const MOCK_JUMMAH_SCHEDULE = [
  {
    id: 'j1',
    title: 'Jummah 1',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat \u00b7 MA Islamic Studies, Al-Azhar',
    time: '12:15 pm',
    icon: 'weather-sunny',
    description: 'Reflections on patience and trust in Allah through trials.',
    avatar: 'https://i.pravatar.cc/200?img=68',
  },
  {
    id: 'j2',
    title: 'Jummah 2',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat \u00b7 MA Islamic Studies, Al-Azhar',
    time: '1:15 pm',
    icon: 'weather-sunset-up',
    description: 'The importance of brotherhood in the ummah.',
    avatar: 'https://i.pravatar.cc/200?img=68',
    isCurrent: true,
  },
  {
    id: 'j3',
    title: 'Jummah 3',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat \u00b7 MA Islamic Studies, Al-Azhar',
    time: '2:15 pm',
    icon: 'weather-sunset-down',
    description: 'Preparing the heart for Ramadan.',
    avatar: 'https://i.pravatar.cc/200?img=68',
  },
  {
    id: 'j4',
    title: 'Jummah 4',
    speaker: 'Sh. Tarek Allan',
    qualifications: 'Ijazah in Qiraat \u00b7 MA Islamic Studies, Al-Azhar',
    time: '3:15 pm',
    icon: 'moon-waning-crescent',
    description: 'Lessons from the prophets on perseverance and hope.',
    avatar: 'https://i.pravatar.cc/200?img=68',
  },
];
