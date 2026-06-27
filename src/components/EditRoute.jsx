import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import TagPicker from './TagPicker';
import { useT } from '../i18n/I18nProvider';
import '../styles/AddForm.css';

export const EditRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const fileInputRef = useRef(null);

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    duration: '',
    distance: '',
    best_time_to_visit: ''
  });
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingImageIds, setExistingImageIds] = useState([]);
  const [tags, setTags] = useState([]);

  // Load route data
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetch(`/routes/${id}`);
        
        if (data && data.data) {
          setRoute(data.data);
          setFormData({
            title: data.data.title || '',
            description: data.data.description || '',
            difficulty: data.data.difficulty || 'easy',
            duration: data.data.duration || '',
            distance: data.data.distance || '',
            best_time_to_visit: data.data.best_time_to_visit || ''
          });
          setTags(Array.isArray(data.data.tags) ? data.data.tags : []);
          
          // Set existing images
          if (data.data.image_urls && data.data.image_urls.length > 0) {
            setExistingImages(data.data.image_urls);
          }
          
          // Set existing image IDs
          if (data.data.image_ids && data.data.image_ids.length > 0) {
            setExistingImageIds(data.data.image_ids);
          }
        }
      } catch (err) {
        setError(t('form.loadFailed'));
        console.error('Error loading route:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoute();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setExistingImageIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add route data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(`hike_route[${key}]`, formData[key]);
        }
      });

      // Tags — uvek šaljemo; prazan string marker omogućava brisanje svih.
      if (tags.length === 0) {
        formDataToSend.append('hike_route[tags][]', '');
      } else {
        tags.forEach((t) => formDataToSend.append('hike_route[tags][]', t));
      }

      // Add new images
      selectedImages.forEach((image, index) => {
        formDataToSend.append(`hike_route[images][]`, image);
      });

      // Add existing image IDs to keep
      console.log('Existing image IDs to keep:', existingImageIds);
      console.log('Existing image IDs length:', existingImageIds.length);
      
      // Always send the existing_image_ids parameter, even if empty
      if (existingImageIds.length === 0) {
        // Send empty parameter to indicate all images should be deleted
        formDataToSend.append(`hike_route[delete_all_images]`, 'true');
      } else {
        existingImageIds.forEach((imageId, index) => {
          formDataToSend.append(`hike_route[existing_image_ids][]`, imageId);
        });
      }

      const response = await authenticatedFetch(`/routes/${id}/update`, {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header, let browser set it for FormData
        headers: {
          // Remove Content-Type to let browser set boundary for FormData
        }
      });

      if (response && response.status === 200) {
        // Redirect back to route details
        navigate(`/routes/${id}`);
      } else {
        setError('Failed to update route');
      }
    } catch (err) {
      setError('Error updating route: ' + err.message);
      console.error('Error updating route:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/routes/${id}`);
  };

  if (loading) {
    return (
      <div className="af-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="af-spin" style={{ borderTopColor: '#50c878', borderColor: 'rgba(80,200,120,0.25)' }} />
      </div>
    );
  }

  if (error && !route) {
    return (
      <div className="af-page"><div className="af-inner"><p className="af-msg error">{error}</p></div></div>
    );
  }

  const gps = route?.calculated_from_points;

  return (
    <div className="af-page">
      <div className="af-inner">
        <button type="button" className="af-back" onClick={handleCancel}>{t('form.back')}</button>
        <h1 className="af-h1">{t('form.editTitle')}</h1>

        <form onSubmit={handleSubmit}>
          {error && <p className="af-msg error" style={{ marginTop: 0, marginBottom: '1rem' }}>{error}</p>}

          {gps && (
            <div className="af-info">{t('form.gpsInfo')}</div>
          )}

          <div className="af-field">
            <label className="af-label">{t('form.name')} *</label>
            <input className="af-input" type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder={t('form.namePh')} />
          </div>

          <div className="af-field">
            <label className="af-label">{t('form.desc')}</label>
            <textarea className="af-textarea" name="description" value={formData.description} onChange={handleInputChange} placeholder={t('form.descPh')} />
          </div>

          <div className="af-field">
            <label className="af-label">{t('form.difficulty')}</label>
            <select className="af-select" name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
              <option value="easy">{t('form.diffEasy')}</option>
              <option value="medium">{t('form.diffModerate')}</option>
              <option value="hard">{t('form.diffHard')}</option>
            </select>
          </div>

          <div className="af-row2">
            <div className="af-field" style={{ flex: 1 }}>
              <label className="af-label">{t('form.duration')} (min){gps ? ' · GPS' : ''}</label>
              <input className={`af-input ${gps ? 'af-disabled' : ''}`} type="number" name="duration" value={formData.duration} onChange={handleInputChange} min="0" placeholder="120" disabled={gps} />
            </div>
            <div className="af-field" style={{ flex: 1 }}>
              <label className="af-label">{t('form.length')}{gps ? ' · GPS' : ''}</label>
              <input className={`af-input ${gps ? 'af-disabled' : ''}`} type="number" name="distance" value={formData.distance} onChange={handleInputChange} min="0" step="0.1" placeholder="5.2" disabled={gps} />
            </div>
          </div>

          <div className="af-field">
            <label className="af-label">{t('form.bestTime')}</label>
            <input className="af-input" type="text" name="best_time_to_visit" value={formData.best_time_to_visit} onChange={handleInputChange} placeholder={t('form.bestTimePh')} />
          </div>

          <div className="af-field">
            <label className="af-label">{t('form.features')}</label>
            <TagPicker value={tags} onChange={setTags} />
          </div>

          {/* Images */}
          <div className="af-field">
            <label className="af-label">{t('form.routeImages')}</label>
            {existingImages.length > 0 && (
              <>
                <p className="af-subtitle">{t('form.existingImages')}</p>
                <div className="af-imggrid" style={{ marginBottom: '0.9rem' }}>
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="af-imgcell">
                      <img src={imageUrl} alt={`Ruta ${index + 1}`} />
                      <button type="button" className="af-imgremove" onClick={() => removeExistingImage(index)}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div
              className="af-drop"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current && fileInputRef.current.click(); } }}
            >
              <span className="af-drop__ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3.5" /></svg>
              </span>
              <span>
                <p className="af-drop__t">{t('form.addNewImages')}</p>
                <p className="af-drop__s">{t('form.addPhotosHint')}</p>
              </span>
            </div>
            <input ref={fileInputRef} type="file" name="images" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />

            {selectedImages.length > 0 && (
              <>
                <p className="af-subtitle" style={{ marginTop: '0.9rem' }}>{t('form.newImages')}</p>
                <div className="af-imggrid">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="af-imgcell">
                      <img src={URL.createObjectURL(file)} alt={`Nova ${index + 1}`} />
                      <button type="button" className="af-imgremove" onClick={() => removeSelectedImage(index)}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="af-actions">
            <button type="button" className="af-cancel" onClick={handleCancel} disabled={saving}>{t('rd.cancel')}</button>
            <button type="submit" className="af-submit" disabled={saving}>
              {saving ? <><span className="af-spin" /> {t('form.saving')}</> : t('form.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
