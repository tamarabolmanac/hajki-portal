import React, { useState, useEffect } from 'react';
import { useT } from '../i18n/I18nProvider';
import '../styles/ConfirmModal.css';

const IcTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
);

/**
 * Dark confirm dialog matching the Figma design.
 * Props:
 *  - open: render flag
 *  - icon: node for the icon tile (defaults to a trash icon)
 *  - title, message, detail (optional emphasised line, e.g. route name)
 *  - confirmLabel / cancelLabel
 *  - requireCheckLabel: when set, shows a checkbox the user must tick first
 *  - onConfirm / onCancel
 *  - busy: disables the confirm button while an async action runs
 *  - accent: 'danger' (default) | 'green'
 */
export default function ConfirmModal({
  open,
  icon,
  title,
  message,
  detail,
  confirmLabel,
  cancelLabel,
  requireCheckLabel,
  onConfirm,
  onCancel,
  busy = false,
  accent = 'danger',
}) {
  const { t } = useT();
  const [checked, setChecked] = useState(false);

  // Reset the checkbox whenever the dialog re-opens.
  useEffect(() => { if (open) setChecked(false); }, [open]);

  if (!open) return null;

  const confirmDisabled = busy || (requireCheckLabel && !checked);

  return (
    <div className="cm-backdrop" onClick={onCancel}>
      <div className="cm-card" onClick={(e) => e.stopPropagation()}>
        <div className={`cm-accent ${accent === 'green' ? 'cm-accent--green' : ''}`} />
        <div className="cm-body">
          <div className="cm-icon">{icon || <IcTrash />}</div>
          <h2 className="cm-title">{title}</h2>
          {message && <p className="cm-msg">{message}</p>}
          {detail && <p className="cm-detail">{detail}</p>}

          {requireCheckLabel && (
            <label className="cm-check" onClick={(e) => { e.preventDefault(); setChecked((c) => !c); }}>
              <span className={`cm-checkbox ${checked ? 'cm-checkbox--on' : ''}`}>{checked ? '✓' : ''}</span>
              <span>{requireCheckLabel}</span>
            </label>
          )}

          <div className="cm-actions">
            <button type="button" className="cm-btn cm-btn--cancel" onClick={onCancel}>{cancelLabel || t('rd.cancel')}</button>
            <button
              type="button"
              className="cm-btn cm-btn--danger"
              disabled={confirmDisabled}
              onClick={() => { if (!confirmDisabled) onConfirm(); }}
            >
              {confirmLabel || t('rd.confirmDelete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
