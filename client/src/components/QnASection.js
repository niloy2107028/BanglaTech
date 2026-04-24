import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsDown, faThumbsUp, faReply, faImage, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import "./QnASection.css";

const QUESTIONS_PER_PAGE = 6;
const MAX_QNA_IMAGES = 3;
const MAX_QNA_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_QNA_TOTAL_IMAGE_BYTES = 5 * 1024 * 1024;

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
    ? item.images.filter(Boolean).slice(0, MAX_QNA_IMAGES)
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
  const maxSelectable = Math.max(0, MAX_QNA_IMAGES - Number(reservedCount || 0));
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
    if (fileSize > MAX_QNA_IMAGE_BYTES) {
      skippedSize += 1;
      return;
    }

    if (totalBytes + fileSize > MAX_QNA_TOTAL_IMAGE_BYTES) {
      skippedTotal += 1;
      return;
    }

    totalBytes += fileSize;
    existingKeys.add(fileKey);
    merged.push(file);
  });

  if (skippedType > 0) {
    alert("Only image files are allowed.");
  }

  if (skippedSize > 0) {
    alert(`Each image must be ${Math.floor(MAX_QNA_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`);
  }

  if (skippedDuplicate > 0) {
    alert("Duplicate image skipped.");
  }

  if (skippedCount > 0) {
    alert(`You can upload maximum ${MAX_QNA_IMAGES} images.`);
  }

  if (skippedTotal > 0) {
    alert(`Total image size must be ${Math.floor(MAX_QNA_TOTAL_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`);
  }

  return merged.slice(0, maxSelectable);
}

