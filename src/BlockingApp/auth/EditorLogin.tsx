import { useState } from "react";
import styles from "./EditorLogin.module.css";

// Demo-only gate — see README. There is no real backend auth in this
// prototype (per spec); this just makes "become an Editor" a real, visible
// flow instead of a hidden dev toggle, and canEdit is still the single prop
// that a future portal integration would replace with a server-checked role.
const DEMO_PASSCODE = "director";

interface EditorLoginProps {
  canEdit: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function EditorLogin({ canEdit, onLogin, onLogout }: EditorLoginProps) {
  const [open, setOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  if (canEdit) {
    return (
      <div className={styles.status}>
        <span className={styles.badge}>Editor</span>
        <button
          className={styles.logoutBtn}
          onClick={() => {
            onLogout();
            setOpen(false);
          }}
        >
          Log out
        </button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toLowerCase() === DEMO_PASSCODE) {
      onLogin();
      setOpen(false);
      setPasscode("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.loginBtn} onClick={() => setOpen((v) => !v)}>
        Editor Login
      </button>
      {open && (
        <form className={styles.popover} onSubmit={submit}>
          <label className={styles.field}>
            Passcode
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="demo: director"
            />
          </label>
          {error && <div className={styles.error}>Incorrect passcode.</div>}
          <button type="submit" className={styles.submitBtn}>
            Log in
          </button>
        </form>
      )}
    </div>
  );
}
