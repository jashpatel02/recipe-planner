import { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase/config";

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      if (onLoginSuccess) onLoginSuccess();
      onClose();
      
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Wrong email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("That email is already registered.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Please enable Email/Password in Firebase console.");
      } else {
        setError(err.message.replace("Firebase: ", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      if (err.code === "auth/operation-not-allowed") {
        setError("Please enable Google login in Firebase console.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase.");
      } else {
        setError(err.message.replace("Firebase: ", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        
        <h2>{mode === "signin" ? "Welcome Back" : "Create Account"}</h2>
        
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={submit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="First Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Password (at least 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? "Hang tight..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          Continue with Google
        </button>
        
        <p className="switch-mode">
          {mode === "signin" ? "Don't have an account?" : "Already registered?"}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}