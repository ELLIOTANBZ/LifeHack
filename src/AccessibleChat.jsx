import React, { useState, useRef, useEffect } from "react";
import { createRNNWasmModule } from '@jitsi/rnnoise-wasm';

function AccessibleChat() {
  const [chatLog, setChatLog] = useState([]);
  const [studentInput, setStudentInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [availableMics, setAvailableMics] = useState([]);
  const [preferredMic, setPreferredMic] = useState(null);

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
      await generateSignLanguageVideo?.(speechResult);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);
    };

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mics = devices.filter((device) => device.kind === "audioinput");
      setAvailableMics(mics);
    })
    .catch((err) => console.error("Error listing microphones:", err));

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
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div className="accessible-chat" style={styles.chatContainer}>
      <h3 style={styles.heading}>💬 Deaf/Hard-of-Hearing Chat</h3>

      <div style={styles.chatBox}>
        {chatLog.map((entry, idx) => (
          <p key={idx} style={entry.sender === "Tutor" ? styles.tutorMessage : styles.studentMessage}>
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
        <div style={styles.buttonRow}>
          <button style={styles.button} onClick={sendQuestion}>🗣 Ask (TTS)</button>
          <button style={styles.button} onClick={listenForTutor}>
            {isListening ? "🎤 Listening..." : "🎙 Tutor Reply"}
          </button>
        </div>

        <label htmlFor="mic-select" style={styles.label}>Select Tutor Microphone:</label>
        <select
          id="mic-select"
          value={preferredMic || ""}
          onChange={(e) => setPreferredMic(e.target.value)}
          style={styles.select}
        >
          <option value="">-- Select a Microphone --</option>
          {availableMics.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || "Unnamed Microphone"}
            </option>
          ))}
        </select>
        <button style={{...styles.button, marginTop: '10px'}} onClick={enableEnhancedAudio}>🎧 Enable Enhanced Hearing Mode</button>
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
    border: "2px solid #4A90E2",
    padding: "15px",
    width: "100%",
    maxWidth: "500px",
    marginTop: "20px",
    background: "#121212",
    borderRadius: "10px",
    color: "#e0e0e0",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxShadow: "0 0 10px #4A90E2"
  },
  heading: {
    marginBottom: "12px",
    color: "#4A90E2",
    textAlign: "center",
    fontWeight: "600",
  },
  chatBox: {
    height: "220px",
    overflowY: "auto",
    padding: "10px",
    border: "1px solid #333",
    background: "#1e1e1e",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "0.95rem",
    lineHeight: "1.4"
  },
  tutorMessage: {
    color: "#81d4fa",
    marginBottom: "8px"
  },
  studentMessage: {
    color: "#f48fb1",
    marginBottom: "8px"
  },
  inputArea: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  input: {
    padding: "10px",
    fontSize: "1.1rem",
    borderRadius: "6px",
    border: "1px solid #4A90E2",
    backgroundColor: "#222",
    color: "#eee",
  },
  buttonRow: {
    display: "flex",
    gap: "10px"
  },
  button: {
    backgroundColor: "#4A90E2",
    border: "none",
    borderRadius: "6px",
    padding: "10px 15px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1,
    transition: "background-color 0.3s ease",
  },
  label: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  select: {
    padding: "8px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #4A90E2",
    backgroundColor: "#222",
    color: "#eee",
  }
};

async function enableEnhancedAudio() {
  try {
    const rnnoiseModule = await createRNNWasmModule();
    const denoiseState = rnnoiseModule.createDenoiseState();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(480, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);

      const frame = new Float32Array(input);

      denoiseState.processFrame(frame);

      for (let i = 0; i < frame.length; i++) {
        output[i] = frame[i];
      }
    };

    console.log("🎧 RNNoise enhanced audio activated");
  } catch (err) {
    console.error("RNNoise initialization failed:", err);
  }
}

export default AccessibleChat;
