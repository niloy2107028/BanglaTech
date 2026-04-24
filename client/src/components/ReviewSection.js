import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faThumbsUp,
  faThumbsDown,
  faReply,
  faShieldAlt,
  faImage,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import "./ReviewSection.css";

const REVIEWS_PER_PAGE = 5;
const MAX_REVIEW_IMAGES = 3;
const MAX_REVIEW_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REVIEW_TOTAL_IMAGE_BYTES = 5 * 1024 * 1024;

function toId(value) {
  return String(value || "");
}

function filePreview(file) {
  if (!file) return "";
  try {
    return URL.createObjectURL(file);
  } catch (error) {
    return "";
  }
}

function getAttachmentImages(item) {
  const images = Array.isArray(item?.images)
    ? item.images.filter(Boolean).slice(0, MAX_REVIEW_IMAGES)
    : [];
  if (images.length > 0) return images;
  const legacyImage = String(item?.image || "").trim();
  return legacyImage ? [legacyImage] : [];
}

function getFilesTotalBytes(files) {
  return (Array.isArray(files) ? files : []).reduce(
    (sum, file) => sum + Number(file?.size || 0),
    0,
  );
}

function mergeImageFiles(existingFiles, fileList, reservedCount = 0) {
  const maxSelectable = Math.max(0, MAX_REVIEW_IMAGES - Number(reservedCount || 0));
  const merged = Array.isArray(existingFiles) ? [...existingFiles] : [];
  const incoming = Array.from(fileList || []);
  const existingKeys = new Set(
    merged.map((file) => `${file?.name || ""}:${file?.size || 0}:${file?.lastModified || 0}`),
  );
  let totalBytes = getFilesTotalBytes(merged);
  let skippedType = 0;
  let skippedSize = 0;
  let skippedDuplicate = 0;
  let skippedCount = 0;
  let skippedTotal = 0;

  incoming.forEach((file) => {
    if (!String(file?.type || "").startsWith("image/")) {
      skippedType += 1;
      return;
    }

    if (merged.length >= maxSelectable) {
      skippedCount += 1;
      return;
    }

    const fileKey = `${file?.name || ""}:${file?.size || 0}:${file?.lastModified || 0}`;
    if (existingKeys.has(fileKey)) {
      skippedDuplicate += 1;
      return;
    }

    const fileSize = Number(file?.size || 0);
    if (fileSize > MAX_REVIEW_IMAGE_BYTES) {
      skippedSize += 1;
      return;
    }

    if (totalBytes + fileSize > MAX_REVIEW_TOTAL_IMAGE_BYTES) {
      skippedTotal += 1;
      return;
    }

    totalBytes += fileSize;
    existingKeys.add(fileKey);
    merged.push(file);
  });

  if (skippedType > 0) alert("Only image files are allowed.");
  if (skippedSize > 0) {
    alert(`Each image must be ${Math.floor(MAX_REVIEW_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`);
  }
  if (skippedDuplicate > 0) alert("Duplicate image skipped.");
  if (skippedCount > 0) alert(`You can upload maximum ${MAX_REVIEW_IMAGES} images.`);
  if (skippedTotal > 0) {
    alert(`Total image size must be ${Math.floor(MAX_REVIEW_TOTAL_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`);
  }

  return merged.slice(0, maxSelectable);
}

