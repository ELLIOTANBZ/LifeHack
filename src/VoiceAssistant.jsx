import { useEffect, useRef, useState } from "react";

export default function VoiceAssistant({ setUserMode, setShowChat, setMagnifier, toggleCamera, startCamera, stopCamera, takeSnapshot, adjustFilter }) {
  const recognitionRef = useRef(null);
  const [active, setActive] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("Browser does not support Speech Recognition");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("🗣 Voice Command Received:", transcript);

      if (transcript.includes("blind")) {
        setUserMode("blind");
        speak("Blind mode activated");
      }
      else if (transcript.includes("deaf")) {
        setUserMode("deaf");
        speak("Deaf mode activated");
      }
      else if (transcript.includes("enable magnifier")) {
        setMagnifier(true);
        speak("Magnifier enabled");
      }
      else if (transcript.includes("disable magnifier")) {
        setMagnifier(false);
        speak("Magnifier disabled");
      }
      else if (transcript.includes("magnifier")) {
        setMagnifier(prev => !prev);
        speak("Magnifier toggled");
      }
      else if (transcript.includes("start camera")) {
        console.log("🔔 Voice command: START CAMERA")
        startCamera().then(() => speak("Camera started"));
      }
      else if (transcript.includes("stop camera")) {
        stopCamera();
        speak("Camera stopped");
      }
      else if (transcript.includes("snapshot") || transcript.includes("screenshot")) {
        takeSnapshot();
        speak("Snapshot taken");
      }
      else if (transcript.includes("increase brightness")) adjustFilter("brightness", 0.1);
      else if (transcript.includes("decrease brightness")) adjustFilter("brightness", -0.1);
      else if (transcript.includes("increase contrast")) adjustFilter("contrast", 0.1);
      else if (transcript.includes("decrease contrast")) adjustFilter("contrast", -0.1);
      else if (transcript.includes("increase grayscale")) adjustFilter("grayscale", 0.1);
      else if (transcript.includes("decrease grayscale")) adjustFilter("grayscale", -0.1);
      else if (transcript.includes("increase invert")) adjustFilter("invert", 0.1);
      else if (transcript.includes("decrease invert")) adjustFilter("invert", -0.1);
    };

    recognition.onerror = (e) => console.error("❌ Voice Assistant Error:", e);

    recognitionRef.current = recognition;
  }, [setUserMode, setShowChat, setMagnifier, toggleCamera, startCamera, stopCamera, takeSnapshot, adjustFilter]);

  // Start/Stop recognition based on active toggle
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (active) {
      try {
        recognition.start();
        console.log("✅ Speech recognition started");
      } catch (err) {
        console.warn("⚠️ Recognition already started or failed:", err.message);
      }
    } else {
      recognition.stop();
      console.log("🛑 Speech recognition stopped");
    }
  }, [active]);

  // Listen to spacebar key
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setActive(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      backgroundColor: active ? '#4caf50' : '#999',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '999px',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      zIndex: 9999
    }}>
      {active ? "🎙 Listening (Spacebar to stop)" : "🛑 Not Listening (Press Spacebar)"}
    </div>
  );
}
