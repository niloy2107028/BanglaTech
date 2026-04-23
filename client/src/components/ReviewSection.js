import React, { useState, useEffect } from "react";
import axios from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faThumbsUp, faThumbsDown, faReply, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import "./ReviewSection.css";

const ReviewSection = ({ productId, productSellerId }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // Review ID
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/api/reviews/${productId}`);
      setReviews(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setSubmitting(true);
    try {
      await axios.post(`/api/reviews/${productId}`, { 
        rating, 
        comment 
      }, { withCredentials: true });
      
      setComment("");
      setRating(5);
      fetchReviews();
      alert("Review submitted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review. Are you a verified buyer?");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reviewId, voteType) => {
    if (!isAuthenticated) return alert("Please login to vote");
    try {
      const res = await axios.post(`/api/reviews/${reviewId}/vote`, { 
        voteType 
      }, { withCredentials: true });
      
      // Update reviews local state
      setReviews(reviews.map(r => r._id === reviewId ? res.data.data : r));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to vote");
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.post(`/api/reviews/${reviewId}/reply`, { 
        text: replyText 
      }, { withCredentials: true });
      
      setReviews(reviews.map(r => r._id === reviewId ? res.data.data : r));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reply");
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="review-section">
      <div className="review-section-header">
        <div className="review-summary">
          <div className="avg-rating-big">
            {reviews.length > 0 
              ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) 
              : "0.0"}
          </div>
          <div className="avg-stars-container">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon 
                  key={i} 
                  icon={faStar} 
                  className={i < (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length || 0) ? "star-filled" : "star-empty"}
                  style={{ color: i < (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length || 0) ? "#fbbf24" : "#e2e8f0" }}
                />
              ))}
            </div>
            <span className="review-count-label text-slate-500 text-sm">{reviews.length} total reviews</span>
          </div>
        </div>
      </div>

      {/* Review Form (Only for logged in users, backend handles verified check) */}
      {isAuthenticated && user.role === "buyer" && (
        <form className="add-review-form" onSubmit={handleSubmitReview}>
          <h3>Write a Review</h3>
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
            required
          />
          <button type="submit" className="submit-review-btn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-user-info">
                <div className="user-name-date">
                  <span className="reviewer-name">
                    {review.name}
                    <span className="verified-badge">
                      <FontAwesomeIcon icon={faShieldAlt} /> Verified Buyer
                    </span>
                  </span>
                  <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="review-stars-small">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon 
                      key={i} 
                      icon={faStar} 
                      style={{ color: i < review.rating ? "#fbbf24" : "#e2e8f0", fontSize: "12px" }}
                    />
                  ))}
                </div>
              </div>

              <p className="review-comment">{review.comment}</p>

              <div className="review-actions">
                <button 
                  className={`vote-btn ${(review.upvotes || []).includes(user?._id) ? "active-up" : ""}`}
                  onClick={() => handleVote(review._id, "upvote")}
                >
                  <FontAwesomeIcon icon={faThumbsUp} /> {(review.upvotes || []).length}
                </button>
                <button 
                  className={`vote-btn ${(review.downvotes || []).includes(user?._id) ? "active-down" : ""}`}
                  onClick={() => handleVote(review._id, "downvote")}
                >
                  <FontAwesomeIcon icon={faThumbsDown} /> {(review.downvotes || []).length}
                </button>
                
                {/* Reply logic: Only reviewer or product seller can reply */}
                {(String(user?._id || "") === String(review.user || "") || String(user?._id || "") === String(productSellerId || "")) && (
                  <button className="reply-btn" onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}>
                    <FontAwesomeIcon icon={faReply} /> Reply
                  </button>
                )}
              </div>

              {/* Replies Section */}
              <div className="replies-container">
                {(review.replies || []).map((reply, idx) => (
                  <div key={idx} className="reply-item">
                    <div className="reply-header">
                      {reply.name} 
                      {String(reply.user || "") === String(productSellerId || "") && <span className="text-blue-500 text-xs ml-2">[Seller]</span>}
                    </div>
                    <p className="reply-text">{reply.text}</p>
                  </div>
                ))}

                {replyingTo === review._id && (
                  <div className="reply-form-container">
                    <input 
                      className="reply-input-mini" 
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button className="send-reply-btn" onClick={() => handleReply(review._id)}>Send Reply</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
