export interface GuestProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality: string;
  document_id?: string;
}

export function normalizeDocument(doc?: string): string {
  if (!doc) return '';
  return doc
    .toString()
    .replace(/[.\-_ ]/g, '') // remove dots, hyphens, underscores, spaces
    .toLowerCase()
    .trim();
}

export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone
    .toString()
    .replace(/[^0-9]/g, '') // keep only numbers
    .trim();
}

export function getUniqueGuests(bookings: any[], quotes: any[]): GuestProfile[] {
  const profileMap = new Map<string, GuestProfile>();

  const process = (item: any) => {
    if (!item.first_name || !item.last_name) return;
    const key = `${item.first_name.trim().toLowerCase()} ${item.last_name.trim().toLowerCase()}`;
    if (!profileMap.has(key)) {
      profileMap.set(key, {
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email || '',
        phone: item.phone || '',
        nationality: item.nationality || '',
        document_id: item.document_id || ''
      });
    } else {
      const existing = profileMap.get(key)!;
      if (item.email && !existing.email) existing.email = item.email;
      if (item.phone && !existing.phone) existing.phone = item.phone;
      if (item.document_id && !existing.document_id) existing.document_id = item.document_id;
    }
  };

  if (Array.isArray(bookings)) bookings.forEach(b => process(b));
  if (Array.isArray(quotes)) quotes.forEach(q => process(q));

  return Array.from(profileMap.values());
}

export interface DuplicateCheckResult {
  field: 'document_id' | 'email' | 'phone';
  guest: GuestProfile;
}

export function findDuplicateInProfiles(
  profiles: GuestProfile[],
  newGuest: { first_name?: string; last_name?: string; email?: string; phone?: string; document_id?: string }
): DuplicateCheckResult | null {
  const normDoc = normalizeDocument(newGuest.document_id);
  const normEmail = normalizeEmail(newGuest.email);
  const normPhone = normalizePhone(newGuest.phone);

  for (const p of profiles) {
    // If it's the exact same name, skip as it will be treated as editing or reusing same contact
    if (newGuest.first_name && newGuest.last_name && 
        p.first_name.toLowerCase().trim() === newGuest.first_name.toLowerCase().trim() && 
        p.last_name.toLowerCase().trim() === newGuest.last_name.toLowerCase().trim()) {
      continue;
    }

    if (normDoc && normalizeDocument(p.document_id) === normDoc) {
      return { field: 'document_id', guest: p };
    }
    if (normEmail && normalizeEmail(p.email) === normEmail) {
      return { field: 'email', guest: p };
    }
    if (normPhone && normalizePhone(p.phone) === normPhone) {
      return { field: 'phone', guest: p };
    }
  }

  return null;
}
