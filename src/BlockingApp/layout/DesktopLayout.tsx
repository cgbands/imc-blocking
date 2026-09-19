import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { PictureNav } from "../panels/PictureNav";
import { DevControls } from "../panels/DevControls";
import { FindMeButton } from "../findme/FindMeButton";
import { EditorLogin } from "../auth/EditorLogin";
import type { LayoutProps } from "./layoutTypes";
import styles from "./layouts.module.css";

export function DesktopLayout(props: LayoutProps) {
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
    onJumpToPicture,
    showTrails,
    onToggleTrails,
    showNames,
    onToggleNames,
    isAnimating,
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
    <div className={styles.bentoRoot} data-density="desktop">
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
      <div className={styles.bentoGrid} data-layout="desktop">
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
            onJumpToPicture={onJumpToPicture}
            showTrails={showTrails}
            onToggleTrails={onToggleTrails}
            showNames={showNames}
            onToggleNames={onToggleNames}
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
            showTrails={showTrails || isAnimating}
            showNames={showNames}
            isolatedMemberId={isolatedMemberId}
            onSelectPerson={onSelectPerson}
          />
        </div>
        <div className={`${styles.glassPanel} ${styles.inspectorCell}`}>
          <div className={styles.inspectorPlaceholder}>Inspector arrives with the editor in Phase 3.</div>
        </div>
      </div>
    </div>
  );
}
