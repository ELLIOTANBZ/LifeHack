import { useState } from 'react'

const DeafNote = () => {
   const [deafNotes, setDeafNotes] = useState("");
    return (
        <section className="deaf-notes" style={{ marginTop: "20px" }}>
            <h3>📝 My Notes</h3>
            <textarea
            value={deafNotes}
            onChange={(e) => setDeafNotes(e.target.value)}
            placeholder="Write your notes here..."
            rows={6}
            style={{
                width: "90%",
                alignContent: "center",
                padding: "10px",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                resize: "vertical",
                backgroundColor: "whitesmoke",
                color: "black"
            }}
        aria-label="Deaf user notes section"
    ></textarea>
  </section>
  )
}

export default DeafNote
