import React, { useState, useEffect } from "react";
import './AccessibilityPanel.css';

export default function AccessibilityPanel() {
  const [fontSize, setFontSize] = useState(100);
  const [contrast, setContrast] = useState(false);

  useEffect(() => {
    document.body.style.fontSize = `${fontSize}%`;
    document.body.classList.toggle('high-contrast', contrast);
  }, [fontSize, contrast]);

  return (
    <div className="accessibility-panel">
      <h3>Accessibility Settings</h3>

      <label>
        Font Size:
        <input
          type="range"
          min="80"
          max="200"
          step="10"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        />
        {fontSize}%
      </label>

      <label>
        <input
          type="checkbox"
          checked={contrast}
          onChange={() => setContrast(!contrast)}
        />
        High Contrast Mode
      </label>
    </div>
  );
}