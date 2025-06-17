import React, { useEffect, useRef } from "react";
import html2canvas from "html2canvas";

export default function MagnifierToggle({ enabled, toggle }) {
  const lensRef = useRef(null);
  const screenshotRef = useRef(null);
  const zoom = 2;
  const lensSize = 300;

  // Take screenshot, store in ref to avoid re-render loop
  const takeScreenshot = async () => {
    const lens = lensRef.current;
    if (lens) lens.style.display = "none";

    const canvas = await html2canvas(document.body, {
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
    });

    if (lens) lens.style.display = "block";
    screenshotRef.current = canvas.toDataURL();
  };

  useEffect(() => {
    if (!enabled) return;

    takeScreenshot();

    // Debounce screenshot updates
    let timeoutId = null;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => takeScreenshot(), 300);
    };

    window.addEventListener("scroll", handleUpdate);
    window.addEventListener("resize", handleUpdate);

    const handleMouseMove = (e) => {
      const lens = lensRef.current;
      if (!lens || !screenshotRef.current) return;

      const x = e.pageX;
      const y = e.pageY;

      lens.style.left = `${x - lensSize / 2}px`;
      lens.style.top = `${y - lensSize / 2}px`;

      lens.style.backgroundImage = `url(${screenshotRef.current})`;
      lens.style.backgroundSize = `${document.body.scrollWidth * zoom}px ${
        document.body.scrollHeight * zoom
      }px`;

      const bgX = x * zoom - lensSize / 2;
      const bgY = y * zoom - lensSize / 2;
      lens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [enabled]);

  return (
    <>
      <button onClick={toggle} style={{ marginBottom: "1rem" }}>
        {enabled ? "🔍 Disable Magnifier" : "🔎 Enable Magnifier"}
      </button>

      {enabled && (
        <div
          ref={lensRef}
          style={{
            position: "absolute",
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            borderRadius: "50%",
            border: "2px solid #ccc",
            pointerEvents: "none",
            backgroundRepeat: "no-repeat",
            zIndex: 9999,
          }}
        />
      )}
    </>
  );
}