const QnASection = ({ productId, productSellerId }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = toId(user?._id);
  const sellerId = toId(productSellerId);
  const isOwnProductSeller = isAuthenticated && Boolean(userId) && userId === sellerId;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [questionImageFiles, setQuestionImageFiles] = useState([]);
  const [questionImagePreviews, setQuestionImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [answeringTo, setAnsweringTo] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answerImageFiles, setAnswerImageFiles] = useState([]);
  const [answerImagePreviews, setAnswerImagePreviews] = useState([]);
  const [messageTo, setMessageTo] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageImageFiles, setMessageImageFiles] = useState([]);
  const [messageImagePreviews, setMessageImagePreviews] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionRetainedImages, setEditQuestionRetainedImages] = useState([]);
  const [editQuestionImageFiles, setEditQuestionImageFiles] = useState([]);
  const [editQuestionImagePreviews, setEditQuestionImagePreviews] = useState([]);
  const [editQuestionRemoveImage, setEditQuestionRemoveImage] = useState(false);
  const [editingMessageKey, setEditingMessageKey] = useState("");
  const [editMessageText, setEditMessageText] = useState("");
  const [editMessageRetainedImages, setEditMessageRetainedImages] = useState([]);
  const [editMessageImageFiles, setEditMessageImageFiles] = useState([]);
  const [editMessageImagePreviews, setEditMessageImagePreviews] = useState([]);
  const [editMessageRemoveImage, setEditMessageRemoveImage] = useState(false);
  const [qnaSort, setQnaSort] = useState("latest");
  const [qnaFilter, setQnaFilter] = useState("all");
  const [qnaPage, setQnaPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [meta, setMeta] = useState({
    page: 1,
    limit: QUESTIONS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axios
      .get(`/api/questions/product/${productId}`, {
        params: {
          page: qnaPage,
          limit: QUESTIONS_PER_PAGE,
          sort: qnaSort,
          filter: qnaFilter,
        },
      })
      .then((res) => {
        if (cancelled) return;
        setQuestions(Array.isArray(res.data?.data) ? res.data.data : []);
        const nextMeta = res.data?.meta || {};
        setMeta({
          page: Number(nextMeta.page || 1),
          limit: Number(nextMeta.limit || QUESTIONS_PER_PAGE),
          total: Number(nextMeta.total || 0),
          totalPages: Number(nextMeta.totalPages || 1),
        });
      })
      .catch((error) => {
        console.error("Error loading Q&A", error);
        if (cancelled) return;
        setQuestions([]);
        setMeta({
          page: 1,
          limit: QUESTIONS_PER_PAGE,
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
  }, [productId, qnaPage, qnaSort, qnaFilter, refreshToken]);

  useEffect(() => {
    if (qnaPage > meta.totalPages) {
      setQnaPage(meta.totalPages);
    }
  }, [qnaPage, meta.totalPages]);

  const triggerRefresh = () => setRefreshToken((value) => value + 1);

  const resetQuestionComposer = () => {
    setQuestionText("");
    setQuestionImageFiles([]);
    setQuestionImagePreviews([]);
  };

  const resetAnswerComposer = () => {
    setAnsweringTo("");
    setAnswerText("");
    setAnswerImageFiles([]);
    setAnswerImagePreviews([]);
  };

  const resetMessageComposer = () => {
    setMessageTo("");
    setMessageText("");
    setMessageImageFiles([]);
    setMessageImagePreviews([]);
  };

  const resetQuestionEdit = () => {
    setEditingQuestionId("");
    setEditQuestionText("");
    setEditQuestionRetainedImages([]);
    setEditQuestionImageFiles([]);
    setEditQuestionImagePreviews([]);
    setEditQuestionRemoveImage(false);
  };

  const resetMessageEdit = () => {
    setEditingMessageKey("");
    setEditMessageText("");
    setEditMessageRetainedImages([]);
    setEditMessageImageFiles([]);
    setEditMessageImagePreviews([]);
    setEditMessageRemoveImage(false);
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

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Please login to ask a question.");
    if (isOwnProductSeller) {
      return alert("You cannot ask a question on your own product.");
    }

    const trimmed = String(questionText || "").trim();
    if (!trimmed && questionImageFiles.length === 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (trimmed) formData.append("question", trimmed);
      questionImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post(
        `/api/questions/product/${productId}`,
        formData,
        { withCredentials: true },
      );
      resetQuestionComposer();
      setQnaPage(1);
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteQuestion = async (questionId, voteType) => {
    if (!isAuthenticated) return alert("Please login to vote.");
    try {
      await axios.post(
        `/api/questions/${questionId}/vote`,
        { voteType },
        { withCredentials: true },
      );
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to vote.");
    }
  };

  const handleAnswer = async (questionId) => {
    const trimmed = String(answerText || "").trim();
    if (!trimmed && answerImageFiles.length === 0) return;

    try {
      const formData = new FormData();
      if (trimmed) formData.append("text", trimmed);
      answerImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post(
        `/api/questions/${questionId}/answer`,
        formData,
        { withCredentials: true },
      );
      resetAnswerComposer();
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to answer question.");
    }
  };

  const handleMessage = async (questionId) => {
    const trimmed = String(messageText || "").trim();
    if (!trimmed && messageImageFiles.length === 0) return;

    try {
      const formData = new FormData();
      if (trimmed) formData.append("text", trimmed);
      messageImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post(
        `/api/questions/${questionId}/message`,
        formData,
        { withCredentials: true },
      );
      resetMessageComposer();
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send message.");
    }
  };

  const beginQuestionEdit = (question) => {
    const existingImages = getAttachmentImages(question);
    setEditingQuestionId(question._id);
    setEditQuestionText(String(question?.question || ""));
    setEditQuestionRetainedImages(existingImages);
    setEditQuestionImageFiles([]);
    setEditQuestionImagePreviews([]);
    setEditQuestionRemoveImage(false);
  };

  const submitQuestionEdit = async (questionId) => {
    const trimmed = String(editQuestionText || "").trim();
    if (
      !trimmed
      && editQuestionRetainedImages.length === 0
      && editQuestionImageFiles.length === 0
      && !editQuestionRemoveImage
    ) {
      return alert("Question cannot be empty.");
    }

    try {
      const formData = new FormData();
      if (trimmed) formData.append("question", trimmed);
      formData.append("retainedImages", JSON.stringify(editQuestionRetainedImages));
      editQuestionImageFiles.forEach((file) => {
        formData.append("images", file);
      });
      if (editQuestionRemoveImage) formData.append("removeImage", "true");

      await axios.put(`/api/questions/${questionId}`, formData, { withCredentials: true });
      resetQuestionEdit();
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update question.");
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axios.delete(`/api/questions/${questionId}`, { withCredentials: true });
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete question.");
    }
  };

  const beginMessageEdit = (questionId, message) => {
    const existingImages = getAttachmentImages(message);
    setEditingMessageKey(`${questionId}:${message._id}`);
    setEditMessageText(String(message?.text || ""));
    setEditMessageRetainedImages(existingImages);
    setEditMessageImageFiles([]);
    setEditMessageImagePreviews([]);
    setEditMessageRemoveImage(false);
  };

  const submitMessageEdit = async (questionId, messageId) => {
    const trimmed = String(editMessageText || "").trim();
    if (
      !trimmed
      && editMessageRetainedImages.length === 0
      && editMessageImageFiles.length === 0
      && !editMessageRemoveImage
    ) {
      return alert("Message cannot be empty.");
    }

    try {
      const formData = new FormData();
      if (trimmed) formData.append("text", trimmed);
      formData.append("retainedImages", JSON.stringify(editMessageRetainedImages));
      editMessageImageFiles.forEach((file) => {
        formData.append("images", file);
      });
      if (editMessageRemoveImage) formData.append("removeImage", "true");

      await axios.put(`/api/questions/${questionId}/messages/${messageId}`, formData, {
        withCredentials: true,
      });
      resetMessageEdit();
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update message.");
    }
  };

  const deleteMessage = async (questionId, messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`/api/questions/${questionId}/messages/${messageId}`, {
        withCredentials: true,
      });
      triggerRefresh();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete message.");
    }
  };

  const visiblePage = Math.min(Math.max(1, qnaPage), meta.totalPages || 1);
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

  return (
    <div className="qna-section">
      <div className="qna-header">
        <h2>Q&A</h2>
        <p>Ask product questions. Seller and question owner can continue the thread.</p>
      </div>

      {isAuthenticated && !isOwnProductSeller && (
        <form className="qna-ask-form" onSubmit={handleAskQuestion}>
          <div className="qna-compose-box">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ask something about this product..."
              rows={2}
            />

            {questionImagePreviews.length > 0 && (
              <div className="qna-compose-preview">
                <div className="qna-compose-preview-grid">
                  {questionImagePreviews.map((image, index) => (
                    <div key={`qna-create-preview-${index}`} className="qna-preview-tile">
                      <img src={image} alt="Question preview" className="inline-image-preview" />
                      <button
                        type="button"
                        className="qna-preview-remove-btn"
                        onClick={() => removeSelectedImageAt(
                          index,
                          questionImageFiles,
                          setQuestionImageFiles,
                          setQuestionImagePreviews,
                        )}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="qna-compose-footer">
              <label className="qna-photo-trigger">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    applySelectedImages(
                      e.target.files,
                      questionImageFiles,
                      setQuestionImageFiles,
                      setQuestionImagePreviews,
                    );
                    e.target.value = "";
                  }}
                />
                <FontAwesomeIcon icon={faImage} />
              </label>

              <button type="submit" className="qna-compose-submit" disabled={submitting}>
                {submitting ? "Posting..." : "Post Question"}
              </button>
            </div>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <div className="qna-note">Login to ask or vote. Everyone can read Q&A.</div>
      )}

      {isAuthenticated && isOwnProductSeller && (
        <div className="qna-note">
          You cannot ask questions on your own product. You can still view, vote, and answer.
        </div>
      )}

      <div className="qna-toolbar">
        <div className="qna-toolbar-group">
          <label htmlFor="qna-sort">Sort</label>
          <select
            id="qna-sort"
            value={qnaSort}
            onChange={(e) => {
              setQnaSort(e.target.value);
              setQnaPage(1);
            }}
          >
            <option value="latest">Latest</option>
            <option value="top">Top Voted</option>
            <option value="active">Most Active</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <div className="qna-toolbar-group">
          <label htmlFor="qna-filter">Filter</label>
          <select
            id="qna-filter"
            value={qnaFilter}
            onChange={(e) => {
              setQnaFilter(e.target.value);
              setQnaPage(1);
            }}
          >
            <option value="all">All Questions</option>
            <option value="answered">Answered</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading Q&A...</p>
      ) : questions.length === 0 ? (
        <p className="qna-empty">No questions found for this filter.</p>
      ) : (
        <div className="qna-list">
          {questions.map((question) => {
            const questionOwnerId = toId(question?.user);
            const isQuestionOwner = userId && userId === questionOwnerId;
            const isSeller = userId && userId === sellerId;
            const canJoinConversation = isQuestionOwner || isSeller;
            const questionImages = getAttachmentImages(question);
            const hasSellerAnswer = (question.messages || []).some(
              (msg) => String(msg.role || "").toLowerCase() === "seller",
            );

            return (
              <div key={question._id} className="qna-item">
                {editingQuestionId === question._id ? (
                  <div className="inline-edit-box">
                    <textarea
                      rows={2}
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
                    />
                    {[...editQuestionRetainedImages, ...editQuestionImagePreviews].length > 0 && (
                      <div className="qna-compose-preview">
                        <div className="qna-compose-preview-grid">
                          {[...editQuestionRetainedImages, ...editQuestionImagePreviews].map((image, index) => {
                            const retainedCount = editQuestionRetainedImages.length;
                            const isRetained = index < retainedCount;
                            const localFileIndex = index - retainedCount;

                            return (
                            <div key={`qna-edit-question-preview-${index}`} className="qna-preview-tile">
                              <img src={image} alt="Question edit preview" className="inline-image-preview" />
                              <button
                                type="button"
                                className="qna-preview-remove-btn"
                                onClick={() => {
                                  if (isRetained) {
                                    setEditQuestionRetainedImages((prev) => prev.filter((_, i) => i !== index));
                                  } else {
                                    removeSelectedImageAt(
                                      localFileIndex,
                                      editQuestionImageFiles,
                                      setEditQuestionImageFiles,
                                      setEditQuestionImagePreviews,
                                    );
                                  }
                                  setEditQuestionRemoveImage(false);
                                }}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="qna-compose-footer">
                      <label className="qna-photo-trigger">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            applySelectedImages(
                              e.target.files,
                              editQuestionImageFiles,
                              setEditQuestionImageFiles,
                              setEditQuestionImagePreviews,
                              editQuestionRetainedImages.length,
                            );
                            setEditQuestionRemoveImage(false);
                            e.target.value = "";
                          }}
                        />
                        <FontAwesomeIcon icon={faImage} />
                      </label>
                      <div className="owner-actions qna-inline-actions">
                        <button type="button" className="mini-btn" onClick={() => submitQuestionEdit(question._id)}>
                          Save
                        </button>
                        <button type="button" className="mini-btn ghost" onClick={resetQuestionEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="qna-question-row">
                    <div>
                      <p className="qna-question-text">{question.question}</p>
                      <p className="qna-meta">
                        Asked by {question.name} on {new Date(question.createdAt).toLocaleDateString()}
                      </p>
                      {questionImages.length > 0 && (
                        <div className="qna-attachments-grid">
                          {questionImages.map((image, index) => (
                            <img
                              key={`qna-question-image-${question._id}-${index}`}
                              src={image}
                              alt="Question attachment"
                              className="qna-attachment"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="qna-actions">
                  <button
                    className={`vote-btn ${(question.upvotes || []).some((id) => toId(id) === userId) ? "active-up" : ""}`}
                    onClick={() => handleVoteQuestion(question._id, "upvote")}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} /> {(question.upvotes || []).length}
                  </button>
                  <button
                    className={`vote-btn ${(question.downvotes || []).some((id) => toId(id) === userId) ? "active-down" : ""}`}
                    onClick={() => handleVoteQuestion(question._id, "downvote")}
                  >
                    <FontAwesomeIcon icon={faThumbsDown} /> {(question.downvotes || []).length}
                  </button>

                  {isSeller && (
                    <button
                      className="reply-btn"
                      onClick={() => {
                        if (answeringTo === question._id) {
                          resetAnswerComposer();
                        } else {
                          setAnsweringTo(question._id);
                          setAnswerText("");
                          setAnswerImageFiles([]);
                          setAnswerImagePreviews([]);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faReply} /> Answer
                    </button>
                  )}

                  {canJoinConversation && (
                    <button
                      className="reply-btn"
                      onClick={() => {
                        if (messageTo === question._id) {
                          resetMessageComposer();
                        } else {
                          setMessageTo(question._id);
                          setMessageText("");
                          setMessageImageFiles([]);
                          setMessageImagePreviews([]);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faReply} /> Message
                    </button>
                  )}

                  {isQuestionOwner && editingQuestionId !== question._id && (
                    <>
                      <button className="reply-btn" onClick={() => beginQuestionEdit(question)}>
                        Edit
                      </button>
                      <button className="reply-btn danger" onClick={() => deleteQuestion(question._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {answeringTo === question._id && (
                  <div className="qna-input-row">
                    <input
                      type="text"
                      placeholder="Write your seller answer..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                    />
                    <button type="button" onClick={() => handleAnswer(question._id)}>
                      Send
                    </button>
                    <div className="image-field-row full-width">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          applySelectedImages(
                            e.target.files,
                            answerImageFiles,
                            setAnswerImageFiles,
                            setAnswerImagePreviews,
                          );
                          e.target.value = "";
                        }}
                      />
                      {answerImagePreviews.length > 0 && (
                        <div className="qna-compose-preview-grid">
                          {answerImagePreviews.map((image, index) => (
                            <div key={`qna-answer-preview-${index}`} className="qna-preview-tile">
                              <img src={image} alt="Answer preview" className="inline-image-preview" />
                              <button
                                type="button"
                                className="qna-preview-remove-btn"
                                onClick={() => removeSelectedImageAt(
                                  index,
                                  answerImageFiles,
                                  setAnswerImageFiles,
                                  setAnswerImagePreviews,
                                )}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {messageTo === question._id && (
                  <div className="qna-input-row">
                    <input
                      type="text"
                      placeholder={
                        isQuestionOwner && !hasSellerAnswer
                          ? "Wait for seller answer first"
                          : "Write a follow-up message..."
                      }
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={isQuestionOwner && !hasSellerAnswer}
                    />
                    <button
                      type="button"
                      onClick={() => handleMessage(question._id)}
                      disabled={isQuestionOwner && !hasSellerAnswer}
                    >
                      Send
                    </button>
                    <div className="image-field-row full-width">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          applySelectedImages(
                            e.target.files,
                            messageImageFiles,
                            setMessageImageFiles,
                            setMessageImagePreviews,
                          );
                          e.target.value = "";
                        }}
                      />
                      {messageImagePreviews.length > 0 && (
                        <div className="qna-compose-preview-grid">
                          {messageImagePreviews.map((image, index) => (
                            <div key={`qna-message-preview-${index}`} className="qna-preview-tile">
                              <img src={image} alt="Message preview" className="inline-image-preview" />
                              <button
                                type="button"
                                className="qna-preview-remove-btn"
                                onClick={() => removeSelectedImageAt(
                                  index,
                                  messageImageFiles,
                                  setMessageImageFiles,
                                  setMessageImagePreviews,
                                )}
                              >
                                <FontAwesomeIcon icon={faXmark} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(question.messages || []).length > 0 && (
                  <div className="qna-messages">
                    {question.messages.map((msg) => {
                      const messageKey = `${question._id}:${msg._id}`;
                      const isMessageOwner = toId(msg?.user) === userId;
                      const isEditingThisMessage = editingMessageKey === messageKey;
                      const messageImages = getAttachmentImages(msg);

                      return (
                        <div key={msg._id} className="qna-message-item">
                          <div className="qna-message-head">
                            <strong>{msg.name}</strong>
                            <span className={msg.role === "seller" ? "tag-seller" : "tag-questioner"}>
                              {msg.role === "seller" ? "Seller" : "Question Owner"}
                            </span>
                          </div>

                          {isEditingThisMessage ? (
                            <div className="inline-edit-box">
                              <input
                                type="text"
                                value={editMessageText}
                                onChange={(e) => setEditMessageText(e.target.value)}
                              />
                              {[...editMessageRetainedImages, ...editMessageImagePreviews].length > 0 && (
                                <div className="qna-compose-preview">
                                  <div className="qna-compose-preview-grid">
                                    {[...editMessageRetainedImages, ...editMessageImagePreviews].map((image, index) => {
                                      const retainedCount = editMessageRetainedImages.length;
                                      const isRetained = index < retainedCount;
                                      const localFileIndex = index - retainedCount;

                                      return (
                                      <div key={`qna-edit-message-preview-${index}`} className="qna-preview-tile">
                                        <img src={image} alt="Message edit preview" className="inline-image-preview" />
                                        <button
                                          type="button"
                                          className="qna-preview-remove-btn"
                                          onClick={() => {
                                            if (isRetained) {
                                              setEditMessageRetainedImages((prev) => prev.filter((_, i) => i !== index));
                                            } else {
                                              removeSelectedImageAt(
                                                localFileIndex,
                                                editMessageImageFiles,
                                                setEditMessageImageFiles,
                                                setEditMessageImagePreviews,
                                              );
                                            }
                                            setEditMessageRemoveImage(false);
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                      </div>
                                    );
                                    })}
                                  </div>
                                </div>
                              )}
                              <div className="qna-compose-footer">
                                <label className="qna-photo-trigger">
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                      applySelectedImages(
                                        e.target.files,
                                        editMessageImageFiles,
                                        setEditMessageImageFiles,
                                        setEditMessageImagePreviews,
                                        editMessageRetainedImages.length,
                                      );
                                      setEditMessageRemoveImage(false);
                                      e.target.value = "";
                                    }}
                                  />
                                  <FontAwesomeIcon icon={faImage} />
                                </label>
                                <div className="owner-actions qna-inline-actions">
                                  <button type="button" className="mini-btn" onClick={() => submitMessageEdit(question._id, msg._id)}>
                                    Save
                                  </button>
                                  <button type="button" className="mini-btn ghost" onClick={resetMessageEdit}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p>{msg.text}</p>
                              {messageImages.length > 0 && (
                                <div className="qna-attachments-grid">
                                  {messageImages.map((image, index) => (
                                    <img
                                      key={`qna-message-image-${msg._id}-${index}`}
                                      src={image}
                                      alt="Message attachment"
                                      className="qna-attachment"
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {isMessageOwner && !isEditingThisMessage && (
                            <div className="owner-actions">
                              <button className="mini-btn" onClick={() => beginMessageEdit(question._id, msg)}>
                                Edit
                              </button>
                              <button className="mini-btn danger" onClick={() => deleteMessage(question._id, msg._id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="qna-pagination">
          <button
            type="button"
            className="qna-page-btn"
            onClick={() => setQnaPage((prev) => Math.max(1, prev - 1))}
            disabled={visiblePage <= 1}
          >
            Previous
          </button>
          <div className="qna-page-numbers">
            {pageWindow.map((page) => (
              <button
                key={page}
                type="button"
                className={`qna-page-number ${page === visiblePage ? "active" : ""}`}
                onClick={() => setQnaPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="qna-page-btn"
            onClick={() => setQnaPage((prev) => Math.min(meta.totalPages, prev + 1))}
            disabled={visiblePage >= meta.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default QnASection;
