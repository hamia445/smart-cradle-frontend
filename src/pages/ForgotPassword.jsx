import React, { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase"; // 'db' import lazmi hai
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

 
  const [toast, setToast] = useState({ show: false, msg: "", type: "error" });

  const showToast = (msg, type = "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "error" }), 4000);
  };

  const text = {
    en: {
      title: "Forgot Password",
      subtitle: "Enter registered email to receive reset link",
      email: "Email Address",
      phone: "Phone Number",
      btn: "Send Reset Link",
      sending: "Sending...",
      not_found: "This email is not registered with us!",
      success_msg: "Reset link sent! Please check your inbox.",
      back_login: "Back to Login"
    },
    ur: {
      title: "پاس ورڈ بھول گئے",
      subtitle: "ری سیٹ لنک حاصل کرنے کے لیے رجسٹرڈ ای میل درج کریں",
      email: "ای میل ایڈریس",
      phone: "فون نمبر",
      btn: "ری سیٹ لنک بھیجیں",
      sending: "بھیجا جا رہا ہے...",
      not_found: "یہ ای میل ہمارے پاس رجسٹرڈ نہیں ہے!",
      success_msg: " لنک بھیج دیا گیا ہے! اپنا ان باکس چیک کریں۔",
      back_login: "لاگ ان پر واپس جائیں"
    },
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (method !== "email") {
      showToast("Phone reset coming soon", "error");
      return;
    }

    if (!email) return showToast("Please enter email", "error");

    setLoading(true);
    try {
      // check email  in Re D
      const usersRef = ref(db, "users");
      const emailQuery = query(usersRef, orderByChild("email"), equalTo(email));
      const snapshot = await get(emailQuery);

      if (!snapshot.exists()) {
        showToast(text[lang].not_found, "error");
        setLoading(false);
        return;
      }

      // 2. yes send 
      await sendPasswordResetEmail(auth, email);
      showToast(text[lang].success_msg, "success");
      
     
      setEmail("");
      
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      {toast.show && (
        <div className={toast.type === "success" ? "toast-success" : "toast-error"}>
          {toast.msg}
        </div>
      )}

      <form className="forgot-card" onSubmit={handleReset}>
        <h1>{text[lang].title}</h1>
        <p className="subtitle">{text[lang].subtitle}</p>

        <div className="method-switch">
          <button
            type="button"
            className={method === "email" ? "active" : ""}
            onClick={() => setMethod("email")}
          > Email </button>
          <button
            type="button"
            className={method === "phone" ? "active" : ""}
            onClick={() => setMethod("phone")}
          > Phone </button>
        </div>

        {method === "email" ? (
          <input
            type="email"
            placeholder={text[lang].email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <input
            type="tel"
            placeholder={text[lang].phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}

        <button type="submit" disabled={loading} className="reset-btn">
          {loading ? <div className="spinner"></div> : text[lang].btn}
        </button>

        <p className="back-link" onClick={() => navigate("/login")}>
          {text[lang].back_login}
        </p>
      </form>
    </div>
  );
}