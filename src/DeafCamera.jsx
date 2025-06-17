import React, { useRef, useState } from "react";

function DeafCamera() {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraOn(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraOn(false);
  };

  return (
    <div className="camera-container">
      <h3>📷 Camera View</h3>
      <div style={{ marginBottom: "10px" }}>
        {!cameraOn ? (
          <button onClick={startCamera} aria-label="Start camera">
            ▶️ Start Camera
          </button>
        ) : (
          <button onClick={stopCamera} aria-label="Stop camera">
            ⏹️ Stop Camera
          </button>
        )}
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "320px", height: "240px", border: "2px solid #444", filter: "brightness(1.5)"}}
      />
    </div>
  );
}

export default DeafCamera;
