// Supabase Edge Function: send-confirmation-email
// Ubicación: supabase/functions/send-confirmation-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  name: string
  email: string
  asistencia: string
  bus: string | null
  comment: string | null
}

function generateICS(name: string, email: string): string {
  const eventStart = "20260919T120000"
  const eventEnd = "20260920T003000"
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Maria & Nacho Wedding//ES
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${eventStart}
DTEND:${eventEnd}
DTSTAMP:${now}Z
UID:wedding-maria-nacho-${Date.now()}@sanostraboda.com
CREATED:${now}Z
DESCRIPTION:Celebració de sa boda de Maria i Nacho\\n\\nHorari:\\n12:00h - Ceremònia a l'Església de Muro\\n13:00h - Còctel a Son Parera\\n15:00h - Dinar\\n19:00h - Festa\\n\\nUbicació: Finca Son Parera\\, Camí Vell de Muro\\, Km 3\\, 07440 Muro\\, Mallorca
LAST-MODIFIED:${now}Z
LOCATION:Finca Son Parera\\, Camí Vell de Muro\\, Km 3\\, 07440 Muro\\, Mallorca
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Boda Maria & Nacho 💛
TRANSP:OPAQUE
ORGANIZER;CN=Maria & Nacho:mailto:noreply@sanostraboda.com
ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Demà és sa boda de Maria i Nacho!
END:VALARM
END:VEVENT
END:VCALENDAR`
}

function getEmailTemplate(data: EmailData): string {
  const asistenciaText = data.asistencia === 'si' ? 'Sí, hi seré! 🎉' : 'No podré assistir 😢'
  const transportText = data.bus === 'bus' ? '🚌 Bus proporcionat' : 
                        data.bus === 'coche' ? '🚗 Cotxe propi' : 
                        'No especificat'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #5d4e37;
      margin: 0;
      padding: 0;
      background-color: #faf8f3;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #9caf88 0%, #6b7c59 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .confirmation-box {
      background: #f5f8f3;
      border-left: 4px solid #6b7c59;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .confirmation-box h3 {
      margin: 0 0 15px 0;
      color: #6b7c59;
      font-size: 16px;
    }
    .confirmation-item {
      margin: 8px 0;
      font-size: 15px;
    }
    .schedule {
      margin: 30px 0;
    }
    .schedule h3 {
      color: #6b7c59;
      border-bottom: 2px solid #e8dcc4;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .schedule-item {
      display: flex;
      margin: 15px 0;
      padding: 15px;
      background: #faf8f3;
      border-radius: 8px;
    }
    .schedule-time {
      font-weight: bold;
      color: #6b7c59;
      font-size: 18px;
      min-width: 80px;
    }
    .schedule-desc {
      flex: 1;
    }
    .location-box {
      background: #e8dcc4;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
      text-align: center;
    }
    .location-box h3 {
      margin: 0 0 10px 0;
      color: #5d4e37;
    }
    .map-button {
      display: inline-block;
      background: #6b7c59;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 15px;
      font-weight: 500;
    }
    .contacts {
      background: #f5f8f3;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .contacts h3 {
      margin: 0 0 15px 0;
      color: #6b7c59;
    }
    .contact-item {
      margin: 8px 0;
    }
    .footer {
      background: #5d4e37;
      color: #e8dcc4;
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
    .calendar-note {
      background: #fff4e6;
      border: 2px dashed #c17c5c;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💛 Maria & Nacho 💛</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">19 de Setembre de 2026</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        <strong>Hola ${data.name},</strong>
        <p>Moltes gràcies per confirmar!</p>
      </div>

      <div class="confirmation-box">
        <h3>📋 Detalls de sa teva confirmació:</h3>
        <div class="confirmation-item"><strong>Assistència:</strong> ${asistenciaText}</div>
        ${data.bus ? `<div class="confirmation-item"><strong>Transport:</strong> ${transportText}</div>` : ''}
        ${data.comment ? `<div class="confirmation-item"><strong>Comentari:</strong> ${data.comment}</div>` : ''}
      </div>

      ${data.asistencia === 'si' ? `
      <div class="calendar-note">
        <strong>📅 Afegeix l'esdeveniment al teu calendari</strong><br>
        Trobaràs un arxiu .ics adjunt que pots obrir amb Google Calendar, Outlook o qualsevol app de calendari.
      </div>

      <div class="schedule">
        <h3>🕐 Horari del Dia</h3>
        
        <div class="schedule-item">
          <div class="schedule-time">11:30h</div>
          <div class="schedule-desc">
            <strong>Sortida Bus des de Palma</strong><br>
            Punt de trobada: Plaça Espanya
          </div>
        </div>

        <div class="schedule-item">
          <div class="schedule-time">12:00h</div>
          <div class="schedule-desc">
            <strong>Ceremònia</strong><br>
            Església de Sant Joan Baptista, Muro
          </div>
        </div>

        <div class="schedule-item">
          <div class="schedule-time">13:00h</div>
          <div class="schedule-desc">
            <strong>Arribada a Son Parera</strong><br>
            Còctel de benvinguda
          </div>
        </div>

        <div class="schedule-item">
          <div class="schedule-time">15:00h</div>
          <div class="schedule-desc">
            <strong>Dinar</strong><br>
            Menú seleccionat amb productes de sa terra
          </div>
        </div>

        <div class="schedule-item">
          <div class="schedule-time">19:00h</div>
          <div class="schedule-desc">
            <strong>Festa!</strong><br>
            Barra lliure i sorpreses
          </div>
        </div>

        <div class="schedule-item">
          <div class="schedule-time">00:00h</div>
          <div class="schedule-desc">
            <strong>Tornada a Palma</strong><br>
            Bus de tornada cap a Palma
          </div>
        </div>
      </div>

      <div class="location-box">
        <h3>📍 Ubicació</h3>
        <p style="margin: 10px 0;">
          <strong>Finca "Son Parera"</strong><br>
          Camí Vell de Muro, Km 3<br>
          07440 Muro, Mallorca
        </p>
        <a href="https://maps.app.goo.gl/gEg1ADKL36m82Tnp8" class="map-button" target="_blank">
          🗺️ Abrir en Google Maps
        </a>
      </div>
      ` : `
      <p style="text-align: center; font-size: 16px; margin: 30px 0;">
        Sentim que no puguis venir. Esperem poder celebrar amb tu en una altra ocasió! 💛
      </p>
      `}

      <div class="contacts">
        <h3>📞 Contacte</h3>
        <div class="contact-item"><strong>Maria:</strong> 689 344 385</div>
        <div class="contact-item"><strong>Nacho:</strong> 678 540 369</div>
      </div>

      <p style="text-align: center; margin-top: 30px; color: #8b7355;">
        Ens veim aviat! 💛
      </p>
    </div>

    <div class="footer">
      Fet amb 💛 per un dia inolvidable<br>
      19 · Setembre · 2026
    </div>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailData: EmailData = await req.json()

    // Validar datos
    if (!emailData.name || !emailData.email || !emailData.asistencia) {
      throw new Error('Faltan datos requeridos')
    }

    // Generar archivo ICS
    const icsContent = generateICS(emailData.name, emailData.email)
    const icsBase64 = btoa(icsContent)

    // Preparar email con Resend
    const emailHtml = getEmailTemplate(emailData)
    
    const emailPayload = {
      from: 'Maria & Nacho <boda@andreuartigues.github.io>', // Cambia por tu dominio verificado
      to: [emailData.email],
      subject: emailData.asistencia === 'si' 
        ? '💛 Confirmació de la teva assistència - Boda Maria & Nacho'
        : '💛 Gràcies per avisar-nos - Maria & Nacho',
      html: emailHtml,
      attachments: emailData.asistencia === 'si' ? [
        {
          filename: 'boda-maria-nacho.ics',
          content: icsBase64,
        }
      ] : []
    }

    // Enviar email con Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      throw new Error(`Error de Resend: ${error}`)
    }

    const result = await resendResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email enviat correctament'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})