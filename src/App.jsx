import React, { useState, useEffect, useRef } from "react";
import './App.css';
import CameraFeed from "./CameraFeed.jsx";
import FileToSpeech from "./FileToSpeech";
import AccessibleChat from "./AccessibleChat.jsx";
import MagnifierToggle from "./MagnifierToggle.jsx";
import DeafNote from "./DeafNote.jsx";
import VoiceAssistant from "./VoiceAssistant.jsx";

function App() {
  const [userMode, setUserMode] = useState('blind'); 
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState("Waiting for tutor speech...");
  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [magnifier, setMagnifier] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [filters, setFilters] = useState({ brightness: 1, contrast: 1, grayscale: 0, invert: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraOn(true);
      }
    } catch (err) {
      console.error("Error starting camera:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    setCameraOn(false);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  };

  const adjustFilter = (key, delta) => {
    setFilters(prev => {
      const newValue = Math.min(Math.max(prev[key] + delta, 0), key === 'contrast' ? 3 : 2);
      return { ...prev, [key]: parseFloat(newValue.toFixed(1)) };
    });
  };

  const recognitionRef = useRef(null);

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

  useEffect(() => {
    console.log("🦻 userMode changed:", userMode);
  }, [userMode]);

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
        if (isListening) {
          recognition.start(); 
        }
      };
      recognition.start();
      setTranscript("🎙 Listening...");
      setIsListening(true);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
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
        <VoiceAssistant 
          setUserMode={setUserMode} 
          setShowChat={setShowChat} 
          setMagnifier={setMagnifier} 
          toggleCamera={() => setShowCamera(prev => !prev)}
          startCamera={startCamera}
          stopCamera={stopCamera}
          takeSnapshot={takeSnapshot}
          adjustFilter={adjustFilter}
        />

        {userMode === 'blind' && (
          <>
            <div className="blind-tools-row">
              <div className="tool-box no-border">
                <MagnifierToggle enabled={magnifier} toggle={() => setMagnifier(prev => !prev)} />
              </div>
              <div className="tool-box no-border">
                <button onClick={() => setShowCamera(prev => !prev)}>
                  {showCamera ? "🔒 Close Camera Section" : "📷 Camera Section"}
                </button>
                {showCamera && (
                  <div>
                    <CameraFeed
                      videoRef={videoRef}
                      canvasRef={canvasRef}
                      cameraOn={cameraOn}
                      startCamera={startCamera}
                      stopCamera={stopCamera}
                      takeSnapshot={takeSnapshot}
                      filters={filters}
                      setFilters={setFilters}
                    />
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
            
              <DeafNote />
            
          </>
        )}
      </main>
    </div>
  );
}

export default App;