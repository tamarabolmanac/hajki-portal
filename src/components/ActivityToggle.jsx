import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { HikerIcon, BikeIcon } from './ActivityIcon';

/**
 * Sliding toggle hike/bike. Poluprozirni zeleni kružić klizi levo/desno preko
 * aktivne ikonice. Vrednost je string "hike" ili "bike".
 * @param {{ value?: 'hike'|'bike', onChange: (v: string) => void }} props
 */
export default function ActivityToggle({ value = 'hike', onChange }) {
  const { t } = useT();
  const isBike = value === 'bike';

  const H = 48;            // visina
  const W = 108;           // širina
  const PAD = 4;           // razmak thumb-a od ivice
  const THUMB = H - PAD * 2;
  const shift = W - THUMB - PAD * 2;   // koliko thumb klizi udesno

  const iconWrap = (active) => ({
    position: 'absolute', top: 0, width: H, height: H,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1, transition: 'color 0.2s ease',
    color: active ? '#0b1f12' : 'rgba(255,255,255,0.45)',
  });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isBike}
      aria-label={t('form.activity')}
      onClick={() => onChange(isBike ? 'hike' : 'bike')}
      style={{
        position: 'relative', width: W, height: H, padding: 0,
        borderRadius: H / 2, cursor: 'pointer',
        background: 'rgba(56, 239, 125, 0.12)',
        border: '1px solid rgba(56, 239, 125, 0.35)',
        WebkitTapHighlightColor: 'transparent', outline: 'none',
        flexShrink: 0,
      }}
    >
      {/* poluprozirni zeleni kružić koji klizi */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', top: PAD, left: PAD,
          width: THUMB, height: THUMB, borderRadius: '50%',
          background: 'rgba(56, 239, 125, 0.45)',
          border: '1px solid rgba(56, 239, 125, 0.75)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          transform: isBike ? `translateX(${shift}px)` : 'translateX(0)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {/* ikonice na krajevima; aktivna je tamna (unutar zelenog kruga) */}
      <span style={{ ...iconWrap(!isBike), left: 0 }}><HikerIcon /></span>
      <span style={{ ...iconWrap(isBike), right: 0, left: 'auto' }}><BikeIcon /></span>
    </button>
  );
}
