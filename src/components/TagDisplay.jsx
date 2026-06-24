import React from 'react';
import { TAG_MAP, TagIcon } from './tags';
import '../styles/Tags.css';

/** Icon-only row for cards (max N icons, then "+rest"). */
export function TagIcons({ tags, max = 5 }) {
  const valid = (tags || []).filter((t) => TAG_MAP[t]);
  if (valid.length === 0) return null;
  const shown = valid.slice(0, max);
  const rest = valid.length - shown.length;
  return (
    <div className="tag-icons">
      {shown.map((key) => (
        <span key={key} className="tag-icons__ic" style={{ color: TAG_MAP[key].color }} title={TAG_MAP[key].label}>
          <TagIcon tag={key} size={13} />
        </span>
      ))}
      {rest > 0 && <span className="tag-icons__more">+{rest}</span>}
    </div>
  );
}

/** Icon + label chips for the detail view. */
export function TagBadges({ tags }) {
  const valid = (tags || []).filter((t) => TAG_MAP[t]);
  if (valid.length === 0) return null;
  return (
    <div className="tag-list">
      {valid.map((key) => (
        <span key={key} className="tag-list__item">
          <span style={{ color: TAG_MAP[key].color, display: 'inline-flex' }}><TagIcon tag={key} size={14} /></span>
          {TAG_MAP[key].label}
        </span>
      ))}
    </div>
  );
}
