'use client';

import { create } from 'zustand';

/* ============================================================
   Application-level store — navigation, mock data, UI state
   ============================================================ */

export type AppView =
  | 'landing'
  | 'invitation'
  | 'editor'
  | 'organizer'
  | 'admin'
  | 'pricing';

export type AnimationType = 'envelope' | 'curtain';

export type TemplateName = 'medina' | 'roseraie' | 'billet' | 'velours' | 'theatre';

export type RSVPStatus = 'pending' | 'confirmed' | 'declined';

export interface Guest {
  id: string;
  eventId: string;
  fullName: string;
  phone: string;
  email: string;
  accessCode: string;
  qrToken: string;
  table: string;
  maxGuests: number;
  rsvpStatus: RSVPStatus;
  plusOnes: number;
  dietaryNotes: string;
  menuChoice: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventData {
  id: string;
  name: string;
  organizerName: string;
  organizerPhone: string;
  template: TemplateName;
  primaryColor: string;
  accentColor: string;
  animationType: AnimationType;
  coverPhotoUrl: string | null;
  musicUrl: string | null;
  brideName: string | null;
  groomName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueMapUrl: string | null;
  mairieName: string | null;
  mairieAddress: string | null;
  mairieDate: string | null;
  mairieTime: string | null;
  receptionVenue: string | null;
  receptionAddress: string | null;
  receptionDate: string | null;
  receptionTime: string | null;
  dressCode: string | null;
  coupleStory: string | null;
  planType: string;
  isActive: boolean;
  isPaid: boolean;
  guests: Guest[];
}

export type PlanKey = 'essentielle' | 'prestige' | 'privilege';

export interface PricingPlan {
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  highlighted: boolean;
}

/* --- Mock event data for the demo --- */
const MOCK_EVENT: EventData = {
  id: 'evt_demo_001',
  name: 'Mariage de Amira & Karim',
  organizerName: 'Famille Diop',
  organizerPhone: '+221 77 123 45 67',
  template: 'medina',
  primaryColor: '#5C1D24',
  accentColor: '#C5A880',
  animationType: 'envelope',
  coverPhotoUrl: null,
  musicUrl: null,
  brideName: 'Amira Diop',
  groomName: 'Karim Ndiaye',
  eventDate: '2026-12-20T16:00:00.000Z',
  eventTime: '16h00',
  venueName: 'Domaine les Collines',
  venueAddress: 'Route de Ngor, Dakar, Sénégal',
  venueMapUrl: 'https://maps.google.com/?q=Domaine+les+Collines+Dakar',
  mairieName: 'Mairie de Dakar',
  mairieAddress: 'Place de l\'Indépendance, Dakar',
  mairieDate: '2026-12-20T09:00:00.000Z',
  mairieTime: '09h00',
  receptionVenue: 'Terrou-Bi Hôtel',
  receptionAddress: 'Corniche Ouest, Dakar',
  receptionDate: '2026-12-20T20:00:00.000Z',
  receptionTime: '20h00',
  dressCode: 'Tenue de cérémonie — Couleurs chaudes recommandées',
  coupleStory:
    'Amira et Karim se sont rencontrés lors d\'un festival de musique à Saint-Louis, en juin 2022. Leur connexion immédiate et leur amour commun pour la culture sénégalaise ont scellé leur destin. Après trois années de complicité et de voyages ensemble à travers l\'Afrique de l\'Ouest, Karim a demandé la main d\'Amira au coucher de soleil sur la plage de N\'Gor. Aujourd\'hui, ils célèbrent l\'union de deux familles et de deux cœurs, entourés de leurs proches les plus chers.',
  planType: 'prestige',
  isActive: true,
  isPaid: true,
  guests: [
    {
      id: 'g1',
      eventId: 'evt_demo_001',
      fullName: 'Fatou Sow',
      phone: '+221 76 111 22 33',
      email: 'fatou.sow@email.com',
      accessCode: 'AMIRA-2026-FS01',
      qrToken: 'qr_fatou_sow_001',
      table: 'Table A — Famille',
      maxGuests: 2,
      rsvpStatus: 'confirmed',
      plusOnes: 1,
      dietaryNotes: 'Végétarien',
      menuChoice: 'Poulet grillé',
      isCheckedIn: true,
      checkedInAt: '2026-12-20T15:45:00.000Z',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-11-15T14:30:00.000Z',
    },
    {
      id: 'g2',
      eventId: 'evt_demo_001',
      fullName: 'Moussa Diallo',
      phone: '+221 77 222 33 44',
      email: 'moussa.d@email.com',
      accessCode: 'AMIRA-2026-MD02',
      qrToken: 'qr_moussa_diallo_002',
      table: 'Table B — Amis',
      maxGuests: 1,
      rsvpStatus: 'confirmed',
      plusOnes: 0,
      dietaryNotes: '',
      menuChoice: 'Thieboudienne',
      isCheckedIn: false,
      checkedInAt: null,
      createdAt: '2026-09-01T10:05:00.000Z',
      updatedAt: '2026-11-20T09:00:00.000Z',
    },
    {
      id: 'g3',
      eventId: 'evt_demo_001',
      fullName: 'Aïssatou Ba',
      phone: '+221 78 333 44 55',
      email: 'aissatou.ba@email.com',
      accessCode: 'AMIRA-2026-AB03',
      qrToken: 'qr_aissatou_ba_003',
      table: 'Table A — Famille',
      maxGuests: 3,
      rsvpStatus: 'pending',
      plusOnes: 0,
      dietaryNotes: 'Allergie arachides',
      menuChoice: '',
      isCheckedIn: false,
      checkedInAt: null,
      createdAt: '2026-09-01T10:10:00.000Z',
      updatedAt: '2026-09-01T10:10:00.000Z',
    },
    {
      id: 'g4',
      eventId: 'evt_demo_001',
      fullName: 'Ibrahima Fall',
      phone: '+221 76 444 55 66',
      email: 'ibrahima.f@email.com',
      accessCode: 'AMIRA-2026-IF04',
      qrToken: 'qr_ibrahima_fall_004',
      table: 'Table C — Collègues',
      maxGuests: 2,
      rsvpStatus: 'declined',
      plusOnes: 0,
      dietaryNotes: '',
      menuChoice: '',
      isCheckedIn: false,
      checkedInAt: null,
      createdAt: '2026-09-01T10:15:00.000Z',
      updatedAt: '2026-10-05T11:00:00.000Z',
    },
    {
      id: 'g5',
      eventId: 'evt_demo_001',
      fullName: 'Mariama Sy',
      phone: '+221 77 555 66 77',
      email: 'mariama.sy@email.com',
      accessCode: 'AMIRA-2026-MS05',
      qrToken: 'qr_mariama_sy_005',
      table: 'Table B — Amis',
      maxGuests: 2,
      rsvpStatus: 'confirmed',
      plusOnes: 1,
      dietaryNotes: '',
      menuChoice: 'Poisson grillé',
      isCheckedIn: false,
      checkedInAt: null,
      createdAt: '2026-09-02T08:00:00.000Z',
      updatedAt: '2026-11-25T16:00:00.000Z',
    },
    {
      id: 'g6',
      eventId: 'evt_demo_001',
      fullName: 'Ousmane Ndiaye',
      phone: '+221 78 666 77 88',
      email: 'ousmane.n@email.com',
      accessCode: 'AMIRA-2026-ON06',
      qrToken: 'qr_ousmane_ndiaye_006',
      table: 'Table C — Collègues',
      maxGuests: 1,
      rsvpStatus: 'pending',
      plusOnes: 0,
      dietaryNotes: '',
      menuChoice: '',
      isCheckedIn: false,
      checkedInAt: null,
      createdAt: '2026-09-02T08:30:00.000Z',
      updatedAt: '2026-09-02T08:30:00.000Z',
    },
  ],
};

/* --- Pricing plans --- */
export const PRICING_PLANS: PricingPlan[] = [
  {
    key: 'essentielle',
    name: 'Essentielle',
    price: 5000,
    priceLabel: '5 000 F CFA',
    features: [
      'Invitation numérique personnalisée',
      'QR Code RSVP',
      'Pass d\'accès PDF nominatif',
      'Jusqu\'à 50 invités',
      'Support WhatsApp',
    ],
    highlighted: false,
  },
  {
    key: 'prestige',
    name: 'Prestige',
    price: 10000,
    priceLabel: '10 000 F CFA',
    features: [
      'Tout du forfait Essentielle',
      'Animations premium (enveloppe / rideau)',
      'Musique personnalisée',
      'Jusqu\'à 200 invités',
      'Scanner QR check-in Jour J',
      'Frise chronologique',
      'Support prioritaire',
    ],
    highlighted: true,
  },
  {
    key: 'privilege',
    name: 'Privilège',
    price: 15000,
    priceLabel: '15 000 F CFA',
    features: [
      'Tout du forfait Prestige',
      'Jusqu\'à 500 invités',
      'Domaine personnalisé',
      'Assistance dédiée 24/7',
      'Statistiques avancées',
    ],
    highlighted: false,
  },
];

/* --- Store interface --- */
interface AppState {
  /* Navigation */
  currentView: AppView;
  setView: (view: AppView) => void;
  previousView: AppView | null;

