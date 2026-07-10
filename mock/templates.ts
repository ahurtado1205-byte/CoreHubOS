import { CommunicationTemplate } from '../types';

export const mockTemplates: CommunicationTemplate[] = [
  {
    id: 't_wa_es_cercano',
    name: 'Cotización ES - Cercano (WhatsApp)',
    type: 'whatsapp',
    content: '¡Hola {{nombre}}! Te compartimos la cotización para tu estadía del {{check_in}} al {{check_out}}.\n\nEl total es de {{total}}.\n\nAvisanos qué te parece para avanzar con la reserva.'
  },
  {
    id: 't_wa_es_formal',
    name: 'Cotización ES - Formal (WhatsApp)',
    type: 'whatsapp',
    content: 'Estimado/a {{nombre}}, le compartimos la cotización formal para su estadía del {{check_in}} al {{check_out}}.\n\nEl total asciende a {{total}}.\n\nQuedamos a su disposición ante cualquier consulta.'
  },
  {
    id: 't_wa_es_directo',
    name: 'Cotización ES - Directo (WhatsApp)',
    type: 'whatsapp',
    content: 'Hola {{nombre}}, tu estadía ({{check_in}} al {{check_out}}) tiene un valor de {{total}}.\n\n¡Avisame si avanzamos!'
  },
  {
    id: 't_em_es_cercano',
    name: 'Cotización ES - Cercano (Email)',
    type: 'email',
    subject: 'Tu propuesta para viajar ✈️',
    content: 'Hola {{nombre}},\n\nRecibimos tu solicitud. Te adjuntamos la cotización de tu estadía.\nFechas: {{check_in}} al {{check_out}}\nTotal: {{total}}\n\nSaludos!'
  },
  {
    id: 't_wa_en_cercano',
    name: 'Cotización EN - Cercano (WhatsApp)',
    type: 'whatsapp',
    content: 'Hi {{nombre}}! Here is the quote for your stay from {{check_in}} to {{check_out}}.\n\nThe total is {{total}}.\n\nLet me know!'
  },
  {
    id: 't_wa_pt_cercano',
    name: 'Cotización PT - Cercano (WhatsApp)',
    type: 'whatsapp',
    content: 'Olá {{nombre}}! Compartilhamos o orçamento para a sua estadia de {{check_in}} a {{check_out}}.\n\nO total é de {{total}}.\n\nMe avise!'
  },
  {
    id: 't_wa_1',
    name: 'Ejemplo Viejo: Presupuesto - WhatsApp',
    type: 'whatsapp',
    content: '¡Hola, {{nombre}}! Te armamos esta propuesta a medida:\n\nCalendario: Del {{check_in}} al {{check_out}}.\n💰 Valor de la experiencia: {{total}}'
  },
  {
    id: 't_wa_2',
    name: '2. Confirmación de Reserva - WhatsApp',
    type: 'whatsapp',
    content: '¡Ya es un hecho, {{Nombre_Cliente}}! Tu lugar te está esperando. 🎉 Tu reserva está 100% CONFIRMADA.\n\nAgendate los datos clave (Tu ID de Reserva es #{{ID_Reserva}}):\n\n{{Nombre_Propiedad}} | {{Tipo_Habitacion_Unidad}}\n\nDuración: {{Cantidad_Noches}} noches de puro disfrute.\n\nLlegada: {{Fecha_CheckIn}} (Te esperamos desde las {{Hora_CheckIn}}).\n\nSalida: {{Fecha_CheckOut}} (El check-out es hasta las {{Hora_CheckOut}}).\n\n📍 Cómo llegar sin perderte: {{Link_Google_Maps}}\n🧾 Cuentas: {{Estado_Pago}} (Saldo pendiente: {{Moneda}} {{Saldo_Pendiente}}).\n\nAdelantate al papeleo y hacé tu Pre-CheckIn digital acá para llegar y directo pasar a descansar: {{Link_Pre_CheckIn}}\n¡Empezó la cuenta regresiva! 🚗💨'
  },
  {
    id: 't_wa_3',
    name: '3. Pedido de Pago / Recordatorio - WhatsApp',
    type: 'whatsapp',
    content: 'Hola, {{Nombre_Cliente}}. Pasamos rápido por acá para que no se te pase un detalle importante de tu viaje a {{Nombre_Propiedad}}. 📋\n\nPara dejar blindada y activa tu reserva (ID #{{ID_Reserva}} por {{Cantidad_Noches}} noches), nos falta registrar el pago pendiente.\n\nMonto: {{Moneda}} {{Monto_A_Pagar}}\n\nLímite: {{Fecha_Limite_Pago}}\n\n💳 Hacé el pago en dos minutos desde acá: {{Link_Pago}}\n\nSi ya hiciste una transferencia, no te preocupes: mandanos el comprobante por acá y nosotros nos encargamos del resto. ¡Muchas gracias!'
  },
  {
    id: 't_wa_4',
    name: '4. Modificación de Reserva - WhatsApp',
    type: 'whatsapp',
    content: 'Hola, {{Nombre_Cliente}}. Los planes cambian y nos adaptamos. Ya reajustamos todo para que tu estadía en {{Nombre_Propiedad}} salga perfecta. 🔄\n\nTu reserva ID #{{ID_Reserva}} ahora quedó así:\n\nTu nueva unidad: {{Tipo_Habitacion_Unidad}}\n\nTus nuevas fechas: Del {{Fecha_CheckIn}} al {{Fecha_CheckOut}} ({{Cantidad_Noches}} noches).\n\nAjuste de tarifa: {{Moneda}} {{Diferencia_Precio}}\n\nSaldo total actualizado: {{Moneda}} {{Precio_Total}}\n\nPodés mirar cómo quedó tu itinerario completo en este link dinámico: {{Link_Resumen_Reserva}} ¡Seguimos coordinando!'
  },
  {
    id: 't_wa_5',
    name: '5. Cancelación de Reserva - WhatsApp',
    type: 'whatsapp',
    content: 'Hola, {{Nombre_Cliente}}. Qué pena que esta vez no se dé, nos quedamos con muchas ganas de recibirte en {{Nombre_Propiedad}}. 😔\n\nTe confirmamos que tu reserva ID #{{ID_Reserva}} ya fue cancelada en el sistema.\n\nCondiciones de la cancelación: {{Politica_Cancelacion_Aplicada}}\n\nTu saldo / reembolso: {{Detalle_Reembolso_O_Credito}}\n\nEl mundo es grande y el año largo. Ojalá coincidamos en tu próximo viaje, acá tenés las puertas abiertas para cuando decidas volver a armar valijas. ¡Buenas vibras!'
  }
];
