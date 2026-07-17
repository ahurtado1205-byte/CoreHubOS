'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ContactlessCheckin from '../../../components/contactless-checkin/ContactlessCheckin';

export default function PreCheckinPage() {
  const { id } = useParams();
  const bookingId = Array.isArray(id) ? id[0] : id;

  return (
    <ContactlessCheckin bookingId={bookingId} />
  );
}
