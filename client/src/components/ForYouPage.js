import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ProductList from "./ProductList";
import {
  getLocalRecommendationConsent,
  getLocalRecommendationKeywords,
  setLocalRecommendationConsent,
} from "../utils/localRecommendation";
import "./ForYouPage.css";

function dedupeProducts(products = []) {
  const seen = new Set();
  const output = [];

  for (const item of products) {
    const key = String(item?._id || item?.id || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}

const ForYouPage = () => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationsPersonalized, setRecommendationsPersonalized] =
    useState(false);
  const [localRecommendationProducts, setLocalRecommendationProducts] =
    useState([]);
  const [consentState, setConsentState] = useState("unknown");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    setConsentState(getLocalRecommendationConsent());
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated) {
        setRecommendedProducts([]);
        setRecommendationsPersonalized(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          "/api/products/recommendations?limit=24",
          { withCredentials: true },
        );
        setRecommendedProducts(response.data.data || []);
        setRecommendationsPersonalized(Boolean(response.data.personalized));
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendedProducts([]);
        setRecommendationsPersonalized(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadLocalRecommendations = async () => {
      if (!isAuthenticated || consentState !== "granted") {
        setLocalRecommendationProducts([]);
        return;
      }

      const localSignals = getLocalRecommendationKeywords(8);
      if (localSignals.length === 0) {
        setLocalRecommendationProducts([]);
        return;
      }

      try {
        const responses = await Promise.all(
          localSignals.map((signal) =>
            axios.get(`/api/products?search=${encodeURIComponent(signal.value)}`),
          ),
        );

        const bucket = new Map();
        responses.forEach((response, index) => {
          const keywordWeight = Number(localSignals[index]?.score || 1);
          (response.data?.data || []).slice(0, 10).forEach((product) => {
            const id = String(product?._id || "").trim();
            if (!id) return;

            const existing = bucket.get(id);
            if (existing) {
              existing.score += keywordWeight;
            } else {
              bucket.set(id, {
                product,
                score: keywordWeight,
              });
            }
          });
        });

        const ranked = [...bucket.values()]
          .sort((a, b) => b.score - a.score)
          .slice(0, 24)
          .map((item) => item.product);

        setLocalRecommendationProducts(ranked);
      } catch (error) {
        console.error("Error loading local recommendations:", error);
        setLocalRecommendationProducts([]);
      }
    };

    loadLocalRecommendations();
  }, [consentState, isAuthenticated]);

  const combinedRecommendedProducts = useMemo(() => {
    return dedupeProducts([
      ...recommendedProducts,
      ...localRecommendationProducts,
    ]).slice(0, 24);
  }, [recommendedProducts, localRecommendationProducts]);

  const handleLocalConsent = (nextState) => {
    setLocalRecommendationConsent(nextState);
    setConsentState(nextState);
  };

  if (!isAuthenticated) {
    return (
      <div className="for-you-page">
        <div className="for-you-page-container">
          <div className="for-you-auth-card">
            <h1>Recommended For You</h1>
            <p>
              Log in to unlock personalized recommendations based on your activity.
            </p>
            <div className="for-you-auth-actions">
              <button type="button" onClick={() => navigate("/login")}>
                Login
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => navigate("/search")}
              >
                Browse Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="for-you-page">
      <div className="for-you-page-container">
        <header className="for-you-header">
          <h1>{t("home.recommendedTitle", {}, "Recommended For You")}</h1>
          <p>
            {t(
              "home.recommendedDescription",
              {},
              "A personalized feed based on your browsing, search, and shopping behavior.",
            )}
          </p>
        </header>

        {consentState === "unknown" && (
          <div className="for-you-consent-popup" role="dialog" aria-live="polite">
            <h3>Use This Browser History For Better Recommendations?</h3>
            <p>
              We can use this browser&apos;s local search and product activity to
              improve recommendation quality.
            </p>
            <div className="for-you-consent-actions">
              <button
                type="button"
                className="allow"
                onClick={() => handleLocalConsent("granted")}
              >
                Yes, allow
              </button>
              <button
                type="button"
                className="deny"
                onClick={() => handleLocalConsent("denied")}
              >
                No, thanks
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="for-you-loading">{t("common.loading")}</div>
        ) : combinedRecommendedProducts.length > 0 ? (
          <ProductList
            products={combinedRecommendedProducts}
            setProducts={() => {}}
            title={t("home.recommendedTitle", {}, "Recommended For You")}
            refreshEndpoint="/api/products/recommendations?limit=24"
          />
        ) : (
          <div className="for-you-empty">
            <p>
              {recommendationsPersonalized
                ? "No recommendations available right now. Try again shortly."
                : "We need a little more activity to personalize your feed."}
            </p>
            <button type="button" onClick={() => navigate("/search")}>
              Explore Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForYouPage;
