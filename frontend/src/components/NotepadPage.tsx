import { useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type Theme = "dark" | "light";

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

interface NotepadPageProps {
  theme: Theme;
  user: User;
  content: string;
  history: SessionSummary[];
  saveLoading: boolean;
  loadingSessionId: string | null;
  deletingSessionId: string | null;
  editingSessionId: string | null;
  statusMessage: string;
  lastSavedAt: string | null;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSave: () => Promise<void>;
  onOpenSession: (sessionId: string) => Promise<void>;
  onEditSession: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onNewSession: () => void;
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
  editingSessionId,
  statusMessage,
  lastSavedAt,
  onToggleTheme,
  onLogout,
  onSave,
  onOpenSession,
  onEditSession,
  onDeleteSession,
  onNewSession,
  onContentChange,
}: NotepadPageProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const wordCount = useMemo(() => {
    const normalized = content.trim();
    return normalized ? normalized.split(/\s+/).length : 0;
  }, [content]);

  const charCount = content.length;

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <section className="notepad-home">
      <header className="app-topbar">
        <div className="header-left">
          <div className="topbar-brand">
            <p className="brand">Vi Notes</p>
            <h2>Notepad</h2>
          </div>
        </div>

        <div className="header-center">
          {editingSessionId ? (
            <div className="editing-indicator">
              <span className="editing-dot" />
              <span>Editing session</span>
            </div>
          ) : (
            <div className="editing-indicator new-indicator">
              <span className="new-dot" />
              <span>New session</span>
            </div>
          )}
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
              <div className="user-avatar" title={user.email}>
                {userInitials}
              </div>
            </button>

            {isProfileMenuOpen ? (
              <div className="profile-menu" role="menu" aria-label="Profile actions">
                <div className="profile-info">
                  <div className="user-avatar user-avatar-lg">{userInitials}</div>
                  <div className="profile-details">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="profile-divider" />
                <button className="btn btn-logout" type="button" onClick={onLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="notepad-layout">
        <main className="editor-panel editor-main">
          <div className="editor-toolbar">
            <div className="editor-mode-label">
              {editingSessionId ? "✏️ Edit Mode" : "📝 Write Mode"}
            </div>
            <div className="editor-actions">
              {editingSessionId ? (
                <button className="btn btn-ghost" type="button" onClick={onNewSession}>
                  + New Session
                </button>
              ) : null}
              <button className="btn btn-primary btn-glow" type="button" onClick={() => void onSave()} disabled={saveLoading}>
                {saveLoading ? "Saving..." : editingSessionId ? "Update Session" : "Save Session"}
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Start writing your thoughts here..."
            aria-label="Writing editor"
          />

          <div className="editor-meta">
            <div className="stats">
              <span className="stat-pill">{wordCount} words</span>
              <span className="stat-pill">{charCount} chars</span>
              <span className="stat-pill">{lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Not saved"}</span>
            </div>
            <p className="status-line">{statusMessage}</p>
          </div>
        </main>

        <section className="history-panel" aria-label="Session history section">
          <div className="history-header">
            <h3>📂 Session History</h3>
            <span className="history-count">{history.length}</span>
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              <p className="muted">No saved sessions yet.</p>
              <p className="muted">Start writing and save to see your sessions here.</p>
            </div>
          ) : (
            <ul>
              {history.map((session) => {
                const isActive = editingSessionId === session.id;
                return (
                  <li key={session.id} className={`history-entry ${isActive ? "is-active" : ""}`}>
                    <div className="history-item">
                      <button
                        type="button"
                        className="history-open-btn"
                        onClick={() => void onOpenSession(session.id)}
                        disabled={loadingSessionId === session.id || deletingSessionId === session.id}
                      >
                        <span className="history-date">{new Date(session.updatedAt).toLocaleString()}</span>
                        <strong className="history-stats">{session.wordCount} words · {session.charCount} chars</strong>
                        <em>{loadingSessionId === session.id ? "Loading..." : "Open in editor"}</em>
                      </button>

                      <div className="history-actions">
                        <button
                          type="button"
                          className="btn btn-edit"
                          onClick={() => void onEditSession(session.id)}
                          disabled={loadingSessionId === session.id || deletingSessionId === session.id}
                          title="Edit this session"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={() => void onDeleteSession(session.id)}
                          disabled={loadingSessionId === session.id || deletingSessionId === session.id}
                          title="Delete this session"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
