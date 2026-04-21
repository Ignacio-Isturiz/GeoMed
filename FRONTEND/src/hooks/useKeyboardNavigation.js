import { useEffect } from "react";

export function useKeyboardNavigation() {
  useEffect(() => {
    const announce = (text, urgent = false) => {
      if (window.announceToScreenReader) {
        window.announceToScreenReader(text, urgent);
      }
    };

    const handleKeyDown = (event) => {
      if (!event.altKey) return;

      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const main = document.getElementById("db-main-content");
        if (main) {
          main.focus();
          main.scrollIntoView({ behavior: "smooth", block: "start" });
          announce("Saltando al contenido principal", true);
        }
      }

      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        const navButtons = Array.from(document.querySelectorAll(".db-nav-item"));
        if (!navButtons.length) return;

        const active = navButtons.find((button) => button.classList.contains("active"));
        const next = active
          ? navButtons[(navButtons.indexOf(active) + 1) % navButtons.length]
          : navButtons[0];

        next?.focus();
        next?.click();
        announce(`Navegando a ${next?.textContent?.trim() || "siguiente seccion"}`, true);
      }

      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        const navButtons = Array.from(document.querySelectorAll(".db-nav-item"));
        if (!navButtons.length) return;

        const active = navButtons.find((button) => button.classList.contains("active"));
        const previous = active
          ? navButtons[(navButtons.indexOf(active) - 1 + navButtons.length) % navButtons.length]
          : navButtons[0];

        previous?.focus();
        previous?.click();
        announce(`Navegando a ${previous?.textContent?.trim() || "seccion anterior"}`, true);
      }

      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        const chatbotButton = document.querySelector('[data-chatbot-nav="true"]');
        if (!chatbotButton) {
          announce("Chatbot no disponible en esta sección", true);
          return;
        }

        chatbotButton.click();
        
        // Esperar a que se renderice el chatbot y luego enfocar el input
        setTimeout(() => {
          const chatInput = document.querySelector(".db-chat-input");
          if (chatInput) {
            chatInput.focus();
            chatInput.scrollIntoView({ behavior: "smooth", block: "center" });
            announce(
              "Chatbot accesible. Escribe tu pregunta y presiona Enter para enviar.",
              true
            );
          }
        }, 300);
      }

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (window.toggleVoiceGuide) {
          window.toggleVoiceGuide();
          // Pequeño delay para que el estado se actualice
          setTimeout(() => {
            const isVoiceEnabled = localStorage.getItem("mecia_voice_guide_enabled") !== "false";
            announce(
              isVoiceEnabled ? "Guía de voz activada" : "Guía de voz desactivada",
              true
            );
          }, 50);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
