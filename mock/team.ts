import { Role, TeamMember } from '../types/team';

export const mockRoles: Role[] = [
  {
    id: 'role_admin',
    name: 'Administrador / Gerente',
    description: 'Acceso total al sistema, configuraciones, reportes financieros y gestión de personal.',
    permissions: ['all']
  },
  {
    id: 'role_reception',
    name: 'Recepción',
    description: 'Gestión de reservas, check-in, check-out, asignación de habitaciones y pagos básicos.',
    permissions: ['read:bookings', 'write:bookings', 'read:inventory', 'write:payments']
  },
  {
    id: 'role_housekeeping',
    name: 'Housekeeping',
    description: 'Actualización de estado de limpieza de habitaciones e inventario de mantenimiento.',
    permissions: ['read:inventory', 'write:inventory']
  },
  {
    id: 'role_sales',
    name: 'Ventas y Marketing',
    description: 'Gestión de CRM, cotizaciones, tarifas y reglas de negocio.',
    permissions: ['read:crm', 'write:crm', 'read:rates', 'write:rates']
  }
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'usr_1',
    first_name: 'Martina',
    last_name: 'Gómez',
    email: 'martina@hotelflow.com',
    role_id: 'role_admin',
    status: 'active',
    last_login: '2026-07-03T10:15:00Z'
  },
  {
    id: 'usr_2',
    first_name: 'Lucas',
    last_name: 'Fernández',
    email: 'lucas.recepcion@hotelflow.com',
    role_id: 'role_reception',
    property_id: '11111111-1111-1111-1111-111111111111',
    status: 'active',
    last_login: '2026-07-03T07:45:00Z'
  },
  {
    id: 'usr_3',
    first_name: 'Carla',
    last_name: 'Rodríguez',
    email: 'carla.hsk@hotelflow.com',
    role_id: 'role_housekeeping',
    property_id: '11111111-1111-1111-1111-111111111111',
    status: 'active',
    last_login: '2026-07-02T15:30:00Z'
  },
  {
    id: 'usr_4',
    first_name: 'Esteban',
    last_name: 'Quito',
    email: 'esteban.ventas@hotelflow.com',
    role_id: 'role_sales',
    status: 'inactive'
  }
];
