import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api';
import ProductList from './ProductList';
import { useLanguage } from '../context/LanguageContext';

const CategoryView = () => {
  const { categoryName: category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, translateCategoryName } = useLanguage();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`/api/products?category=${encodeURIComponent(category)}`);
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching category products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (loading) {
    return <div className="category-view-loading">{t('category.loading')}</div>;
  }

  return (
    <div className="category-view">
      <ProductList
        products={products}
        setProducts={setProducts}
        title={translateCategoryName(category)}
        refreshEndpoint={`/api/products?category=${encodeURIComponent(category)}`}
      />
    </div>
  );
};

export default CategoryView;
