import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

function MagnifierToggle() {
    const [enabled, setEnabled] = useState(false);
    const lensRef = useRef(null);
    const [screenshot, setScreenshot] = useState(null);

    const zoom = 2;

    useEffect(() => {
    if (!enabled) return;

    const captureAndSetScreenshot = () => {
        takeScreenshot(setScreenshot);
    };

    // Take initial screenshot
    captureAndSetScreenshot();

    const handleMouseMove = (e) => {
        const lens = lensRef.current;
        if (!lens || !screenshot) return;

        const lensSize = 300;
        const x = e.clientX;
        const y = e.clientY;

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        lens.style.left = `${x - lensSize / 2}px`;
        lens.style.top = `${y - lensSize / 2}px`;

        lens.style.backgroundImage = `url(${screenshot})`;
        lens.style.backgroundSize = `${document.documentElement.scrollWidth * zoom}px ${document.documentElement.scrollHeight * zoom}px`;

        const bgX = (x + scrollX) * zoom - lensSize / 2;
        const bgY = (y + scrollY) * zoom - lensSize / 2;

        lens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    // Attach listeners
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", captureAndSetScreenshot);
    window.addEventListener("resize", captureAndSetScreenshot);

    // Clean up
    return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("scroll", captureAndSetScreenshot);
        window.removeEventListener("resize", captureAndSetScreenshot);
    };
    }, [enabled, screenshot]);

  return (
    <>
      <button onClick={() => setEnabled((prev) => !prev)} style={{ marginBottom: "1rem" }}>
        {enabled ? "🔍 Disable Magnifier" : "🔎 Enable Magnifier"}
      </button>

      {enabled && (
        <div
          ref={lensRef}
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            border: "3px solid #ccc",
            pointerEvents: "none",
            backgroundRepeat: "no-repeat",
            overflow: 'hidden',
            zIndex: 9999
          }}
        ></div>
      )}
    </>
  );
}

const takeScreenshot = async (setScreenshot) => {
  const canvas = await html2canvas(document.body, {
  scrollX: 0,
  scrollY: 0,
  windowWidth: document.documentElement.scrollWidth,
  windowHeight: document.documentElement.scrollHeight,
  useCORS: true  // Optional: useful if you have images from other domains
});


  const dataURL = canvas.toDataURL();
  setScreenshot(dataURL);
};

export default MagnifierToggle;

