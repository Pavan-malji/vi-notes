import { useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type Theme = "dark" | "light";

interface User {
  id: string;
  name: string;
  email: string;
}

interface SessionSummary {
  id: string;
  wordCount: number;
  charCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NotepadPageProps {
  theme: Theme;
  user: User;
  content: string;
  history: SessionSummary[];
  saveLoading: boolean;
  loadingSessionId: string | null;
  deletingSessionId: string | null;
  statusMessage: string;
  lastSavedAt: string | null;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSave: () => Promise<void>;
  onOpenSession: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onContentChange: (value: string) => void;
}

export default function NotepadPage({
  theme,
  user,
  content,
  history,
  saveLoading,
  loadingSessionId,
  deletingSessionId,
  statusMessage,
  lastSavedAt,
  onToggleTheme,
  onLogout,
  onSave,
  onOpenSession,
  onDeleteSession,
  onContentChange,
}: NotepadPageProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const wordCount = useMemo(() => {
    const normalized = content.trim();
    return normalized ? normalized.split(/\s+/).length : 0;
  }, [content]);

  const charCount = content.length;

  return (
    <section className="notepad-home">
      <header className="app-topbar">
        <div className="header-left">
          <div>
            <p className="brand">Vi Notes</p>
            <h2>Notepad</h2>
          </div>
        </div>

        <div className="header-right">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <div className="profile-wrap">
            <button
              type="button"
              className="profile-toggle"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-label="Profile menu"
            >
              <div className="user-chip" title={user.email}>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <span className="chevron">▾</span>
            </button>

            {isProfileMenuOpen ? (
              <div className="profile-menu" role="menu" aria-label="Profile actions">
                <button className="btn btn-secondary" type="button" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="notepad-layout">
        <main className="editor-panel editor-main">
          <textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            aria-label="Writing editor"
          />

          <div className="editor-meta">
            <div className="stats">
              <span>{wordCount} words</span>
              <span>{charCount} chars</span>
              <span>{lastSavedAt ? `Last saved: ${new Date(lastSavedAt).toLocaleTimeString()}` : "Not saved yet"}</span>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => void onSave()} disabled={saveLoading}>
              {saveLoading ? "Saving..." : "Save session"}
            </button>
          </div>

          <p className="status-line">{statusMessage}</p>
        </main>

        <section className="history-panel" aria-label="Session history section">
            <h3>Session History</h3>

            <p className="muted">Open or delete your previous writing sessions.</p>

            {history.length === 0 ? (
              <p className="muted">No saved sessions yet.</p>
            ) : (
              <ul>
                {history.map((session) => (
                  <li key={session.id} className="history-entry">
                    <div className="history-item">
                      <button
                        type="button"
                        className="history-open-btn"
                        onClick={() => void onOpenSession(session.id)}
                        disabled={loadingSessionId === session.id || deletingSessionId === session.id}
                      >
                        <span>{new Date(session.updatedAt).toLocaleString()}</span>
                        <strong>{session.wordCount} words | {session.charCount} chars</strong>
                        <em>{loadingSessionId === session.id ? "Loading..." : "Open in editor"}</em>
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger history-delete-btn"
                        onClick={() => void onDeleteSession(session.id)}
                        disabled={loadingSessionId === session.id || deletingSessionId === session.id}
                      >
                        {deletingSessionId === session.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
      </div>
    </section>
  );
}
