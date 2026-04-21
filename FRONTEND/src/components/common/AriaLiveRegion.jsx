import { useEffect, useState } from "react";

const HIDE_STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function AriaLiveRegion() {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  useEffect(() => {
    const announcer = (message, urgent = false) => {
      const text = `${message || ""}`.trim();
      if (!text) return;

      if (urgent) {
        setAssertive("");
        setTimeout(() => setAssertive(text), 20);
      } else {
        setPolite("");
        setTimeout(() => setPolite(text), 20);
      }
    };

    window.announceToScreenReader = announcer;
    return () => {
      delete window.announceToScreenReader;
    };
  }, []);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" style={HIDE_STYLE}>{polite}</div>
      <div aria-live="assertive" aria-atomic="true" style={HIDE_STYLE}>{assertive}</div>
    </>
  );
}
