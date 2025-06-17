import React, { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function FileToSpeech() {
  const [extractedText, setExtractedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "txt") {
      const text = await file.text();
      setExtractedText(text);
    } else if (fileType === "pdf") {
      const text = await extractPdfText(file);
      setExtractedText(text);
    } else if (fileType === "docx") {
      const text = await extractDocxText(file);
      setExtractedText(text);
    } else {
      alert("Unsupported file type.");
    }
  };

  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      text += pageText + "\n";
    }
    return text;
  };

  const extractDocxText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const speakText = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(extractedText);
    utteranceRef.current = utterance;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  };

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const stopSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="file-to-speech">
      <h3>📂 Upload File & Read Aloud</h3>
      <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileChange} />

      {extractedText && (
        <>
          <div style={{ marginTop: "10px" }}>
            <button onClick={speakText}>🔊 Read Aloud</button>
            <button onClick={pauseSpeech}>⏸ Pause</button>
            <button onClick={resumeSpeech}>▶️ Resume</button>
            <button onClick={stopSpeech}>⏹ Stop</button>
          </div>

          <pre style={{ whiteSpace: "pre-wrap", background: "#000000", padding: "10px", marginTop: "10px" }}>
            {extractedText}
          </pre>
        </>
      )}
    </div>
  );
}

export default FileToSpeech;
