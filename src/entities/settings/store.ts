import { useSyncExternalStore } from "react";

const LS_MODEL = "model_id";
const LS_PERSONA = "persona_id";

type State = {
  modelId: string | null;
  personaId: string | null;
  setModelId: (id: string | null) => void;
  setPersonaId: (id: string | null) => void;
};

function readLS(key: string): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeLS(key: string, val: string | null) {
  try {
    if (typeof localStorage === "undefined") return;
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch {
    /* ignore storage errors */
  }
}

let state: State = {
  modelId: readLS(LS_MODEL),
  personaId: readLS(LS_PERSONA),
  setModelId: () => {},
  setPersonaId: () => {}
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of Array.from(listeners)) l();
}

function setModelId(id: string | null) {
  state = { ...state, modelId: id, setModelId, setPersonaId };
  writeLS(LS_MODEL, id);
  emit();
}

function setPersonaId(id: string | null) {
  state = { ...state, personaId: id, setModelId, setPersonaId };
  writeLS(LS_PERSONA, id);
  emit();
}

// Finalize setters on initial state
state = { ...state, setModelId, setPersonaId };

/** React-Hook-API für Komponenten. */
export function useSettings(): State {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
  return snapshot;
}

/** Test-/Utility-API kompatibel zu zustand: useSettings.getState() */
(useSettings as any).getState = function getState(): State {
  return state;
};
