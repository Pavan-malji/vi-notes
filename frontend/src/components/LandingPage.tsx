import { useEffect, useState, type FormEvent } from "react";
import EyeIcon from "./EyeIcon";
import ThemeToggle from "./ThemeToggle";

type AuthMode = "login" | "register";
type Theme = "dark" | "light";

interface AuthPayload {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface LandingPageProps {
  theme: Theme;
  authMode: AuthMode;
  authLoading: boolean;
  statusMessage: string;
  onSwitchMode: (mode: AuthMode) => void;
  onToggleTheme: () => void;
  onAuthSubmit: (payload: AuthPayload) => Promise<void>;
}

export default function LandingPage({
  theme,
  authMode,
  authLoading,
  statusMessage,
  onSwitchMode,
  onToggleTheme,
  onAuthSubmit,
}: LandingPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const isRegister = authMode === "register";
  const shellClassName = `landing-shell ${isRegister ? "is-register" : "is-login"} ${isEntering ? "is-entering" : ""}`;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  function switchMode(mode: AuthMode) {
    if (mode === authMode) {
      return;
    }

    onSwitchMode(mode);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onAuthSubmit({
      name: isRegister ? name : undefined,
      email,
      password,
      confirmPassword: isRegister ? confirmPassword : undefined,
    });

    if (!authLoading) {
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <section className="landing-page">
      <div className={shellClassName}>
        <aside className="brand-panel">
          <p className="brand-kicker">Focused Writing Platform</p>
          <p className="brand">Vi-Notes</p>
          <h1>Write clearly. Think deeply.</h1>
          <p className="tagline">A calm, authenticated writing workspace for focused sessions and meaningful notes.</p>
        </aside>

        <div className="auth-card">
          <header className="auth-head">
            <div className="auth-toolbar">
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>

            <div>
              <h3>{isRegister ? "Create your account" : "Welcome back"}</h3>
              <p className="tagline">{isRegister ? "Start your first writing session." : "Login to continue your notes."}</p>
            </div>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label>
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  required
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <div className="input-with-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <p className="field-hint">Use at least 8 characters.</p>
            </label>

            {isRegister ? (
              <label>
                Confirm password
                <div className="input-with-icon">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </label>
            ) : null}

            <button className="btn btn-primary" type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : isRegister ? "Create account" : "Login"}
            </button>

            <p className="auth-switch-text">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => switchMode(isRegister ? "login" : "register")}
              >
                {isRegister ? "Login" : "Register"}
              </button>
            </p>
          </form>

          <p className="status-line">{statusMessage}</p>
        </div>
      </div>
    </section>
  );
}
