export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  property_id?: string; // Si es null o indefinido, tiene acceso a todas (útil para dueños/gerentes generales)
  status: 'active' | 'inactive';
  avatar_url?: string;
  last_login?: string;
}
