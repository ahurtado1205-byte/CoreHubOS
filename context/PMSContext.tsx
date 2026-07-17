'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Quote, Booking, Room, CommunicationTemplate, Lead, Contact, Opportunity, Activity, Task, Property, Payment, Invoice, HousekeepingTask } from '../types';
import { Unit, UnitType, RatePlan, RateRule, DailyRate, MaintenanceBlock } from '../types/inventory';
import { mockQuotes } from '../mock/quotes';
import { mockBookings } from '../mock/bookings';
import { mockUnits, mockUnitTypes, mockRatePlans, mockRateRules, mockDailyRates, mockPromotions } from '../mock/inventory';
import { mockTemplates } from '../mock/templates';
import { mockLeads, mockContacts, mockOpportunities, mockActivities, mockTasks } from '../mock/crm';
import { mockProperties } from '../mock/properties';
import { Role, TeamMember } from '../types/team';
import { mockRoles, mockTeamMembers } from '../mock/team';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import { BOOKING_COLORS } from '../mock/config';
import { Promotion } from '../types';
import { FunnelMapping, LandingConfig, defaultFunnelMapping, defaultLandingConfig } from '../lib/funnelConfig';

interface PMSContextType {
  properties: Property[];
  currentPropertyId: string;
  setCurrentPropertyId: (id: string) => void;
  systemDate: string;
  setSystemDate: (date: string) => void;
  addProperty: (property: Partial<Property>) => Promise<Property | null>;
  updateProperty: (property: Property) => void;
  deleteProperty: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quotes: Quote[];
  bookings: Booking[];
  units: Unit[];
  unitTypes: UnitType[];
  templates: CommunicationTemplate[];
  ratePlans: RatePlan[];
  rateRules: RateRule[];
  dailyRates: DailyRate[];
  promotions: Promotion[];
  bookingSources: string[];
  leads: Lead[];
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
  tasks: Task[];
  payments: Payment[];
  invoices: Invoice[];
  maintenanceBlocks: MaintenanceBlock[];
  housekeepingTasks: HousekeepingTask[];
  dockedBookingIds: string[];
  setDockedBookingIds: (ids: string[]) => void;
  updateHousekeepingTask: (task: HousekeepingTask) => void;
  addMaintenanceBlock: (block: MaintenanceBlock) => void;
  updateMaintenanceBlock: (block: MaintenanceBlock) => void;
  deleteMaintenanceBlock: (id: string) => void;
  addQuote: (quote: any) => Promise<any>;
  updateQuote: (quote: Quote) => void;
  deleteQuote: (id: string) => void;
  addBooking: (booking: any) => Promise<any>;
  updateBooking: (booking: Booking) => void;
  deleteBooking: (id: string) => void;
  addPayment: (payment: any) => Promise<any>;
  deletePayment: (id: string) => Promise<void>;
  addInvoice: (invoice: any) => Promise<any>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  updateUnits: (units: Unit[]) => void;
  addUnit: (unit: any) => Promise<any>;
  updateUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  addUnitType: (type: any) => Promise<any>;
  updateUnitType: (type: UnitType) => Promise<void>;
  deleteUnitType: (id: string) => Promise<void>;
  addTemplate: (template: CommunicationTemplate) => void;
  updateTemplate: (template: CommunicationTemplate) => void;
  deleteTemplate: (id: string) => void;
  addRateRule: (rule: RateRule) => void;
  updateRateRule: (rule: RateRule) => void;
  deleteRateRule: (id: string) => void;
  setDailyRate: (rate: DailyRate) => void;
  addRatePlan: (plan: RatePlan) => void;
  updateRatePlan: (plan: RatePlan) => void;
  deleteRatePlan: (id: string) => void;
  addPromotion: (promo: Promotion) => void;
  updatePromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;
  addSource: (source: string) => void;
  deleteSource: (source: string) => void;
  addLead: (lead: Lead) => void;
  updateLead: (lead: Lead) => void;
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  addOpportunity: (opp: Opportunity) => void;
  updateOpportunity: (opp: Opportunity) => void;
  addActivity: (activity: Activity) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  teamMembers: TeamMember[];
  roles: Role[];
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  currentUserProfile: any | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => void;
  isInitialized: boolean;
  initializeSystem: (mode: 'demo' | 'blank' | 'demo_1' | 'demo_2' | 'demo_3', propertyName?: string) => void;
  bookingColors: Record<string, { label: string; colorClass: string }>;
  updateBookingColor: (status: string, config: { label: string; colorClass: string }) => void;
  deleteBookingColor: (status: string) => void;
  saveStatus: string;
  version: number;
  allUnits: Unit[];
  allUnitTypes: UnitType[];
  allRatePlans: RatePlan[];
  allBookings: Booking[];
  funnels: FunnelMapping;
  landings: Record<string, LandingConfig>;
  updateFunnels: (funnels: FunnelMapping) => void;
  updateLandings: (landings: Record<string, LandingConfig>) => void;
}

const PMSContext = createContext<PMSContextType | undefined>(undefined);

