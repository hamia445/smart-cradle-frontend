import React, { useState, useEffect, useRef } from "react";
import { 
  Baby, Wifi, WifiOff, Smile, Thermometer, Waves, 
  Power, SlidersHorizontal, Home, BarChart2, Settings as SettingsIcon, 
  AlertCircle, Mic, MicOff, Battery, Zap, Clock, Timer as TimerIcon,
  Droplets, Eye 
} from "lucide-react";
import { auth, db } from "../firebase";
import { ref, set, onValue, push, serverTimestamp, update, query, limitToLast, orderByChild, equalTo } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import SettingsPage from "./Settings"; 
import Monitoring from "./Monitoring";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [speed, setSpeed] = useState("Medium");
  const [isRocking, setIsRocking] = useState(false);
  const [prediction, setPrediction] = useState("sleeping"); 
  const [confidence, setConfidence] = useState(0);
  const [liveTemp, setLiveTemp] = useState(25);
  const [liveHumidity, setLiveHumidity] = useState(50); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState(Date.now());
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const [babyInfo, setBabyInfo] = useState({ name: "", dob: "", gender: "Boy" });
  const [showSetup, setShowSetup] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  
  const [cryLogs, setCryLogs] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  const userId = auth.currentUser?.uid;
  const recognitionRef = useRef(null);
  
  const lastAlertRef = useRef({ temp: null, humidity: null, status: null });

  const text = {
    en: { 
      online: "Online", offline: "Offline", sleeping: "Resting Quietly", 
      temp: "TEMPERATURE", motion: "MOTION", humidity: "HUMIDITY", stop: "STOP CRADLE", 
      start: "START CRADLE", history: "Analytics", settings: "Settings", 
      home: "Home", voiceActive: "Listening...", battery: "Battery",
      controls: "CONTROLS", cryHistory: "Cry History", noRecords: "No records found.",
      setupTitle: "Baby Details", setupSub: "Enter baby details to complete registration",
      namePh: "Baby Name", dobPh: "Date of Birth",
      genderPh: "Select Gender", boy: "Boy", girl: "Girl", saveBtn: "Save & Continue",
      low: "Low", medium: "Medium", high: "High", monitoring: "Monitoring"
    },
    ur: { 
      online: "آن لائن", offline: "آف لائن", sleeping: "پرسکون نیند", 
      temp: "درجہ حرارت", motion: "حرکت", humidity: "نمی", stop: "جھولا روکیں", 
      start: "جھولا چلائیں", history: "تجزیہ", settings: "ترتیبات", 
      home: "ہوم", voiceActive: "سن رہا ہوں...", battery: "بیٹری",
      controls: "کنٹرولز", cryHistory: "رونے کا ریکارڈ", noRecords: "کوئی ریکارڈ نہیں ملا",
      setupTitle: "بچے کی تفصیلات", setupSub: "رجسٹریشن مکمل کرنے کے لیے بچے کی تفصیلات درج کریں",
      namePh: "بچے کا نام", dobPh: "تاریخ پیدائش",
      genderPh: "جنس منتخب کریں", boy: "لڑکا", girl: "لڑکی", saveBtn: "محفوظ کریں",
      low: "کم", medium: "درمیانہ", high: "تیز", monitoring: "نگرانی"
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastAlertRef.current = { temp: null, humidity: null, status: null };
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const triggerNotification = (title, bodyText) => {
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: bodyText,
        icon: "/logo192.png",
      });
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = lang === "ur" ? "ur-PK" : "en-US";
      recognitionRef.current.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        if (command.includes("start") || command.includes("chalao") || command.includes("on")) handleStart(speed);
        else if (command.includes("stop") || command.includes("roko") || command.includes("off")) handleStop();
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [lang, speed]);

  const startVoiceAI = () => { setIsListening(true); recognitionRef.current?.start(); };

  useEffect(() => {
    let interval = null;
    if (isRocking && timeLeft > 0) interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    else if (timeLeft === 0 && isRocking) handleStop(); 
    return () => clearInterval(interval);
  }, [isRocking, timeLeft]);

  const handleStart = (selectedSpeed) => {
    const cmd = selectedSpeed.toUpperCase().trim();
    update(ref(db, 'Cradle'), { MotorCommand: cmd, TimerDuration: 600, TimerStart: Date.now() / 1000, CurrentStatus: "Rocking..." });
    if (timeLeft <= 0) setTimeLeft(600);
    setIsRocking(true);
  };

  const handleStop = () => {
    update(ref(db, 'Cradle'), { MotorCommand: "OFF", TimerDuration: 0, TimerStart: 0, CurrentStatus: "sleeping" });
    setTimeLeft(0); setIsRocking(false); setPrediction("sleeping");
  };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (babyInfo.name && babyInfo.dob && babyInfo.gender) {
      set(ref(db, `users/${userId}/babyDetails`), babyInfo).then(() => setShowSetup(false));
    }
  };

  useEffect(() => {
    if (!userId) return;
    document.documentElement.setAttribute("data-theme", theme);
    
    const watchdog = setInterval(() => {
      setLastSeen((prev) => {
        if ((Date.now() - prev) / 1000 > 15) setIsOnline(false);
        else setIsOnline(true);
        return prev;
      });
    }, 5000);

    const unsubscribeCradle = onValue(ref(db, 'Cradle'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLastSeen(Date.now());
        const dbIsRocking = data.MotorCommand && data.MotorCommand !== "OFF";
        setIsRocking(dbIsRocking);
        
        const currentStatus = data.CurrentStatus?.toLowerCase() || "sleeping";
        setPrediction(!dbIsRocking ? "sleeping" : currentStatus);
        setConfidence(!dbIsRocking ? 98 : (data.Confidence?.toString().replace("%", "") || 0));
        
        if (dbIsRocking && data.TimerStart) {
          const elapsed = (Date.now() / 1000) - data.TimerStart;
          setTimeLeft(Math.max(0, Math.floor(data.TimerDuration - elapsed)));
        }
        
        const currentTemp = parseFloat(data.LiveTemp || data.Temperature || 25);
        const currentHum = parseFloat(data.Humidity || 50);
        
        setLiveTemp(currentTemp);
        setLiveHumidity(currentHum);
        setBatteryLevel(data.BatteryLevel || 85);

        if (currentTemp >= 32 && lastAlertRef.current.temp !== "high") {
            triggerNotification("🌡️ High Temp Alert!", `Room is too hot for baby: ${currentTemp}°C`);
            lastAlertRef.current.temp = "high";
        } else if (currentTemp <= 16 && lastAlertRef.current.temp !== "low") {
            triggerNotification("❄️ Low Temp Alert!", `Room is too cold for baby: ${currentTemp}°C`);
            lastAlertRef.current.temp = "low";
        } else if (currentTemp > 16 && currentTemp < 32) {
            lastAlertRef.current.temp = "normal";
        }

        if (currentHum >= 70 && lastAlertRef.current.humidity !== "high") {
            triggerNotification("💧 High Humidity Alert!", `Room is too humid: ${currentHum}%`);
            lastAlertRef.current.humidity = "high";
        } else if (currentHum <= 30 && lastAlertRef.current.humidity !== "low") {
            triggerNotification("🌵 Low Humidity Alert!", `Room is too dry: ${currentHum}%`);
            lastAlertRef.current.humidity = "low";
        } else if (currentHum > 30 && currentHum < 70) {
            lastAlertRef.current.humidity = "normal";
        }

        const isDangerStatus = !currentStatus.includes("sleeping");

        if (isDangerStatus && lastAlertRef.current.status !== currentStatus) {
            triggerNotification("🍼 Baby Alert!", `Baby needs attention: ${currentStatus.toUpperCase()}`);
            lastAlertRef.current.status = currentStatus;
        } else if (!isDangerStatus) {
            lastAlertRef.current.status = "normal";
        }
      }
    });

    const unsubscribeBabyDetails = onValue(ref(db, `users/${userId}/babyDetails`), (s) => s.exists() ? (setBabyInfo(s.val()), setShowSetup(false)) : setShowSetup(true));
    
    return () => {
      clearInterval(watchdog);
      unsubscribeCradle();
      unsubscribeBabyDetails();
    };
  }, [userId, theme]);

  
  useEffect(() => {
    if (!userId) return;
    
    let historyQuery;
    if (filterDate) {
      const [year, month, day] = filterDate.split("-");
      const formattedFilterDate = `${month}/${day}/${year}`; 
      historyQuery = query(ref(db, `Cradle/History`), orderByChild('Date'), equalTo(formattedFilterDate));
    } else {
      historyQuery = query(ref(db, `Cradle/History`), limitToLast(20));
    }

    const unsubscribe = onValue(historyQuery, (s) => {
      if (s.exists()) {
        const logsArray = Object.values(s.val()).reverse();
        setCryLogs(logsArray);
      } else {
        setCryLogs([]);
      }
    });

    return () => unsubscribe();
  }, [userId, filterDate]);

  const renderContent = () => {
    if (activeTab === "settings") return <SettingsPage onBack={() => setActiveTab("home")} setTheme={setTheme} setLang={setLang} currentTheme={theme} currentLang={lang} />;
    if (activeTab === "monitoring") return <Monitoring lang={lang} />;
    if (activeTab === "history") {
      
      const filteredLogs = cryLogs.filter(log => {
        if (!filterDate) return true; 
        const [year, month, day] = filterDate.split("-");
        const formattedFilterDate = `${month}/${day}/${year}`; 
        return log.Date === formattedFilterDate; 
      }).slice(0, 50);

      return (
        <div className="history-card-8d">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{margin: 0, color: 'var(--text-main)', fontSize: '18px'}}>{text[lang].cryHistory}</h2>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.5)',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                outline: 'none',
                fontSize: '12px',
                fontWeight: '600'
              }}
            />
          </div>

          <div className="log-scroll-area">
            {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
              <div key={i} className="log-item-8d">
                <div className="avatar-neon" style={{width: 35, height: 35, flexShrink: 0}}><Clock size={16}/></div>
                <div>
                  <div style={{fontWeight: 700, color: 'var(--text-main)'}}>
                    {log.Status ? log.Status.toUpperCase() : "UNKNOWN"}
                  </div>
                  <div style={{fontSize: '12px', color: 'var(--text-sub)'}}>
                    Date: {log.Date} | Time: {log.Timestamp}
                  </div>
                </div>
              </div>
            )) : <p style={{textAlign: 'center', color: 'var(--text-sub)'}}>{text[lang].noRecords}</p>}
          </div>
        </div>
      );
    }

    const isDanger = !prediction.includes("sleeping");

    return (
      <>
        <header className="main-header-8d">
          <div className="baby-info-box">
            <div className="avatar-neon"><Baby size={24} /></div>
            <div>
              <span style={{fontWeight: 800, color: 'var(--text-main)'}}>{babyInfo.name || (lang === 'ur' ? 'بچہ' : 'Baby')}</span>
              <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? text[lang].online : text[lang].offline}
              </div>
            </div>
          </div>
          <div className="battery-glass-box"><Zap size={14} /><span>{batteryLevel}%</span></div>
        </header>

        <section className="hero-display-8d">
          <div className={`prediction-card-8d ${isDanger ? 'danger-neon pulse-blink' : 'safe-neon'}`}>
            {isRocking && <div className="timer-badge-8d"><TimerIcon size={14} /><span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span></div>}
            <div className="prediction-icon">{prediction.includes("sleeping") ? <Smile size={60} /> : <AlertCircle size={60} />}</div>
            <h1 className="prediction-main-label">{prediction === "sleeping" ? text[lang].sleeping : prediction.toUpperCase().replace("_", " ")}</h1>
            <div style={{marginTop: '10px', fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.5)'}}>AI Confidence: {confidence}%</div>
          </div>
        </section>

        <section className="sensor-grid-8d">
          <div className="glass-stat-card">
            <div className="temp-glow" style={{padding: '10px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Thermometer size={20} />
            </div>
            <span className="stat-label">{text[lang].temp}</span>
            <span className="stat-number">{liveTemp.toString().replace("°C", "")}°C</span>
          </div>
          
          <div className="glass-stat-card">
            <div className="motion-glow" style={{padding: '10px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Waves size={20} />
            </div>
            <span className="stat-label">{text[lang].motion}</span>
            <span className="stat-number">{isRocking ? "ON" : "OFF"}</span>
          </div>

          <div className="glass-stat-card">
            <div className="humid-glow" style={{padding: '10px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Droplets size={20} />
            </div>
            <span className="stat-label">{text[lang].humidity}</span>
            <span className="stat-number">{liveHumidity}%</span>
          </div>
        </section>

        <section className="manual-deck-8d">
          <div className="deck-header">
            <span style={{fontWeight: 800, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '8px'}}><SlidersHorizontal size={16}/> {text[lang].controls}</span>
            <button onClick={startVoiceAI} className="voice-mic-btn" style={isListening ? {background: 'var(--accent-grad)', color: 'white'} : {}}><Mic size={20} /></button>
          </div>
          <button className={`master-power-btn ${isRocking ? 'power-on' : ''}`} onClick={isRocking ? handleStop : () => handleStart(speed)}>
            <Power size={24} /> {isRocking ? text[lang].stop : text[lang].start}
          </button>
          <div className="speed-pills-container">
            {["Low", "Medium", "High"].map((s) => (
              <button key={s} className={`speed-pill-btn ${speed === s ? 'pill-active' : ''}`} onClick={() => { setSpeed(s); if(isRocking) handleStart(s); }}>
                {text[lang][s.toLowerCase()]}
              </button>
            ))}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className={`dashboard-container ${lang === 'ur' ? 'rtl' : ''}`}>
      {showSetup && (
        <div className="setup-overlay-full">
          <div className="setup-card-container">
            <h2 className="setup-title">{text[lang].setupTitle}</h2>
            <p className="setup-subtitle">{text[lang].setupSub}</p>
            <div className="gender-switch">
              <button type="button" className={babyInfo.gender === "Boy" ? "active" : ""} onClick={() => setBabyInfo({...babyInfo, gender: "Boy"})}>{text[lang].boy}</button>
              <button type="button" className={babyInfo.gender === "Girl" ? "active" : ""} onClick={() => setBabyInfo({...babyInfo, gender: "Girl"})}>{text[lang].girl}</button>
            </div>
            <form onSubmit={handleSetupSubmit} className="setup-form">
              <input type="text" placeholder={text[lang].namePh} className="setup-input" required value={babyInfo.name} onChange={(e) => setBabyInfo({...babyInfo, name: e.target.value})} />
              <div className="input-group">
                <label className="input-label">{text[lang].dobPh}</label>
                <input type="date" className="setup-input" required value={babyInfo.dob} onChange={(e) => setBabyInfo({...babyInfo, dob: e.target.value})} />
              </div>
              <button type="submit" className="setup-submit-btn">{text[lang].saveBtn}</button>
            </form>
          </div>
        </div>
      )}
      {isListening && <div className="voice-modal-8d" onClick={() => setIsListening(false)}><div className="ai-waves"><span></span><span></span><span></span><span></span><span></span></div><p style={{fontWeight: 700, color: 'var(--accent)'}}>{text[lang].voiceActive}</p></div>}
      <div className="main-content-area">{renderContent()}</div>
      <nav className="dock-nav-8d">
        <button className={`dock-link ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}><Home size={22} /><span>{text[lang].home}</span></button>
        <button className={`dock-link ${activeTab === "monitoring" ? "active" : ""}`} onClick={() => setActiveTab("monitoring")}><Eye size={22} /><span>{text[lang].monitoring}</span></button>
        <button className={`dock-link ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}><BarChart2 size={22} /><span>{text[lang].history}</span></button>
        <button className={`dock-link ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}><SettingsIcon size={22} /><span>{text[lang].settings}</span></button>
      </nav>
    </div>
  );
};

export default Dashboard;