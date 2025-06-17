import React, { useRef, useState } from "react";

function CameraFeed() {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    invert: 0,
    });
  const [showSettings, setShowSettings] = useState(false);

  const canvasRef = useRef(null);

  const takeSnapshot = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (video && canvas) {
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Copy computed filter styles from video
    const filter = getComputedStyle(video).filter;
    ctx.filter = filter; // Apply the same filter to the canvas

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
    style={{
        width: "300px",
        height: "300px",
        border: "2px solid #444",
        filter: `
        brightness(${filters.brightness})
        contrast(${filters.contrast})
        grayscale(${filters.grayscale})
        invert(${filters.invert})
        `,
    }}
    />

    <button onClick={() => setShowSettings(prev => !prev)} style={{ marginBottom: "10px" }}>
        {showSettings ? "⚙️ Hide Vision Settings" : "⚙️ Show Vision Settings"}
    </button>

    {showSettings && (
    <div style={{ marginBottom: "10px" }}>
        <label>Brightness: {filters.brightness.toFixed(1)}</label>
        <input
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={filters.brightness}
        onChange={(e) =>
            setFilters({ ...filters, brightness: parseFloat(e.target.value) })
        }
        />

        <label>Contrast: {filters.contrast.toFixed(1)}</label>
        <input
        type="range"
        min="0"
        max="3"
        step="0.1"
        value={filters.contrast}
        onChange={(e) =>
            setFilters({ ...filters, contrast: parseFloat(e.target.value) })
        }
        />

        <label>Grayscale: {filters.grayscale.toFixed(1)}</label>
        <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={filters.grayscale}
        onChange={(e) =>
            setFilters({ ...filters, grayscale: parseFloat(e.target.value) })
        }
        />

        <label>Invert: {filters.invert.toFixed(1)}</label>
        <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={filters.invert}
        onChange={(e) =>
            setFilters({ ...filters, invert: parseFloat(e.target.value) })
        }
        />
    </div>
    )}



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

