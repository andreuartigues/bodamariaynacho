// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Configuración de la fecha de la boda
const WEDDING_DATE = new Date("2026-09-19T12:00:00");

/**
 * Genera un archivo .ics para añadir el evento al calendario
 */
function generateICS(name, email) {
  const eventStart = "20260919T120000"; // 19 Sept 2026, 12:00
  const eventEnd = "20260920T003000";   // 20 Sept 2026, 00:30
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Maria & Nacho Wedding//ES
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${eventStart}
DTEND:${eventEnd}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
UID:wedding-maria-nacho-${Date.now()}@sanostraboda.com
CREATED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION:Celebració de sa boda de Maria i Nacho\\n\\nHorari:\\n12:00h - Ceremònia a l'Església de Muro\\n13:00h - Còctel a Son Parera\\n15:00h - Dinar\\n19:00h - Festa\\n\\nUbicació: Finca Son Parera\\, Camí Vell de Muro\\, Km 3\\, 07440 Muro\\, Mallorca
LAST-MODIFIED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
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
END:VCALENDAR`;

  return icsContent;
}

/**
 * Descarga el archivo .ics directamente
 */
function downloadICS(name, email) {
  const icsContent = generateICS(name, email);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'boda-maria-nacho.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Envía email de confirmación usando Supabase Edge Function
 */
async function sendConfirmationEmail(name, email, asistencia, bus, comment) {
  try {
    console.log('📧 Enviando email con datos:', { name, email, asistencia, bus, comment });
    
    const { data, error } = await supabaseClient.functions.invoke('send-confirmation-email', {
      body: JSON.stringify({
        name: name,
        email: email,
        asistencia: asistencia,
        bus: bus || null,
        comment: comment || null
      })
    });

    if (error) {
      console.error('❌ Error invocando Edge Function:', error);
      return false;
    }

    console.log('✅ Respuesta del servidor:', data);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
}

/**
 * Actualiza la cuenta regresiva cada segundo
 */
function updateCountdown() {
  const now = new Date();
  const diff = WEDDING_DATE - now;

  const countdownElement = document.getElementById("countdown");
  
  if (!countdownElement) return;
  
  if (diff <= 0) {
    countdownElement.innerText = "Avui és es gran dia! 💛";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  countdownElement.innerText = `${days} dies`;
}

// Iniciar cuenta regresiva si existe el elemento
if (document.getElementById("countdown")) {
  setInterval(updateCountdown, 1000);
  updateCountdown();
}

/**
 * Manejo del formulario RSVP
 */
const form = document.getElementById("rsvp-form");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener el valor de asistencia
    const asistenciaOption = document.querySelector('input[name="asistencia"]:checked');
    
    // Obtener el valor del bus solo si asiste
    const busOption = document.querySelector('input[name="bus"]:checked');

    // Obtener datos del formulario
    const data = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      asistencia: asistenciaOption ? asistenciaOption.value : null,
      comment: document.getElementById("comment").value.trim() || null,
      bus: busOption ? busOption.value : null,
      created_at: new Date().toISOString()
    };

    // Validación básica
    if (!data.name || !data.email || !data.asistencia) {
      alert("⚠️ Per favor, completa els camps obligatòris (nom, email i assistència)");
      return;
    }

    // Si asiste, el transporte es obligatorio
    if (data.asistencia === 'si' && !data.bus) {
      alert("⚠️ Per favor, selecciona el teu mètode de transport");
      return;
    }

    // Deshabilitar botón mientras se envía
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Enviant...";

    try {
      // 1. Guardar en base de datos
      const { error } = await supabaseClient
        .from("rsvp")
        .insert([data]);

      if (error) {
        throw error;
      }

      // 3. Enviar email de confirmación (en segundo plano)
      sendConfirmationEmail(data.name, data.email, data.asistencia, data.bus, data.comment)
        .then(success => {
          if (success) {
            console.log('✅ Email de confirmació enviat');
          } else {
            console.log('⚠️ No s\'ha pogut enviar l\'email, però la confirmació s\'ha guardat');
          }
        });

      // 4. Mostrar mensaje de éxito
      if (data.asistencia === 'si') {
        alert("💛 Moltes gràcies per confirmar la teva assistència! ✅\n\n 📧 Rebràs un email de confirmació en breus moments\n\nEns veim dia 19 de setembre!");
      } else {
        alert("💛 Gràcies per informar-nos\n\nEsperam poder celebrar amb tu en una altra ocasió!");
      }
      
      form.reset();
      
      // Ocultar campo de transporte después de reset
      const transportGroup = document.getElementById('transport-group');
      if (transportGroup) {
        transportGroup.style.display = 'none';
      }
      
    } catch (error) {
      console.error("Error en enviar sa confirmació:", error);
      
      // Mensaje de error más específico
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        alert("⚠️ Aquest email ja ha estat registrat. Si necessites fer canvis, contacta'ns.");
      } else {
        alert("❌ Error al enviar la confirmació. Per favor intenta de nou o contacta'ns.");
      }
      
    } finally {
      // Rehabilitar botón
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}