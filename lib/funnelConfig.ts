export type FunnelStepType = 'multiple_choice' | 'date_picker' | 'contact_form' | 'pax_selector';

export interface FunnelOption {
  label: string;
  value: string;
  description?: string;
}

export interface FunnelStep {
  id: string;
  type: FunnelStepType;
  question: string;
  subtitle?: string;
  options?: FunnelOption[];
  maxSelect?: number; // 1 para radio, >1 para checkbox
  bgImageKey?: 'default' | 'movie' | 'car' | 'calendar' | 'contact' | 'reflection';
}
export interface FunnelHook {
  id: string;
  type: 'map' | 'doc' | 'link';
  title: string;
  description: string;
  url: string;
  icon: string; // e.g. emoji or lucide icon name
}

export interface FunnelConfig {
  title: string;
  subtitle: string;
  welcomeHeading: string;
  welcomeDescription: string;
  reflectionHeading: string;
  reflectionText: string;
  reflectionBenefit: string;
  landingCtaDestination?: string; // Slug del quiz al que apunta el CTA de la landing
  steps: FunnelStep[];
  images: {
    default: string;
    movie: string;
    car: string;
    calendar: string;
    contact: string;
    reflection: string;
  };
  hooks?: FunnelHook[];
}

export type FunnelMapping = Record<string, FunnelConfig>;

export const defaultFunnelConfig: FunnelConfig = {
  title: "MODO CONÓZCANNOS",
  subtitle: "Embudo Parejas 💛",
  welcomeHeading: "Excelente decisión 👀",
  welcomeDescription: "Vamos a meternos un poquito en su viaje. Prometemos solemnemente:",
  reflectionHeading: "¡Recibido! 💛",
  reflectionText: "Un asesor experto ya está procesando esto y enviando las opciones que coinciden 100% con tu viaje.",
  reflectionBenefit: "¡Te vamos a incluir una guía sorpresa sin cargo!",
  steps: [
    {
      id: "Película",
      type: "multiple_choice",
      question: "La película del viaje 🎬",
      subtitle: "Cuando imaginan este viaje, ¿qué aparece? Elige hasta dos.",
      maxSelect: 2,
      bgImageKey: "movie",
      options: [
        { label: "Desconectar juntos 💛", description: "Bajar un cambio, dormir bien y no mirar demasiado el reloj.", value: "Desconectar" },
        { label: "Comer y tomar cosas ricas 🍷", description: "La gastronomía también es parte del viaje. Bastante parte.", value: "Gastronomía" },
        { label: "Salir a explorar 🏔️", description: "Queremos conocer, caminar, recorrer y aprovechar los días.", value: "Explorar" },
        { label: "Darnos un gusto ✨", description: "Queremos que este viaje se sienta un poquito especial.", value: "Darnos un gusto" }
      ]
    },
    {
      id: "Historia",
      type: "multiple_choice",
      question: "¿Qué tan barilochenses son? 👀",
      maxSelect: 1,
      bgImageKey: "movie",
      options: [
        { label: "🌱 Es nuestra primera vez", value: "Primera vez" },
        { label: "🕰️ Ya vinimos, pero hace tiempo", value: "Hace tiempo" },
        { label: "🧭 Ya conocemos bastante", value: "Conocemos bastante" }
      ]
    },
    {
      id: "Auto",
      type: "multiple_choice",
      question: "¿Vienen en auto? 🚗",
      maxSelect: 1,
      bgImageKey: "car",
      options: [
        { label: "🚗 Sí, propio o alquilado", value: "Si" },
        { label: "🚶 No, a pie", value: "No" }
      ]
    },
    {
      id: "Evitar",
      type: "multiple_choice",
      question: "Lo que NO quieren 🛑",
      subtitle: "Elige todo lo que aplique.",
      maxSelect: 10,
      bgImageKey: "car",
      options: [
        { label: "🔊 Mucho ruido molesto", value: "Ruido" },
        { label: "🌎 Estar demasiado lejos del mapa", value: "Lejos" },
        { label: "🪜 Subir y bajar muchas escaleras", value: "Escaleras" }
      ]
    },
    {
      id: "Fechas",
      type: "date_picker",
      question: "¿Cuándo sucede el viaje? 🗓️",
      bgImageKey: "calendar"
    },
    {
      id: "Acompañantes",
      type: "multiple_choice",
      question: "¿Son solo ustedes dos? 👥",
      maxSelect: 1,
      bgImageKey: "calendar",
      options: [
        { label: "💑 Sí, somos 2 adultos", value: "Solo dos" },
        { label: "👶 Viajamos con nuestro(s) hijo(s)", value: "Con niños" }
      ]
    },
    {
      id: "Contacto",
      type: "contact_form",
      question: "¡Ya lo tenemos! 🎉",
      subtitle: "Con todo esto, el equipo ya sabe exactamente qué recomendarles.",
      bgImageKey: "contact"
    }
  ],
  images: {
    default: "https://images.unsplash.com/photo-1544645229-41710bd3c597?auto=format&fit=crop&q=80&w=2000",
    movie: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000",
    car: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000",
    calendar: "https://images.unsplash.com/photo-1506744626753-2fea904ca86f?auto=format&fit=crop&q=80&w=2000",
    contact: "https://images.unsplash.com/photo-1518182170546-076616fd42bf?auto=format&fit=crop&q=80&w=2000",
    reflection: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2000"
  },
  hooks: [
    {
      id: "guia-gastronomica",
      type: "doc",
      title: "Guía Gastronómica 🍷",
      description: "Los 5 lugares secretos para cenar en Bariloche",
      url: "https://docs.google.com/document/d/12345/edit",
      icon: "🍷"
    },
    {
      id: "mapa-rutas",
      type: "map",
      title: "Rutas Panorámicas 🗺️",
      description: "Mapa interactivo con los mejores miradores",
      url: "https://maps.google.com/?q=bariloche",
      icon: "🗺️"
    }
  ]
};

