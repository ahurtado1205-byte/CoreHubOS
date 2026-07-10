import { Lead, Contact, Opportunity, Activity, Task, TimelineEvent } from '../types';

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'tl_1',
    type: 'creation',
    date: '2026-06-25T10:00:00Z',
    agent: 'Ana',
    description: 'Lead creado'
  },
  {
    id: 'tl_2',
    type: 'whatsapp',
    date: '2026-06-26T11:30:00Z',
    agent: 'Ana',
    description: 'Consulta enviada por WhatsApp'
  }
];

export const mockLeads: Lead[] = [
  {
    id: 'l_1',
    first_name: 'Carlos',
    last_name: 'Gómez',
    email: 'carlos.gomez@empresa.com',
    phone: '+5491122334455',
    source: 'Web',
    type: 'corporate',
    tentative_dates: 'Agosto 2026',
    pax: 1,
    budget: 500,
    notes: 'Viaje de negocios, necesita WiFi rápido',
    status: 'new',
    agent_id: 'Ana',
    created_at: '2026-06-25T10:00:00Z',
    updated_at: '2026-06-25T10:00:00Z',
    timeline: mockTimelineEvents
  }
];

export const mockContacts: Contact[] = [
  {
    id: 'c_1',
    first_name: 'Laura',
    last_name: 'Martínez',
    email: 'laura@agenciaviajes.com',
    phone: '+5491188776655',
    city: 'Buenos Aires',
    country: 'Argentina',
    type: 'agency',
    created_at: '2026-05-10T09:00:00Z'
  }
];

export const mockOpportunities: Opportunity[] = [
  {
    id: 'opp_1',
    name: 'Retiro Corporativo Tech Solutions',
    contact_id: 'c_1',
    estimated_value: 4500,
    currency: 'USD',
    expected_close_date: '2026-07-15',
    tentative_dates: 'Septiembre 2026',
    rooms_count: 10,
    pax: 20,
    business_type: 'group',
    stage: 'follow_up',
    probability: 60,
    status: 'open',
    agent_id: 'Ana',
    next_action: 'Enviar contrato final',
    next_action_date: '2026-07-05',
    last_activity_at: '2026-07-01T15:00:00Z',
    created_at: '2026-06-20T10:00:00Z',
    updated_at: '2026-07-01T15:00:00Z'
  },
  {
    id: 'opp_2',
    name: 'Luna de miel VIP',
    estimated_value: 1200,
    currency: 'USD',
    stage: 'sent',
    business_type: 'individual',
    probability: 40,
    status: 'open',
    agent_id: 'Ana',
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-06-28T10:00:00Z'
  }
];

export const mockActivities: Activity[] = [
  {
    id: 'act_1',
    type: 'call',
    date: '2026-07-01T14:30:00Z',
    result: 'interested',
    description: 'Llamada para confirmar requerimientos del grupo',
    opportunity_id: 'opp_1',
    agent_id: 'Ana'
  }
];

export const mockTasks: Task[] = [
  {
    id: 'tsk_1',
    title: 'Preparar propuesta final',
    due_date: '2026-07-05T12:00:00Z',
    priority: 'high',
    status: 'pending',
    agent_id: 'Ana',
    opportunity_id: 'opp_1'
  },
  {
    id: 'tsk_2',
    title: 'Seguimiento presupuesto',
    due_date: '2026-07-02T16:00:00Z', // Today
    priority: 'medium',
    status: 'pending',
    agent_id: 'Ana'
  }
];
