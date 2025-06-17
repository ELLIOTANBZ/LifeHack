import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

function MagnifierToggle() {
  const [enabled, setEnabled] = useState(false);
  const lensRef = useRef(null);
  const [screenshot, setScreenshot] = useState(null);
  const zoom = 2;
  const lensSize = 300;

  const takeScreenshot = async () => {
    const lens = lensRef.current;
    if (lens) lens.style.display = 'none';
    
    const canvas = await html2canvas(document.body, {
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
    });
    if (lens) lens.style.display = "block";
    setScreenshot(canvas.toDataURL());
  };

  useEffect(() => {
    if (!enabled) return;

    takeScreenshot();

    const handleUpdate = () => takeScreenshot();
    window.addEventListener("scroll", handleUpdate);
    window.addEventListener("resize", handleUpdate);

    const handleMouseMove = (e) => {
      const lens = lensRef.current;
      if (!lens || !screenshot) return;

      const x = e.pageX;
      const y = e.pageY;

      lens.style.left = `${x - lensSize / 2}px`;
      lens.style.top = `${y - lensSize / 2}px`;

      lens.style.backgroundImage = `url(${screenshot})`;
      lens.style.backgroundSize = `${document.body.scrollWidth * zoom}px ${document.body.scrollHeight * zoom}px`;

      const bgX = x * zoom - lensSize / 2;
      const bgY = y * zoom - lensSize / 2;
      lens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      document.removeEventListener("mousemove", handleMouseMove);
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
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            borderRadius: "50%",
            border: "2px solid #ccc",
            pointerEvents: "none",
            backgroundRepeat: "no-repeat",
            zIndex: 9999
          }}
        ></div>
      )}
    </>
  );
}

export default MagnifierToggle;
