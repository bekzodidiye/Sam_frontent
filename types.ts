
export enum Role {
  OPERATOR = 'operator',
  MANAGER = 'manager',
  DUTY_OPERATOR = 'navbatchi_operator'
}

export interface LeagueHistory {
  league: 'gold' | 'silver' | 'bronze';
  date: string; // ISO date string
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
  password?: string;
  isApproved: boolean;
  createdAt: string;
  workingHours?: string;
  photo?: string;
  inventory?: Record<string, number>;
  department?: string;
  league?: 'gold' | 'silver' | 'bronze';
  leagueHistory?: LeagueHistory[];
  achievements?: Achievement[];
  workLocation?: { lat: number; lng: number; address?: string };
  workRadius?: number;
  workType?: 'office' | 'mobile' | 'desk';
}

export interface Achievement {
  id: string;
  type: 'gold' | 'silver' | 'bronze';
  title: string;
  reason: string;
  date: string;
}

export interface CheckIn {
  userId: string;
  userName?: string;
  timestamp: string;
  location_lat: number;
  location_lng: number;
  photo: string;
  checkOutTime?: string;
  date?: string;
  workingHours?: string;
}

export interface SimSale {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  company: string;
  tariff: string;
  count: number;
  bonus: number;
  timestamp: string;
}

export interface DailyReport {
  userId: string;
  date: string;
  summary: string;
  timestamp: string;
  locationLat?: number;
  locationLng?: number;
  photos?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId?: string; // 'all' or specific userId
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Rule {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesLink {
  id: string;
  name: string;
  url: string;
  mobileUrl?: string;
  image?: string;
  createdAt: string;
}

export interface MonthlyTarget {
  month: string; // YYYY-MM
  targets: Record<string, number>; // company -> target count
  officeCounts?: Record<string, number>; // company -> office count
  mobileOfficeCounts?: Record<string, number>; // company -> mobile office count
}

export interface RatingThresholds {
  overall: { bronze: number; silver: number; gold: number };
  companies: Record<string, { bronze: number; silver: number; gold: number }>;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  checkIns: CheckIn[];
  sales: SimSale[];
  reports: DailyReport[];
  simInventory: Record<string, number>;
  messages: Message[];
  rules: Rule[];
  monthlyTargets: MonthlyTarget[];
  tariffs: Record<string, string[]>;
  ratingThresholds?: RatingThresholds;
  processedMonthsForAchievements?: string[];
  salesLinks: SalesLink[];
}
