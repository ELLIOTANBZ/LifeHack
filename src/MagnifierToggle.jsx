import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

function MagnifierToggle({ enabled, toggle }) {
  const lensRef = useRef(null);
  const [screenshot, setScreenshot] = useState(null);
  const [showLens, setShowLens] = useState(enabled);
  const zoom = 2;

  useEffect(() => {
    if (!enabled) return;

    const refreshScreenshot = async () => {
      setShowLens(false); // Completely remove from DOM
      await takeScreenshot(setScreenshot);
      setShowLens(true); // Put back in DOM after capture
    };

    refreshScreenshot(); // Initial load

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

    const handleRefresh = () => refreshScreenshot();
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleRefresh);
    window.addEventListener("resize", handleRefresh);

    const interval = setInterval(refreshScreenshot, 5000);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleRefresh);
      window.removeEventListener("resize", handleRefresh);
      clearInterval(interval);
    };
  }, [enabled, screenshot]);

  return (
    <>
      <button onClick={toggle} style={{ marginBottom: "1rem" }}>
        {enabled ? "🔍 Disable Magnifier" : "🔎 Enable Magnifier"}
      </button>

      {enabled && showLens && (
        <div
          ref={lensRef}
          data-magnifier-lens
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            border: "3px solid #ccc",
            pointerEvents: "none",
            backgroundRepeat: "no-repeat",
            overflow: "hidden",
            zIndex: 9999,
          }}
        />
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
    useCORS: true,
  });

  const dataURL = canvas.toDataURL();
  setScreenshot(dataURL);
};

export default MagnifierToggle;
