import { StageCanvas } from "../stage/StageCanvas";
import { SetlistPanel } from "../panels/SetlistPanel";
import { PictureNav } from "../panels/PictureNav";
import { DevControls } from "../panels/DevControls";
import { Inspector } from "../panels/Inspector";
import { EditorToolbar } from "../panels/EditorToolbar";
import { StageSetupPanel } from "../panels/StageSetupPanel";
import { FindMeButton } from "../findme/FindMeButton";
import { EditorLogin } from "../auth/EditorLogin";
import { useState } from "react";
import { Sheet, type SheetState } from "./Sheet";
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
  // The sheet overlays the stage, so the stage reserves room for it and keeps
  // the formation centred in what's actually visible.
  const [sheetState, setSheetState] = useState<SheetState>("half");

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

      <div className={styles.phoneStage} data-sheet={sheetState}>
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
          editMode={canEdit}
          coarsePointer={coarsePointer}
          selection={selection}
          onSelectionChange={onSelectionChange}
          onMovePeople={onMovePeople}
          onMoveProps={onMoveProps}
          onMoveMics={onMoveMics}
          snapValue={snapValue}
        />
        {!canEdit && <FindMeButton floating />}
      </div>

      <Sheet onStateChange={setSheetState}>
        {/* On a phone the editor tools live in the sheet rather than floating
            over the stage, where they would collide with it. */}
        {canEdit && (
          <EditorToolbar
            scrollable
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
        )}
        <SetlistPanel
          songs={songs}
          currentSongId={currentSongId}
          onSelectSong={onSelectSong}
          compact
          canEdit={canEdit}
          onMoveSong={onMoveSong}
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
          compact
          canEdit={canEdit}
          onMovePicture={onMovePicture}
          onDuplicatePicture={onDuplicatePicture}
          onDeletePicture={onDeletePicture}
        />
        {canEdit && <StageSetupPanel stageConfig={stageConfig} onChange={onUpdateStageConfig} />}
      </Sheet>
    </div>
  );
}
