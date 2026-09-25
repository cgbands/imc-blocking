import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { PictureNav } from "../panels/PictureNav";
import { DevControls } from "../panels/DevControls";
import { Inspector } from "../panels/Inspector";
import { EditorToolbar } from "../panels/EditorToolbar";
import { StageSetupPanel } from "../panels/StageSetupPanel";
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
    isAnimating,
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
    isolatedMemberId,
    onSelectPerson,
    absentSongIds,
    findMeActive,
    onFindMe,
    memberInCurrentPicture,
    highlightedMemberId,
    members,
    currentMemberId,
    canEdit,
    onChangeMember,
    onToggleRole,
    onResetSeed,
    onEditorLogin,
    onEditorLogout,
    coarsePointer,
    selection,
    selectionCount,
    onSelectionChange,
    onMovePeople,
    onMoveProps,
    onMoveMics,
    onAssignMic,
    mics,
    micPlacements,
    snapValue,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onAddProp,
    onUpdateProp,
    onDeleteProp,
    onUpdateMember,
    onAlign,
    onDistribute,
    onDeleteSelection,
    onDuplicatePicture,
    onDeletePicture,
    onMovePicture,
    onMoveSong,
    onUpdateStageConfig,
  } = props;

  const hasSelection = selectionCount > 0;

  return (
    <div className={styles.bentoRoot} data-density="tablet">
      <div className={styles.topBar}>
        <span className={styles.wordmark}>Indianapolis Men&rsquo;s Chorus</span>
        <div className={styles.topBarActions}>
          <FindMeButton active={findMeActive} onClick={onFindMe} inPicture={memberInCurrentPicture} />
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
          <SetlistPanel
            songs={songs}
            currentSongId={currentSongId}
            onSelectSong={onSelectSong}
            canEdit={canEdit}
            onMoveSong={onMoveSong}
            absentSongIds={absentSongIds}
          />
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
            canEdit={canEdit}
            onMovePicture={onMovePicture}
            onDuplicatePicture={onDuplicatePicture}
            onDeletePicture={onDeletePicture}
            memberInCurrentPicture={memberInCurrentPicture}
          />
          {canEdit && <StageSetupPanel stageConfig={stageConfig} onChange={onUpdateStageConfig} />}
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
            highlightedMemberId={highlightedMemberId}
            onSelectPerson={onSelectPerson}
            editMode={canEdit}
            coarsePointer={coarsePointer}
            selection={selection}
            onSelectionChange={onSelectionChange}
            onMovePeople={onMovePeople}
            onMoveProps={onMoveProps}
            onMoveMics={onMoveMics}
            snapValue={snapValue}
          />

          {/* Editors get a floating glass toolbar over the stage, and the
              inspector appears as a floating card only when something's up. */}
          {canEdit && (
            <EditorToolbar
              floating
              canUndo={canUndo}
              canRedo={canRedo}
              selectionCount={selectionCount}
              onUndo={onUndo}
              onRedo={onRedo}
              onAddProp={onAddProp}
              onDuplicatePicture={() => onDuplicatePicture(playerIndex)}
              onAlign={onAlign}
              onDistribute={onDistribute}
              onDelete={onDeleteSelection}
            />
          )}
          {canEdit && hasSelection && (
            <div className={styles.floatingInspector}>
              <Inspector
                selection={selection}
                membersById={membersById}
                propsById={propsById}
                mics={mics}
                micPlacements={micPlacements}
                canEdit={canEdit}
                onUpdateMember={onUpdateMember}
                onUpdateProp={onUpdateProp}
                onDeleteProp={onDeleteProp}
                onAssignMic={onAssignMic}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
