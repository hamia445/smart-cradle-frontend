import React, { useState } from "react";
import { Moon, Sun, LogOut, Globe, HelpCircle, Baby, Edit2, X, Instagram, Facebook, Info } from "lucide-react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { ref, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

const SettingsPage = ({ currentTheme, setTheme, currentLang, setLang }) => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, msg: "" });
  
  // Modals ke states
  const [showNameModal, setShowNameModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [newName, setNewName] = useState("");

  const userId = auth.currentUser?.uid;

  const handleLogout = async () => {
    const logoutMsg = currentLang === "en" ? "See you soon!" : "جلد ملیں گے!";
    setToast({ show: true, msg: logoutMsg });
    
    setTimeout(async () => {
      await signOut(auth);
      navigate("/login");
    }, 1500);
  };

  // Dark Mode Toggle Logic
  const handleThemeToggle = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Language Toggle Logic
  const handleLangToggle = () => {
    const newLang = currentLang === "en" ? "ur" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  // Baby Name Update Logic
  const handleNameUpdate = (e) => {
    e.preventDefault();
    if (newName.trim() !== "" && userId) {
      update(ref(db, `users/${userId}/babyDetails`), { name: newName })
        .then(() => {
          setToast({ show: true, msg: currentLang === "en" ? "Name Updated!" : "نام اپڈیٹ ہو گیا!" });
          setShowNameModal(false);
          setNewName("");
          setTimeout(() => setToast({ show: false, msg: "" }), 2000);
        });
    }
  };

  const text = {
    en: { 
      title: "Settings", theme: "Dark Mode", lang: "Language", logout: "Logout",
      help: "Help & Support", editName: "Edit Baby Name", save: "Save Name", close: "Close",
      about: "About Us",
      aboutTitle: "About Smart Cradle",
      aboutDesc: "This project is an AI-powered Smart Baby Cradle system designed for automated soothing and monitoring. Developed as a final year project to assist parents.",
      team: "Developed by: Team Smart Cradle",
      helpDesc: "If you are facing issues with the hardware or the app, please check your WiFi connection or contact support at support@smartcradle.com"
    },
    ur: { 
      title: "ترتیبات", theme: "ڈارک موڈ", lang: "زبان", logout: "لاگ آؤٹ",
      help: "مدد اور سپورٹ", editName: "بچے کا naam تبدیل کریں", save: "محفوظ کریں", close: "بند کریں",
      about: "ہمارے بارے میں",
      aboutTitle: "سمارٹ کریڈل کے بارے میں",
      aboutDesc: "یہ پروجیکٹ ایک AI سے لیس سمارٹ بیبی کریڈل سسٹم ہے جو والدین کی مدد کے لیے خودکار طریقے سے نگرانی اور جھولانے کے لیے بنایا گیا ہے۔",
      team: "تیار کردہ: ٹیم سمارٹ کریڈل",
      helpDesc: "اگر آپ کو ہارڈویئر یا ایپ میں کوئی مسئلہ آ رہا ہے تو اپنا وائی فائی چیک کریں یا support@smartcradle.com پر رابطہ کریں۔"
    }
  };

  return (
    <div className={`settings-page ${currentLang === 'ur' ? 'rtl' : ''}`}>
      {toast.show && <div className="toast-success">{toast.msg}</div>}
      
      <header className="settings-header">
        <h1>{text[currentLang].title}</h1>
      </header>

      <div className="settings-options">
       
        {/* Dark Mode Toggle */}
        <div className="setting-item" onClick={handleThemeToggle}>
          <div className="item-info">
            {currentTheme === "light" ? <Moon size={20}/> : <Sun size={20}/>}
            <span>{text[currentLang].theme}</span>
          </div>
          <div className={`toggle-switch ${currentTheme === "dark" ? "active" : ""}`}></div>
        </div>

        {/* Edit Baby Name */}
        <div className="setting-item" onClick={() => setShowNameModal(true)}>
          <div className="item-info">
            <Baby size={20}/>
            <span>{text[currentLang].editName}</span>
          </div>
          <Edit2 size={16} className="edit-icon" />
        </div>

        {/* Help & Support */}
        <div className="setting-item" onClick={() => setShowHelpModal(true)}>
          <div className="item-info">
            <HelpCircle size={20}/>
            <span>{text[currentLang].help}</span>
          </div>
        </div>

        {/* About Us */}
        <div className="setting-item" onClick={() => setShowAboutModal(true)}>
          <div className="item-info">
            <Info size={20}/>
            <span>{text[currentLang].about}</span>
          </div>
        </div>
        
        {/* Language */}
        <div className="setting-item" onClick={handleLangToggle}>
          <div className="item-info">
            <Globe size={20}/>
            <span>{text[currentLang].lang}</span>
          </div>
          <span className="lang-badge">
            {currentLang === "en" ? "English" : "اردو"}
          </span>
        </div>

        {/* Logout */}
        <button className="logout-btn-full" onClick={handleLogout}>
          <LogOut size={20} /> {text[currentLang].logout}
        </button>
      </div>

      {/* --- MODALS --- */}
      
      {/* Edit Name Modal */}
      {showNameModal && (
        <div className="setup-overlay-full">
          <div className="setup-card-container">
            <div className="modal-header">
              <h2 className="setup-title">{text[currentLang].editName}</h2>
              <button onClick={() => setShowNameModal(false)} className="close-modal-btn"><X size={24}/></button>
            </div>
            <form onSubmit={handleNameUpdate} className="setup-form">
              <input 
                type="text" 
                placeholder="Enter new name..." 
                className="setup-input" 
                required 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
              />
              <button type="submit" className="setup-submit-btn">{text[currentLang].save}</button>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="setup-overlay-full">
          <div className="setup-card-container">
            <div className="modal-header">
              <h2 className="setup-title">{text[currentLang].help}</h2>
              <button onClick={() => setShowHelpModal(false)} className="close-modal-btn"><X size={24}/></button>
            </div>
            <p className="help-desc-text">
              {text[currentLang].helpDesc}
            </p>
            <button className="setup-submit-btn close-help-btn" onClick={() => setShowHelpModal(false)}>
              {text[currentLang].close}
            </button>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="setup-overlay-full">
          <div className="setup-card-container">
            <div className="modal-header">
              <h2 className="setup-title">{text[currentLang].aboutTitle}</h2>
              <button onClick={() => setShowAboutModal(false)} className="close-modal-btn"><X size={24}/></button>
            </div>
            
            <div className="about-body">
              <p className="help-desc-text">{text[currentLang].aboutDesc}</p>
              <p className="team-text"><strong>{text[currentLang].team}</strong></p>
              
              <div className="social-links-container">
                <a href="https://instagram.com/yourprofile" target="_blank" rel="noopener noreferrer" className="social-link">
                  <Instagram size={30} color="#E4405F" />
                </a>
                <a href="https://facebook.com/yourprofile" target="_blank" rel="noopener noreferrer" className="social-link">
                  <Facebook size={30} color="#1877F2" />
                </a>
              </div>
              
              <p className="version-text">Version 1.0.0</p>
            </div>

            <button className="setup-submit-btn" onClick={() => setShowAboutModal(false)}>
              {text[currentLang].close}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;