  /* Envelope animation state */
  envelopeOpened: boolean;
  setEnvelopeOpened: (opened: boolean) => void;

  /* Current demo event */
  event: EventData;
  setEvent: (event: Partial<EventData>) => void;

  /* Selected guest (for RSVP detail view) */
  selectedGuestId: string | null;
  setSelectedGuestId: (id: string | null) => void;

  /* RSVP modal */
  rsvpModalOpen: boolean;
  setRsvpModalOpen: (open: boolean) => void;

  /* Pass PDF modal */
  passModalOpen: boolean;
  setPassModalOpen: (open: boolean) => void;

  /* Check-in scanner modal */
  checkinScannerOpen: boolean;
  setCheckinScannerOpen: (open: boolean) => void;

  /* Audio playing */
  isAudioPlaying: boolean;
  setIsAudioPlaying: (playing: boolean) => void;

  /* Toast helper */
 toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;

  /* Update a guest's RSVP */
  updateGuestRSVP: (guestId: string, data: Partial<Guest>) => void;

  /* Check in a guest */
  checkInGuest: (guestId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  /* Navigation */
  currentView: 'landing',
  setView: (view) =>
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
    })),
  previousView: null,

  /* Envelope */
  envelopeOpened: false,
  setEnvelopeOpened: (opened) => set({ envelopeOpened: opened }),

  /* Event */
  event: MOCK_EVENT,
  setEvent: (data) =>
    set((state) => ({
      event: { ...state.event, ...data },
    })),

  /* Selected guest */
  selectedGuestId: null,
  setSelectedGuestId: (id) => set({ selectedGuestId: id }),

  /* Modals */
  rsvpModalOpen: false,
  setRsvpModalOpen: (open) => set({ rsvpModalOpen: open }),
  passModalOpen: false,
  setPassModalOpen: (open) => set({ passModalOpen: open }),
  checkinScannerOpen: false,
  setCheckinScannerOpen: (open) => set({ checkinScannerOpen: open }),

  /* Audio */
  isAudioPlaying: false,
  setIsAudioPlaying: (playing) => set({ isAudioPlaying: playing }),

  /* Toast */
  toastMessage: null,
  setToastMessage: (msg) => set({ toastMessage: msg }),

  /* Update guest RSVP */
  updateGuestRSVP: (guestId, data) =>
    set((state) => ({
      event: {
        ...state.event,
        guests: state.event.guests.map((g) =>
          g.id === guestId ? { ...g, ...data, updatedAt: new Date().toISOString() } : g
        ),
      },
    })),

  /* Check in guest */
  checkInGuest: (guestId) =>
    set((state) => ({
      event: {
        ...state.event,
        guests: state.event.guests.map((g) =>
          g.id === guestId
            ? { ...g, isCheckedIn: true, checkedInAt: new Date().toISOString() }
            : g
        ),
      },
    })),
}));
