import type { PersonaModel } from "../entities/persona";

export type Filter = {
  free?: boolean;
  allow_nsfw?: boolean;
  fast?: boolean;
};

function nameOf(m: PersonaModel): string {
  return (m.name ?? m.label ?? m.id).toLowerCase();
}

export function sortModels(models: PersonaModel[], favs: Record<string, true>): PersonaModel[] {
  return [...models].sort((a, b) => {
    const fa = !!favs[a.id], fb = !!favs[b.id];
    if (fa !== fb) return fa ? -1 : 1;
    const af = !!a.free, bf = !!b.free;
    if (af !== bf) return af ? -1 : 1;
    return nameOf(a).localeCompare(nameOf(b));
  });
}

export function filterModels(models: PersonaModel[], f: Filter): PersonaModel[] {
  return models.filter((m) => {
    if (f.free === true && !m.free) return false;
    if (f.allow_nsfw === true && !m.allow_nsfw) return false;
    if (f.fast === true && !m.fast) return false;
    return true;
  });
}
