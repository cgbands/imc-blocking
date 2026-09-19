import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { PictureNav } from "../panels/PictureNav";
import { DevControls } from "../panels/DevControls";
import { FindMeButton } from "../findme/FindMeButton";
import { EditorLogin } from "../auth/EditorLogin";
import { Sheet } from "./Sheet";
import type { LayoutProps } from "./layoutTypes";
import styles from "./layouts.module.css";

export function PhoneLayout(props: LayoutProps) {
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
    <div className={styles.phoneRoot}>
      <div className={styles.phoneTopBar}>
        <span className={styles.wordmark}>Indianapolis Men&rsquo;s Chorus</span>
        <div className={styles.topBarActions}>
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

      <div className={styles.phoneStage}>
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
        <FindMeButton floating />
      </div>

      <Sheet>
        <SetlistPanel songs={songs} currentSongId={currentSongId} onSelectSong={onSelectSong} compact />
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
          compact
        />
      </Sheet>
    </div>
  );
}
