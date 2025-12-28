export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  defaultAddressText?: string;
  defaultLat?: number;
  defaultLng?: number;
  token: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  userId: string;
  addressText: string;
  neighborhood?: string;
  lat: number;
  lng: number;
  status: AlertStatus;
  notes?: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
}

export interface AlertMedia {
  id: string;
  alertId: string;
  photoUrl: string;
  createdAt: Date;
}

// Rio Branco, AC boundaries (approximate)
export const RIO_BRANCO_BOUNDS = {
  center: { lat: -9.9747, lng: -67.8107 },
  north: -9.85,
  south: -10.15,
  east: -67.65,
  west: -67.95,
  defaultZoom: 13,
  minZoom: 11,
  maxZoom: 18,
};

export interface FilterOption {
  id: string;
  label: string;
  hours?: number;
  includeHistory?: boolean;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'active-24h', label: 'Ativos (24h)', hours: 24 },
  { id: 'active-6h', label: 'Últimas 6h', hours: 6 },
  { id: 'history', label: 'Histórico', includeHistory: true },
];

// Generate 6-digit token
export function generateToken(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Format phone to E.164 (Brazilian)
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) {
    return `+${digits}`;
  }
  if (digits.length === 11 || digits.length === 10) {
    return `+55${digits}`;
  }
  return `+55${digits}`;
}

// Format phone for display
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const localDigits = digits.startsWith('55') ? digits.slice(2) : digits;
  
  if (localDigits.length === 11) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`;
  }
  if (localDigits.length === 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }
  return phone;
}

// Check if coordinates are within Rio Branco bounds
export function isWithinBounds(lat: number, lng: number): boolean {
  return (
    lat >= RIO_BRANCO_BOUNDS.south &&
    lat <= RIO_BRANCO_BOUNDS.north &&
    lng >= RIO_BRANCO_BOUNDS.west &&
    lng <= RIO_BRANCO_BOUNDS.east
  );
}

// Calculate time ago string
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  return `há ${diffDays} dias`;
}

// WhatsApp help message
export function getWhatsAppHelpUrl(alert: Alert, destinationNumber = '5568992288071'): string {
  const message = encodeURIComponent(
    `Sentinela: preciso de ajuda. Alagamento em ${alert.addressText}. Localização: https://maps.google.com/?q=${alert.lat},${alert.lng}. Código do alerta: ${alert.id}`
  );
  return `https://wa.me/${destinationNumber}?text=${message}`;
}
