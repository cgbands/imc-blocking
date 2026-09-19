import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { PictureNav } from "../panels/PictureNav";
import { DevControls } from "../panels/DevControls";
import { FindMeButton } from "../findme/FindMeButton";
import { EditorLogin } from "../auth/EditorLogin";
import type { LayoutProps } from "./layoutTypes";
import styles from "./layouts.module.css";

export function TabletLayout(props: LayoutProps) {
  const {
    stageConfig,
    currentPicture,
    nextPicture,
    progress,
    membersById,
    propsById,
    micsById,
    songs,
    currentSongId,
    onSelectSong,
    songPictures,
    playerIndex,
    isPlaying,
    canStepPrev,
    canStepNext,
    onPlayPause,
    onStepPrev,
    onStepNext,
    onScrub,
    showTrails,
    onToggleTrails,
    isolatedMemberId,
    onSelectPerson,
    members,
    currentMemberId,
    canEdit,
    onChangeMember,
    onToggleRole,
    onResetSeed,
    onEditorLogin,
    onEditorLogout,
  } = props;

  return (
    <div className={styles.bentoRoot} data-density="tablet">
      <div className={styles.topBar}>
        <span className={styles.wordmark}>Indianapolis Men&rsquo;s Chorus</span>
        <div className={styles.topBarActions}>
          <FindMeButton />
          <EditorLogin canEdit={canEdit} onLogin={onEditorLogin} onLogout={onEditorLogout} />
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
      <div className={styles.bentoGrid} data-layout="tablet">
        <div className={`${styles.glassPanel} ${styles.setlistCell}`}>
          <SetlistPanel songs={songs} currentSongId={currentSongId} onSelectSong={onSelectSong} />
          <PictureNav
            pictures={songPictures}
            currentIndex={playerIndex}
            progress={progress}
            isPlaying={isPlaying}
            canStepPrev={canStepPrev}
            canStepNext={canStepNext}
            onPlayPause={onPlayPause}
            onStepPrev={onStepPrev}
            onStepNext={onStepNext}
            onScrub={onScrub}
            showTrails={showTrails}
            onToggleTrails={onToggleTrails}
          />
        </div>
        <div className={`${styles.glassPanel} ${styles.stageCell}`}>
          <StageCanvas
            stageConfig={stageConfig}
            picture={currentPicture}
            nextPicture={nextPicture}
            progress={progress}
            membersById={membersById}
            propsById={propsById}
            micsById={micsById}
            showTrails={showTrails}
            isolatedMemberId={isolatedMemberId}
            onSelectPerson={onSelectPerson}
          />
        </div>
      </div>
    </div>
  );
}
