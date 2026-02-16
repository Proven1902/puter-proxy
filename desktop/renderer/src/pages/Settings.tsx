interface SettingsProps {
  lifecycleTuningNote: string;
}

export function Settings({ lifecycleTuningNote }: SettingsProps) {
  return (
    <section className="page" data-testid="page-settings">
      <h2>Settings</h2>
      <div className="card">
        <p>UI-driven lifecycle tuning follow-up (Task 4 plan extension):</p>
        <p data-testid="lifecycle-tuning-note">{lifecycleTuningNote}</p>
      </div>
    </section>
  );
}
