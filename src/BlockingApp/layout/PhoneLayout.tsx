import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { DevControls } from "../panels/DevControls";
import { FindMeButton } from "../findme/FindMeButton";
import { Sheet } from "./Sheet";
import type { LayoutProps } from "./layoutTypes";
import styles from "./layouts.module.css";

export function PhoneLayout(props: LayoutProps) {
  const { stageConfig, currentPicture, membersById, songs, currentSongId, members, currentMemberId, canEdit, onChangeMember, onToggleRole, onResetSeed } = props;

  return (
    <div className={styles.phoneRoot}>
      <div className={styles.phoneTopBar}>
        <span className={styles.wordmark}>Indianapolis Men&rsquo;s Chorus</span>
        <DevControls
          members={members}
          currentMemberId={currentMemberId}
          canEdit={canEdit}
          onChangeMember={onChangeMember}
          onToggleRole={onToggleRole}
          onResetSeed={onResetSeed}
        />
      </div>

      <div className={styles.phoneStage}>
        <StageCanvas stageConfig={stageConfig} picture={currentPicture} membersById={membersById} />
        <FindMeButton floating />
      </div>

      <Sheet>
        <SetlistPanel songs={songs} currentSongId={currentSongId} currentPicture={currentPicture} compact />
      </Sheet>
    </div>
  );
}
