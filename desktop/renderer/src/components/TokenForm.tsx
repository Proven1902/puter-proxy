import { useState } from "react";

interface TokenFormProps {
  busy: boolean;
  tokenMasked: boolean;
  onSave(token: string): Promise<boolean>;
  onClear(): Promise<boolean>;
}

export function TokenForm({ busy, tokenMasked, onSave, onClear }: TokenFormProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  async function handleSave() {
    const value = tokenInput.trim();
    if (!value) {
      setInputError("Token is required");
      return;
    }

    setInputError(null);
    const ok = await onSave(value);
    if (ok) {
      setTokenInput("");
    }
  }

  return (
    <div className="card" data-testid="token-panel">
      <h3>Token Security</h3>
      <label htmlFor="token-input">Puter token</label>
      <input
        id="token-input"
        data-testid="token-input"
        type="password"
        value={tokenInput}
        placeholder={tokenMasked ? "Token saved (masked)" : "pt_..."}
        onChange={(event) => setTokenInput(event.target.value)}
      />
      {inputError ? <p className="field-error">{inputError}</p> : null}
      <div className="actions">
        <button type="button" data-testid="save-token" disabled={busy} onClick={() => void handleSave()}>
          Save Token
        </button>
        <button type="button" data-testid="clear-token" disabled={busy} onClick={() => void onClear()}>
          Clear
        </button>
      </div>
    </div>
  );
}
