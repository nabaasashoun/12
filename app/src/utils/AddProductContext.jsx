import { createContext, useContext, useState } from 'react';

const AddProductContext = createContext();

export const useAddProduct = () => useContext(AddProductContext);

export const AddProductProvider = ({ children }) => {
  const [productImages, setProductImages] = useState(Array(9).fill(null));
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_price: '',
    stock_quantity: '',
    category: '',
    unit_name: '',
    min_order: 1,
    max_order: 1000,
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, question: '', type: 'text', options: [], required: false },
    { id: 2, question: '', type: 'text', options: [], required: false },
    { id: 3, question: '', type: 'text', options: [], required: false },
  ]);

  const updateQuestions = (updatedQuestions) => {
    setQuestions(updatedQuestions);
  };

  const resetForm = () => {
    setProductImages(Array(9).fill(null));
    setFormData({
      name: '',
      description: '',
      unit_price: '',
      stock_quantity: '',
      category: '',
      unit_name: '',
      min_order: 1,
      max_order: 1000,
    });
    setSelectedCategory('');
    setQuestions([
      { id: 1, question: '', type: 'text', options: [], required: false },
      { id: 2, question: '', type: 'text', options: [], required: false },
      { id: 3, question: '', type: 'text', options: [], required: false },
    ]);
  };

  return (
    <AddProductContext.Provider value={{
      productImages,
      setProductImages,
      formData,
      setFormData,
      selectedCategory,
      setSelectedCategory,
      questions,
      updateQuestions,
      resetForm
    }}>
      {children}
    </AddProductContext.Provider>
  );
};