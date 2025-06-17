import React, { useState, useEffect, useRef } from "react";
import './App.css';
import CameraFeed from "./CameraFeed.jsx";
import FileToSpeech from "./FileToSpeech";
import AccessibleChat from "./AccessibleChat.jsx";
import MagnifierToggle from "./MagnifierToggle.jsx";
import DeafNote from "./DeafNote.jsx";

function App() {
  const [userMode, setUserMode] = useState('blind'); 
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState("Waiting for tutor speech...");
  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const recognitionRef = useRef(null);

  // Request mic access
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }).catch(err => {
      console.error("Mic permission denied or unavailable:", err);
    });
  }, []);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser doesn't support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (!result[0] || result[0].transcript.trim().length < 2) continue;
        if (result.isFinal) {
          setTranscript(prev => prev + " " + result[0].transcript);
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        setTranscript(prev => prev + " " + interim);
      }
    };

    recognition.onerror = (event) => console.error("Speech recognition error", event);
    recognitionRef.current = recognition;
  }, []);

  // Toggle mic
  const toggleMic = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.onend = null;
      recognition.stop();
      setIsListening(false);
      setTranscript(prev => prev + " ⏹️ Mic stopped.");
    } else {
      recognition.onend = () => {
        if (isListening) recognition.start();
      };
      recognition.start();
      setTranscript("🎙 Listening...");
      setIsListening(true);
    }
  };

  // Speech output for deaf users
  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1 id="main-title">Equal Ground - Accessible Tutorials</h1>
        <div className="mode-buttons">
          <button
            aria-label={userMode === 'blind' ? 'Disable Blind Mode' : 'Enable Blind Mode'}
            onClick={() => setUserMode(userMode === 'blind' ? null : 'blind')}
          >
            {userMode === 'blind' ? '👁️ Blind Mode ON' : 'Blind Mode'}
          </button>
          <button
            aria-label={userMode === 'deaf' ? 'Disable Deaf Mode' : 'Enable Deaf Mode'}
            onClick={() => setUserMode(userMode === 'deaf' ? null : 'deaf')}
          >
            {userMode === 'deaf' ? '🦻 Deaf Mode ON' : 'Deaf Mode'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {userMode === 'blind' && (
  <>
    <div className="blind-tools-row">
      <div className="tool-box no-border">
        <MagnifierToggle />
      </div>

      <div className="tool-box no-border">
        <button onClick={() => setShowCamera(prev => !prev)}>
          {showCamera ? "🔒 Close Camera Section" : "📷 Camera Section"}
        </button>
        {showCamera && (
          <div>
            <CameraFeed />
          </div>
        )}
      </div>
    </div>

    <div className="section-box">
      <FileToSpeech />
    </div>
  </>
)}




{userMode === 'deaf' && (
  <>
    <div className="section-box">
      <button onClick={() => setShowChat(!showChat)}>💬 Ask Tutor a Question</button>
      {showChat && <AccessibleChat />}
    </div>

    <div className="section-box transcript-area">
      <h3>Live Transcript</h3>
      <p>{transcript}</p>
      <button onClick={toggleMic}>
        {isListening ? "🛑 Stop Mic" : "🎤 Start Mic"}
      </button>
    </div>

    <div className="section-box speak-to-tutor">
      <h3>Deaf User Talk</h3>
      <label htmlFor="deafTextInput">Type your message   </label>
      <input
        id="deafTextInput"
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
      />
      <button onClick={() => speak(textInput)}>🗣 Speak to Tutor</button>
    </div>

    <div className="section-box">
      <DeafNote />
    </div>

    <div className="section-box">
      <button onClick={() => setShowCamera(prev => !prev)}>
        {showCamera ? "🔒 Close Camera" : "📷 I can't see my interpreter clearly"}
      </button>
      {showCamera && <CameraFeed />}
    </div>
  </>
)}
      </main>
    </div>
  );
}

export default App;