const ReviewSection = ({ productId, productSellerId }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = toId(user?._id);
  const sellerId = toId(productSellerId);
  const isOwnProductSeller = isAuthenticated && Boolean(userId) && userId === sellerId;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewImageFiles, setReviewImageFiles] = useState([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyImageFiles, setReplyImageFiles] = useState([]);
  const [replyImagePreviews, setReplyImagePreviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editRetainedImages, setEditRetainedImages] = useState([]);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const [editingReplyKey, setEditingReplyKey] = useState("");
  const [editReplyText, setEditReplyText] = useState("");
  const [editReplyRetainedImages, setEditReplyRetainedImages] = useState([]);
  const [editReplyImageFiles, setEditReplyImageFiles] = useState([]);
  const [editReplyImagePreviews, setEditReplyImagePreviews] = useState([]);
  const [editReplyRemoveImage, setEditReplyRemoveImage] = useState(false);
  const [reviewSort, setReviewSort] = useState("latest");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [meta, setMeta] = useState({
    page: 1,
    limit: REVIEWS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
  });
  const [permissions, setPermissions] = useState({
    loaded: false,
    canReview: false,
    hasReviewed: false,
    canVote: false,
    isOwnProductSeller: false,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get(`/api/reviews/${productId}`, {
        params: {
          page: reviewPage,
          limit: REVIEWS_PER_PAGE,
          sort: reviewSort,
          filter: reviewFilter,
        },
      })
      .then((res) => {
        if (cancelled) return;
        setReviews(Array.isArray(res.data?.data) ? res.data.data : []);
        const nextMeta = res.data?.meta || {};
        setMeta({
          page: Number(nextMeta.page || 1),
          limit: Number(nextMeta.limit || REVIEWS_PER_PAGE),
          total: Number(nextMeta.total || 0),
          totalPages: Number(nextMeta.totalPages || 1),
        });
        const nextStats = res.data?.stats || {};
        setStats({
          totalReviews: Number(nextStats.totalReviews || 0),
          avgRating: Number(nextStats.avgRating || 0),
        });
      })
      .catch((err) => {
        console.error("Error fetching reviews", err);
        if (cancelled) return;
        setReviews([]);
        setMeta({
          page: 1,
          limit: REVIEWS_PER_PAGE,
          total: 0,
          totalPages: 1,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, reviewPage, reviewSort, reviewFilter, refreshToken]);

  useEffect(() => {
    if (reviewPage > meta.totalPages) {
      setReviewPage(meta.totalPages);
    }
  }, [reviewPage, meta.totalPages]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isAuthenticated) {
        setPermissions({
          loaded: true,
          canReview: false,
          hasReviewed: false,
          canVote: false,
          isOwnProductSeller: false,
        });
        return;
      }

      try {
        const res = await axios.get(`/api/reviews/permissions/${productId}`, {
          withCredentials: true,
        });
        const data = res.data?.data || {};
        setPermissions({
          loaded: true,
          canReview: Boolean(data.canReview),
          hasReviewed: Boolean(data.hasReviewed),
          canVote: Boolean(data.canVote),
          isOwnProductSeller: Boolean(data.isOwnProductSeller),
        });
      } catch (error) {
        setPermissions({
          loaded: true,
          canReview: false,
          hasReviewed: false,
          canVote: false,
          isOwnProductSeller: false,
        });
      }
    };

    fetchPermissions();
  }, [isAuthenticated, productId, refreshToken]);

  const avgRating = Number(stats.avgRating || 0);
  const totalReviews = Number(stats.totalReviews || 0);

  const hasMyReview = permissions.hasReviewed
    || reviews.some((review) => toId(review?.user) === userId);

  const canWriteReview = isAuthenticated
    && !isOwnProductSeller
    && user?.role === "buyer"
    && permissions.canReview
    && !hasMyReview;

  const visiblePage = Math.min(Math.max(1, reviewPage), meta.totalPages || 1);
  const pageWindow = useMemo(() => {
    const totalPages = Math.max(1, Number(meta.totalPages || 1));
    const start = Math.max(1, visiblePage - 1);
    const end = Math.min(totalPages, start + 2);
    const pages = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  }, [meta.totalPages, visiblePage]);

  const triggerRefresh = () => setRefreshToken((value) => value + 1);

  const resetCreateReviewForm = () => {
    setComment("");
    setRating(5);
    setReviewImageFiles([]);
    setReviewImagePreviews([]);
  };

  const resetReplyForm = () => {
    setReplyingTo("");
    setReplyText("");
    setReplyImageFiles([]);
    setReplyImagePreviews([]);
  };

  const resetEditReviewForm = () => {
    setEditingReviewId("");
    setEditRating(5);
    setEditComment("");
    setEditRetainedImages([]);
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditRemoveImage(false);
  };

  const resetEditReplyForm = () => {
    setEditingReplyKey("");
    setEditReplyText("");
    setEditReplyRetainedImages([]);
    setEditReplyImageFiles([]);
    setEditReplyImagePreviews([]);
    setEditReplyRemoveImage(false);
  };

  const applySelectedImages = (fileList, currentFiles, setFiles, setPreviews, reservedCount = 0) => {
    const files = mergeImageFiles(currentFiles, fileList, reservedCount);
    setFiles(files);
    setPreviews(files.map((file) => filePreview(file)));
  };

  const removeSelectedImageAt = (index, files, setFiles, setPreviews) => {
    const nextFiles = (Array.isArray(files) ? files : []).filter((_, i) => i !== index);
    setFiles(nextFiles);
    setPreviews(nextFiles.map((file) => filePreview(file)));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (isOwnProductSeller || permissions.isOwnProductSeller) {
      return alert("You cannot review your own product.");
    }
    const trimmedComment = String(comment || "").trim();
    if (!trimmedComment && reviewImageFiles.length === 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rating", String(rating));
      if (trimmedComment) formData.append("comment", trimmedComment);
      reviewImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post(
        `/api/reviews/${productId}`,
        formData,
        { withCredentials: true },
      );

      resetCreateReviewForm();
      setReviewPage(1);
      triggerRefresh();
      alert("Review submitted successfully.");
    } catch (err) {
      alert(
        err.response?.data?.message
          || "Failed to submit review. Only verified buyers can review once.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteReview = async (reviewId, voteType) => {
    if (!isAuthenticated) return alert("Please login to vote.");
    if (!permissions.canVote) {
      return alert("Only verified buyers can vote on reviews.");
    }

    try {
      await axios.post(
        `/api/reviews/${reviewId}/vote`,
        { voteType },
        { withCredentials: true },
      );
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to vote.");
    }
  };

  const handleVoteReply = async (reviewId, replyId, voteType) => {
    if (!isAuthenticated) return alert("Please login to vote.");
    if (!permissions.canVote) {
      return alert("Only verified buyers can vote on replies.");
    }

    try {
      await axios.post(
        `/api/reviews/${reviewId}/replies/${replyId}/vote`,
        { voteType },
        { withCredentials: true },
      );
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to vote on reply.");
    }
  };

  const handleReply = async (reviewId) => {
    const trimmedText = String(replyText || "").trim();
    if (!trimmedText && replyImageFiles.length === 0) return;

    try {
      const formData = new FormData();
      if (trimmedText) formData.append("text", trimmedText);
      replyImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post(
        `/api/reviews/${reviewId}/reply`,
        formData,
        { withCredentials: true },
      );
      resetReplyForm();
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reply.");
    }
  };

  const beginReviewEdit = (review) => {
    const existingImages = getAttachmentImages(review);
    setEditingReviewId(review._id);
    setEditRating(Number(review?.rating || 5));
    setEditComment(String(review?.comment || ""));
    setEditRetainedImages(existingImages);
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditRemoveImage(false);
  };

  const submitReviewEdit = async (reviewId) => {
    const trimmedComment = String(editComment || "").trim();
    if (
      !trimmedComment
      && editRetainedImages.length === 0
      && editImageFiles.length === 0
      && !editRemoveImage
    ) {
      return alert("Review cannot be empty.");
    }

    try {
      const formData = new FormData();
      formData.append("rating", String(editRating));
      if (trimmedComment) formData.append("comment", trimmedComment);
      formData.append("retainedImages", JSON.stringify(editRetainedImages));
      editImageFiles.forEach((file) => {
        formData.append("images", file);
      });
      if (editRemoveImage) formData.append("removeImage", "true");

      await axios.put(`/api/reviews/${reviewId}`, formData, { withCredentials: true });
      resetEditReviewForm();
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update review.");
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`/api/reviews/${reviewId}`, { withCredentials: true });
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete review.");
    }
  };

  const beginReplyEdit = (reviewId, reply) => {
    const existingImages = getAttachmentImages(reply);
    setEditingReplyKey(`${reviewId}:${reply._id}`);
    setEditReplyText(String(reply?.text || ""));
    setEditReplyRetainedImages(existingImages);
    setEditReplyImageFiles([]);
    setEditReplyImagePreviews([]);
    setEditReplyRemoveImage(false);
  };

  const submitReplyEdit = async (reviewId, replyId) => {
    const trimmedText = String(editReplyText || "").trim();
    if (
      !trimmedText
      && editReplyRetainedImages.length === 0
      && editReplyImageFiles.length === 0
      && !editReplyRemoveImage
    ) {
      return alert("Reply cannot be empty.");
    }

    try {
      const formData = new FormData();
      if (trimmedText) formData.append("text", trimmedText);
      formData.append("retainedImages", JSON.stringify(editReplyRetainedImages));
      editReplyImageFiles.forEach((file) => {
        formData.append("images", file);
      });
      if (editReplyRemoveImage) formData.append("removeImage", "true");

      await axios.put(`/api/reviews/${reviewId}/replies/${replyId}`, formData, {
        withCredentials: true,
      });
      resetEditReplyForm();
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update reply.");
    }
  };

  const deleteReply = async (reviewId, replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await axios.delete(`/api/reviews/${reviewId}/replies/${replyId}`, {
        withCredentials: true,
      });
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete reply.");
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="review-section">
      <div className="review-section-header">
        <div className="review-summary">
          <div className="avg-rating-big">{avgRating.toFixed(1)}</div>
          <div className="avg-stars-container">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon
                  key={i}
                  icon={faStar}
                  className={i < avgRating ? "star-filled" : "star-empty"}
                  style={{ color: i < avgRating ? "#fbbf24" : "#e2e8f0" }}
                />
              ))}
            </div>
            <span className="review-count-label text-slate-500 text-sm">
              {totalReviews} total reviews
            </span>
          </div>
        </div>
      </div>

      {canWriteReview && (
        <form className="add-review-form" onSubmit={handleSubmitReview}>
          <h3>Write a Review</h3>
          <p className="review-rule-note">
            Only verified buyers can review, and each buyer can review once.
          </p>
          <div className="rating-input-group">
            <p className="text-sm font-semibold mb-2">Your Rating</p>
            <div className="star-rating-input">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="star-btn"
                  onClick={() => setRating(num)}
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    style={{ color: num <= rating ? "#fbbf24" : "#e2e8f0" }}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="comment-input"
            placeholder="Tell others about your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {reviewImagePreviews.length > 0 && (
            <div className="review-compose-preview-grid">
              {reviewImagePreviews.map((image, index) => (
                <div key={`review-create-preview-${index}`} className="review-preview-tile">
                  <img src={image} alt="Review preview" className="inline-image-preview" />
                  <button
                    type="button"
                    className="review-preview-remove-btn"
                    onClick={() => removeSelectedImageAt(
                      index,
                      reviewImageFiles,
                      setReviewImageFiles,
                      setReviewImagePreviews,
                    )}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="review-compose-footer">
            <label className="review-photo-trigger">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  applySelectedImages(
                    e.target.files,
                    reviewImageFiles,
                    setReviewImageFiles,
                    setReviewImagePreviews,
                  );
                  e.target.value = "";
                }}
              />
              <FontAwesomeIcon icon={faImage} />
            </label>
          </div>
          <button type="submit" className="submit-review-btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {isAuthenticated && user?.role === "buyer" && hasMyReview && (
        <div className="review-rule-note boxed">
          You already reviewed this product. You can edit or delete your review.
        </div>
      )}

      {(isOwnProductSeller || permissions.isOwnProductSeller) && (
        <div className="review-rule-note boxed">
          You cannot rate or review your own product. You can still view, vote, and reply.
        </div>
      )}

      {isAuthenticated
        && user?.role === "buyer"
        && permissions.loaded
        && !permissions.canReview
        && !hasMyReview
        && !isOwnProductSeller
        && !permissions.isOwnProductSeller && (
        <div className="review-rule-note boxed">
          Only verified buyers can submit reviews for this product.
        </div>
      )}

      <div className="review-toolbar">
        <div className="review-toolbar-group">
          <label htmlFor="review-sort">Sort</label>
          <select
            id="review-sort"
            value={reviewSort}
            onChange={(e) => {
              setReviewSort(e.target.value);
              setReviewPage(1);
            }}
          >
            <option value="latest">Latest</option>
            <option value="top">Top Voted</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
            <option value="discussed">Most Discussed</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <div className="review-toolbar-group">
          <label htmlFor="review-filter">Filter</label>
          <select
            id="review-filter"
            value={reviewFilter}
            onChange={(e) => {
              setReviewFilter(e.target.value);
              setReviewPage(1);
            }}
          >
            <option value="all">All Reviews</option>
            <option value="with_replies">With Replies</option>
            <option value="no_replies">No Replies Yet</option>
          </select>
        </div>
      </div>

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="text-center text-slate-500 py-10">
            No reviews found for this filter.
          </p>
        ) : (
          reviews.map((review) => {
            const reviewOwnerId = toId(review?.user);
            const isReviewOwner = userId && userId === reviewOwnerId;
            const isSeller = userId && userId === sellerId;
            const sellerHasReplied = (review.replies || []).some(
              (reply) => toId(reply?.user) === sellerId || String(reply?.role || "") === "seller",
            );
            const canReply = isAuthenticated && (isSeller || (isReviewOwner && sellerHasReplied));

            return (
              <div key={review._id} className="review-item">
                <div className="review-user-info">
                  <div className="user-name-date">
                    <span className="reviewer-name">
                      {review.name}
                      <span className="verified-badge">
                        <FontAwesomeIcon icon={faShieldAlt} /> Verified Buyer
                      </span>
                    </span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-stars-small">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        style={{
                          color: i < review.rating ? "#fbbf24" : "#e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {editingReviewId === review._id ? (
                  <div className="inline-edit-box">
                    <div className="star-rating-input">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className="star-btn"
                          onClick={() => setEditRating(num)}
                        >
                          <FontAwesomeIcon
                            icon={faStar}
                            style={{ color: num <= editRating ? "#fbbf24" : "#e2e8f0" }}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="comment-input"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                    />
                    {[...editRetainedImages, ...editImagePreviews].length > 0 && (
                      <div className="review-compose-preview-grid">
                        {[...editRetainedImages, ...editImagePreviews].map((image, index) => {
                          const retainedCount = editRetainedImages.length;
                          const isRetained = index < retainedCount;
                          const localFileIndex = index - retainedCount;
                          return (
                            <div key={`review-edit-preview-${index}`} className="review-preview-tile">
                              <img src={image} alt="Review edit preview" className="inline-image-preview" />
                              <button
                                type="button"
                                className="review-preview-remove-btn"
                                onClick={() => {
                                  if (isRetained) {
                                    setEditRetainedImages((prev) => prev.filter((_, i) => i !== index));
                                  } else {
                                    removeSelectedImageAt(
                                      localFileIndex,
                                      editImageFiles,
                                      setEditImageFiles,
                                      setEditImagePreviews,
                                    );
                                  }
                                  setEditRemoveImage(false);
                                }}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="review-compose-footer">
                      <label className="review-photo-trigger">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            applySelectedImages(
                              e.target.files,
                              editImageFiles,
                              setEditImageFiles,
                              setEditImagePreviews,
                              editRetainedImages.length,
                            );
                            setEditRemoveImage(false);
                            e.target.value = "";
                          }}
                        />
                        <FontAwesomeIcon icon={faImage} />
                        <span>+ Photo</span>
                      </label>
                    </div>
                    <div className="owner-actions">
                      <button className="mini-btn" onClick={() => submitReviewEdit(review._id)}>
                        Save
                      </button>
                      <button className="mini-btn ghost" onClick={resetEditReviewForm}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="review-comment">{review.comment}</p>
                    {getAttachmentImages(review).length > 0 && (
                      <div className="review-attachments-grid">
                        {getAttachmentImages(review).map((image, index) => (
                          <img
                            key={`review-image-${review._id}-${index}`}
                            src={image}
                            alt="Review attachment"
                            className="review-attachment"
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="review-actions">
                  <button
                    className={`vote-btn ${(review.upvotes || []).some((id) => toId(id) === userId) ? "active-up" : ""}`}
                    onClick={() => handleVoteReview(review._id, "upvote")}
                    disabled={isAuthenticated && !permissions.canVote}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} /> {(review.upvotes || []).length}
                  </button>
                  <button
                    className={`vote-btn ${(review.downvotes || []).some((id) => toId(id) === userId) ? "active-down" : ""}`}
                    onClick={() => handleVoteReview(review._id, "downvote")}
                    disabled={isAuthenticated && !permissions.canVote}
                  >
                    <FontAwesomeIcon icon={faThumbsDown} /> {(review.downvotes || []).length}
                  </button>

                  {canReply && (
                    <button
                      className="reply-btn"
                      onClick={() => {
                        if (replyingTo === review._id) {
                          resetReplyForm();
                        } else {
                          setReplyingTo(review._id);
                          setReplyText("");
                          setReplyImageFiles([]);
                          setReplyImagePreviews([]);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faReply} /> Reply
                    </button>
                  )}

                  {isReviewOwner && editingReviewId !== review._id && (
                    <>
                      <button className="reply-btn" onClick={() => beginReviewEdit(review)}>
                        Edit
                      </button>
                      <button className="reply-btn danger" onClick={() => deleteReview(review._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>

                <div className="replies-container">
                  {(review.replies || []).map((reply) => {
                    const replyKey = `${review._id}:${reply._id}`;
                    const isReplyOwner = toId(reply?.user) === userId;
                    const isEditingThisReply = editingReplyKey === replyKey;
                    return (
                      <div key={reply._id} className="reply-item">
                        <div className="reply-header">
                          {reply.name}
                          {String(reply.role || "") === "seller" && (
                            <span className="text-blue-500 text-xs ml-2">[Seller]</span>
                          )}
                          {String(reply.role || "") === "reviewer" && (
                            <span className="text-slate-500 text-xs ml-2">[Buyer]</span>
                          )}
                        </div>

                        {isEditingThisReply ? (
                          <div className="inline-edit-box">
                            <input
                              className="reply-input-mini"
                              value={editReplyText}
                              onChange={(e) => setEditReplyText(e.target.value)}
                            />
                            {[...editReplyRetainedImages, ...editReplyImagePreviews].length > 0 && (
                              <div className="review-compose-preview-grid">
                                {[...editReplyRetainedImages, ...editReplyImagePreviews].map((image, index) => {
                                  const retainedCount = editReplyRetainedImages.length;
                                  const isRetained = index < retainedCount;
                                  const localFileIndex = index - retainedCount;
                                  return (
                                    <div key={`reply-edit-preview-${index}`} className="review-preview-tile">
                                      <img src={image} alt="Reply edit preview" className="inline-image-preview" />
                                      <button
                                        type="button"
                                        className="review-preview-remove-btn"
                                        onClick={() => {
                                          if (isRetained) {
                                            setEditReplyRetainedImages((prev) => prev.filter((_, i) => i !== index));
                                          } else {
                                            removeSelectedImageAt(
                                              localFileIndex,
                                              editReplyImageFiles,
                                              setEditReplyImageFiles,
                                              setEditReplyImagePreviews,
                                            );
                                          }
                                          setEditReplyRemoveImage(false);
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faXmark} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="review-compose-footer">
                              <label className="review-photo-trigger">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => {
                                    applySelectedImages(
                                      e.target.files,
                                      editReplyImageFiles,
                                      setEditReplyImageFiles,
                                      setEditReplyImagePreviews,
                                      editReplyRetainedImages.length,
                                    );
                                    setEditReplyRemoveImage(false);
                                    e.target.value = "";
                                  }}
                                />
                                <FontAwesomeIcon icon={faImage} />
                                <span>+ Photo</span>
                              </label>
                            </div>
                            <div className="owner-actions">
                              <button className="mini-btn" onClick={() => submitReplyEdit(review._id, reply._id)}>
                                Save
                              </button>
                              <button className="mini-btn ghost" onClick={resetEditReplyForm}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="reply-text">{reply.text}</p>
                            {getAttachmentImages(reply).length > 0 && (
                              <div className="review-attachments-grid">
                                {getAttachmentImages(reply).map((image, index) => (
                                  <img
                                    key={`reply-image-${reply._id}-${index}`}
                                    src={image}
                                    alt="Reply attachment"
                                    className="reply-attachment"
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        <div className="review-actions reply-votes">
                          <button
                            className={`vote-btn ${(reply.upvotes || []).some((id) => toId(id) === userId) ? "active-up" : ""}`}
                            onClick={() => handleVoteReply(review._id, reply._id, "upvote")}
                            disabled={isAuthenticated && !permissions.canVote}
                          >
                            <FontAwesomeIcon icon={faThumbsUp} /> {(reply.upvotes || []).length}
                          </button>
                          <button
                            className={`vote-btn ${(reply.downvotes || []).some((id) => toId(id) === userId) ? "active-down" : ""}`}
                            onClick={() => handleVoteReply(review._id, reply._id, "downvote")}
                            disabled={isAuthenticated && !permissions.canVote}
                          >
                            <FontAwesomeIcon icon={faThumbsDown} /> {(reply.downvotes || []).length}
                          </button>

                          {isReplyOwner && !isEditingThisReply && (
                            <>
                              <button className="reply-btn" onClick={() => beginReplyEdit(review._id, reply)}>
                                Edit
                              </button>
                              <button className="reply-btn danger" onClick={() => deleteReply(review._id, reply._id)}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {replyingTo === review._id && (
                    <div className="reply-form-container">
                      <input
                        className="reply-input-mini"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      {replyImagePreviews.length > 0 && (
                        <div className="review-compose-preview-grid">
                          {replyImagePreviews.map((image, index) => (
                            <div key={`reply-preview-${index}`} className="review-preview-tile">
                              <img src={image} alt="Reply preview" className="inline-image-preview" />
                              <button
                                type="button"
                                className="review-preview-remove-btn"
                                onClick={() => removeSelectedImageAt(
                                  index,
                                  replyImageFiles,
                                  setReplyImageFiles,
                                  setReplyImagePreviews,
                                )}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="review-compose-footer">
                        <label className="review-photo-trigger">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              applySelectedImages(
                                e.target.files,
                                replyImageFiles,
                                setReplyImageFiles,
                                setReplyImagePreviews,
                              );
                              e.target.value = "";
                            }}
                          />
                          <FontAwesomeIcon icon={faImage} />
                          <span>+ Photo</span>
                        </label>
                      </div>
                      <button className="send-reply-btn" onClick={() => handleReply(review._id)}>
                        Send Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="review-pagination">
          <button
            type="button"
            className="review-page-btn"
            onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
            disabled={visiblePage <= 1}
          >
            Previous
          </button>
          <div className="review-page-numbers">
            {pageWindow.map((page) => (
              <button
                key={page}
                type="button"
                className={`review-page-number ${page === visiblePage ? "active" : ""}`}
                onClick={() => setReviewPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="review-page-btn"
            onClick={() => setReviewPage((prev) => Math.min(meta.totalPages, prev + 1))}
            disabled={visiblePage >= meta.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
