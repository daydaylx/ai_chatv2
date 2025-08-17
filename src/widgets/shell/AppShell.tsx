import { ReactNode, useState, createContext } from "react";
import SettingsSheet from "../../features/settings/SettingsSheet";
import { useSettings } from "../../entities/settings/store";
import { Button } from "../../shared/ui/Button";

type Props = { children: ReactNode };

export const SettingsContext = createContext<() => void>(() => {});

export function AppShell({ children }: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const { modelId, personaId } = useSettings();

  return (
    <SettingsContext.Provider value={() => setOpen(true)}>
      <div className="m-app">
        <header className="m-header">
          <div className="m-header__title">AI Chat</div>
          <div className="m-header__right">
            <span className="badge">{modelId ?? "kein Modell"}</span>
            <span className="badge badge--persona">{personaId ?? "Stil —"}</span>
            <Button className="h-9 px-3" onClick={() => setOpen(true)}>Einstellungen</Button>
          </div>
        </header>
        <main className="m-main">{children}</main>
        <SettingsSheet open={open} onClose={() => setOpen(false)} />
      </div>
    </SettingsContext.Provider>
  );
}
