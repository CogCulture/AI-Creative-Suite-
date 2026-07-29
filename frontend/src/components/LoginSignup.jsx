import { useState, useEffect, useRef } from "react";
import { Mail, Lock, User, Loader2 } from "lucide-react";

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function LoginSignup({ onLogin, onNavigate }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isOtpPending, setIsOtpPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Normal Spinner Loader State ---
  const [showLoader, setShowLoader] = useState(false);

  // --- Google Login Initialization ---
  const googleBtnRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const parseJsonResponse = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error(text || `Request failed (${res.status}).`);
    }
  };

  useEffect(() => {
    if (isOtpPending) return;

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

      if (!googleInitializedRef.current) {
        window.google.accounts.id.initialize({
          client_id:
            "802361061203-55201dnd5a513n745tu2o0rv0uadsao2.apps.googleusercontent.com",
          callback: handleGoogleCredential,
        });
        googleInitializedRef.current = true;
      }

      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: Math.min(Math.max(googleBtnRef.current.offsetWidth || 400, 40), 400),
        text: isSignUp ? "signup_with" : "signin_with",
      });
    };

    // Retry a few times in case script load is slightly delayed
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.google) {
        initGoogle();
        clearInterval(interval);
      } else if (attempts > 30) {
        clearInterval(interval);
      }
      attempts++;
    }, 100);

    return () => clearInterval(interval);
  }, [isSignUp, isOtpPending]);

  const handleGoogleCredential = async (response) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/bff/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.detail || "Google authentication failed.");
      }
      localStorage.setItem("studio-user-info", JSON.stringify(data.user));
      triggerLoginTransition();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Normal Spinner Loader execution ---
  useEffect(() => {
    if (!showLoader) return;

    const timer = setTimeout(() => {
      onLogin();
    }, 1200);
    return () => clearTimeout(timer);
  }, [showLoader]);

  const triggerLoginTransition = () => {
    setShowLoader(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim() || !email || !password || !confirmPassword) {
        setError("Please fill in all fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please enter your email and password.");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const res = await fetch("/bff/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: fullName }),
        });
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          throw new Error(data.detail || "Sign up failed.");
        }
        setIsOtpPending(true);
      } else {
        const res = await fetch("/bff/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          throw new Error(data.detail || "Invalid email or password.");
        }
        localStorage.setItem("studio-user-info", JSON.stringify(data.user));
        triggerLoginTransition();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/bff/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.detail || "OTP verification failed.");
      }
      localStorage.setItem("studio-user-info", JSON.stringify(data.user));
      triggerLoginTransition();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      const res = await fetch("/bff/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.detail || "Failed to resend verification code.");
      }
      setError("A new verification code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-signup-root bg-white text-ink font-sans min-h-screen flex flex-col justify-between overflow-x-hidden relative">
      {/* BACKGROUND GLOW */}
      <div className="spectrum-rainbow-top opacity-20"></div>
      <div className="spectrum-glow spectrum-glow-rainbow w-[550px] h-[550px] -top-[100px] -right-[100px] opacity-25"></div>
      <div className="spectrum-glow spectrum-glow-rainbow w-[350px] h-[350px] bottom-[50px] -left-[100px] opacity-15"></div>

      {/* MAIN CONTAINER */}
      <main className="z-10 flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-[460px] bg-white border border-border rounded-none p-8 md:p-10 shadow-xl transition-all duration-300">
          
          {isOtpPending ? (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-medium font-display tracking-tight text-ink">
                Verify your email
              </h1>
              <p className="text-sm text-muted mt-2 font-sans">
                We've sent a 6-digit verification code to {email}.
              </p>
            </div>
          ) : (
            <div className="text-center mb-8">
              {isSignUp ? (
                <>
                  <div className="inline-flex items-center gap-2 bg-brand/10 text-brand text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                    ✦ New Account
                  </div>
                  <h1 className="text-2xl font-medium font-display tracking-tight text-ink">
                    Create your account
                  </h1>
                  <p className="text-sm text-muted mt-2 font-sans">
                    Join Cog Culture's Creative Suite and start building.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 bg-ink/5 text-ink text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                    👋 Welcome back
                  </div>
                  <h1 className="text-2xl font-medium font-display tracking-tight text-ink">
                    Sign in to your suite
                  </h1>
                  <p className="text-sm text-muted mt-2 font-sans">
                    Good to see you again — enter your credentials below.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Form Error or success info message */}
          {error && (
            <div className={`mb-4 p-3 border-l-4 text-xs font-semibold rounded-none font-sans ${
              error.includes("sent to your email") 
                ? "bg-green-50 border-green-500 text-green-700" 
                : "bg-red-50 border-red-500 text-red-700"
            }`}>
              {error}
            </div>
          )}

          {isOtpPending ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-surface border border-border py-2.5 text-center text-xl font-bold tracking-[0.5em] text-ink placeholder-muted/30 rounded-none focus:outline-none focus:border-ink font-sans transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group/btn inline-flex items-center justify-center gap-1.5 rounded-none bg-brand py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-md hover:brightness-110 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin text-white" size={16} />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-xs font-sans text-muted mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="hover:underline bg-transparent border-none p-0 cursor-pointer text-ink font-semibold"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpPending(false);
                    setError("");
                  }}
                  className="hover:underline bg-transparent border-none p-0 cursor-pointer text-muted"
                >
                  Back to Sign Up
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Sign Up: First + Last Name row */}
              {isSignUp && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                      First Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted/60">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-surface border border-border py-2.5 pl-9 pr-3 text-sm text-ink placeholder-muted/50 rounded-none focus:outline-none focus:border-ink font-sans transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                      Last Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted/60">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-surface border border-border py-2.5 pl-9 pr-3 text-sm text-ink placeholder-muted/50 rounded-none focus:outline-none focus:border-ink font-sans transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted/60">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-surface border border-border py-2.5 pl-10 pr-4 text-sm text-ink placeholder-muted/50 rounded-none focus:outline-none focus:border-ink font-sans transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted/60">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-border py-2.5 pl-10 pr-4 text-sm text-ink placeholder-muted/50 rounded-none focus:outline-none focus:border-ink font-sans transition-colors"
                  />
                </div>
              </div>

              {/* Sign Up: Confirm Password */}
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted/60">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-surface border py-2.5 pl-10 pr-4 text-sm text-ink placeholder-muted/50 rounded-none focus:outline-none font-sans transition-colors ${
                        confirmPassword && confirmPassword !== password
                          ? "border-red-400 focus:border-red-500"
                          : "border-border focus:border-ink"
                      }`}
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 font-sans mt-1">Passwords do not match</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group/btn inline-flex items-center justify-center gap-1.5 rounded-none bg-brand py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] hover:shadow-md hover:brightness-110 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin text-white" size={16} />
                ) : (
                  <>
                    <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                    <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {!isOtpPending && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted font-sans font-semibold tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In Container */}
              <div className="flex justify-center w-full min-h-[44px]">
                <div ref={googleBtnRef} className="w-full"></div>
              </div>

              {/* Toggle Tab Footer */}
              <div className="mt-8 text-center text-sm font-sans text-muted">
                {isSignUp ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setError("");
                        setFirstName("");
                        setLastName("");
                        setConfirmPassword("");
                      }}
                      className="text-ink font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setError("");
                        setPassword("");
                      }}
                      className="text-ink font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Create one
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </main>


      {/* FOOTER */}
      <footer className="z-10 bg-[#dddddd] py-6">
        <div className="mx-auto max-w-7xl px-[70px] flex flex-col md:flex-row justify-between items-center text-xs text-black/80 font-sans">
          <p className="uppercase tracking-[0.2em] font-medium text-[11px] text-black">
            COPYRIGHT COG CULTURE <span>{new Date().getFullYear()}</span>
          </p>
          <div className="flex gap-5 mt-4 md:mt-0">
            <a href="#" className="hover:underline text-black/85">
              Privacy
            </a>
            <a href="#" className="hover:underline text-black/85">
              Terms
            </a>
          </div>
        </div>
      </footer>

      {/* SPINNER LOADING SCREEN OVERLAY */}
      {showLoader && (
        <div
          id="loading-overlay"
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center opacity-100 transition-opacity duration-300 select-none"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="animate-spin text-black" size={44} strokeWidth={1.5} />
            <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#16192b", fontFamily: "Inter Tight, system-ui, sans-serif" }}>
              Setting up workspace...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
