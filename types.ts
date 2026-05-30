export enum RoomType {
  STANDARD = 'Standard',
  DELUXE = 'Deluxe',
  SUITE = 'Suite',
  PRESIDENTIAL = 'Presidential'
}

export enum ViewType {
  CITY = 'City View',
  GARDEN = 'Garden View',
  OCEAN = 'Ocean View',
  POOL = 'Pool View'
}

export enum BedType {
  TWIN = 'Twin',
  QUEEN = 'Queen',
  KING = 'King'
}

export enum RoomStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  DIRTY = 'Cleaning'
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  view: ViewType;
  bed: BedType;
  price: number;
  status: RoomStatus;
  amenities: string[];
  floor: number;
}

export interface BookingDraft {
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes: string;
  roomId?: string;
}

export interface ChatMessage {
  role: 'agent' | 'customer';
  text: string;
  timestamp: number;
  isFinal?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'system' | 'agent' | 'customer';
}

export interface CallEvaluation {
  score: number;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  bookingAccuracy: 'Perfect' | 'Good' | 'Needs Work';
}