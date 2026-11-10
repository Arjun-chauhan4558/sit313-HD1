import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase";

function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = sessionStorage.getItem("otpToken");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await signInWithCustomToken(auth, data.customToken);

      sessionStorage.removeItem("otpToken");

      navigate("/");

    } catch (err) {
      setError(err.message || "OTP verification failed.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleVerify}>
        <h1>Verify OTP</h1>

        <p>Enter the 6-digit OTP sent to your email.</p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          required
        />

        {error && <p>{error}</p>}

        <button type="submit">Verify OTP</button>
      </form>
    </div>
  );
}

export default VerifyOTP;