import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TagPicker from './TagPicker';
import { authenticatedFetch } from '../utils/api';
import { useT } from '../i18n/I18nProvider';
import '../styles/AddForm.css';

export const ImportGpx = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tags, setTags] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!file) { setMessage(t('gpx.noFile')); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('gpx', file);
      if (title.trim()) fd.append('title', title.trim());
      if (difficulty) fd.append('difficulty', difficulty);
      tags.forEach((tg) => fd.append('tags[]', tg));

      const data = await authenticatedFetch('/routes/import_gpx', { method: 'POST', body: fd });
      if (data && data.id) { navigate(`/route/${data.id}`); return; }
      setMessage(data?.message || t('gpx.failed'));
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isError = message && (message.startsWith('Error') || message === t('gpx.failed') || message === t('gpx.noFile'));

  return (
    <div className="af-page">
      <div className="af-inner">
        <button type="button" className="af-back" onClick={() => navigate(-1)}>{t('form.back')}</button>
        <h1 className="af-h1">{t('gpx.title')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="af-field">
            <label className="af-label">{t('gpx.file')}</label>
            <div
              className="af-drop"
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current && fileRef.current.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current && fileRef.current.click(); } }}
            >
              <span className="af-drop__ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6M9 15h6" /></svg>
              </span>
              <span>
                <p className="af-drop__t">{file ? file.name : t('gpx.pick')}</p>
                <p className="af-drop__s">{t('gpx.pickHint')}</p>
              </span>
            </div>
            <input ref={fileRef} type="file" accept=".gpx,application/gpx+xml,application/xml" onChange={(e) => setFile(e.target.files[0] || null)} style={{ display: 'none' }} />
          </div>

          <div className="af-field">
            <label className="af-label">{t('gpx.titleOpt')}</label>
            <input className="af-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('gpx.titlePh')} />
          </div>

          <div className="af-field">
            <label className="af-label">{t('form.difficulty')}</label>
            <select className="af-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">{t('form.diffPick')}</option>
              <option value="Laka">{t('form.diffEasy')}</option>
              <option value="Srednja">{t('form.diffModerate')}</option>
              <option value="Teška">{t('form.diffHard')}</option>
            </select>
          </div>

          <div className="af-field">
            <label className="af-label">{t('form.features')}</label>
            <TagPicker value={tags} onChange={setTags} />
          </div>

          <p className="af-hint">{t('gpx.autoNote')}</p>

          <button type="submit" className="af-submit" disabled={loading}>
            {loading ? <><span className="af-spin" /> {t('gpx.importing')}</> : t('gpx.import')}
          </button>
          {message && <p className={`af-msg ${isError ? 'error' : 'success'}`}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default ImportGpx;
