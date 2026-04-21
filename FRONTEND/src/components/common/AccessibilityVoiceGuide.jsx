import { useEffect, useRef, useState } from "react";
import { llmService } from "@/services/llmService";

const STORAGE_KEY = "mecia_voice_guide_enabled";
const COOLDOWN_MS = 1200;

function getElementLabel(element) {
  if (!element) return "";

  const explicit =
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.getAttribute("placeholder") ||
    element.getAttribute("alt");

  if (explicit && explicit.trim()) return explicit.trim();

  if (element.id) {
    const label = document.querySelector(`label[for=\"${element.id}\"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }

  const text = element.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 120);

  return element.tagName?.toLowerCase() || "elemento";
}

export default function AccessibilityVoiceGuide() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== "false");
  const [status, setStatus] = useState("Guia de voz activa");
  
  // Voz predeterminada - Nova es clara y natural para usuarios ciegos
  const voice = "nova";
  const language = "es-CO";

  const lastTextRef = useRef("");
  const lastAtRef = useRef(0);
  const audioRef = useRef(null);
  const urlRef = useRef("");
  const cacheRef = useRef(new Map());
  const focusTimerRef = useRef(null);
  const enabledRef = useRef(enabled);
  const speakSeqRef = useRef(0);
  const abortControllerRef = useRef(null);

  const cleanupAudio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    urlRef.current = "";
  };

  const speak = async (message) => {
    const text = `${message || ""}`.trim();
    if (!enabledRef.current || !text) return;

    const now = Date.now();
    if (text === lastTextRef.current && now - lastAtRef.current < COOLDOWN_MS) return;

    // Identificador de solicitud para descartar respuestas tardias.
    const mySeq = ++speakSeqRef.current;

    lastTextRef.current = text;
    lastAtRef.current = now;
    setStatus(`Leyendo: ${text}`);

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const cacheKey = `${voice}:${language}:${text}`;
      let objectUrl = cacheRef.current.get(cacheKey);

      if (!objectUrl) {
        const blob = await llmService.textToSpeech({
          text,
          voice,
          language,
          signal: abortControllerRef.current.signal,
        });

        if (!enabledRef.current || mySeq !== speakSeqRef.current) return;
        objectUrl = URL.createObjectURL(blob);
        cacheRef.current.set(cacheKey, objectUrl);
      }

      if (!enabledRef.current || mySeq !== speakSeqRef.current) return;

      cleanupAudio();
      urlRef.current = objectUrl;
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      if (error?.name === "AbortError") return;

      // Fallback local del navegador para mejorar tiempos de respuesta.
      try {
        if (enabledRef.current && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language;
          window.speechSynthesis.speak(utterance);
          setStatus(`Leyendo (local): ${text}`);
          return;
        }
      } catch (_) {
        // Ignorar fallback errors
      }

      setStatus("Guia de voz disponible, pero TTS no responde");
    }
  };

  useEffect(() => {
    enabledRef.current = enabled;
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");

    if (!enabled) {
      speakSeqRef.current += 1;
      clearTimeout(focusTimerRef.current);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      cleanupAudio();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("Guia de voz desactivada");
      cleanupAudio();
      return undefined;
    }

    setStatus("Guia de voz activa");

    const onFocusIn = (event) => {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => {
        if (!enabledRef.current) return;
        const label = getElementLabel(event.target);
        if (label) void speak(label);
      }, 120);
    };

    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      clearTimeout(focusTimerRef.current);
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, [enabled, voice]);

  useEffect(() => {
    return () => {
      cleanupAudio();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      cacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    };
  }, []);

  // Exponer función global para alternar la voz
  useEffect(() => {
    window.toggleVoiceGuide = () => {
      setEnabled((prev) => !prev);
    };
    return () => {
      delete window.toggleVoiceGuide;
    };
  }, []);

  return (
    <div className="voice-guide-fab">
      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        aria-pressed={enabled}
        aria-label={enabled ? "Desactivar guia de voz" : "Activar guia de voz"}
        className={`voice-guide-btn${enabled ? " is-on" : " is-off"}`}
      >
        <span className="voice-guide-icon" aria-hidden="true">🔊</span>
        <span className="voice-guide-label">{enabled ? "Voz ON" : "Voz OFF"}</span>
      </button>

      <span className="sr-only" aria-live="polite">{status}</span>
    </div>
  );
}
