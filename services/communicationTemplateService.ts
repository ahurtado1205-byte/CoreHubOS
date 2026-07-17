import { Quote } from '../types';

export type QuoteLanguage = 'es' | 'en' | 'pt';
export type QuoteTone = 'friendly' | 'formal' | 'direct';

const parseQuizNotes = (notes: string) => {
  if (!notes) return null;
  if (!notes.includes('[LEAD DE FUNNEL]') && !notes.includes('[LEAD PERFILADO]')) return null;
  
  const lines = notes.split('\n');
  const data: Record<string, string> = {};
  lines.forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      data[key.trim()] = rest.join(':').trim();
    }
  });
  return data;
};

export const buildWhatsAppQuoteMessage = (quote: Quote, lang: QuoteLanguage = 'es', tone: QuoteTone = 'friendly'): string => {
  const paxText = `${quote.pax} pax${quote.extra_beds ? ` y ${quote.extra_beds} cama(s) extra` : ''}`;
  const paxTextEs = `${quote.pax} personas${quote.extra_beds ? ` y ${quote.extra_beds} cama(s) extra` : ''}`;
  const paxTextEn = `${quote.pax} guests${quote.extra_beds ? ` and ${quote.extra_beds} extra bed(s)` : ''}`;
  const paxTextPt = `${quote.pax} pessoas${quote.extra_beds ? ` e ${quote.extra_beds} cama(s) extra` : ''}`;

  if (lang === 'es' && quote.source?.startsWith('Quiz Funnel')) {
    const quizData = parseQuizNotes(quote.internal_notes || '');
    if (quizData) {
      const vipTag = quizData['VIP_TAG'] || 'general';
      const movie = quizData['Preferencia'] || quizData['Película'] || '';
      const dates = `del ${quote.check_in} al ${quote.check_out}`;
      
      let personalizedIntro = '';
      if (vipTag === 'parejas') {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name}, hemos preparado una propuesta de escapada única para ustedes, ideal para disfrutar de la tranquilidad y la intimidad en pareja.`
          : `¡Hola ${quote.first_name}! Preparamos una propuesta de escapada única para ustedes, ideal para disfrutar de la tranquilidad en pareja.`;
        if (movie) personalizedIntro += ` Especialmente pensada para celebrar su viaje de tipo *${movie}* con los detalles que buscan.`;
        personalizedIntro += ` Para agasajarlos, les sumamos de regalo nuestra *Guía Romántica y Rincones Secretos de la Región 🍷* para planificar veladas mágicas.`;
      } else if (vipTag === 'familia') {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name}, preparamos una propuesta de estadía ideal para viajar con su familia, enfocada en la comodidad y la diversión de todos.`
          : `¡Hola ${quote.first_name}! Preparamos una propuesta de estadía ideal para viajar con tu familia y crear hermosos recuerdos juntos.`;
        if (movie) personalizedIntro += ` Está pensada para disfrutar de *${movie}* sin preocupaciones logísticas y con espacios amplios.`;
        personalizedIntro += ` Para los más chicos, les sumamos de regalo nuestra *Guía de Paseos y Actividades Familiares 🎪*.`;
      } else if (vipTag === 'amigos') {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name}, estructuramos la base perfecta para su viaje grupal, ofreciendo espacios integrados y opciones flexibles.`
          : `¡Hola ${quote.first_name}! Diseñamos la base perfecta para su escapada con amigos, ideal para compartir grandes momentos.`;
        if (movie) personalizedIntro += ` Está pensada especialmente para su plan de aventura *${movie}* en la zona.`;
        personalizedIntro += ` Les incluimos de regalo nuestra *Guía de Aventura, Trekking y Cervecerías Artesanales 🥾* con los mejores circuitos locales.`;
      } else {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name}, adjuntamos una propuesta a su medida para sus próximas fechas de descanso.`
          : `¡Hola ${quote.first_name}! Te armamos una propuesta a tu medida pensando en tus preferencias de descanso.`;
        personalizedIntro += ` Les sumamos de regalo nuestra *Guía de Recomendaciones Gastronómicas y Paseos Locales 🍽️*.`;
      }

      return `${personalizedIntro}\n\nPara sus fechas ${dates} para ${paxTextEs}, el total de su propuesta especial es de ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.\n\n¿Qué les parece el plan? ¿Les reservamos su habitación preferida?`;
    }
  }

  // Español genérico
  if (lang === 'es') {
    if (tone === 'direct') return `Hola ${quote.first_name}, tu estadía (${quote.check_in} al ${quote.check_out} / ${paxText}) tiene un valor de ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}. Avisame si avanzamos!`;
    if (tone === 'formal') return `Estimado/a ${quote.first_name}, le compartimos la cotización formal para su estadía del ${quote.check_in} al ${quote.check_out} para ${paxTextEs}. El total asciende a ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.`;
    return `¡Hola ${quote.first_name}! Te compartimos la cotización para tu estadía del ${quote.check_in} al ${quote.check_out} para ${paxTextEs}. El total es de ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.`;
  }

  // Inglés genérico
  if (lang === 'en') {
    if (tone === 'direct') return `Hi ${quote.first_name}, your stay (${quote.check_in} to ${quote.check_out} / ${paxTextEn}) is ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}. Let me know!`;
    if (tone === 'formal') return `Dear ${quote.first_name}, here is the formal quote for your stay from ${quote.check_in} to ${quote.check_out} for ${paxTextEn}. The total is ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.`;
    return `Hi ${quote.first_name}! Here is the quote for your stay from ${quote.check_in} to ${quote.check_out} for ${paxTextEn}. The total is ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.`;
  }

  // Portugués genérico
  if (lang === 'pt') {
    if (tone === 'direct') return `Olá ${quote.first_name}, sua estadia (${quote.check_in} a ${quote.check_out} / ${paxTextPt}) fica em ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}. Me avise!`;
    if (tone === 'formal') return `Prezado/a ${quote.first_name}, compartilhamos o orçamento formal para a sua estadia de ${quote.check_in} a ${quote.check_out} para ${paxTextPt}. O total é de ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.`;
    return `Olá ${quote.first_name}! Compartilhamos o orçamento para a sua estadia de ${quote.check_in} a ${quote.check_out} para ${paxTextPt}. O total é de ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.`;
  }

  return '';
};

