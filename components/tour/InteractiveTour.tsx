'use client';

import React, { useState, useEffect } from 'react';
import { Joyride, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';

export function InteractiveTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    (window as any).startInteractiveTour = () => {
      setRun(true);
    };
    return () => {
      delete (window as any).startInteractiveTour;
    };
  }, []);

  const steps: Step[] = [
    {
      target: 'a[href="/"]',
      title: 'El Tablero Mágico',
      content: '¡Bienvenido! Acá caen todas las cotizaciones.',
      placement: 'bottom',
    },
    {
      target: 'a[href="/roomrack"]',
      title: 'Roomrack',
      content: 'El corazón del hotel.',
      placement: 'bottom',
    },
    {
      target: 'a[href="/rates"]',
      title: 'Tarifas',
      content: 'Configurá tus precios acá.',
      placement: 'bottom',
    },
    {
      target: 'a[href="/settings"]',
      title: 'Configuración',
      content: 'El cuarto de máquinas.',
      placement: 'left',
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  const JoyrideComponent = Joyride as any;

  return (
    <JoyrideComponent
      callback={handleJoyrideCallback}
      continuous
      run={run}
      showSkipButton
      steps={steps}
    />
  );
}
