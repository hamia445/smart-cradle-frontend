import React, { useState } from "react";

export default function Settings() {
  const [threshold, setThreshold] = useState(30);

  return (
    <div className="card">
      <h3>Settings</h3>

      <label>Temperature Threshold</label>
      <input
        type="range"
        min="20"
        max="40"
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
      />

      <p>{threshold} °C</p>
    </div>
  );
}
