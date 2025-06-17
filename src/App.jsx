import React, { useState, useEffect, useRef } from "react";
import './App.css';
import CameraFeed from "./CameraFeed.jsx";
import FileToSpeech from "./FileToSpeech";
import AccessibleChat from "./AccessibleChat.jsx";
import MagnifierToggle from "./MagnifierToggle.jsx";

function App() {
  const [userMode, setUserMode] = useState('blind'); 
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState("Waiting for tutor speech...");
  const [isListening, setIsListening] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [showChat, setShowChat] = useState(false);


  const recognitionRef = useRef(null);

  // Request mic with noise suppression
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }).catch((err) => {
      console.error("Mic permission denied or unavailable:", err);
    });
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Sorry, your browser doesn't support Speech Recognition.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const speechResult = event.results[i];

        if (!speechResult[0] || speechResult[0].transcript.trim().length < 2) continue;

        if (speechResult.isFinal) {
          setTranscript((prev) => prev + " " + speechResult[0].transcript);
        } else {
          interimTranscript += speechResult[0].transcript;
        }
      }

      if (interimTranscript) {
        setTranscript((prev) => prev + " " + interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
    };

    recognitionRef.current = recognition;
  }, []);

const toggleMic = () => {
  const recognition = recognitionRef.current;
  if (!recognition) return;

  if (isListening) {
    recognition.onend = null; 
    recognition.stop();
    setIsListening(false);
    setTranscript((prev) => prev + " ⏹️ Mic stopped.");
  } else {
    recognition.onend = () => {
      if (isListening) {
        recognition.start(); 
      }
    };
    recognition.start();
    setTranscript("🎙 Listening...");
    setIsListening(true);
  }
};


  return (
    <div className="App">
      <header className="app-header">
        <h1>Equal Ground - Accessible Tutorials</h1>
        <button
          aria-label="Toggle Blind Mode"
          onClick={() => setUserMode(userMode === 'blind' ? null : 'blind')}
        >
          {userMode === 'blind' ? '👁️ Blind Mode ON' : 'Blind Mode'}
        </button>

    <button
      aria-label="Toggle Deaf Mode"
      onClick={() => setUserMode(userMode === 'deaf' ? null : 'deaf')}
    >
      {userMode === 'deaf' ? '🦻 Deaf Mode ON' : 'Deaf Mode'}
    </button>
      </header>

      <main className="app-main">
        {userMode === 'blind' && (
          <>
          <MagnifierToggle/>
          <CameraFeed/>
          <FileToSpeech/>
          </>
        )}

        {userMode === 'deaf' && (
          <>
            <button onClick={() => setShowChat(!showChat)}>💬 Ask Tutor a Question</button>
            {showChat && <AccessibleChat />}
        

            <section className="transcript-area" aria-live="polite">
              <h3>Live Transcript</h3>
              <p>{transcript}</p>
              <button onClick={toggleMic}>
                {isListening ? "🛑 Stop Mic" : "🎤 Start Mic"}
              </button>
            </section>

            <section className="speak-to-tutor">
              <h3>Deaf User Talk</h3>
              <input
                type="text"
                aria-label="Type your message"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button onClick={() => speak(textInput)}>🗣 Speak to Tutor</button>
            </section>
          </>
          )}
      </main>
    </div>
  );
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

export default App;
