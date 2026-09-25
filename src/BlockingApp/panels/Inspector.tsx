import type { Member, Mic, MicPlacement, PersonShape, Prop, PropKind } from "../../types";
import type { SelectionState } from "../editor/useEditor";
import styles from "./editor.module.css";

const SHAPES: PersonShape[] = ["circle", "star", "square", "triangle", "diamond", "heart", "spade", "club"];
const COLORS = ["#2e6f9e", "#3f8f6c", "#b06a2f", "#7a4fa3", "#c2455f", "#3a3a6e", "#3b8f9e", "#8a8536"];

interface InspectorProps {
  selection: SelectionState;
  membersById: Map<string, Member>;
  propsById: Map<string, Prop>;
  mics: Mic[];
  micPlacements: MicPlacement[];
  canEdit: boolean;
  onUpdateMember: (member: Member) => void;
  onUpdateProp: (prop: Prop) => void;
  onDeleteProp: (propId: string) => void;
  onAssignMic: (micId: string, memberId: string | null) => void;
}

export function Inspector({
  selection,
  membersById,
  propsById,
  mics,
  micPlacements,
  canEdit,
  onUpdateMember,
  onUpdateProp,
  onDeleteProp,
  onAssignMic,
}: InspectorProps) {
  const count = selection.memberIds.length + selection.propIds.length;

  if (count === 0) {
    return (
      <div className={styles.inspector}>
        <h2 className={styles.inspectorTitle}>Inspector</h2>
        <p className={styles.inspectorHint}>
          {canEdit ? "Select a person or prop to edit it." : "Tap a person to follow their path."}
        </p>
      </div>
    );
  }

  // Detail editors only make sense for a single item; a multi-selection gets
  // the align/distribute tools instead.
  const prop = count === 1 && selection.propIds.length === 1 ? propsById.get(selection.propIds[0]) : undefined;
  const member = count === 1 && selection.memberIds.length === 1 ? membersById.get(selection.memberIds[0]) : undefined;

  return (
    <div className={styles.inspector}>
      <h2 className={styles.inspectorTitle}>Inspector</h2>

      {count > 1 && <p className={styles.inspectorHint}>{count} items selected. Use the toolbar to align or distribute.</p>}

      {member && (
        <div className={styles.inspectorBody}>
          <div className={styles.inspectorName}>{member.name}</div>
          <div className={styles.inspectorMeta}>
            {member.voicePart} · {member.danceGroup}
          </div>

          {canEdit && (
            <>
              <ShapePicker
                label="Shape"
                value={member.shape}
                onChange={(shape) => onUpdateMember({ ...member, shape })}
              />
              <ColorPicker
                label="Colour"
                value={member.color}
                onChange={(color) => onUpdateMember({ ...member, color })}
              />
              <ShapePicker
                label="Tag shape"
                value={member.tagShape}
                onChange={(tagShape) => onUpdateMember({ ...member, tagShape })}
              />
              <ColorPicker
                label="Tag colour"
                value={member.tagColor}
                onChange={(tagColor) => onUpdateMember({ ...member, tagColor })}
              />
              <p className={styles.inspectorHint}>Shape, colour and tag stay with this person across every Picture.</p>

              <h3 className={styles.setupHeading}>Mics</h3>
              {mics.map((mic) => {
                const placement = micPlacements.find((m) => m.micId === mic.id);
                const heldByThisPerson = placement?.holderMemberId === member.id;
                const otherHolder = placement?.holderMemberId ? membersById.get(placement.holderMemberId) : null;
                return (
                  <div key={mic.id} className={styles.micRow}>
                    <div>
                      <div className={styles.micName}>{mic.label}</div>
                      <div className={styles.inspectorHint}>
                        {heldByThisPerson
                          ? "Held by this person"
                          : otherHolder
                            ? `Held by ${otherHolder.name}`
                            : "Standing on its own"}
                      </div>
                    </div>
                    {heldByThisPerson ? (
                      <button className={styles.chip} onClick={() => onAssignMic(mic.id, null)}>
                        Put down
                      </button>
                    ) : (
                      <button className={styles.chip} onClick={() => onAssignMic(mic.id, member.id)}>
                        {otherHolder ? "Hand off here" : "Pick up"}
                      </button>
                    )}
                  </div>
                );
              })}
              <p className={styles.inspectorHint}>
                Mic changes apply from this Picture onward. Drag a mic that nobody is holding to reposition it.
              </p>
            </>
          )}
        </div>
      )}

      {prop && canEdit && (
        <div className={styles.inspectorBody}>
          <label className={styles.field}>
            Name
            <input value={prop.name} onChange={(e) => onUpdateProp({ ...prop, name: e.target.value })} />
          </label>
          <label className={styles.field}>
            Kind
            <select value={prop.kind} onChange={(e) => onUpdateProp({ ...prop, kind: e.target.value as PropKind })}>
              <option value="rectangle">Rectangle</option>
              <option value="square">Square</option>
              <option value="circle">Circle</option>
            </select>
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Width (ft)
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={prop.width}
                onChange={(e) => onUpdateProp({ ...prop, width: Number(e.target.value) })}
              />
            </label>
            <label className={styles.field}>
              Height (ft)
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={prop.height}
                onChange={(e) => onUpdateProp({ ...prop, height: Number(e.target.value) })}
              />
            </label>
          </div>
          <ColorPicker label="Colour" value={prop.color} onChange={(color) => onUpdateProp({ ...prop, color })} />
          <button className={styles.dangerBtn} onClick={() => onDeleteProp(prop.id)}>
            Delete prop
          </button>
        </div>
      )}
    </div>
  );
}

function ShapePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PersonShape;
  onChange: (shape: PersonShape) => void;
}) {
  return (
    <label className={styles.field}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as PersonShape)}>
        {SHAPES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const isCustom = !COLORS.includes(value);
  return (
    <div className={styles.field}>
      {label}
      <div className={styles.swatchRow}>
        {COLORS.map((c) => (
          <button
            key={c}
            className={c === value ? styles.swatchActive : styles.swatch}
            style={{ background: c }}
            onClick={() => onChange(c)}
            aria-label={`${label} ${c}`}
          />
        ))}
        {/* A native picker for anything the curated palette doesn't cover;
            it takes on whatever custom colour is already chosen. */}
        <label
          className={isCustom ? styles.swatchActive : styles.swatch}
          style={{ background: isCustom ? value : "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)" }}
          title="Custom colour"
        >
          <input
            type="color"
            value={isCustom ? value : "#888888"}
            onChange={(e) => onChange(e.target.value)}
            className={styles.colorInput}
            aria-label={`${label} custom`}
          />
        </label>
      </div>
    </div>
  );
}
