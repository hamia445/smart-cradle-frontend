import React, { useState } from "react";
import { Play, Square, VideoOff, Radio, ShieldCheck, Activity } from "lucide-react";
import "./Monitoring.css"; 
const Monitoring = ({ lang = "en" }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  

  const streamUrl = "http://10.149.128.217/stream";


  const text = {
    en: {
      title: "Live Baby Monitor",
      start: "START VIDEO",
      stop: "STOP VIDEO",
      offline: "Camera is on Standby",
      secure: "Local Network Secure Stream",
      save: "Saves battery & bandwidth when off"
    },
    ur: {
      title: "لائیو مانیٹرنگ",
      start: "ویڈیو شروع کریں",
      stop: "ویڈیو بند کریں",
      offline: "کیمرہ ابھی سٹینڈ بائے پر ہے",
      secure: "محفوظ لوکل نیٹ ورک سٹریم",
      save: "بند ہونے پر بیٹری اور انٹرنیٹ کی بچت"
    }
  };

  const t = text[lang] || text.en;

  return (
    <div className="monitoring-wrapper">
      
      
      <div className="monitoring-header">
        <h2 className="monitoring-title">
          <Radio size={20} color={isStreaming ? "#ff4757" : "gray"} />
          {t.title}
        </h2>
        

        {isStreaming && (
          <div className="live-badge pulse-blink">
            <Activity size={14} /> LIVE
          </div>
        )}
      </div>

    
      <div className={`video-player-card ${isStreaming ? 'active-stream' : 'inactive-stream'}`}>
        {isStreaming ? (
        
          <img 
            src={streamUrl} 
            alt="Live Baby Stream" 
            className="stream-image"
          />
        ) : (
          /* Offline State */
          <div className="offline-state">
            <VideoOff size={50} className="offline-icon" />
            <p className="offline-title">{t.offline}</p>
            <p className="offline-sub">{t.save}</p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="controls-container">
        {!isStreaming ? (
          <button onClick={() => setIsStreaming(true)} className="mon-btn btn-start">
            <Play size={22} fill="currentColor" /> {t.start}
          </button>
        ) : (
          <button onClick={() => setIsStreaming(false)} className="mon-btn btn-stop">
            <Square size={22} fill="currentColor" /> {t.stop}
          </button>
        )}
      </div>

      {/* Security Info Banner */}
      <div className="security-banner">
        <ShieldCheck size={16} color="#00C9FF" />
        {t.secure} • {streamUrl.split('/')[2]}
      </div>

    </div>
  );
};

export default Monitoring;