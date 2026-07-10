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
      const movie = quizData['Película'] || '';
      const avoid = quizData['Evitar'] || '';
      const guide = quizData['Recomendación asignada'] || '';
      
      let personalizedIntro = tone === 'formal' ? `Estimado/a ${quote.first_name}, hemos recibido sus respuestas del formulario.` : `¡Hola ${quote.first_name}! Recibimos tus respuestas del Quiz ⚡.`;
      if (movie) personalizedIntro += ` Vimos que en su viaje buscan *${movie}*`;
      if (avoid) personalizedIntro += ` y que prefieren evitar *${avoid}*.`;
      else personalizedIntro += `.`;
      
      personalizedIntro += tone === 'formal' ? ` Le adjuntamos esta cotización especial, incluyendo nuestra guía: *${guide.replace(/[🥾🍷🌲🧭]/g, '').trim()}*.` : ` Les armamos esta cotización especial pensando en su perfil, e incluimos de regalo nuestra guía: *${guide.replace(/[🥾🍷🌲🧭]/g, '').trim()}*.`;

      return `${personalizedIntro}\n\nPara sus fechas del ${quote.check_in} al ${quote.check_out} para ${paxTextEs}, el total es de ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}.\n\n¿Qué les parece la propuesta?`;
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
    return `Propuesta especial para tu viaje a Bariloche 🏔️ - ${quote.check_in}`;
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
      const movie = quizData['Película'] || '';
      const avoid = quizData['Evitar'] || '';
      const guide = quizData['Recomendación asignada'] || '';
      
      let personalizedIntro = tone === 'formal' ? `Estimado/a ${quote.first_name},\n\nHemos recibido sus respuestas del formulario.\n` : `Hola ${quote.first_name},\n\nRecibimos tus respuestas del Quiz ⚡.\n`;
      if (movie) personalizedIntro += `Vimos que en su viaje buscan "${movie}"`;
      if (avoid) personalizedIntro += ` y que prefieren evitar "${avoid}".\n`;
      else personalizedIntro += `.\n`;
      
      personalizedIntro += tone === 'formal' ? `\nLe adjuntamos esta cotización especial, incluyendo nuestra guía: ${guide}.` : `\nLes armamos esta cotización especial pensando en su perfil, e incluimos de regalo nuestra guía: ${guide}.`;

      return `${personalizedIntro}\n\nFechas: ${quote.check_in} al ${quote.check_out}\nHuéspedes: ${paxText}\nTotal: ${quote.total_amount} ${quote.options?.[0]?.currency || 'USD'}\n\nQuedamos a tu disposición por cualquier consulta.\n\nSaludos!`;
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
