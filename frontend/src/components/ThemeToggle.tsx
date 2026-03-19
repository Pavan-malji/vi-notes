type Theme = "dark" | "light";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className={theme === "dark" ? "theme-toggle is-dark" : "theme-toggle"}
      aria-label="Toggle theme"
      onClick={onToggle}
    >
      <span className="theme-icon theme-icon-sun" aria-hidden="true">
        ☀
      </span>
      <span className="theme-icon theme-icon-moon" aria-hidden="true">
        ☾
      </span>
      <span className="theme-track" />
      <span className="theme-thumb" />
    </button>
  );
}