export function PMSProvider({ children }: { children: ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<string>('idle');
  const [version, setVersion] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(true); 
  const [currentUserProfile, setCurrentUserProfile] = useState<any | null>({
    id: 'usr_admin',
    first_name: 'Agustin',
    last_name: 'Hurtado',
    email: 'ahurtado1205@gmail.com',
    role_id: 'role_admin',
    status: 'active'
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoggingOut = useRef(false);
  const lastMutationTimeRef = useRef<number>(0);
  const isFirstMutationRef = useRef<boolean>(true);

  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [currentPropertyId, setCurrentPropertyIdInternal] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPropertyId = params.get('property_id') || params.get('p');
      if (urlPropertyId) {
        localStorage.setItem('hotelFlow_currentPropertyId', urlPropertyId);
        return urlPropertyId;
      }
      const saved = localStorage.getItem('hotelFlow_currentPropertyId');
      if (saved) return saved;
    }
    return '11111111-1111-1111-1111-111111111111';
  });

  const setCurrentPropertyId = (id: string) => {
    setCurrentPropertyIdInternal(id);
    if (currentUserProfile?.email && id && id !== 'all' && isSupabaseAvailable) {
      supabase
        .from('team_members')
        .update({ property_id: id })
        .eq('email', currentUserProfile.email)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating team member property ID in DB:', error);
          }
        });
      if (currentUserProfile.property_id !== id) {
        setCurrentUserProfile((prev: any) => prev ? { ...prev, property_id: id } : null);
      }
    }
  };
  const [systemDate, setSystemDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [units, setUnits] = useState<Unit[]>(mockUnits);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(mockUnitTypes);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(mockTemplates);
  
  const [ratePlans, setRatePlans] = useState<RatePlan[]>(mockRatePlans);
  const [rateRules, setRateRules] = useState<RateRule[]>(mockRateRules);
  const [dailyRates, setDailyRates] = useState<DailyRate[]>(mockDailyRates);
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [bookingSources, setBookingSources] = useState<string[]>(['WhatsApp', 'Email', 'Teléfono', 'Instagram', 'Booking.com', 'Web']);

  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<MaintenanceBlock[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [dockedBookingIds, setDockedBookingIds] = useState<string[]>([]);
  const [bookingColors, setBookingColors] = useState<Record<string, { label: string; colorClass: string }>>(BOOKING_COLORS);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);

  const [funnels, setFunnels] = useState<FunnelMapping>(defaultFunnelMapping);
  const [landings, setLandings] = useState<Record<string, LandingConfig>>({
    'bariloche-parejas': defaultLandingConfig
  });

  const updateFunnels = (newFunnels: FunnelMapping) => {
    setFunnels(newFunnels);
    lastMutationTimeRef.current = Date.now();
  };

  const updateLandings = (newLandings: Record<string, LandingConfig>) => {
    setLandings(newLandings);
    lastMutationTimeRef.current = Date.now();
  };

  const updateBookingColor = (status: string, config: { label: string; colorClass: string }) => {
    setBookingColors(prev => ({ ...prev, [status]: config }));
  };

  const deleteBookingColor = (status: string) => {
    setBookingColors(prev => {
      const newColors = { ...prev };
      delete newColors[status];
      return newColors;
    });
  };

  const fallbackPropertyId = properties.length > 0 ? properties[0].id : '00000000-0000-0000-0000-000000000001';
  const getActivePropertyId = () => currentPropertyId === 'all' ? fallbackPropertyId : currentPropertyId;

  const login = async (email?: string, password?: string) => {
    if (!email || !password) {
      setIsAuthenticated(true);
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    setIsAuthenticated(true);
  };

  const logout = async () => {
    isLoggingOut.current = true;
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key === 'hotelFlow_currentPropertyId') {
          localStorage.removeItem(key);
        }
      });
      // Clear demo session cookie
      document.cookie = 'hotelflow_demo_session=; path=/; max-age=0; SameSite=Lax';
    }
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUserProfile(null);
    setCurrentPropertyId('11111111-1111-1111-1111-111111111111');
    setTimeout(() => { isLoggingOut.current = false; }, 1000);
  };


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isLoggingOut.current) return;
      if (session && session.user) {
        // Set cookie so proxy/middleware knows we are authenticated
        document.cookie = 'hotelflow_demo_session=true; path=/; max-age=86400; SameSite=Lax';
        setIsAuthenticated(true);
        try {
          const { data: member, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          if (!error && member) {
            setCurrentUserProfile(member);
            if (member.property_id) {
              setCurrentPropertyId(member.property_id);
            }
          }
        } catch (err) {
          console.error('Error fetching team member:', err);
        }
      } else {
        // Clear cookie if no session
        document.cookie = 'hotelflow_demo_session=; path=/; max-age=0; SameSite=Lax';
        setIsAuthenticated(false);
        setCurrentUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPropertyId = params.get('property_id') || params.get('p');
      if (urlPropertyId) {
        if (urlPropertyId !== currentPropertyId) {
          setCurrentPropertyId(urlPropertyId);
        }
        localStorage.setItem('hotelFlow_currentPropertyId', urlPropertyId);
      } else {
        const saved = localStorage.getItem('hotelFlow_currentPropertyId');
        if (saved && saved !== currentPropertyId) {
          setCurrentPropertyId(saved);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentPropertyId) {
      localStorage.setItem('hotelFlow_currentPropertyId', currentPropertyId);
    }
  }, [currentPropertyId]);

  useEffect(() => {
    let mounted = true;
    async function fetchInitialData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        let url = currentPropertyId ? `/api/db?property_id=${currentPropertyId}&t=${Date.now()}` : `/api/db?t=${Date.now()}`;
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.includes('/precheckin/')) {
            const parts = path.split('/');
            const preId = parts[parts.length - 1];
            if (preId) {
              url += (url.includes('?') ? '&' : '?') + `precheckinId=${encodeURIComponent(preId)}`;
            }
          }
        }
        const res = await fetch(url, { headers });
        const dbData = await res.json();

        if (!mounted) return;

        if (dbData && Object.keys(dbData).length > 0) {
          if (dbData.version !== undefined) setVersion(dbData.version);
          if (dbData.properties) setProperties(dbData.properties);
          if (dbData.quotes) setQuotes(dbData.quotes);
          if (dbData.bookings) setBookings(dbData.bookings);
          if (dbData.units) setUnits(dbData.units);
          if (dbData.unitTypes) setUnitTypes(dbData.unitTypes);
          if (dbData.ratePlans) setRatePlans(dbData.ratePlans);
          if (dbData.rateRules) setRateRules(dbData.rateRules);
          if (dbData.dailyRates) setDailyRates(dbData.dailyRates);
          if (dbData.promotions && dbData.promotions.length > 0) {
            setPromotions(dbData.promotions);
          } else {
            setPromotions(mockPromotions);
          }
          if (dbData.leads) setLeads(dbData.leads);
          if (dbData.contacts) setContacts(dbData.contacts);
          if (dbData.opportunities) setOpportunities(dbData.opportunities);
          if (dbData.activities) setActivities(dbData.activities);
          if (dbData.tasks) setTasks(dbData.tasks);
          if (dbData.payments) setPayments(dbData.payments);
          if (dbData.invoices) setInvoices(dbData.invoices);
          if (dbData.maintenanceBlocks) setMaintenanceBlocks(dbData.maintenanceBlocks);
          if (dbData.housekeepingTasks) setHousekeepingTasks(dbData.housekeepingTasks);
          if (dbData.templates) setTemplates(dbData.templates);
          if (dbData.roles) setRoles(dbData.roles);
          if (dbData.teamMembers) setTeamMembers(dbData.teamMembers);
          if (dbData.bookingColors) setBookingColors(dbData.bookingColors);
          if (dbData.currentPropertyId) setCurrentPropertyId(dbData.currentPropertyId);
          if (dbData.systemDate) setSystemDate(dbData.systemDate);
          setFunnels(dbData.funnels || defaultFunnelMapping);
          setLandings(dbData.landings || { [defaultLandingConfig.slug]: defaultLandingConfig });
        }
        setIsInitialized(true);
      } catch (e) {
        console.error('Error fetching local DB:', e);
        setIsInitialized(true);
      }
    }
    fetchInitialData();

    const handleFocus = () => {
      if (Date.now() - lastMutationTimeRef.current > 4000) {
        fetchInitialData();
      }
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      if (!document.hidden && Date.now() - lastMutationTimeRef.current > 4000) {
        fetchInitialData();
      }
    }, 3000);

    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [currentPropertyId]);

  const initializeSystem = (mode: 'demo' | 'blank' | 'demo_1' | 'demo_2' | 'demo_3', propertyName?: string) => {
    let nextProperties: Property[] = [];
    let nextQuotes: Quote[] = [];
    let nextBookings: Booking[] = [];
    let nextUnits: Unit[] = [];
    let nextUnitTypes: UnitType[] = [];
    let nextRatePlans: RatePlan[] = [];
    let nextRateRules: any[] = [];
    let nextDailyRates: DailyRate[] = [];
    let nextPromotions: Promotion[] = [];
    let nextLeads: Lead[] = [];
    let nextContacts: Contact[] = [];
    let nextOpportunities: Opportunity[] = [];
    let nextActivities: Activity[] = [];
    let nextTasks: Task[] = [];
    let nextRoles: Role[] = [];
    let nextTeamMembers: TeamMember[] = [];
    let nextPropertyId = 'all';

    const propId = '11111111-1111-1111-1111-111111111111';

    if (mode === 'demo') {
      nextProperties = mockProperties;
      nextQuotes = mockQuotes;
      nextBookings = mockBookings;
      nextUnits = mockUnits;
      nextUnitTypes = mockUnitTypes;
      nextRatePlans = mockRatePlans;
      nextRateRules = mockRateRules;
      nextDailyRates = mockDailyRates;
      nextPromotions = mockPromotions;
      nextLeads = mockLeads;
      nextContacts = mockContacts;
      nextOpportunities = mockOpportunities;
      nextActivities = mockActivities;
      nextTasks = mockTasks;
      nextRoles = mockRoles;
      nextTeamMembers = mockTeamMembers;
      nextPropertyId = propId;
      localStorage.removeItem('hotelFlow_funnels');
      localStorage.removeItem('hotelFlow_landings');
    } else if (mode.startsWith('demo_')) {
      let propName = '';
      if (mode === 'demo_1') {
        propName = 'Empresa 1 (Cabañas)';
        nextUnitTypes = [{ id: '55555555-5555-5555-5555-555555555551', property_id: propId, name: 'Cabaña 4 Pax', description: 'Cabaña espaciosa para 4 personas', max_pax: 4, base_price: 100, amenities: [] }];
        nextUnits = Array.from({length: 5}).map((_, i) => ({ id: `u_${i+1}`, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551', name: `Cabaña ${i+1}`, status: 'active' as const, housekeeping_status: 'clean' as const }));
        nextRateRules = [{ id: 'rr_d1_1', rate_plan_id: 'rp_1', unit_type_id: '55555555-5555-5555-5555-555555555551', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 100, min_nights: 1 }];
        nextBookings = mockBookings.map((b, idx) => ({ ...b, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551', room_id: `u_${(idx % 5) + 1}` }));
        nextQuotes = mockQuotes.map(q => ({ ...q, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551' }));
      } else if (mode === 'demo_2') {
        propName = 'Empresa 2 (Mixto)';
        nextUnitTypes = [
          { id: '55555555-5555-5555-5555-555555555551', property_id: propId, name: 'Depto 2 Pax', description: 'Departamento cómodo para parejas', max_pax: 2, base_price: 60, amenities: [] },
          { id: '55555555-5555-5555-5555-555555555552', property_id: propId, name: 'Casa 4 Pax', description: 'Casa ideal para familias chicas', max_pax: 4, base_price: 120, amenities: [] },
          { id: '55555555-5555-5555-5555-555555555553', property_id: propId, name: 'Casa 10 Pax', description: 'Casa grande para grupos', max_pax: 10, base_price: 250, amenities: [] }
        ];
        let unitCounter = 1;
        nextUnits = [
          ...Array.from({length: 5}).map((_, i) => ({ id: `u_${unitCounter++}`, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551', name: `Depto ${i+1}`, status: 'active' as const, housekeeping_status: 'clean' as const })),
          ...Array.from({length: 2}).map((_, i) => ({ id: `u_${unitCounter++}`, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555552', name: `Casa ${i+1} (4pax)`, status: 'active' as const, housekeeping_status: 'clean' as const })),
          { id: `u_${unitCounter++}`, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555553', name: `Casa Grande (10pax)`, status: 'active' as const, housekeeping_status: 'clean' as const }
        ];
        nextRateRules = [
          { id: 'rr_d2_1', rate_plan_id: 'rp_1', unit_type_id: '55555555-5555-5555-5555-555555555551', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 60, min_nights: 1 },
          { id: 'rr_d2_2', rate_plan_id: 'rp_1', unit_type_id: '55555555-5555-5555-5555-555555555552', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 120, min_nights: 1 },
          { id: 'rr_d2_3', rate_plan_id: 'rp_1', unit_type_id: '55555555-5555-5555-5555-555555555553', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 250, min_nights: 1 }
        ];
        nextBookings = mockBookings.map((b, idx) => {
          const roomIndex = (idx % 8) + 1;
          let typeId = '55555555-5555-5555-5555-555555555551';
          if (roomIndex === 6 || roomIndex === 7) typeId = '55555555-5555-5555-5555-555555555552';
          if (roomIndex === 8) typeId = '55555555-5555-5555-5555-555555555553';
          return { ...b, property_id: propId, unit_type_id: typeId, room_id: `u_${roomIndex}` };
        });
        nextQuotes = mockQuotes.map((q, idx) => {
          const typeIndex = (idx % 3) + 1;
          return { ...q, property_id: propId, unit_type_id: `55555555-5555-5555-5555-55555555555${typeIndex}` };
        });
      } else if (mode === 'demo_3') {
        propName = 'Empresa 3 (Complejo)';
        nextUnitTypes = [{ id: '55555555-5555-5555-5555-555555555551', property_id: propId, name: 'Hab. con Kitchinet', description: 'Habitación equipada con kitchinet', max_pax: 2, base_price: 80, amenities: [] }];
        nextUnits = Array.from({length: 30}).map((_, i) => ({ id: `u_${i+1}`, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551', name: `Habitación ${i+1}`, status: 'active' as const, housekeeping_status: 'clean' as const }));
        nextRateRules = [{ id: 'rr_d3_1', rate_plan_id: 'rp_1', unit_type_id: '55555555-5555-5555-5555-555555555551', season_name: 'Tarifa General', start_date: '2026-01-01', end_date: '2026-12-31', price: 80, min_nights: 1 }];
        nextBookings = mockBookings.map((b, idx) => ({ ...b, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551', room_id: `u_${(idx % 30) + 1}` }));
        nextQuotes = mockQuotes.map(q => ({ ...q, property_id: propId, unit_type_id: '55555555-5555-5555-5555-555555555551' }));
      }
      nextProperties = [{ id: propId, name: propName }];
      nextRatePlans = mockRatePlans;
      nextDailyRates = mockDailyRates;
      nextPromotions = mockPromotions;
      nextLeads = mockLeads;
      nextContacts = mockContacts;
      nextOpportunities = mockOpportunities;
      nextActivities = mockActivities;
      nextTasks = mockTasks;
      nextRoles = mockRoles;
      nextTeamMembers = mockTeamMembers;
      nextPropertyId = propId;
      localStorage.removeItem('hotelFlow_funnels');
      localStorage.removeItem('hotelFlow_landings');
    } else {
      const newPropertyId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      nextProperties = propertyName ? [{ id: newPropertyId, name: propertyName }] : [];
      nextPropertyId = propertyName ? newPropertyId : 'all';
      const defaultRole = { id: 'role_admin', name: 'Administrador (Por defecto)', description: 'Acceso total al sistema', permissions: ['all'] };
      nextRoles = [defaultRole];
      nextTeamMembers = [{ id: 'usr_admin', first_name: 'Admin', last_name: 'Principal', email: 'admin@hotel.com', role_id: 'role_admin', status: 'active' }];
      localStorage.removeItem('hotelFlow_funnels');
      localStorage.removeItem('hotelFlow_landings');
    }
    
    setProperties(nextProperties);
    setQuotes(nextQuotes);
    setBookings(nextBookings);
    setUnits(nextUnits);
    setUnitTypes(nextUnitTypes);
    setRatePlans(nextRatePlans);
    setRateRules(nextRateRules);
    setDailyRates(nextDailyRates);
    setPromotions(nextPromotions);
    setLeads(nextLeads);
    setContacts(nextContacts);
    setOpportunities(nextOpportunities);
    setActivities(nextActivities);
    setTasks(nextTasks);
    setMaintenanceBlocks([]);
    setRoles(nextRoles);
    setTeamMembers(nextTeamMembers);
    setCurrentPropertyId(nextPropertyId);

    const fullState = {
      properties: nextProperties, quotes: nextQuotes, bookings: nextBookings, units: nextUnits, unitTypes: nextUnitTypes,
      ratePlans: nextRatePlans, rateRules: nextRateRules, dailyRates: nextDailyRates, promotions: nextPromotions,
      leads: nextLeads, contacts: nextContacts, opportunities: nextOpportunities, activities: nextActivities,
      tasks: nextTasks, payments: [], invoices: [], maintenanceBlocks: [], housekeepingTasks: [],
      templates: mockTemplates, roles: nextRoles, teamMembers: nextTeamMembers, bookingColors: BOOKING_COLORS,
      currentPropertyId: nextPropertyId, systemDate: new Date().toISOString().split('T')[0]
    };

    setIsInitialized(true);
    lastMutationTimeRef.current = Date.now();
    const url = nextPropertyId ? `/api/db?property_id=${nextPropertyId}` : '/api/db';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullState)
    })
    .then(() => { if (typeof window !== 'undefined') window.location.reload(); })
    .catch(() => { if (typeof window !== 'undefined') window.location.reload(); });
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setQuotes(prevQuotes => {
        let changed = false;
        const now = new Date();
        const updatedQuotes = prevQuotes.map(q => {
          if (q.status !== 'booked' && q.status !== 'lost' && q.status !== 'expired') {
            const expDate = q.expiration_date ? new Date(q.expiration_date) : null;
            if (expDate && expDate < now) {
              changed = true;
              const autoTimelineEvent = {
                id: `evt_${Date.now()}_${Math.random()}`,
                type: 'whatsapp' as const,
                date: new Date().toISOString(),
                agent: 'CoreHub Bot',
                description: `Che ${q.first_name}, se nos venció el presupuesto N° ${q.id} y liberamos la unidad. Si todavía te dan ganas de venir, avisame y veo si te puedo recuperar el precio.`
              };
              return { ...q, status: 'expired', timeline: [...(q.timeline || []), autoTimelineEvent] } as Quote;
            }
          }
          return q;
        });
        return changed ? updatedQuotes : prevQuotes;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerImmediateSave = async (nextQuotes: Quote[], nextBookings: Booking[], nextActivities?: Activity[], nextFunnels?: FunnelMapping, nextLandings?: Record<string, LandingConfig>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const fullState = {
        properties, quotes: nextQuotes, bookings: nextBookings, units, unitTypes, ratePlans, rateRules, dailyRates, promotions,
        leads, contacts, opportunities, activities: nextActivities || activities, tasks, payments, invoices, maintenanceBlocks,
        housekeepingTasks, templates, roles, teamMembers, bookingColors, currentPropertyId, systemDate,
        funnels: nextFunnels || funnels, landings: nextLandings || landings,
        version
      };
      const url = currentPropertyId ? `/api/db?property_id=${currentPropertyId}` : '/api/db';
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullState)
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.version !== undefined) {
          setVersion(resData.version);
        }
        lastMutationTimeRef.current = Date.now();
      }
    } catch (e) {
      console.error('Immediate save failed:', e);
    }
  };

  const logSystemAction = (type: 'reserva' | 'rate_change' | 'other', description: string, propertyId?: string): Activity[] => {
    const newAct = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      property_id: propertyId || getActivePropertyId() || 'all',
      type,
      date: new Date().toISOString(),
      result: 'completed' as const,
      description,
      agent_id: 'AH'
    };
    const nextActs = [newAct, ...activities];
    setActivities(nextActs);
    return nextActs;
  };

  const addQuote = async (quote: any) => {
    const { id, timeline, extra_beds, ...payload } = quote;
    if (payload.follow_up_date === '') payload.follow_up_date = null;
    if (payload.expiration_date === '') payload.expiration_date = null;
    if (extra_beds !== undefined) {
      payload.options = payload.options || [{ currency: 'USD' }];
      payload.options[0] = { ...payload.options[0], extra_beds };
    }
    const targetPropertyId = payload.property_id || getActivePropertyId();
    const newQuote = { 
      ...payload, 
      id: quote.id || `q_${Date.now()}`, 
      property_id: targetPropertyId, 
      created_at: quote.created_at || new Date().toISOString(),
      updated_at: quote.updated_at || new Date().toISOString()
    };
    const nextQuotes = [newQuote, ...quotes];
    setQuotes(nextQuotes);
    const nextActs = logSystemAction('other', `Nueva cotización CRM creada para ${newQuote.first_name} ${newQuote.last_name}`, targetPropertyId);
    await triggerImmediateSave(nextQuotes, bookings, nextActs);
    return newQuote;
  };
  
  const updateQuote = async (quote: any) => {
    const { timeline, ...payload } = quote;
    if (payload.follow_up_date === '') payload.follow_up_date = null;
    if (payload.expiration_date === '') payload.expiration_date = null;
    const targetPropertyId = getActivePropertyId();
    const updatedQuote = { ...quote, ...payload, updated_at: new Date().toISOString() };
    setQuotes(prev => prev.map(q => q.id === quote.id ? updatedQuote : q));
    logSystemAction('other', `Cotización CRM de ${quote.first_name} ${quote.last_name} modificada`, targetPropertyId);
  };

  const addBooking = async (booking: any) => {
    const { id, extra_beds, ...payload } = booking;
    if (payload.follow_up_date === '') payload.follow_up_date = null;
    if (payload.dob === '') payload.dob = null;
    if (payload.room_id === '') payload.room_id = null;
    if (payload.unit_type_id === '') payload.unit_type_id = null;
    if (payload.quote_id === '') payload.quote_id = null;

    if (payload.room_id) {
      const overlapping = bookings.some(b => b.room_id === payload.room_id && b.booking_status !== 'cancelled' && payload.check_in < b.check_out && payload.check_out > b.check_in);
      if (overlapping) {
        alert("🚨 OVERBOOKING PREVENIDO: La habitación seleccionada ya está ocupada.");
        return null;
      }
    }
    const targetPropertyId = payload.property_id || getActivePropertyId();
    const newBooking = { 
      ...payload, 
      id: booking.id || `b_${Date.now()}`, 
      property_id: targetPropertyId, 
      created_at: booking.created_at || new Date().toISOString(),
      updated_at: booking.updated_at || new Date().toISOString()
    };
    const nextBookings = [newBooking, ...bookings];
    setBookings(nextBookings);
    
    let nextQuotes = quotes;
    if (payload.quote_id) {
      nextQuotes = quotes.map(q => q.id === payload.quote_id ? { ...q, status: 'booked' } : q);
      setQuotes(nextQuotes);
    }
    
    const nextActs = logSystemAction('reserva', `Nueva reserva creada para ${newBooking.first_name} ${newBooking.last_name} (${newBooking.confirmation_id || newBooking.id})`, targetPropertyId);
    await triggerImmediateSave(nextQuotes, nextBookings, nextActs);
    return newBooking;
  };
  
  const updateBooking = async (booking: any) => {
    const { extra_beds, ...payload } = booking;
    if (payload.follow_up_date === '') payload.follow_up_date = null;
    if (payload.dob === '') payload.dob = null;
    if (payload.room_id === '') payload.room_id = null;
    if (payload.unit_type_id === '') payload.unit_type_id = null;
    if (payload.quote_id === '') payload.quote_id = null;

    if (payload.room_id) {
      const overlapping = bookings.some(b => b.id !== booking.id && b.room_id === payload.room_id && b.booking_status !== 'cancelled' && payload.check_in < b.check_out && payload.check_out > b.check_in);
      if (overlapping) {
        alert("🚨 OVERBOOKING PREVENIDO: La habitación seleccionada ya está ocupada.");
        return;
      }
    }
    const targetPropertyId = payload.property_id || getActivePropertyId();
    const updatedBooking = { ...booking, ...payload, updated_at: new Date().toISOString() };
    const nextBookings = bookings.map(b => b.id === booking.id ? updatedBooking : b);
    setBookings(nextBookings);
    const nextActs = logSystemAction('reserva', `Reserva de ${booking.first_name} ${booking.last_name} editada (Estado: ${booking.booking_status})`, targetPropertyId);
    // Immediate save to prevent data loss if tab is closed before debounce fires
    await triggerImmediateSave(quotes, nextBookings, nextActs);
  };


  const updateProperty = async (property: Property) => {
    lastMutationTimeRef.current = Date.now();
    setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    logSystemAction('other', `Configuración de Propiedad "${property.name}" modificada`);
  };

  const deleteProperty = async (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    if (currentPropertyId === id) setCurrentPropertyId('all');
    logSystemAction('other', `Propiedad con ID ${id} eliminada`);
  };

  const deleteBooking = async (id: string) => {
    lastMutationTimeRef.current = Date.now();
    const bookingToDelete = bookings.find(b => b.id === id);
    const associatedQuoteId = bookingToDelete?.quote_id;
    setBookings(prev => prev.filter(b => b.id !== id));
    if (associatedQuoteId) setQuotes(prev => prev.filter(q => q.id !== associatedQuoteId));
    logSystemAction('reserva', `Reserva con ID ${id} de ${bookingToDelete?.first_name || 'Huésped'} ${bookingToDelete?.last_name || ''} eliminada`);
  };

  const deleteQuote = async (id: string) => {
    lastMutationTimeRef.current = Date.now();
    setQuotes(prev => prev.filter(q => q.id !== id));
    logSystemAction('other', `Cotización CRM con ID ${id} eliminada`);
  };

  const deleteContact = async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };
  
  const addPayment = async (payment: any) => {
    const { id, ...payload } = payment;
    const mockPay = { id: `pay_${Date.now()}`, ...payload, property_id: payload.property_id || getActivePropertyId() };
    setPayments(prev => [...prev, mockPay]);
    logSystemAction('other', `Pago registrado: $${payload.amount} USD via ${payload.method} para la reserva ${payload.booking_id}`);
    return mockPay;
  };

  const deletePayment = async (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    logSystemAction('other', `Pago con ID ${id} eliminado del sistema`);
  };

  const addInvoice = async (invoice: any) => {
    const { id, ...payload } = invoice;
    const mockInv = { id: `inv_${Date.now()}`, ...payload, property_id: payload.property_id || getActivePropertyId() };
    setInvoices(prev => [...prev, mockInv]);
    logSystemAction('other', `Factura creada: ${payload.number || mockInv.id} por $${payload.total || 0} USD`);
    return mockInv;
  };

  const updateInvoice = async (invoice: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
    logSystemAction('other', `Factura con ID ${invoice.id} modificada (Estado: ${invoice.status})`);
  };
  
  const updateUnits = (newUnits: Unit[]) => {
    setUnits(newUnits);
    logSystemAction('other', `Inventario de unidades físicas reordenado/actualizado`);
  };
  
  const addUnit = async (unit: any) => {
    const { id, ...payload } = unit;
    const mockU = { id: `u_${Date.now()}`, ...payload, property_id: payload.property_id || getActivePropertyId() };
    setUnits(prev => [...prev, mockU]);
    logSystemAction('other', `Nueva unidad física creada: Habitación "${payload.name}"`);
    return mockU;
  };

  const updateUnit = async (unit: Unit) => {
    setUnits(prev => prev.map(u => u.id === unit.id ? unit : u));
    logSystemAction('other', `Unidad física "${unit.name}" modificada (Estado: ${unit.status})`);
  };

  const deleteUnit = async (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    logSystemAction('other', `Unidad física con ID ${id} eliminada`);
  };

  const addUnitType = async (type: any) => {
    const mockUt = { id: type.id || `ut_${Date.now()}`, ...type, property_id: type.property_id || getActivePropertyId() };
    setUnitTypes(prev => [...prev, mockUt]);
    logSystemAction('rate_change', `Nueva categoría de habitación creada: "${mockUt.name}"`);
    return mockUt;
  };

  const updateUnitType = async (type: UnitType) => {
    setUnitTypes(prev => prev.map(t => t.id === type.id ? type : t));
    logSystemAction('rate_change', `Categoría de habitación modificada: "${type.name}"`);
  };

  const deleteUnitType = async (id: string) => {
    setUnitTypes(prev => prev.filter(t => t.id !== id));
    logSystemAction('rate_change', `Categoría de habitación con ID ${id} eliminada`);
  };

  const addProperty = async (property: Partial<Property>) => {
    const mockP = { id: `prop_${Date.now()}`, name: property.name || 'Nueva Propiedad', address: property.address || '', phone: property.phone || '', email: property.email || '', website: property.website || '' };
    setProperties(prev => [...prev, mockP]);
    logSystemAction('other', `Nueva propiedad creada: "${mockP.name}"`);
    return mockP;
  };

  const addTemplate = (template: CommunicationTemplate) => {
    setTemplates(prev => [...prev, { ...template, property_id: template.property_id || getActivePropertyId() }]);
    logSystemAction('other', `Nueva plantilla de comunicación creada: "${template.name}"`);
  };
  const updateTemplate = (template: CommunicationTemplate) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    logSystemAction('other', `Plantilla de comunicación "${template.name}" modificada`);
  };
  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    logSystemAction('other', `Plantilla de comunicación con ID ${id} eliminada`);
  };

  const addRateRule = (rule: RateRule) => {
    setRateRules(prev => [...prev, rule]);
    logSystemAction('rate_change', `Nueva regla tarifaria creada para Categoría con ID ${rule.unit_type_id}`);
  };
  const updateRateRule = (rule: RateRule) => {
    setRateRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    logSystemAction('rate_change', `Regla tarifaria modificada`);
  };
  const deleteRateRule = (id: string) => {
    setRateRules(prev => prev.filter(r => r.id !== id));
    logSystemAction('rate_change', `Regla tarifaria con ID ${id} eliminada`);
  };
  
  const setDailyRate = (rate: DailyRate) => {
    setDailyRates(prev => {
      const idx = prev.findIndex(r => r.date === rate.date && r.unit_type_id === rate.unit_type_id && r.rate_plan_id === rate.rate_plan_id);
      let newRates = [...prev];
      if (idx >= 0) newRates[idx] = rate; else newRates.push(rate);
      return newRates;
    });
    logSystemAction('rate_change', `Tarifa diaria para Categoría ID ${rate.unit_type_id} en fecha ${rate.date} configurada en $${rate.price} USD`);
  };

  const addRatePlan = (plan: RatePlan) => {
    setRatePlans(prev => [...prev, { ...plan, property_id: plan.property_id || getActivePropertyId() }]);
    logSystemAction('rate_change', `Nuevo plan tarifario creado: "${plan.name}"`);
  };
  const updateRatePlan = (plan: RatePlan) => {
    setRatePlans(prev => prev.map(p => p.id === plan.id ? plan : p));
    logSystemAction('rate_change', `Plan tarifario modificado: "${plan.name}"`);
  };
  const deleteRatePlan = (id: string) => {
    setRatePlans(prev => prev.filter(p => p.id !== id));
    logSystemAction('rate_change', `Plan tarifario con ID ${id} eliminado`);
  };

  const addPromotion = (promo: Promotion) => {
    setPromotions(prev => [...prev, { ...promo, property_id: promo.property_id || getActivePropertyId() }]);
    logSystemAction('rate_change', `Nueva promoción comercial creada: Código "${promo.code}"`);
  };
  const updatePromotion = (promo: Promotion) => {
    setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p));
    logSystemAction('rate_change', `Promoción comercial Código "${promo.code}" modificada`);
  };
  const deletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    logSystemAction('rate_change', `Promoción comercial con ID ${id} eliminada`);
  };

  const addSource = (source: string) => setBookingSources(prev => prev.includes(source) ? prev : [...prev, source]);
  const deleteSource = (source: string) => setBookingSources(prev => prev.filter(s => s !== source));

  const addLead = (lead: Lead) => setLeads(prev => [...prev, lead]);
  const updateLead = (lead: Lead) => setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
  
  const addContact = (contact: Contact) => setContacts(prev => [...prev, contact]);
  const updateContact = (contact: Contact) => setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
  
  const addOpportunity = (opp: Opportunity) => setOpportunities(prev => [...prev, opp]);
  const updateOpportunity = (opp: Opportunity) => setOpportunities(prev => prev.map(o => o.id === opp.id ? opp : o));
  
  const addActivity = (activity: Activity) => setActivities(prev => [...prev, activity]);
  
  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  const updateTask = (task: Task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t));

  const addMaintenanceBlock = (block: MaintenanceBlock) => setMaintenanceBlocks(prev => [...prev, { ...block, property_id: block.property_id || getActivePropertyId() }]);
  const updateMaintenanceBlock = (block: MaintenanceBlock) => setMaintenanceBlocks(prev => prev.map(m => m.id === block.id ? block : m));
  const deleteMaintenanceBlock = (id: string) => setMaintenanceBlocks(prev => prev.filter(b => b.id !== id));

  const updateHousekeepingTask = (task: HousekeepingTask) => {
    setHousekeepingTasks(prev => {
      const existing = prev.find(t => t.id === task.id || (t.unit_id === task.unit_id && t.date === task.date));
      if (existing) return prev.map(t => (t.id === existing.id ? { ...task, id: existing.id } : t));
      return [...prev, task];
    });
  };
  
  const addTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
  const updateTeamMember = (member: TeamMember) => setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m));
  const deleteTeamMember = (id: string) => setTeamMembers(prev => prev.filter(m => m.id !== id));

  const addRole = (role: Role) => setRoles(prev => [...prev, role]);
  const updateRole = (role: Role) => setRoles(prev => prev.map(r => r.id === role.id ? role : r));
  const deleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));

  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuotes = currentPropertyId === 'all' ? quotes : quotes.filter(q => q.property_id === currentPropertyId);
  const filteredBookings = currentPropertyId === 'all' ? bookings : bookings.filter(b => b.property_id === currentPropertyId);
  const filteredUnits = currentPropertyId === 'all' ? units : units.filter(u => u.property_id === currentPropertyId);
  const filteredUnitTypes = currentPropertyId === 'all' ? unitTypes : unitTypes.filter(ut => ut.property_id === currentPropertyId);
  const filteredRatePlans = currentPropertyId === 'all' ? ratePlans : ratePlans.filter(rp => rp.property_id === currentPropertyId);
  const filteredRateRules = rateRules.filter(rr => {
    const ut = unitTypes.find(t => t.id === rr.unit_type_id);
    return currentPropertyId === 'all' || ut?.property_id === currentPropertyId;
  });
  const filteredMaintenanceBlocks = currentPropertyId === 'all' ? maintenanceBlocks : maintenanceBlocks.filter(m => m.property_id === currentPropertyId);
  const filteredDailyRates = currentPropertyId === 'all' ? dailyRates : dailyRates.filter(dr => {
    const rp = ratePlans.find(p => p.id === dr.rate_plan_id);
    return rp?.property_id === currentPropertyId;
  });
  const filteredPromotions = currentPropertyId === 'all' ? promotions : promotions.filter(p => p.property_id === currentPropertyId);
  const filteredLeads = currentPropertyId === 'all' ? leads : leads.filter(l => l.property_id === currentPropertyId);
  const filteredContacts = currentPropertyId === 'all' ? contacts : contacts.filter(c => c.property_id === currentPropertyId);
  const filteredOpportunities = currentPropertyId === 'all' ? opportunities : opportunities.filter(o => o.property_id === currentPropertyId);
  const filteredActivities = currentPropertyId === 'all' ? activities : activities.filter(a => a.property_id === currentPropertyId);
  const filteredTasks = currentPropertyId === 'all' ? tasks : tasks.filter(t => t.property_id === currentPropertyId);
  const filteredTeamMembers = currentPropertyId === 'all' ? teamMembers : teamMembers.filter(m => !m.property_id || m.property_id === currentPropertyId);
  const filteredTemplates = currentPropertyId === 'all' ? templates : templates.filter(t => !t.property_id || t.property_id === currentPropertyId);

  // Debounce and Auto-Save Effect
  useEffect(() => {
    if (!isInitialized) return;
    
    if (isFirstMutationRef.current) {
      isFirstMutationRef.current = false;
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('dirty');
    lastMutationTimeRef.current = Date.now();

    const timeout = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const fullState = {
          properties, quotes, bookings, units, unitTypes, ratePlans, rateRules, dailyRates, promotions,
          leads, contacts, opportunities, activities, tasks, payments, invoices, maintenanceBlocks,
          housekeepingTasks, templates, roles, teamMembers, bookingColors, currentPropertyId, systemDate,
          funnels, landings,
          version
        };

        const url = currentPropertyId ? `/api/db?property_id=${currentPropertyId}` : '/api/db';
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(fullState)
        });

        if (res.status === 409) {
          setSaveStatus('conflict');
          const conflictData = await res.json();
          alert(`⚠️ CONFLICTO DE CONCURRENCIA: La base de datos fue actualizada por otro usuario (Versión en base: ${conflictData.currentVersion}, tu versión: ${conflictData.incomingVersion}). Por favor guarda tus cambios locales o recarga la página.`);
          return;
        }

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const resData = await res.json();
        if (resData.version !== undefined) {
          setVersion(resData.version);
        }
        setSaveStatus('saved');
        lastMutationTimeRef.current = Date.now();
      } catch (e) {
        console.error('Failed auto-save:', e);
        if (typeof window !== 'undefined' && !navigator.onLine) {
          setSaveStatus('offline');
        } else {
          setSaveStatus('error');
        }
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [
    properties, quotes, bookings, units, unitTypes, ratePlans, rateRules, dailyRates, promotions,
    leads, contacts, opportunities, activities, tasks, payments, invoices, maintenanceBlocks,
    housekeepingTasks, templates, roles, teamMembers, bookingColors, currentPropertyId, systemDate, isInitialized,
    funnels, landings
  ]);

  return (
    <PMSContext.Provider value={{
      properties, currentPropertyId, setCurrentPropertyId, addProperty, updateProperty, deleteProperty, systemDate, setSystemDate, searchQuery, setSearchQuery, dockedBookingIds, setDockedBookingIds,
      quotes: filteredQuotes, bookings: filteredBookings, units: filteredUnits, unitTypes: filteredUnitTypes, templates: filteredTemplates, ratePlans: filteredRatePlans, rateRules: filteredRateRules, dailyRates: filteredDailyRates, promotions: filteredPromotions,
      bookingSources, leads: filteredLeads, contacts: filteredContacts, opportunities: filteredOpportunities, activities: filteredActivities, tasks: filteredTasks, maintenanceBlocks: filteredMaintenanceBlocks, housekeepingTasks,
      addMaintenanceBlock, updateMaintenanceBlock, deleteMaintenanceBlock, updateHousekeepingTask, addQuote, updateQuote, deleteQuote, addBooking, updateBooking, deleteBooking, updateUnits,
      funnels, landings, updateFunnels, updateLandings,
      addUnit, updateUnit, deleteUnit, addUnitType, updateUnitType, deleteUnitType, addTemplate, updateTemplate, deleteTemplate, addRateRule, updateRateRule, deleteRateRule, setDailyRate,
      addRatePlan, updateRatePlan, deleteRatePlan, addPromotion, updatePromotion, deletePromotion, addSource, deleteSource, addLead, updateLead, addContact, updateContact, deleteContact,
      addOpportunity, updateOpportunity, addActivity, addTask, updateTask, payments, invoices, addPayment, deletePayment, addInvoice, updateInvoice,
      teamMembers: filteredTeamMembers, roles, addTeamMember, updateTeamMember, deleteTeamMember, addRole, updateRole, deleteRole, currentUserProfile, isAuthenticated, login, logout, isInitialized, initializeSystem, bookingColors, updateBookingColor, deleteBookingColor,
      saveStatus, version,
      allUnits: units,
      allUnitTypes: unitTypes,
      allRatePlans: ratePlans,
      allBookings: bookings
    }}>
      {children}
    </PMSContext.Provider>
  );
}

export function usePMS() {
  const context = useContext(PMSContext);
  if (context === undefined) {
    throw new Error('usePMS must be used within a PMSProvider');
  }
  return context;
}