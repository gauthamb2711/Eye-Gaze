import { AcMode, ApplianceState, RoomId } from '../types';

export interface RoomMeta {
  id: RoomId;
  name: string;
  description: string;
}

export const ROOMS: RoomMeta[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    description: 'Main entertainment and climate zone with lighting, fan, AC, TV, curtains, and front door.',
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    description: 'Rest environment with dimmable lighting, quiet fan, climate control, curtains, and suite door.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Culinary workspace with overhead lighting, ventilation fan, climate unit, blinds, and patio door.',
  },
];

export const TV_CHANNELS = [
  { number: 1, name: 'Nature HD', program: 'Alpine Dawn Documentary' },
  { number: 2, name: 'World News', program: 'Morning Global Briefing' },
  { number: 3, name: 'Science Lab', program: 'Optics & Vision Today' },
  { number: 4, name: 'Ambient Art', program: 'Calm Geometric Motion' },
  { number: 5, name: 'Music Lounge', program: 'Acoustic Sessions Live' },
];

export const LIGHT_COLORS = [
  { name: 'Warm White', hex: '#FDE68A' },
  { name: 'Daylight', hex: '#F8FAFC' },
  { name: 'Soft Lavender', hex: '#DDD6FE' },
  { name: 'Cool Cyan', hex: '#A5F3FC' },
  { name: 'Evening Amber', hex: '#FDBA74' },
];

export function createInitialAppliances(): ApplianceState[] {
  const now = Date.now();
  return [
    // Living Room
    {
      id: 'living-light',
      roomId: 'living-room',
      type: 'light',
      name: 'Smart Light',
      isOn: true,
      brightness: 85,
      color: '#FDE68A',
      lastUpdated: now,
    },
    {
      id: 'living-fan',
      roomId: 'living-room',
      type: 'fan',
      name: 'Smart Fan',
      isOn: false,
      speed: 3,
      lastUpdated: now,
    },
    {
      id: 'living-ac',
      roomId: 'living-room',
      type: 'ac',
      name: 'Smart AC',
      isOn: true,
      temperature: 22,
      acMode: 'cool',
      lastUpdated: now,
    },
    {
      id: 'living-tv',
      roomId: 'living-room',
      type: 'tv',
      name: 'Smart TV',
      isOn: false,
      volume: 40,
      channel: 1,
      lastUpdated: now,
    },
    {
      id: 'living-door',
      roomId: 'living-room',
      type: 'door',
      name: 'Smart Door',
      isOn: false,
      isLocked: true,
      lastUpdated: now,
    },
    {
      id: 'living-curtains',
      roomId: 'living-room',
      type: 'curtains',
      name: 'Smart Curtains',
      isOn: true,
      curtainPosition: 75,
      lastUpdated: now,
    },

    // Bedroom
    {
      id: 'bedroom-light',
      roomId: 'bedroom',
      type: 'light',
      name: 'Bedroom Light',
      isOn: false,
      brightness: 60,
      color: '#DDD6FE',
      lastUpdated: now,
    },
    {
      id: 'bedroom-fan',
      roomId: 'bedroom',
      type: 'fan',
      name: 'Ceiling Fan',
      isOn: true,
      speed: 2,
      lastUpdated: now,
    },
    {
      id: 'bedroom-ac',
      roomId: 'bedroom',
      type: 'ac',
      name: 'Bedroom AC',
      isOn: true,
      temperature: 21,
      acMode: 'eco',
      lastUpdated: now,
    },
    {
      id: 'bedroom-tv',
      roomId: 'bedroom',
      type: 'tv',
      name: 'Suite Display',
      isOn: false,
      volume: 30,
      channel: 4,
      lastUpdated: now,
    },
    {
      id: 'bedroom-door',
      roomId: 'bedroom',
      type: 'door',
      name: 'Suite Door',
      isOn: false,
      isLocked: true,
      lastUpdated: now,
    },
    {
      id: 'bedroom-curtains',
      roomId: 'bedroom',
      type: 'curtains',
      name: 'Blackout Curtains',
      isOn: false,
      curtainPosition: 15,
      lastUpdated: now,
    },

    // Kitchen
    {
      id: 'kitchen-light',
      roomId: 'kitchen',
      type: 'light',
      name: 'Kitchen Pendant',
      isOn: true,
      brightness: 95,
      color: '#F8FAFC',
      lastUpdated: now,
    },
    {
      id: 'kitchen-fan',
      roomId: 'kitchen',
      type: 'fan',
      name: 'Exhaust Fan',
      isOn: false,
      speed: 4,
      lastUpdated: now,
    },
    {
      id: 'kitchen-ac',
      roomId: 'kitchen',
      type: 'ac',
      name: 'Kitchen AC',
      isOn: false,
      temperature: 23,
      acMode: 'cool',
      lastUpdated: now,
    },
    {
      id: 'kitchen-door',
      roomId: 'kitchen',
      type: 'door',
      name: 'Patio Door',
      isOn: false,
      isLocked: true,
      lastUpdated: now,
    },
    {
      id: 'kitchen-curtains',
      roomId: 'kitchen',
      type: 'curtains',
      name: 'Window Blinds',
      isOn: true,
      curtainPosition: 90,
      lastUpdated: now,
    },
  ];
}

export function getApplianceSpeechMessage(appliance: ApplianceState, actionDesc: string): string {
  if (appliance.type === 'door') {
    return appliance.isLocked ? `${appliance.name} locked.` : `${appliance.name} unlocked.`;
  }
  if (appliance.type === 'curtains') {
    return appliance.isOn
      ? `${appliance.name} opened to ${appliance.curtainPosition ?? 100} percent.`
      : `${appliance.name} closed.`;
  }
  if (actionDesc.includes('temperature')) {
    return `${appliance.name} temperature set to ${appliance.temperature} degrees.`;
  }
  if (actionDesc.includes('speed')) {
    return `${appliance.name} speed set to level ${appliance.speed}.`;
  }
  if (actionDesc.includes('mode')) {
    return `${appliance.name} mode changed to ${appliance.acMode}.`;
  }
  return `${appliance.name} ${actionDesc}.`;
}

export function nextAcMode(current?: AcMode): AcMode {
  if (current === 'cool') return 'eco';
  if (current === 'eco') return 'fan';
  return 'cool';
}
