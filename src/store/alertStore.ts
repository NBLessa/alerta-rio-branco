import { Alert, User, AlertStatus, generateToken, RIO_BRANCO_BOUNDS } from '@/types/alert';

const STORAGE_KEYS = {
  USERS: 'sentinela_users',
  ALERTS: 'sentinela_alerts',
  CURRENT_USER: 'sentinela_current_user',
};

// Initialize with mock data for demo
function getInitialAlerts(): Alert[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
  if (stored) {
    return JSON.parse(stored).map((a: Alert) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
      expiresAt: new Date(a.expiresAt),
      resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
    }));
  }
  
  // Create demo alerts
  const now = new Date();
  const demoAlerts: Alert[] = [
    {
      id: 'demo-1',
      userId: 'demo-user',
      addressText: 'Av. Ceará, 1500 - Centro',
      neighborhood: 'Centro',
      lat: -9.9747,
      lng: -67.8107,
      status: 'ACTIVE',
      notes: 'Água na altura do joelho, trânsito parado',
      photos: ['https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=300&fit=crop'],
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000),
    },
    {
      id: 'demo-2',
      userId: 'demo-user',
      addressText: 'Rua Epaminondas Jácome, 234 - Bosque',
      neighborhood: 'Bosque',
      lat: -9.9680,
      lng: -67.8200,
      status: 'ACTIVE',
      notes: 'Bueiro entupido, água subindo',
      photos: ['https://images.unsplash.com/photo-1446824505046-e43605ffb17f?w=400&h=300&fit=crop'],
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 19 * 60 * 60 * 1000),
    },
    {
      id: 'demo-3',
      userId: 'demo-user',
      addressText: 'Av. Brasil, 890 - Cadeia Velha',
      neighborhood: 'Cadeia Velha',
      lat: -9.9820,
      lng: -67.8050,
      status: 'ACTIVE',
      photos: ['https://images.unsplash.com/photo-1583245177184-4ab53e5e391a?w=400&h=300&fit=crop'],
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 23 * 60 * 60 * 1000),
    },
  ];
  
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(demoAlerts));
  return demoAlerts;
}

function getUsers(): User[] {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (stored) {
    return JSON.parse(stored).map((u: User) => ({
      ...u,
      createdAt: new Date(u.createdAt),
    }));
  }
  return [];
}

function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function saveAlerts(alerts: Alert[]): void {
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
}

// Check and update expired alerts
export function updateExpiredAlerts(): void {
  const alerts = getInitialAlerts();
  const now = new Date();
  let updated = false;
  
  alerts.forEach(alert => {
    if (alert.status === 'ACTIVE' && new Date(alert.expiresAt) < now) {
      alert.status = 'EXPIRED';
      alert.updatedAt = now;
      updated = true;
    }
  });
  
  if (updated) {
    saveAlerts(alerts);
  }
}

// Get all alerts
export function getAllAlerts(): Alert[] {
  updateExpiredAlerts();
  return getInitialAlerts();
}

// Get filtered alerts
export function getFilteredAlerts(filterHours?: number, includeHistory?: boolean): Alert[] {
  const alerts = getAllAlerts();
  const now = new Date();
  
  if (includeHistory) {
    return alerts;
  }
  
  return alerts.filter(alert => {
    if (alert.status !== 'ACTIVE') return false;
    if (filterHours) {
      const alertAge = (now.getTime() - new Date(alert.createdAt).getTime()) / (1000 * 60 * 60);
      return alertAge <= filterHours;
    }
    return true;
  });
}

// Get alert by ID
export function getAlertById(id: string): Alert | undefined {
  return getAllAlerts().find(a => a.id === id);
}

// Get alerts by user token
export function getAlertsByToken(token: string): Alert[] {
  const users = getUsers();
  const user = users.find(u => u.token === token);
  if (!user) return [];
  
  return getAllAlerts().filter(a => a.userId === user.id);
}

// Create or get user
export function createOrGetUser(data: {
  fullName: string;
  phone: string;
  addressText?: string;
  lat?: number;
  lng?: number;
}): User {
  const users = getUsers();
  const existingUser = users.find(u => u.phone === data.phone);
  
  if (existingUser) {
    // Update user info
    existingUser.fullName = data.fullName;
    if (data.addressText) existingUser.defaultAddressText = data.addressText;
    if (data.lat) existingUser.defaultLat = data.lat;
    if (data.lng) existingUser.defaultLng = data.lng;
    saveUsers(users);
    return existingUser;
  }
  
  const newUser: User = {
    id: crypto.randomUUID(),
    fullName: data.fullName,
    phone: data.phone,
    defaultAddressText: data.addressText,
    defaultLat: data.lat,
    defaultLng: data.lng,
    token: generateToken(),
    createdAt: new Date(),
  };
  
  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  
  return newUser;
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) {
    const user = JSON.parse(stored);
    return { ...user, createdAt: new Date(user.createdAt) };
  }
  return null;
}

// Create new alert
export function createAlert(data: {
  userId: string;
  addressText: string;
  neighborhood?: string;
  lat: number;
  lng: number;
  notes?: string;
  photos: string[];
}): Alert {
  const alerts = getAllAlerts();
  const now = new Date();
  
  const newAlert: Alert = {
    id: crypto.randomUUID().slice(0, 8).toUpperCase(),
    userId: data.userId,
    addressText: data.addressText,
    neighborhood: data.neighborhood,
    lat: data.lat,
    lng: data.lng,
    status: 'ACTIVE',
    notes: data.notes,
    photos: data.photos,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
  };
  
  alerts.push(newAlert);
  saveAlerts(alerts);
  
  return newAlert;
}

// Update alert status
export function updateAlertStatus(alertId: string, status: AlertStatus): Alert | null {
  const alerts = getAllAlerts();
  const alert = alerts.find(a => a.id === alertId);
  
  if (!alert) return null;
  
  alert.status = status;
  alert.updatedAt = new Date();
  
  if (status === 'RESOLVED') {
    alert.resolvedAt = new Date();
  } else if (status === 'ACTIVE') {
    // Renew expiration
    alert.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  saveAlerts(alerts);
  return alert;
}

// Update alert notes
export function updateAlertNotes(alertId: string, notes: string): Alert | null {
  const alerts = getAllAlerts();
  const alert = alerts.find(a => a.id === alertId);
  
  if (!alert) return null;
  
  alert.notes = notes;
  alert.updatedAt = new Date();
  saveAlerts(alerts);
  
  return alert;
}

// Count active alerts
export function countActiveAlerts(): number {
  return getAllAlerts().filter(a => a.status === 'ACTIVE').length;
}

// Check for nearby alerts from same user
export function hasNearbyActiveAlert(userId: string, lat: number, lng: number): Alert | null {
  const alerts = getAllAlerts();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  return alerts.find(a => {
    if (a.userId !== userId || a.status !== 'ACTIVE') return false;
    if (new Date(a.createdAt) < twoHoursAgo) return false;
    
    // Check distance (approx 200m)
    const latDiff = Math.abs(a.lat - lat);
    const lngDiff = Math.abs(a.lng - lng);
    const approxMeters = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000;
    
    return approxMeters < 200;
  }) || null;
}

// Count active alerts by user
export function countActiveAlertsByUser(userId: string): number {
  return getAllAlerts().filter(a => a.userId === userId && a.status === 'ACTIVE').length;
}

// Find user by token
export function findUserByToken(token: string): User | null {
  const users = getUsers();
  return users.find(u => u.token === token) || null;
}
