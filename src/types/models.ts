export type PersonaModel = {
  id: string;
  name?: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
};

export type Persona = {
  id: string;
  title?: string;
  description?: string;
  models: PersonaModel[];
  [key: string]: unknown;
};
