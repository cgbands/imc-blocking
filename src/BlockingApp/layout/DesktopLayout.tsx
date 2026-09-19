import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { DevControls } from "../panels/DevControls";
import { FindMeButton } from "../findme/FindMeButton";
import type { LayoutProps } from "./layoutTypes";
import styles from "./layouts.module.css";

export function DesktopLayout(props: LayoutProps) {
  const { stageConfig, currentPicture, membersById, songs, currentSongId, members, currentMemberId, canEdit, onChangeMember, onToggleRole, onResetSeed } = props;

  return (
    <div className={styles.bentoRoot} data-density="desktop">
      <div className={styles.topBar}>
        <span className={styles.wordmark}>Indianapolis Men&rsquo;s Chorus</span>
        <div className={styles.topBarActions}>
          <FindMeButton />
          <DevControls
            members={members}
            currentMemberId={currentMemberId}
            canEdit={canEdit}
            onChangeMember={onChangeMember}
            onToggleRole={onToggleRole}
            onResetSeed={onResetSeed}
          />
        </div>
      </div>
      <div className={styles.bentoGrid} data-layout="desktop">
        <div className={`${styles.glassPanel} ${styles.setlistCell}`}>
          <SetlistPanel songs={songs} currentSongId={currentSongId} currentPicture={currentPicture} />
        </div>
        <div className={`${styles.glassPanel} ${styles.stageCell}`}>
          <StageCanvas stageConfig={stageConfig} picture={currentPicture} membersById={membersById} />
        </div>
        <div className={`${styles.glassPanel} ${styles.inspectorCell}`}>
          <div className={styles.inspectorPlaceholder}>Inspector arrives with the editor in Phase 3.</div>
        </div>
      </div>
    </div>
  );
}
