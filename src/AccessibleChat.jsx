import React, { useState, useRef, useEffect } from "react";
import { createRNNWasmModule } from '@jitsi/rnnoise-wasm';

function AccessibleChat() {
  const [chatLog, setChatLog] = useState([]);
  const [studentInput, setStudentInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [availableMics, setAvailableMics] = useState([]);
  const [preferredMic, setPreferredMic] = useState(null);

  // Initialize STT
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      const speechResult = event.results[0][0].transcript;
      setChatLog((prev) => [...prev, { sender: "Tutor", message: speechResult }]);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);
    };

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mics = devices.filter((device) => device.kind === "audioinput");
      setAvailableMics(mics);
    }).catch((err) => console.error("Error listing microphones:", err));

    recognitionRef.current = recognition;
  }, []);

  const sendQuestion = () => {
    if (studentInput.trim() === "") return;

    setChatLog((prev) => [...prev, { sender: "Student", message: studentInput }]);
    speak(studentInput);
    setStudentInput("");
  };

  const listenForTutor = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
    setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
  };

  const enableEnhancedAudio = async () => {
    try {
      const rnnoise = await createRNNWasmModule(); // auto-loads WASM
      const denoiseState = new rnnoise.DenoiseState(); // ✅ correct constructor

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(480, 1, 1);

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);
        rnnoise.processFrame(denoiseState, input, output);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("🎧 Enhanced hearing mode ON");
    } catch (err) {
      console.error("❌ Could not enable enhanced audio:", err);
    }
  };

  return (
    <div className="accessible-chat" style={styles.chatContainer}>
      <h3>💬 Deaf/Hard-of-Hearing Chat</h3>

      <div style={styles.chatBox}>
        {chatLog.map((entry, idx) => (
          <p key={idx}>
            <strong>{entry.sender}:</strong> {entry.message}
          </p>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          value={studentInput}
          placeholder="Type your question..."
          onChange={(e) => setStudentInput(e.target.value)}
          aria-label="Type your question to the tutor"
          style={styles.input}
        />
        <button onClick={sendQuestion}>🗣 Ask (TTS)</button>
        <button onClick={listenForTutor}>
          {isListening ? "🎤 Listening..." : "🎙 Tutor Reply"}
        </button>

        <label>Select Tutor Microphone:</label>
        <select
          value={preferredMic || ""}
          onChange={(e) => setPreferredMic(e.target.value)}
        >
          <option value="">-- Select a Microphone --</option>
          {availableMics.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || "Unnamed Microphone"}
            </option>
          ))}
        </select>
        <button onClick={enableEnhancedAudio}>🎧 Enable Enhanced Hearing Mode</button>
      </div>
    </div>
  );
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

const styles = {
  chatContainer: {
    border: "2px solid #ccc",
    padding: "10px",
    width: "100%",
    maxWidth: "500px",
    marginTop: "20px",
    background: "#000000",
    borderRadius: "8px"
  },
  chatBox: {
    height: "200px",
    overflowY: "auto",
    padding: "8px",
    border: "1px solid #ddd",
    background: "#0f0f0f",
    marginBottom: "10px"
  },
  inputArea: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  input: {
    padding: "8px",
    fontSize: "1rem"
  }
};

export default AccessibleChat;
