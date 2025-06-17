import React, { useRef, useState } from "react";

function CameraFeed() {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("none");

  const canvasRef = useRef(null);

  const takeSnapshot = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (video && canvas) {
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };
  
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
        style={{ width: "320px", height: "240px", border: "2px solid #444", filter: getFilterCSS(selectedFilter) }}
      />

      <select
        aria-label="Select vision support mode"
        onChange={(e) => setSelectedFilter(e.target.value)}
        value={selectedFilter}>
            <option value="none">Normal</option>
            <option value="invert">Invert Colors</option>
            <option value="grayscale">Grayscale</option>
            <option value="low-brightness">Reduce Brightness</option>
            <option value="high-contrast">High Contrast</option>
      </select>


      {cameraOn && (
        <>
          <button onClick={takeSnapshot} aria-label="Take snapshot">
            📸 Take Snapshot
          </button>
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              marginTop: "10px",
              border: "1px solid #999",
              width: "320px",
              height: "auto"
            }}
          />
        </>
      )}
    </div>
  );
}

export default CameraFeed;

function getFilterCSS(mode) {
  switch (mode) {
    case "invert":
      return "invert(1)";
    case "grayscale":
      return "grayscale(1)";
    case "low-brightness":
      return "brightness(0.6)";
    case "high-contrast":
      return "contrast(1.5)";
    case "protanopia":
      return "url('#protanopia-filter')"; // Advanced: use SVG or WebGL
    case "deuteranopia":
      return "url('#deuteranopia-filter')";
    default:
      return "none";
  }
}

