import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth, db } from "../firebase"; 
import { ref, update, increment, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [toast, setToast] = useState({ show: false, msg: "", type: "error" });

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const showToast = (msg, type = "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "error" }), 3000);
  };

  const text = {
    en: {
      title: "Smart Cradle",
      subtitle: "Smart Baby Monitoring System",
      email: "Email Address",
      password: "Password",
      login: "Login",
      google: "Continue with Google",
      signup: "Create new account",
      forgot: "Forgot Password?",
      success: "Welcome Back!",
    },
    ur: {
      title: "سمارٹ کریڈل",
      subtitle: "اسمارٹ بیبی مانیٹرنگ سسٹم",
      email: "ای میل",
      password: "پاس ورڈ",
      login: "لاگ ان",
      google: "گوگل کے ساتھ جاری رکھیں",
      signup: "نیا اکاؤنٹ بنائیں",
      forgot: "پاس ورڈ بھول گئے؟",
      success: "خوش آمدید!",
    },
  };

  const trackUserLogin = async (user) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    // Actual Readable Time
    const readableTime = new Date().toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    if (!snapshot.exists()) {
      await update(userRef, {
        fullName: user.displayName || "User",
        email: user.email,
        uid: user.uid,
        createdAt: readableTime,
        loginCount: 1,
        lastLogin: readableTime,
        status: "Online"
      });
    } else {
      await update(userRef, {
        lastLogin: readableTime,
        loginCount: increment(1),
        status: "Online"
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await trackUserLogin(userCredential.user);
      showToast(text[lang].success, "success");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await trackUserLogin(result.user);
      showToast(text[lang].success, "success");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="login-container">
      {toast.show && (
        <div className={toast.type === "success" ? "toast-success" : "toast-error"}>
          {toast.msg}
        </div>
      )}

      <form className="login-card" onSubmit={handleLogin}>
        <div className="logo">👶</div>
        
        <h1>{text[lang].title}</h1>
        <p className="subtitle">{text[lang].subtitle}</p>

        <input
          type="email"
          placeholder={text[lang].email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder={text[lang].password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <span className="forgot-link" onClick={() => navigate("/forgot-password")}>
          {text[lang].forgot}
        </span>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? "..." : text[lang].login}
        </button>

        <div className="divider">OR</div>

        <button type="button" onClick={handleGoogleLogin} className="google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
          {text[lang].google}
        </button>

        <span className="signup-link" onClick={() => navigate("/signup")}>
          {text[lang].signup}
        </span>

        <button type="button" className="lang-btn" onClick={() => setLang(lang === "en" ? "ur" : "en")}>
          {lang === "en" ? "اردو" : "English"}
        </button>
      </form>
    </div>
  );
}