export const defaultFunnelMapping: FunnelMapping = {
  parejas: defaultFunnelConfig,
};

// ----------------------------------------------------
// LANDING PAGE CONFIGURATION
// ----------------------------------------------------

export interface LandingFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface LandingConfig {
  slug: string;
  hero: {
    tagline: string;
    title: string;
    subtitle: string;
    description1: string;
    description2: string;
    ctaText: string;
    footerText: string;
  };
  comparison: {
    title: string;
    optionA_title: string;
    optionA_points: string[];
    optionB_title: string;
    optionB_points: string[];
    conclusion: string;
    ctaText: string;
  };
  features: {
    title: string;
    items: LandingFeature[];
  };
  quote: {
    text: string;
    authorOrContext1: string;
    authorOrContext2: string;
    highlight: string;
    ctaText: string;
  };
  preQuiz: {
    title: string;
    description1: string;
    description2: string;
    ctaText: string;
    footerText: string;
  };
  targetQuizSlug: string; // The quiz this landing opens
  bookingDirectEnabled?: boolean;
  bookingDirectPromoCode?: string;
  bookingPropertyId?: string;
}

export const defaultLandingConfig: LandingConfig = {
  slug: "bariloche-parejas",
  targetQuizSlug: "parejas",
  bookingDirectEnabled: true,
  bookingDirectPromoCode: "PAREJAS20",
  bookingPropertyId: "11111111-1111-1111-1111-111111111111",
  hero: {
    tagline: "CAMPAÑA DE CAPTACIÓN EXCLUSIVA",
    title: "Bariloche se disfruta.",
    subtitle: "De a dos, se recuerda.",
    description1: "Armamos una guía con los lugares, momentos y pequeños secretos que toda pareja debería vivir al menos una vez en Bariloche.",
    description2: "Respondé unas pocas preguntas sobre su viaje y te mostramos qué no deberían perderse.",
    ctaText: "QUIERO LA GUÍA PARA DOS ❤️",
    footerText: "Es gratis. El quiz lleva menos que elegir dónde cenar."
  },
  comparison: {
    title: "Hay dos formas de viajar a Bariloche.",
    optionA_title: "OPCIÓN A",
    optionA_points: [
      "Llegar.",
      "Improvisar.",
      "Buscar \"qué hacer en Bariloche\" cuando ya estás acá.",
      "Terminar en los mismos lugares que todo el mundo."
    ],
    optionB_title: "OPCIÓN B",
    optionB_points: [
      "Saber dónde ir.",
      "Qué vale realmente la pena.",
      "Qué reservar antes.",
      "Dónde comer.",
      "Qué paseo elegir.",
      "Y dónde desaparecer un rato del mundo."
    ],
    conclusion: "Nos gusta más la opción B.",
    ctaText: "ARMEMOS NUESTRO VIAJE"
  },
  features: {
    title: "El pequeño mapa del tesoro para un viaje de a dos 🗺️❤️",
    items: [
      { id: "1", icon: "🌅", title: "Momentos únicos", description: "Los paisajes y experiences que realmente merecen un lugar en el viaje de una pareja." },
      { id: "2", icon: "🍷", title: "Dónde comer", description: "Desde una cena especial hasta ese rincón secreto donde quedarse hablando horas." },
      { id: "3", icon: "🚗", title: "Rutas para perderse", description: "Los caminos más lindos para recorrer Bariloche sin convertir el viaje en una carrera." },
      { id: "4", icon: "❤️", title: "Planes para dos", description: "Ideas para bajar un cambio, sorprenderse y compartir algo totalmente distinto." },
      { id: "5", icon: "🏔️", title: "Secretos locales", description: "Consejos para evitar errores clásicos y aprovechar mucho mejor cada día de la escapada." },
      { id: "6", icon: "🏡", title: "Dónde quedarse", description: "Opciones de alojamiento según el tipo de viaje, las fechas y el plan de la pareja." }
    ]
  },
  quote: {
    text: "\"No van a recordar cuántas cosas hicieron.<br/>Van a recordar cómo se sintieron.\"",
    authorOrContext1: "Bariloche tiene cientos de lugares. Pero un gran viaje no se arma acumulando actividades.",
    authorOrContext2: "Se arma encontrando esos momentos que después aparecen años más tarde en una conversación:",
    highlight: "\"¿Te acordás de ese día?\"",
    ctaText: "QUIERO VIVIR BARILOCHE ASÍ"
  },
  preQuiz: {
    title: "Ok. Hablemos de ustedes. 👀",
    description1: "No todas las parejas viajan igual. Algunas quieren recorrer todo. Otras quieren desaparecer del mapa. Algunas viven por la gastronomía, otras por la montaña. Y algunas quieren un poco de todo.",
    description2: "Respondan unas preguntas y armamos algo mucho más parecido a ustedes.",
    ctaText: "EMPEZAR EL QUIZ ❤️",
    footerText: "Sin formularios eternos. Sin interrogatorio policial. Prometido."
  }
};
