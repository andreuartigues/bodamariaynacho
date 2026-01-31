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
  
  if (diff <= 0) {
    countdownElement.innerText = "¡Hoy es el gran día! 💍";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  countdownElement.innerText = `Falten només ${days} días `;
}

// Iniciar cuenta regresiva
setInterval(updateCountdown, 1000);
updateCountdown();


/**
 * Manejo del formulario RSVP
 */
const form = document.getElementById("rsvp-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Obtener el valor del radio button seleccionado
  const busOption = document.querySelector('input[name="bus"]:checked');

  // Obtener datos del formulario
  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    bus: busOption ? busOption.value : null,
    created_at: new Date().toISOString()
  };

  // Validación básica
  if (!data.name || !data.email || !data.bus) {
    alert("⚠️ Por favor completa todos los campos");
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

    alert("💛 ¡Gracias por confirmar tu asistencia!");
    form.reset();
    
  } catch (error) {
    console.error("Error al enviar confirmación:", error);
    alert("❌ Error al enviar la confirmación. Por favor intenta de nuevo.");
    
  } finally {
    // Rehabilitar botón
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});