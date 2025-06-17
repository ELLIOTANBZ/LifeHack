import React, { useState, useRef, useEffect } from "react";
import { createRNNWasmModule } from '@jitsi/rnnoise-wasm';

function AccessibleChat() {
  const [chatLog, setChatLog] = useState([]);
  const [studentInput, setStudentInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [availableMics, setAvailableMics] = useState([]);
  const [preferredMic, setPreferredMic] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [signVideoUrl, setSignVideoUrl] = useState("");

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
      await generateSignLanguageVideo(speechResult);
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

    // Add to chat log
    setChatLog((prev) => [...prev, { sender: "Student", message: studentInput }]);

    // Speak it out loud
    speak(studentInput);

    // Clear input
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
      <h3>💬 Deaf/Hard-of-Hearing Chat</h3>

      <div style={styles.chatBox}>
        {chatLog.map((entry, idx) => (
          <p key={idx}>
            <strong>{entry.sender}:</strong> {entry.message}
          </p>
        ))}
      </div>

    {signVideoUrl && (<div style={{ marginTop: "15px" }}>
        <h4>Sign Language Interpretation</h4>
        <video
        src={signVideoUrl}
        controls
        autoPlay
        style={{ maxWidth: "100%", border: "2px solid #ccc" }}
        />
    </div>
    )}


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

async function enableEnhancedAudio() {
  try {
    const rnnoiseModule = await createRNNWasmModule();
    const denoiseState = rnnoiseModule.createDenoiseState();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(480, 1, 1); // RNNoise frame = 480

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);

      // Copy input to frame for RNNoise
      const frame = new Float32Array(input);

      // Process with RNNoise (in-place modification)
      denoiseState.processFrame(frame);

      // Write back to output
      for (let i = 0; i < frame.length; i++) {
        output[i] = frame[i];
      }
    };

    console.log("🎧 RNNoise enhanced audio activated");
  } catch (err) {
    console.error("RNNoise initialization failed:", err);
  }
}

function generateSignLanguageVideo(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("hello")) {
    setSignVideoUrl("/videos/hello.mp4");
  } else if (lowerText.includes("how are you")) {
    setSignVideoUrl("/videos/how_are_you.mp4");
  } else {
    setSignVideoUrl("/videos/default.mp4");
  }
}


export default AccessibleChat;
