import { Timestamp } from 'firebase/firestore';

// User types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  country: string;
  language: string;
  photoURL?: string;
  createdAt: string;
  isEmailVerified: boolean;
  coupledWith: string | null;
  lastSeen?: Timestamp;
  settings?: UserSettings;
}

export interface UserSettings {
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface NotificationSettings {
  messages: boolean;
  calendar: boolean;
  capsules: boolean;
  dailyReminder: boolean;
  reminderTime?: string;
}

// Couple types
export interface Couple {
  id: string;
  users: string[];
  pin: string; // Hashed
  startDate: Timestamp;
  createdAt: Timestamp;
  topics: string[];
  settings?: CoupleSettings;
  stats?: CoupleStats;
  status?: string;
  leftAt?: Timestamp;
  leftBy?: string;
}

export interface CoupleSettings {
  currencySymbol: string;
  timezone: string;
  milestoneNotifications?: boolean;
  milestoneReminderDays?: number;
}

export interface CoupleStats {
  messageCount: number;
  daysTogether: number;
  currentStreak: number;
  longestStreak: number;
  lastInteraction: Timestamp;
}

// Message types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  topic: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'voice';
  mediaUrl?: string;
  read: boolean;
  reactions?: MessageReaction[];
  replyTo?: string;
  replyToMessage?: Message; // Message auquel on répond
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  voiceDuration?: number; // Durée en secondes pour les messages vocaux
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Timestamp;
}

// Journal types
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  authorId: string;
  date: Timestamp;
  media: string[];
  mood?: string;
  tags?: string[];
  location?: Location;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

// Agenda types
export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  allDay: boolean;
  location?: string;
  reminder?: ReminderType[];
  recurring?: RecurringConfig;
  type: EventType;
  color?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isMultiDay?: boolean;
  recurrenceId?: string; // Pour les instances d'événements récurrents
}

export interface RecurringConfig {
  type: RecurringType;
  interval: number; // Intervalle de récurrence (ex: tous les 2 jours)
  endDate?: Timestamp; // Date de fin de la récurrence
  count?: number; // Nombre d'occurrences
  daysOfWeek?: number[]; // Pour la récurrence hebdomadaire (0=dimanche, 1=lundi, etc.)
  dayOfMonth?: number; // Pour la récurrence mensuelle
  exceptions?: Timestamp[]; // Dates d'exception
}

export type ReminderType = '5min' | '10min' | '15min' | '30min' | '1hour' | '2hour' | '1day' | '2day' | '1week';
export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type EventType = 'general' | 'date' | 'anniversary' | 'birthday' | 'travel' | 'work' | 'medical' | 'personal' | 'important';

export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

// Types pour les dates marquantes du couple
export interface CoupleMilestone {
  id: string;
  title: string;
  description?: string;
  date: Timestamp;
  type: MilestoneType;
  isRecurring: boolean;
  notifications: boolean;
  reminderDays: number;
  color?: string;
  icon?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type MilestoneType = 
  | 'first_meeting' 
  | 'first_date' 
  | 'official_relationship' 
  | 'engagement' 
  | 'wedding'
  | 'civil_wedding'
  | 'religious_wedding'
  | 'traditional_wedding'
  | 'app_installation' 
  | 'moving_in' 
  | 'first_travel' 
  | 'pregnancy_announcement' 
  | 'child_birth' 
  | 'custom';

// Types pour la vue calendrier
export interface MarkedDate {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  textColor?: string;
  dotColor?: string;
  activeOpacity?: number;
  disabled?: boolean;
  events?: AgendaEvent[];
}

export interface AgendaItem {
  name: string;
  height: number;
  day: string;
  event: AgendaEvent;
}

// Budget types
export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Timestamp;
  paidBy: string;
  splitType: 'equal' | 'custom';
  splitDetails?: SplitDetail[];
  receipt?: string;
  createdAt: Timestamp;
}

export interface SplitDetail {
  userId: string;
  amount: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}



// Capsule types
export interface TimeCapsule {
  id: string;
  message: string;
  media?: string[];
  createdBy: string;
  createdAt: Timestamp;
  openDate: Timestamp;
  isOpen: boolean;
  openedAt?: Timestamp;
}

// Listes partagées types
export interface SharedList {
  id: string;
  title: string;
  type: 'todo' | 'shopping' | 'wishlist' | 'custom';
  items: ListItem[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  color?: string;
  icon?: string;
}

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Notes collaboratives types
export interface CollaborativeNote {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastEditedBy?: string;
  version: number;
  isLocked?: boolean;
  lockedBy?: string;
}

// Activity Log types
export type ActivityType = 
  | 'milestone_created'
  | 'milestone_updated'
  | 'milestone_deleted'
  | 'message_sent'
  | 'message_received'
  | 'agenda_event_created'
  | 'agenda_event_updated'
  | 'agenda_event_deleted'
  | 'budget_transaction_added'
  | 'budget_transaction_updated'
  | 'budget_transaction_deleted'
  | 'capsule_created'
  | 'capsule_opened'
  | 'list_created'
  | 'list_item_added'
  | 'list_item_completed'
  | 'list_item_deleted'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted'
  | 'profile_updated'
  | 'settings_changed'
  | 'couple_joined'
  | 'couple_left'
  | 'couple_dissolved'
  | 'couple_invitation_sent'
  | 'couple_invitation_accepted'
  | 'couple_invitation_rejected'
  | 'login'
  | 'logout';

export interface ActivityLog {
  id: string;
  coupleId: string;
  userId: string;
  userName: string;
  activityType: ActivityType;
  description: string;
  details?: {
    [key: string]: any;
  };
  timestamp: Timestamp;
  isRead: boolean;
  notificationSent: boolean;
}