export const buildWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
};

export const buildEmailSubject = (quote: Quote, lang: QuoteLanguage = 'es'): string => {
  if (lang === 'es' && quote.source?.startsWith('Quiz Funnel')) {
    const quizData = parseQuizNotes(quote.internal_notes || '');
    const vipTag = quizData?.['VIP_TAG'] || 'general';
    const tagLabels: Record<string, string> = {
      parejas: 'Propuesta de Escapada Romántica a tu Medida 💖',
      familia: 'Propuesta de Estadía Familiar Diseñada para Vosotros 👨‍👩‍👧‍👦',
      amigos: 'Propuesta de Aventura y Amigos Especial 🏔️'
    };
    return tagLabels[vipTag] || `Tu propuesta de estadía personalizada ✨`;
  }
  if (lang === 'en') return `Your Stay Quote - ${quote.check_in}`;
  if (lang === 'pt') return `Orçamento da sua estadia - ${quote.check_in}`;
  return `Tu cotización de estadía - ${quote.check_in}`;
};

export const buildEmailBody = (quote: Quote, lang: QuoteLanguage = 'es', tone: QuoteTone = 'friendly'): string => {
  const paxText = `${quote.pax}${quote.extra_beds ? ` + ${quote.extra_beds} cama(s) extra` : ''}`;

  if (lang === 'es' && quote.source?.startsWith('Quiz Funnel')) {
    const quizData = parseQuizNotes(quote.internal_notes || '');
    if (quizData) {
      const vipTag = quizData['VIP_TAG'] || 'general';
      const movie = quizData['Preferencia'] || quizData['Película'] || '';
      const dates = `del ${quote.check_in} al ${quote.check_out}`;
      
      let personalizedIntro = '';
      if (vipTag === 'parejas') {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name},\n\nHemos preparado una propuesta de escapada única para ustedes, ideal para disfrutar de la tranquilidad y la intimidad en pareja.\n`
          : `¡Hola ${quote.first_name}!\n\nPreparamos una propuesta de escapada única para ustedes, ideal para disfrutar de la tranquilidad en pareja.\n`;
        if (movie) personalizedIntro += `Especialmente pensada para celebrar su viaje de tipo "${movie}" con los detalles que buscan.\n`;
        personalizedIntro += `Para agasajarlos, les sumamos de regalo nuestra Guía Romántica y Rincones Secretos de la Región 🍷 para planificar veladas mágicas.\n`;
      } else if (vipTag === 'familia') {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name},\n\nPreparamos una propuesta de estadía ideal para viajar con su familia, enfocada en la comodidad y la diversión de todos.\n`
          : `¡Hola ${quote.first_name}!\n\nPreparamos una propuesta de estadía ideal para viajar con tu familia y crear hermosos recuerdos juntos.\n`;
        if (movie) personalizedIntro += `Está pensada para disfrutar de "${movie}" sin preocupaciones logísticas y con espacios amplios.\n`;
        personalizedIntro += `Para los más chicos, les sumamos de regalo nuestra Guía de Paseos y Actividades Familiares 🎪.\n`;
      } else if (vipTag === 'amigos') {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name},\n\nEstructuramos la base perfecta para su viaje grupal, ofreciendo espacios integrados y opciones flexibles.\n`
          : `¡Hola ${quote.first_name}!\n\nDiseñamos la base perfecta para su escapada con amigos, ideal para compartir grandes momentos.\n`;
        if (movie) personalizedIntro += `Está pensada especialmente para su plan de aventura "${movie}" en la zona.\n`;
        personalizedIntro += `Les incluimos de regalo nuestra Guía de Aventura, Trekking y Cervecerías Artesanales 🥾 con los mejores circuitos locales.\n`;
      } else {
        personalizedIntro = tone === 'formal'
          ? `Estimado/a ${quote.first_name},\n\nAdjuntamos una propuesta a su medida para sus próximas fechas de descanso.\n`
          : `¡Hola ${quote.first_name}!\n\nTe armamos una propuesta a tu medida pensando en tus preferencias de descanso.\n`;
        personalizedIntro += `Les sumamos de regalo nuestra Guía de Recomendaciones Gastronómicas y Paseos Locales 🍽️.\n`;
      }

      return `${personalizedIntro}\nDetalles de su Propuesta Personalizada:\nFechas: ${dates}\nHuéspedes: ${paxText}\nTarifa Especial: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nQuedamos a su entera disposición para cualquier consulta o para confirmar su habitación preferida.\n\nAtentamente,\nConcierge de Hospitalidad`;
    }
  }

  if (lang === 'en') {
    if (tone === 'formal') return `Dear ${quote.first_name},\n\nAttached is the formal quote for your stay.\nDates: ${quote.check_in} to ${quote.check_out}\nGuests: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nSincerely,`;
    return `Hi ${quote.first_name},\n\nAttached is the quote for your stay.\nDates: ${quote.check_in} to ${quote.check_out}\nGuests: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nBest regards!`;
  }
  if (lang === 'pt') {
    if (tone === 'formal') return `Prezado/a ${quote.first_name},\n\nSegue em anexo o orçamento formal da sua estadia.\nDatas: ${quote.check_in} a ${quote.check_out}\nHóspedes: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nAtenciosamente,`;
    return `Olá ${quote.first_name},\n\nSegue em anexo o orçamento da sua estadia.\nDatas: ${quote.check_in} a ${quote.check_out}\nHóspedes: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nSaudações!`;
  }

  if (tone === 'formal') return `Estimado/a ${quote.first_name},\n\nAdjuntamos la cotización formal de su estadía.\nFechas: ${quote.check_in} al ${quote.check_out}\nHuéspedes: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nAtentamente,`;
  return `Hola ${quote.first_name},\n\nAdjuntamos la cotización de tu estadía.\nFechas: ${quote.check_in} al ${quote.check_out}\nHuéspedes: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nSaludos!`;
};

export const buildMailtoLink = (email: string, subject: string, body: string): string => {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
