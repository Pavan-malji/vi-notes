import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage.tsx";
import NotepadPage from "./components/NotepadPage";
import "./App.css";

type Theme = "dark" | "light";
type AuthMode = "login" | "register";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SessionSummary {
  id: string;
  wordCount: number;
  charCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SessionPayload extends SessionSummary {
  content: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthPayload {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "vi-notes-token";
const THEME_STORAGE_KEY = "vi-notes-theme";

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json().catch(() => ({}))) as { message?: string } & T;

  if (!response.ok) {
    throw new Error(body.message || "Request failed");
  }

  return body;
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "dark");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [authBootstrapping, setAuthBootstrapping] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const [content, setContent] = useState("");
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Sign in to begin a verified writing session.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setAuthBootstrapping(false);
      return;
    }

    setAuthBootstrapping(true);
    void loadAuthenticatedState(token);
  }, [token]);

  useEffect(() => {
    if (!token || !dirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveCurrentSession();
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [content, dirty, token]);

  async function loadAuthenticatedState(accessToken: string) {
    try {
      const meResponse = await apiRequest<{ user: User }>("/api/auth/me", {}, accessToken);
      const latestResponse = await apiRequest<{ session: SessionPayload | null }>("/api/sessions/latest", {}, accessToken);
      const historyResponse = await apiRequest<{ sessions: SessionSummary[] }>("/api/sessions/history", {}, accessToken);

      setUser(meResponse.user);
      setHistory(historyResponse.sessions);

      if (latestResponse.session) {
        setContent(latestResponse.session.content);
        setLastSavedAt(latestResponse.session.updatedAt);
        setStatusMessage("Latest draft restored.");
      } else {
        setStatusMessage("Authenticated. Start writing.");
      }

      setDirty(false);
    } catch (_error) {
      handleLogout(false);
      setStatusMessage("Session expired. Please login again.");
    } finally {
      setAuthBootstrapping(false);
    }
  }

  async function submitAuth(payload: AuthPayload) {
    const isRegister = authMode === "register";

    if (isRegister && payload.password !== payload.confirmPassword) {
      setStatusMessage("Password and confirm password must match.");
      return;
    }

    setAuthLoading(true);
    setStatusMessage(isRegister ? "Creating account..." : "Signing in...");

    try {
      const requestPayload = isRegister
        ? { firstName: payload.firstName, lastName: payload.lastName, email: payload.email, password: payload.password }
        : { email: payload.email, password: payload.password };

      const response = await apiRequest<AuthResponse>(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(requestPayload),
        },
      );

      if (isRegister) {
        setAuthMode("login");
        setStatusMessage("Account created successfully. Please login.");
      } else {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        setToken(response.token);
        setUser(response.user);
        setStatusMessage("Welcome back.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setStatusMessage(message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveCurrentSession() {
    if (!token) {
      setStatusMessage("Login is required to save.");
      return;
    }

    setSaveLoading(true);

    try {
      const isEditing = Boolean(editingSessionId);
      const path = isEditing ? `/api/sessions/${editingSessionId}` : "/api/sessions/save";
      const method = isEditing ? "PUT" : "POST";

      const response = await apiRequest<{ session: SessionPayload }>(
        path,
        {
          method,
          body: JSON.stringify({ content }),
        },
        token,
      );

      const summary: SessionSummary = {
        id: response.session.id,
        wordCount: response.session.wordCount,
        charCount: response.session.charCount,
        createdAt: response.session.createdAt,
        updatedAt: response.session.updatedAt,
      };

      setLastSavedAt(response.session.updatedAt);
      setHistory((current) => [summary, ...current.filter((entry) => entry.id !== summary.id)].slice(0, 20));
      setDirty(false);
      setStatusMessage(isEditing ? "Session updated." : "Saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setStatusMessage(message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function openSession(sessionId: string) {
    if (!token) {
      setStatusMessage("Login is required to load saved sessions.");
      return;
    }

    setLoadingSessionId(sessionId);

    try {
      const response = await apiRequest<{ session: SessionPayload }>(`/api/sessions/${sessionId}`, {}, token);
      setContent(response.session.content);
      setLastSavedAt(response.session.updatedAt);
      setDirty(false);
      setStatusMessage("Session loaded in editor.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load session";
      setStatusMessage(message);
    } finally {
      setLoadingSessionId(null);
    }
  }

  async function editSession(sessionId: string) {
    if (!token) {
      setStatusMessage("Login is required to edit sessions.");
      return;
    }

    setLoadingSessionId(sessionId);

    try {
      const response = await apiRequest<{ session: SessionPayload }>(`/api/sessions/${sessionId}`, {}, token);
      setContent(response.session.content);
      setLastSavedAt(response.session.updatedAt);
      setEditingSessionId(sessionId);
      setDirty(false);
      setStatusMessage("Editing session. Changes will update this session.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load session";
      setStatusMessage(message);
    } finally {
      setLoadingSessionId(null);
    }
  }

  function startNewSession() {
    setContent("");
    setEditingSessionId(null);
    setLastSavedAt(null);
    setDirty(false);
    setStatusMessage("New session started.");
  }

  async function deleteSession(sessionId: string) {
    if (!token) {
      setStatusMessage("Login is required to delete sessions.");
      return;
    }

    setDeletingSessionId(sessionId);

    try {
      await apiRequest<{ message: string }>(`/api/sessions/${sessionId}`, { method: "DELETE" }, token);
      setHistory((current) => current.filter((session) => session.id !== sessionId));

      if (editingSessionId === sessionId) {
        setEditingSessionId(null);
        setContent("");
        setLastSavedAt(null);
      }

      setStatusMessage("Session deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete session";
      setStatusMessage(message);
    } finally {
      setDeletingSessionId(null);
    }
  }

  function handleLogout(showMessage = true) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setContent("");
    setHistory([]);
    setLastSavedAt(null);
    setDirty(false);
    setEditingSessionId(null);

    if (showMessage) {
      setStatusMessage("Logged out.");
    }
  }

  const isAuthenticated = Boolean(token && user);

  if (token && !user && authBootstrapping) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/notepad" replace />
          ) : (
            <LandingPage
              theme={theme}
              authMode={authMode}
              authLoading={authLoading}
              statusMessage={statusMessage}
              onSwitchMode={setAuthMode}
              onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              onAuthSubmit={submitAuth}
            />
          )
        }
      />

      <Route
        path="/notepad"
        element={
          isAuthenticated && user ? (
            <NotepadPage
              theme={theme}
              user={user}
              content={content}
              history={history}
              saveLoading={saveLoading}
              loadingSessionId={loadingSessionId}
              deletingSessionId={deletingSessionId}
              editingSessionId={editingSessionId}
              statusMessage={statusMessage}
              lastSavedAt={lastSavedAt}
              onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              onLogout={handleLogout}
              onSave={saveCurrentSession}
              onOpenSession={openSession}
              onEditSession={editSession}
              onDeleteSession={deleteSession}
              onNewSession={startNewSession}
              onContentChange={(value) => {
                setContent(value);
                setDirty(true);
                setStatusMessage("Unsaved changes.");
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? "/notepad" : "/"} replace />} />
    </Routes>
  );
}

export default App;
