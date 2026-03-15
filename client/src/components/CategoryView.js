import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
// useParams() → Gets URL parameters (like category name from URL).
// useNavigate() → Used to navigate to another page (you commented it).

import ProductCard from "./ProductCard";
import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import "./CategoryView.css";

const CategoryView = () => {
  // /category/Laptop
  // categoryName = "Laptop"
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);

  // const navigate = useNavigate();

  const category = decodeURIComponent(categoryName);
  // console.log("modhu : " + category);
  // console.log("todhu : " + categoryName);

  // Converts URL-encoded text into normal text.
  // Example:
  // "Gaming%20Laptop" → "Gaming Laptop"

  const [filteredProducts, setFilteredProducts] = useState([]);
  // Stores products after filtering & sorting.
  const [priceSort, setPriceSort] = useState("");
  // Stores sorting option (low-to-high / high-to-low).
  const [selectedBrand, setSelectedBrand] = useState("");
  // Stores selected brand filter.
  const [showModal, setShowModal] = useState(false);
  // Controls modal visibility.
  const [modalMode, setModalMode] = useState("view");
  // Stores modal mode (view or edit).
  const [currentProduct, setCurrentProduct] = useState(null);
  // Stores product currently opened in modal.

  // Memoize categoryProducts to avoid recalculating on every render
  // In React:
  // Every time state changes → component re-renders.
  // When component re-renders:
  // All normal variables are recalculated
  // All filter/map operations run again
  // Even if nothing related changed.
  // That can slow your app if:
  // You have many products
  // You do heavy filtering/sorting

  const fetchCategoryProducts = async () => {
    try {
      const response = await axios.get(
        `/api/products?category=${encodeURIComponent(category)}`,
      );

      setProducts(response.data.data);
      console.log("checking");
      console.log(response.data.data.length);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Reset filters when category changes
  useEffect(() => {
    // setPriceSort("");
    // setSelectedBrand("");
    resetFilters();
    fetchCategoryProducts();
  }, [categoryName]);

  const categoryProducts = useMemo(
    () =>
      products.filter((p) => {
        const productCategory =
          typeof p.category === "object" && p.category !== null
            ? p.category.name
            : p.categoryName;
        // category jodi onject hoy then Object.category.name
        // string hole category.name
        // category: { name: "Laptop" }
        // and sometimes:
        // categoryName: "Laptop"
        return productCategory === category;
        // Returns only products matching current category.
      }),
    [products, category],
    // “I will only recalculate this filter IF products or category changes.”
  );

  const brands = useMemo(
    // Step-by-step:
    // map() → get all brands
    // new Set() → remove duplicates
    // ... → convert Set back to array
    // sort() → sort alphabetically

    () => [...new Set(categoryProducts.map((p) => p.brand))].sort(),
    [categoryProducts],
    // Recalculate only when category products change.
  );

  useEffect(() => {
    let result = [...categoryProducts];
    // Copy array (avoid mutating original)
    // The ... spread operator creates a new array copy.
    // just assign korle reference create hoto copy na

    // Filter by brand
    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Sort by price
    if (priceSort === "low-to-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === "high-to-low") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [categoryProducts, priceSort, selectedBrand]);
  // ei 3 tar jekono akta change hoile ei portion run hbe

  const handleView = (product) => {
    setCurrentProduct(product);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        // window.location.reload();
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== id),
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const handleModalSave = async () => {
    setShowModal(false);
    // window.location.reload();
    // This reloads entire page

    try {
      const response = await axios.get("/api/products");
      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const resetFilters = () => {
    setPriceSort("");
    setSelectedBrand("");
  };

  return (
    <div className="category-view">
      {console.log("I am category page")}

      <ProductList
        products={products}
        setProducts={setProducts}
        title={category}
      />
    </div>
  );
};

export default CategoryView;
