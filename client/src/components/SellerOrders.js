import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faChevronLeft,
  faChevronRight,
  faClock,
  faFire,
  faPlus,
  faStore,
  faTrash,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import axios from "../api";
import { useLanguage } from "../context/LanguageContext";
import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import "./SellerOrders.css";

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [ownedProducts, setOwnedProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [dismissedOrderIds, setDismissedOrderIds] = useState(
    () => new Set(JSON.parse(localStorage.getItem('seller_dismissed_orders') || '[]'))
  );
  const topScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navigate = useNavigate();
  const { t, formatDate, formatNumber, formatCurrency, translateOrderStatus } = useLanguage();

  useEffect(() => {
    const initSellerWorkspace = async () => {
      await Promise.all([fetchSellerOrders(), fetchOwnedProducts(), fetchTopProducts()]);
    };
    initSellerWorkspace();
  }, []);

  useEffect(() => {
    const track = topScrollRef.current;
    if (!track) return;
    const update = () => {
      setCanScrollLeft(track.scrollLeft > 4);
      setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };
    update();
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [topProducts]);

  const fetchTopProducts = async () => {
    try {
      const res = await axios.get('/api/products/top-selling', { withCredentials: true });
      setTopProducts(res.data.data || []);
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const scrollTop = (direction) => {
    const track = topScrollRef.current;
    if (!track) return;
    const amount = Math.max(260, Math.round(track.clientWidth * 0.75));
    track.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const isOrderClearable = (order) =>
    Array.isArray(order.orderItems) &&
    order.orderItems.length > 0 &&
    order.orderItems.every(item => item.status === 'Delivered' || item.status === 'Cancelled');

  const dismissOrder = (orderId) => {
    setDismissedOrderIds(prev => {
      const next = new Set([...prev, orderId]);
      localStorage.setItem('seller_dismissed_orders', JSON.stringify([...next]));
      return next;
    });
  };

  const clearAllOrders = () => {
    const allIds = orders.filter(isOrderClearable).map(o => o._id);
    setDismissedOrderIds(prev => {
      const next = new Set([...prev, ...allIds]);
      localStorage.setItem('seller_dismissed_orders', JSON.stringify([...next]));
      return next;
    });
  };

  const fetchSellerOrders = async ({ withLoader = true } = {}) => {
    if (withLoader) setOrdersLoading(true);
    try {
      const res = await axios.get("/api/orders/seller", { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching seller orders:", error);
    } finally {
      if (withLoader) setOrdersLoading(false);
    }
  };

  const fetchOwnedProducts = async ({ withLoader = true } = {}) => {
    if (withLoader) setProductsLoading(true);
    try {
      const response = await axios.get("/api/products/mine", {
        withCredentials: true,
      });
      setOwnedProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching seller products:", error);
      setOwnedProducts([]);
    } finally {
      if (withLoader) setProductsLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setShowProductModal(true);
  };

  const handleProductModalClose = () => {
    setShowProductModal(false);
  };

  const handleProductModalSave = async () => {
    setShowProductModal(false);
    await fetchOwnedProducts({ withLoader: false });
  };

  const handleStatusUpdate = async (orderId, productId, newStatus) => {
    let cancellationReason = "";
    if (newStatus === "Cancelled") {
      cancellationReason = prompt(t("sellerOrders.cancelPrompt"));
      if (cancellationReason === null) return;
      if (!cancellationReason.trim()) {
        alert(t("sellerOrders.cancelReasonRequired"));
        return;
      }
    }

    try {
      const res = await axios.put(
        `/api/orders/${orderId}/item/${productId}/status`,
        { status: newStatus, cancellationReason },
        { withCredentials: true },
      );
      if (res.data.success) {
        fetchSellerOrders({ withLoader: false });
      }
    } catch (error) {
      alert(error.response?.data?.message || t("sellerOrders.updateError"));
    }
  };

  const getAvailableStatuses = (currentStatus) => {
    const statusOrder = ["Pending", "Processing", "Shipped", "Delivered"];

    if (currentStatus === "Cancelled") return ["Cancelled"];
    if (currentStatus === "Delivered") return ["Delivered"];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const available = statusOrder.slice(Math.max(currentIndex, 0));
    if (currentIndex <= 1) available.push("Cancelled");
    return available;
  };

  const orderItems = useMemo(
    () =>
      orders.flatMap((order) =>
        (Array.isArray(order.orderItems) ? order.orderItems : []).map((item) => ({
          ...item,
          orderId: order._id,
        })),
      ),
    [orders],
  );

  const visibleOrders = orders.filter(o => !dismissedOrderIds.has(o._id));
  const clearableVisible = visibleOrders.filter(isOrderClearable);
  const pendingItems = orderItems.filter((item) => item.status === "Pending").length;
  const deliveredItems = orderItems.filter((item) => item.status === "Delivered").length;

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-container">
        <section className="seller-workbench">
          <div className="seller-workbench-head">
            <div>
              <p className="seller-workbench-kicker">
                {t("sellerOrders.workspaceKicker", {}, "Seller Workspace")}
              </p>
              <h1 className="seller-orders-title">{t("sellerOrders.title")}</h1>
              <p className="seller-workbench-subtitle">
                {t(
                  "sellerOrders.workspaceSubtitle",
                  {},
                  "Manage products and orders from one focused dashboard.",
                )}
              </p>
            </div>

            <div className="seller-workbench-actions">
              <button type="button" className="seller-primary-btn" onClick={handleCreateProduct}>
                <FontAwesomeIcon icon={faPlus} />
                {t("home.addProduct")}
              </button>
              <button type="button" className="seller-secondary-btn" onClick={() => navigate("/profile")}>
                <FontAwesomeIcon icon={faUser} />
                {t("navbar.account")}
              </button>
              <button type="button" className="seller-secondary-btn" onClick={() => navigate("/store")}>
                <FontAwesomeIcon icon={faStore} />
                {t("navbar.visitSite")}
              </button>
            </div>
          </div>

          <div className="seller-metrics-grid">
            <div className="seller-metric-card">
              <span className="seller-metric-icon">
                <FontAwesomeIcon icon={faBoxOpen} />
              </span>
              <div>
                <p>{t("profile.sellerInventory", {}, "Inventory")}</p>
                <strong>{formatNumber(ownedProducts.length)}</strong>
              </div>
            </div>

            <div className="seller-metric-card">
              <span className="seller-metric-icon">
                <FontAwesomeIcon icon={faClock} />
              </span>
              <div>
                <p>{t("sellerOrders.pendingLabel", {}, "Pending Items")}</p>
                <strong>{formatNumber(pendingItems)}</strong>
              </div>
            </div>

            <div className="seller-metric-card">
              <span className="seller-metric-icon">
                <FontAwesomeIcon icon={faBoxOpen} />
              </span>
              <div>
                <p>{t("sellerOrders.deliveredLabel", {}, "Delivered Items")}</p>
                <strong>{formatNumber(deliveredItems)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="seller-orders-section">
          <div className="seller-section-head seller-section-head--row">
            <div>
              <h2>{t("sellerOrders.orderQueueTitle", {}, "Order Queue")}</h2>
              <p>
                {t(
                  "sellerOrders.orderQueueDescription",
                  {},
                  "Update fulfillment status quickly and keep buyers informed.",
                )}
              </p>
            </div>
            {clearableVisible.length > 0 && (
              <button type="button" className="seller-clear-all-btn" onClick={clearAllOrders}>
                <FontAwesomeIcon icon={faTrash} /> Clear All
              </button>
            )}
          </div>

          {ordersLoading ? (
            <div className="seller-orders-loading">{t("sellerOrders.loading")}</div>
          ) : visibleOrders.length === 0 ? (
            <div className="seller-orders-empty">{t("sellerOrders.empty")}</div>
          ) : (
            <div className="seller-orders-list">
              {visibleOrders.map((order) => (
                <div key={order._id} className="seller-order-card">
                  <div className="seller-order-header">
                    <div className="customer-info">
                      <span className="order-id">
                        {t("orders.order")} #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="customer-details">
                        {t("sellerOrders.customer")}: {order.shippingAddress.phone}
                      </span>
                    </div>
                    <div className="seller-order-header-right">
                      <div className="order-date">{formatDate(order.createdAt)}</div>
                      {isOrderClearable(order) && (
                        <button
                          type="button"
                          className="seller-dismiss-btn"
                          onClick={() => dismissOrder(order._id)}
                          title="Dismiss order"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="seller-order-items">
                    {order.orderItems.map((item) => (
                      <div key={item.product} className="seller-item">
                        <img src={item.image} alt={item.name} className="item-img" />
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">
                            {t("sellerOrders.quantity")}: {item.qty}
                          </span>
                        </div>
                        <div className="item-status-actions">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusUpdate(order._id, item.product, e.target.value)}
                            className={`status-select status-${item.status.toLowerCase()}`}
                            disabled={item.status === "Delivered" || item.status === "Cancelled"}
                          >
                            {getAvailableStatuses(item.status).map((status) => (
                              <option key={status} value={status}>
                                {translateOrderStatus(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                        {item.status === "Cancelled" && item.cancellationReason && (
                          <div className="cancellation-info">
                            {t("sellerOrders.reason")}: {item.cancellationReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="seller-order-footer">
                    <div className="shipping-address">
                      <strong>{t("sellerOrders.shippingAddress")}</strong>
                      <p>
                        {order.shippingAddress.address}, {order.shippingAddress.city} -{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {topProducts.length > 0 && (
          <section className="seller-trending-section">
            <div className="seller-section-head seller-section-head--row">
              <div>
                <h2>
                  <FontAwesomeIcon icon={faFire} className="seller-trending-icon" />
                  {t('sellerOrders.topSellingTitle', {}, 'Top 20 — Marketplace Best Sellers')}
                </h2>
                <p>{t('sellerOrders.topSellingDesc', {}, 'Products ranked by total units sold across the marketplace.')}</p>
              </div>
              <div className="seller-top-scroll-btns">
                <button type="button" className="seller-top-scroll-btn" onClick={() => scrollTop('left')} disabled={!canScrollLeft}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button type="button" className="seller-top-scroll-btn" onClick={() => scrollTop('right')} disabled={!canScrollRight}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
            <div className="seller-top-track" ref={topScrollRef}>
              {topProducts.map((p, idx) => (
                <div key={p._id} className="seller-top-card" onClick={() => navigate(`/product/${p._id}`)}>
                  <span className="seller-top-rank">#{idx + 1}</span>
                  <div className="seller-top-img-wrap">
                    <img src={p.image} alt={p.name} className="seller-top-img" />
                  </div>
                  <div className="seller-top-info">
                    <span className="seller-top-name">{p.name}</span>
                    <span className="seller-top-brand">{p.brand}</span>
                    <div className="seller-top-meta">
                      <span className="seller-top-price">{formatCurrency(p.price)}</span>
                      <span className="seller-top-sold">{formatNumber(p.soldCount)} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="seller-catalog-section">
          {productsLoading ? (
            <div className="seller-orders-loading">{t("common.loading")}</div>
          ) : (
            <ProductList
              title={t("profile.manageMyProducts")}
              products={ownedProducts}
              setProducts={setOwnedProducts}
              showOwnerActions={true}
              refreshEndpoint="/api/products/mine"
            />
          )}
        </section>
      </div>

      {showProductModal && (
        <ProductModal
          show={showProductModal}
          mode="create"
          product={null}
          onClose={handleProductModalClose}
          onSave={handleProductModalSave}
        />
      )}
    </div>
  );
};

export default SellerOrders;
