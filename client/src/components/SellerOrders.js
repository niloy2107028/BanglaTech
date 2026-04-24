import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faClock,
  faPlus,
  faStore,
  faTruckFast,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import axios from "../api";
import { useLanguage } from "../context/LanguageContext";
import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import "./SellerOrders.css";

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [ownedProducts, setOwnedProducts] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const navigate = useNavigate();
  const { t, formatDate, formatNumber, translateOrderStatus } = useLanguage();

  useEffect(() => {
    const initSellerWorkspace = async () => {
      await Promise.all([fetchSellerOrders(), fetchOwnedProducts()]);
    };
    initSellerWorkspace();
  }, []);

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

  const pendingItems = orderItems.filter((item) => item.status === "Pending").length;
  const shippingItems = orderItems.filter((item) => item.status === "Shipped").length;
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
                <FontAwesomeIcon icon={faTruckFast} />
              </span>
              <div>
                <p>{t("sellerOrders.shippedLabel", {}, "Shipped Items")}</p>
                <strong>{formatNumber(shippingItems)}</strong>
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
          <div className="seller-section-head">
            <h2>{t("sellerOrders.orderQueueTitle", {}, "Order Queue")}</h2>
            <p>
              {t(
                "sellerOrders.orderQueueDescription",
                {},
                "Update fulfillment status quickly and keep buyers informed.",
              )}
            </p>
          </div>

          {ordersLoading ? (
            <div className="seller-orders-loading">{t("sellerOrders.loading")}</div>
          ) : orders.length === 0 ? (
            <div className="seller-orders-empty">{t("sellerOrders.empty")}</div>
          ) : (
            <div className="seller-orders-list">
              {orders.map((order) => (
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
                    <div className="order-date">{formatDate(order.createdAt)}</div>
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
