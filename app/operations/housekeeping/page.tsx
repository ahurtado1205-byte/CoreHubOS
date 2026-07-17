'use client';

import React from 'react';
import HousekeepingDashboard from '../../../components/housekeeping/HousekeepingDashboard';
import { TopBar } from '../../../components/layout/TopBar';

export default function HousekeepingPage() {
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col pb-10">
        <HousekeepingDashboard />
      </main>
    </div>
  );
}
