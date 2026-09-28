import { useRef, useState } from "react";
import { useApp } from "../../app/AppContext";
import { useSettings, type FontSize, type Theme } from "../../app/SettingsContext";
import { eventLogExportSchema } from "../../domain/schemas";
import type { EventLogExport } from "../../domain/types";

export function SettingsPage() {
  const { events, store, refresh } = useApp();
  const { settings, update } = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportEvents = () => {
    const payload: EventLogExport = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      events
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `german-reader-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${events.length} events.`);
  };

  const importEvents = async (file: File) => {
    try {
      const parsed = eventLogExportSchema.parse(JSON.parse(await file.text()));
      await store.append(parsed.events);
      await refresh();
      setMessage(`Imported ${parsed.events.length} events (duplicates skipped).`);
    } catch {
      setMessage("Import failed: not a valid progress export file.");
    }
  };

  const resetProgress = async () => {
    await store.clear();
    await refresh();
    setConfirmReset(false);
    setMessage("Progress reset.");
  };

  return (
    <main className="page stack">
      <h1>Settings</h1>

      <section className="card stack">
        <h2>Appearance</h2>
        <div className="spread">
          <span>Theme</span>
          <div className="seg" role="group" aria-label="Theme">
            {(["system", "light", "dark"] as Theme[]).map((t) => (
              <button
                key={t}
                className={settings.theme === t ? "active" : ""}
                onClick={() => update({ theme: t })}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="spread">
          <span>Font size</span>
          <div className="seg" role="group" aria-label="Font size">
            {(["s", "m", "l"] as FontSize[]).map((f) => (
              <button
                key={f}
                className={settings.fontSize === f ? "active" : ""}
                onClick={() => update({ fontSize: f })}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Progress data</h2>
        <p className="muted small">
          {events.length} events stored on this device. Export regularly as a backup, or
          to move progress to another device.
        </p>
        <div className="row">
          <button className="primary" onClick={exportEvents}>
            Export progress
          </button>
          <button onClick={() => fileInput.current?.click()}>Import progress</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importEvents(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="card stack">
        <h2>Danger zone</h2>
        {confirmReset ? (
          <div className="row">
            <span className="small">Delete all progress on this device?</span>
            <button className="danger" onClick={() => void resetProgress()}>
              Yes, delete
            </button>
            <button onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button className="danger" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </button>
        )}
      </section>

      {message && <p className="muted small">{message}</p>}
    </main>
  );
}
