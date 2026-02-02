// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Configuración de la fecha de la boda
const WEDDING_DATE = new Date("2026-09-19");

/**
 * Actualiza la cuenta regresiva cada segundo
 */
function updateCountdown() {
  const now = new Date();
  const diff = WEDDING_DATE - now;

  const countdownElement = document.getElementById("countdown");
  
  if (!countdownElement) return;
  
  if (diff <= 0) {
    countdownElement.innerText = "¡Avui és es gran dia! 💛";
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
      comment: document.getElementById("comment").value.trim() || null,
      bus: busOption ? busOption.value : "No",
      created_at: new Date().toISOString(),
      asistencia: asistenciaOption ? asistenciaOption.value : null
    };

    // Validación básica
    if (!data.name || !data.email || !data.asistencia) {
      alert("⚠️ Per favor, completa es camps obligatòris (nom, email i assistència)");
      return;
    }

    // Si asiste, el transporte es obligatorio
    if (data.asistencia === 'si' && !data.bus) {
      alert("⚠️ Per favor, selecciona es mètode de transport");
      return;
    }

    // Deshabilitar botón mientras se envía
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Enviant...";

    try {
      const { error } = await supabaseClient
        .from("rsvp")
        .insert([data]);

      if (error) {
        throw error;
      }

      if (data.asistencia === 'si') {
        alert("💛 Moltes gràcies per confirmar la teva assistència! Ens veim dia 19 de setembre.");
      } else {
        alert("💛 Gràcies per informar-nos. Esperem poder celebrar amb tu en una altra ocasió!");
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