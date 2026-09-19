import { useState } from "react";
import type { Member } from "../../types";
import styles from "./panels.module.css";

interface DevControlsProps {
  members: Member[];
  currentMemberId: string;
  canEdit: boolean;
  onChangeMember: (id: string) => void;
  onToggleRole: (canEdit: boolean) => void;
  onResetSeed: () => void;
}

/**
 * Structured to be trivial to delete: one component, no state elsewhere depends on it
 * beyond the callbacks passed in from BlockingApp.
 */
export function DevControls({ members, currentMemberId, canEdit, onChangeMember, onToggleRole, onResetSeed }: DevControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.devControls} data-open={open || undefined}>
      <button className={styles.devToggle} onClick={() => setOpen((v) => !v)}>
        Dev {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className={styles.devBody}>
          <label className={styles.devField}>
            Logged in as
            <select value={currentMemberId} onChange={(e) => onChangeMember(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.devField}>
            Role
            <select value={canEdit ? "editor" : "viewer"} onChange={(e) => onToggleRole(e.target.value === "editor")}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </label>
          <button className={styles.devReset} onClick={onResetSeed}>
            Reset seed data
          </button>
        </div>
      )}
    </div>
  );
}
