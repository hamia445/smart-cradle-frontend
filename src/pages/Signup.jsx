import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; 
import { ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "error" });

  const text = {
    en: {
      title: "Create Parent Account",
      subtitle: "Smart Baby Monitoring System",
      email: "Email Address",
      username: "Username",
      mobile: "Mobile Number",
      password: "Password",
      confirm: "Confirm Password",
      signup: "Create Account",
      login: "Already have an account? Login",
      success: "Account created successfully!",
    },
    ur: {
      title: "والدین کا اکاؤنٹ بنائیں",
      subtitle: "اسمارٹ بیبی مانیٹرنگ سسٹم",
      email: "ای میل",
      username: "یوزر نیم",
      mobile: "موبائل نمبر",
      password: "پاس ورڈ",
      confirm: "پاس ورڈ کی تصدیق",
      signup: "اکاؤنٹ بنائیں",
      login: "اکاؤنٹ موجود ہے؟ لاگ ان کریں",
      success: "اکاؤنٹ کامیابی سے بن گیا!",
    },
  };

  const showToast = (msg, type = "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "error" }), 3000);
  };

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  const emailPattern = /^[^\s@]{5,}@[^\s@]+\.[^\s@]+$/; 
  const usernamePattern = /^[a-zA-Z0-9]{5,20}$/; 

  const validate = () => {
    if (!email) return showToast("Email is required"), false;
    if (!emailPattern.test(email)) return showToast("Email must have at least 5 characters before @"), false;

    if (!username) return showToast("Username is required"), false;
    if (!usernamePattern.test(username)) return showToast("Username must be at least 5 characters"), false;

    if (!mobile || mobile.length < 10) return showToast("Valid mobile number is required"), false;
    if (!password) return showToast("Password is required"), false;

    if (!strongPassword.test(password))
      return (
        showToast("Password must be 8+ chars with upper, lower, number & special character"),
        false
      );

    if (password !== confirmPassword)
      return showToast("Passwords do not match"), false;

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await set(ref(db, `users/${user.uid}`), {
        email: email,
        username: username,
        phone: "+" + mobile,
        createdAt: new Date().toISOString()
      });

      showToast(text[lang].success, "success");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {toast.show && (
        <div className={toast.type === "success" ? "toast-success" : "toast-error"}>
          {toast.msg}
        </div>
      )}

      <form className="signup-card" onSubmit={handleSignup}>
        <div className="logo">👶</div>
        
        <h1>{text[lang].title}</h1>
        <p className="subtitle">{text[lang].subtitle}</p>

        <input
          type="email"
          placeholder={text[lang].email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />

        <input
          type="text"
          placeholder={text[lang].username}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />

        <div className="phone-wrapper">
          <PhoneInput
            country={"pk"}
            value={mobile}
            onChange={(phone) => setMobile(phone)}
            inputClass="phone-field"
            containerClass="phone-container"
          />
        </div>

        <input
          type="password"
          placeholder={text[lang].password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />

        <input
          type="password"
          placeholder={text[lang].confirm}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-input"
        />

        <button type="submit" disabled={loading} className="signup-btn">
          {loading ? <div className="spinner"></div> : text[lang].signup}
        </button>

        <Link to="/login" className="login-link">
          {text[lang].login}
        </Link>

        <button 
          type="button" 
          className="lang-btn" 
          onClick={() => {
            const newLang = lang === "en" ? "ur" : "en";
            setLang(newLang);
            localStorage.setItem("lang", newLang);
          }}
        >
          {lang === "en" ? "اردو" : "English"}
        </button>
      </form>
    </div>
  );
}