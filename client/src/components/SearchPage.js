import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductList from './ProductList';
import { trackLocalSearchSignal } from '../utils/localRecommendation';
import './SearchPage.css';

const IMAGE_SEARCH_SESSION_KEY = 'banglamart_image_search_payload_v1';

function normalizeProductEntry(item) {
  const productId = String(item?._id || item?.id || item?.productId || '').trim();
  return {
    _id: productId,
    id: productId,
    name: String(item?.name || 'Product'),
    brand: String(item?.brand || ''),
    price: Number(item?.price || 0),
    image: String(item?.image || ''),
    categoryName: String(item?.categoryName || item?.category || ''),
    description: String(item?.description || ''),
    rating: Number(item?.rating || 0),
    reviews: Number(item?.reviews || 0),
    soldCount: Number(item?.soldCount || 0),
    inStock: Boolean(item?.inStock),
    stock: Number(item?.stock || (item?.inStock ? 1 : 0)),
  };
}

function mapCardsToProducts(cards) {
  if (!Array.isArray(cards)) return [];
  return cards.map((card) => normalizeProductEntry(card));
}

function buildImageProducts(payload) {
  const directProducts = Array.isArray(payload?.products) ? payload.products : [];
  if (directProducts.length > 0) {
    return directProducts.map((item) => normalizeProductEntry(item));
  }

  const cards = Array.isArray(payload?.cards) ? payload.cards : [];
  return mapCardsToProducts(cards);
}

