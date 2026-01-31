// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Configuración de la fecha de la boda
const WEDDING_DATE = new Date("2026-09-19T12:00:00");

/**
 * Actualiza la cuenta regresiva cada segundo
 */
function updateCountdown() {
  const now = new Date();
  const diff = WEDDING_DATE - now;

  const countdownElement = document.getElementById("countdown");
  
  if (!countdownElement) return;
  
  if (diff <= 0) {
    countdownElement.innerText = "¡Avui és es gran dia! 💍";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  countdownElement.innerText = `${days} días · ${hours} horas · ${minutes} minutos`;
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

    // Obtener el valor del radio button seleccionado
    const busOption = document.querySelector('input[name="bus"]:checked');

    // Obtener datos del formulario
    const data = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      comment: document.getElementById("comment").value.trim() || null,
      bus: busOption ? busOption.value : null,
      created_at: new Date().toISOString()
    };

    // Validación básica
    if (!data.name || !data.email || !data.bus) {
      alert("⚠️ Per favor, completa els camps obligatòris (nom, email y transport)");
      return;
    }

    // Deshabilitar botón mientras se envía
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
      const { error } = await supabaseClient
        .from("rsvp")
        .insert([data]);

      if (error) {
        throw error;
      }

      alert("💛 Moltes gràcies per confirmar la teva asistència! Ens veim dia 19 de setembre.");
      form.reset();
      
    } catch (error) {
      console.error("Error en enviar sa confirmació:", error);
      
      // Mensaje de error más específico
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        alert("⚠️ Este email ya ha sido registrado. Si necesitas hacer cambios, contáctanos.");
      } else {
        alert("❌ Error al enviar la confirmación. Por favor intenta de nuevo o contáctanos.");
      }
      
    } finally {
      // Rehabilitar botón
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}