import React from 'react';
import { TAGS, TagIcon } from './tags';
import { useT } from '../i18n/I18nProvider';
import '../styles/Tags.css';

/** Multi-select tag chips for create/edit. value = array of tag keys. */
export default function TagPicker({ value = [], onChange }) {
  const { t } = useT();
  const toggle = (key) => {
    const set = new Set(value);
    if (set.has(key)) set.delete(key); else set.add(key);
    onChange(Array.from(set));
  };

  return (
    <div className="tagpick">
      {TAGS.map(({ key, color }) => {
        const on = value.includes(key);
        return (
          <button
            type="button"
            key={key}
            className={`tagpick__chip ${on ? 'is-on' : ''}`}
            style={on ? { color } : undefined}
            onClick={() => toggle(key)}
            aria-pressed={on}
          >
            <TagIcon tag={key} size={14} />
            <span>{t(`tag.${key}`)}</span>
            {on && <span className="tagpick__dot">·</span>}
          </button>
        );
      })}
    </div>
  );
}