function readStoredImagePayload() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(IMAGE_SEARCH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

function createPreviewUrl(file) {
  if (!file || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return '';
  return URL.createObjectURL(file);
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const currentQuery = searchParams.get('q') || '';
  const isImageSearchMode = location.pathname === '/image-search' || searchParams.get('image') === '1';

  const [query, setQuery] = useState(currentQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [hasImageSearchAttempted, setHasImageSearchAttempted] = useState(false);
  const [imageSearchState, setImageSearchState] = useState({
    prompt: '',
    reply: '',
    caption: '',
    error: '',
    status: '',
  });
  const [imageDraft, setImageDraft] = useState({
    file: null,
    fileName: '',
    previewUrl: '',
    prompt: '',
  });

  const replaceInputRef = useRef(null);
  const imageSearchAbortRef = useRef(null);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (isImageSearchMode) return;

    const timeoutId = setTimeout(() => {
      const trimmedQuery = query.trim();
      const trimmedCurrentQuery = currentQuery.trim();

      if (trimmedQuery === trimmedCurrentQuery) return;

      if (trimmedQuery) {
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });
      } else {
        navigate('/search', { replace: true });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, currentQuery, navigate, isImageSearchMode]);

  useEffect(() => {
    let ignore = false;

    const hydratePage = async () => {
      if (isImageSearchMode) {
        const uploadState = location.state?.imageSearchUpload || null;
        const stateError = String(location.state?.imageSearchError || '').trim();

        if (uploadState?.file) {
          const previewUrl = createPreviewUrl(uploadState.file);
          if (!ignore) {
            setImageDraft((prev) => {
              if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
              return {
                file: uploadState.file,
                fileName: String(uploadState.fileName || uploadState.file.name || 'image'),
                previewUrl,
                prompt: String(uploadState.prompt || '').trim(),
              };
            });
            setHasImageSearchAttempted(false);
            setProducts([]);
            setSearchMeta(null);
            setImageSearchState({
              prompt: '',
              reply: '',
              caption: '',
              error: '',
              status: '',
            });
          }
          return;
        }

        const storedPayload = readStoredImagePayload();
        if (!ignore) {
          if (storedPayload) {
            const imageProducts = buildImageProducts(storedPayload);
            setHasImageSearchAttempted(true);
            setProducts(imageProducts);
            setSearchMeta(null);
            setImageSearchState({
              prompt: String(storedPayload?.prompt || '').trim(),
              reply: String(storedPayload?.reply || '').trim(),
              caption: String(storedPayload?.caption || '').trim(),
              error: imageProducts.length > 0 ? '' : (stateError || 'No similar products found.'),
              status: '',
            });
          } else {
            setHasImageSearchAttempted(false);
            setProducts([]);
            setSearchMeta(null);
            setImageSearchState({
              prompt: '',
              reply: '',
              caption: '',
              error: stateError || '',
              status: '',
            });
          }
        }
        return;
      }

      try {
        setLoading(true);

        const response = currentQuery.trim()
          ? await axios.get(`/api/products?search=${encodeURIComponent(currentQuery)}`)
          : await axios.get('/api/products');

        if (!ignore) {
          setProducts(response.data.data || []);
          setSearchMeta(response.data.searchMeta || null);
          setImageSearchState({ prompt: '', reply: '', caption: '', error: '', status: '' });
        }
      } catch (error) {
        if (!ignore) {
          console.error('Error fetching search results:', error);
          setProducts([]);
          setSearchMeta(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    hydratePage();

    return () => {
      ignore = true;
    };
  }, [currentQuery, isImageSearchMode, location.state]);

  useEffect(() => {
    return () => {
      if (imageDraft.previewUrl) {
        URL.revokeObjectURL(imageDraft.previewUrl);
      }
      if (imageSearchAbortRef.current) {
        imageSearchAbortRef.current.abort();
        imageSearchAbortRef.current = null;
      }
    };
  }, [imageDraft.previewUrl]);

  useEffect(() => {
    const appliedSearch = currentQuery;
    if (isImageSearchMode || !isAuthenticated || !appliedSearch.trim()) return;

    const trackSearch = async () => {
      try {
        await axios.post(
          '/api/products/recommendations/track-search',
          { search: appliedSearch },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error tracking search keywords:', error);
      }
    };

    trackSearch();
  }, [currentQuery, isAuthenticated, isImageSearchMode]);

  useEffect(() => {
    if (isImageSearchMode || !currentQuery.trim()) return;
    trackLocalSearchSignal(currentQuery);
  }, [currentQuery, isImageSearchMode]);

  const handleReplaceImage = (file) => {
    if (!file) return;

    setImageDraft((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        ...prev,
        file,
        fileName: file.name || 'image',
        previewUrl: createPreviewUrl(file),
      };
    });

    setHasImageSearchAttempted(false);
    setProducts([]);
    setImageSearchState((prev) => ({
      ...prev,
      reply: '',
      caption: '',
      error: '',
      status: '',
    }));
  };

  const runImageSearch = async () => {
    if (!imageDraft.file || isImageSearching) return;

    const controller = new AbortController();
    imageSearchAbortRef.current = controller;

    try {
      setLoading(true);
      setIsImageSearching(true);
      setImageSearchState((prev) => ({
        ...prev,
        error: '',
        reply: '',
        caption: '',
        status: 'Searching products...',
      }));

      const formData = new FormData();
      formData.append('image', imageDraft.file);
      const promptText = String(imageDraft.prompt || '').trim();
      if (promptText) {
        formData.append('prompt', promptText);
      }

      const { data } = await axios.post('/api/chatbot/image-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
      });

      const payload = {
        source: 'image-search-page',
        createdAt: Date.now(),
        prompt: promptText,
        caption: String(data?.caption || '').trim(),
        reply: String(data?.reply || '').trim(),
        cards: Array.isArray(data?.cards) ? data.cards : [],
        products: Array.isArray(data?.products) ? data.products : [],
      };

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(IMAGE_SEARCH_SESSION_KEY, JSON.stringify(payload));
      }

      const imageProducts = buildImageProducts(payload);
      setHasImageSearchAttempted(true);
      setProducts(imageProducts);
      setSearchMeta(null);
      setImageSearchState({
        prompt: promptText,
        reply: payload.reply,
        caption: payload.caption,
        error: imageProducts.length > 0 ? '' : 'No similar products found. Try replacing the image.',
        status: '',
      });
    } catch (error) {
      const cancelled = error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
      if (cancelled) {
        setImageSearchState((prev) => ({
          ...prev,
          status: '',
          error: 'Search cancelled.',
        }));
      } else {
        console.error('Image search failed:', error);
        setProducts([]);
        setSearchMeta(null);
        setHasImageSearchAttempted(true);
        setImageSearchState((prev) => ({
          ...prev,
          status: '',
          reply: '',
          error: 'Image search failed. Please try another image.',
        }));
      }
    } finally {
      setIsImageSearching(false);
      setLoading(false);
      imageSearchAbortRef.current = null;
    }
  };

  const cancelImageSearch = () => {
    if (imageSearchAbortRef.current) {
      imageSearchAbortRef.current.abort();
      imageSearchAbortRef.current = null;
    }
  };

  const removeImageDraft = () => {
    if (isImageSearching) {
      cancelImageSearch();
    }

    setImageDraft((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file: null, fileName: '', previewUrl: '', prompt: prev.prompt };
    });
    setHasImageSearchAttempted(false);
    setProducts([]);
    setImageSearchState((prev) => ({
      ...prev,
      reply: '',
      caption: '',
      status: '',
      error: '',
    }));
  };

  const handleClear = () => {
    const hadImageFilterQuery = isImageSearchMode && String(query || '').trim().length > 0;
    setQuery('');

    if (hadImageFilterQuery) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(IMAGE_SEARCH_SESSION_KEY);
    }

    if (isImageSearchMode) {
      removeImageDraft();
      setHasImageSearchAttempted(false);
      setImageSearchState({
        prompt: '',
        reply: '',
        caption: '',
        error: '',
        status: '',
      });
      navigate('/image-search', { replace: true, state: null });
      return;
    }

    navigate('/search', { replace: true });
  };

  const searchTitle = useMemo(() => {
    if (isImageSearchMode) return 'Similar Products from Image Search';
    return currentQuery
      ? t('search.titleResults', { query: currentQuery })
      : t('search.titleAll');
  }, [currentQuery, isImageSearchMode, t]);

  const visibleProducts = useMemo(() => {
    if (!isImageSearchMode) return products;

    const keyword = String(query || '').trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) => {
      const haystack = [
        product?.name,
        product?.brand,
        product?.categoryName,
        product?.description,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return haystack.includes(keyword);
    });
  }, [products, query, isImageSearchMode]);

  return (
    <div className="search-page">
      <div className={`search-page-header ${isImageSearchMode ? 'image-mode' : ''}`}>
        <div className="search-page-copy">
          <span className="search-page-badge">{t('search.badge')}</span>
          <h1>{t('search.title')}</h1>
          <p>{t('search.description')}</p>
        </div>

        <div className="search-page-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isImageSearchMode ? 'Filter image search results...' : t('common.searchProducts')}
            className="search-page-input"
            autoFocus
          />
          <button onClick={handleClear} className="search-page-clear-btn">
            {t('search.clear')}
          </button>
        </div>

        {isImageSearchMode ? (
          <div className="search-image-mode-note">
            <span className="search-image-mode-pill">Image Search</span>
            <p>Upload product image + optional details, then instantly get similar products.</p>
          </div>
        ) : currentQuery ? (
          <p className="search-page-label">
            {t('search.showingFor')} <strong>{currentQuery}</strong>
          </p>
        ) : (
          <p className="search-page-label">{t('search.showingAll')}</p>
        )}

        {isImageSearchMode && (
          <div className="search-image-uploader">
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              className="search-image-hidden-input"
              onChange={(event) => {
                handleReplaceImage(event.target.files?.[0] || null);
                event.target.value = '';
              }}
            />
            <div className="search-image-preview">
              {imageDraft.previewUrl ? (
                <img src={imageDraft.previewUrl} alt={imageDraft.fileName || 'Uploaded'} />
              ) : (
                <div className="search-image-preview-placeholder">
                  <span className="search-image-preview-icon">+</span>
                  <span>No image selected</span>
                </div>
              )}
            </div>
            <div className="search-image-fields">
              <div className="search-image-fields-head">
                <p className="search-image-title">
                  {imageDraft.fileName ? `Selected: ${imageDraft.fileName}` : 'Select an image to begin'}
                </p>
                <span className="search-image-fields-meta">PNG, JPG, WEBP</span>
              </div>
              <textarea
                value={imageDraft.prompt}
                onChange={(e) =>
                  setImageDraft((prev) => ({
                    ...prev,
                    prompt: e.target.value,
                  }))
                }
                placeholder="Optional: describe the product you want (color, style, budget, brand)"
                className="search-image-prompt"
                rows={2}
              />
              <div className="search-image-actions">
                <div className="search-image-actions-left">
                  <button
                    type="button"
                    className="search-image-action-btn"
                    onClick={() => replaceInputRef.current?.click()}
                    disabled={isImageSearching}
                  >
                    {imageDraft.file ? 'Replace Image' : 'Choose Image'}
                  </button>
                  <button
                    type="button"
                    className="search-image-action-btn danger"
                    onClick={removeImageDraft}
                    disabled={!imageDraft.file && !imageDraft.previewUrl}
                  >
                    Remove Image
                  </button>
                  {isImageSearching && (
                    <button
                      type="button"
                      className="search-image-action-btn muted"
                      onClick={cancelImageSearch}
                    >
                      Cancel Search
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="search-image-submit-btn"
                  onClick={runImageSearch}
                  disabled={!imageDraft.file || isImageSearching}
                >
                  {isImageSearching ? 'Searching...' : 'Find Similar Products'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isImageSearchMode && (isImageSearching || imageSearchState.status) && (
          <div className="search-image-loader" role="status" aria-live="polite">
            <div className="search-image-loader-dots">
              <span />
              <span />
              <span />
            </div>
            <p>{imageSearchState.status || 'Searching products...'}</p>
          </div>
        )}

        {isImageSearchMode && imageSearchState.reply && (
          <div className="search-correction-banner subtle">
            <p>{imageSearchState.reply}</p>
          </div>
        )}

        {isImageSearchMode && imageSearchState.caption && !isImageSearching && (
          <div className="search-image-caption-card" role="status" aria-live="polite">
            <p className="search-image-caption-label">AI Image Understanding</p>
            <p className="search-image-caption-text">{imageSearchState.caption}</p>
          </div>
        )}

        {isImageSearchMode && imageSearchState.error && (
          <div className="search-correction-banner subtle search-image-error">
            <p>{imageSearchState.error}</p>
          </div>
        )}

        {!isImageSearchMode && currentQuery && searchMeta?.didYouMean && (
          <div className="search-correction-banner subtle">
            <p>
              {t('search.didYouMean')}{' '}
              <button
                type="button"
                className="search-correction-link"
                onClick={() => navigate(`/search?q=${encodeURIComponent(searchMeta.didYouMean)}`)}
              >
                {searchMeta.didYouMean}
              </button>
              ?
            </p>
          </div>
        )}
      </div>

      {loading && !isImageSearchMode ? (
        <p className="search-page-loading">{t('common.loading')}</p>
      ) : isImageSearchMode && isImageSearching ? (
        <div className="search-image-idle-state searching" role="status" aria-live="polite">
          <div className="search-image-idle-icon">...</div>
          <div className="search-image-idle-copy">
            <h3>Searching in progress</h3>
            <p>Please wait. Results will appear after the search completes.</p>
          </div>
        </div>
      ) : isImageSearchMode && !hasImageSearchAttempted ? (
        <div className="search-image-idle-state" role="status" aria-live="polite">
          <div className="search-image-idle-icon">IMG</div>
          <div className="search-image-idle-copy">
            <h3>Ready for image search</h3>
            <p>Choose an image and click <strong>Find Similar Products</strong> to see results.</p>
          </div>
        </div>
      ) : (
        <ProductList
          products={visibleProducts}
          setProducts={setProducts}
          title={searchTitle}
          refreshEndpoint={currentQuery ? `/api/products?search=${encodeURIComponent(currentQuery)}` : '/api/products'}
        />
      )}
    </div>
  );
};

export default SearchPage;
