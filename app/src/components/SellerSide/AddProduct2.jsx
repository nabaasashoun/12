import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Tag, DollarSign, Hash, FileText, Grid } from 'lucide-react';
import { useAddProduct } from '../../utils/AddProductContext';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';

const AddProduct2 = () => {
  const { isDarkMode } = useSellerDarkMode();
  const navigate = useNavigate();
  const { formData, setFormData, selectedCategory, setSelectedCategory } = useAddProduct();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const unitOptions = [
    'piece', 'kg', 'g', 'lb', 'oz', 'liter', 'ml', 'pack', 'set', 'pair', 'dozen', 'bundle', 'box'
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }
    if (!formData.unit_name) {
      alert('Please select a unit');
      return;
    }
    navigate('/seller/add-product/step3');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`border-b sticky top-0 z-10 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/seller/add-product/step1')}
            className={`flex items-center ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
          <p className={`text-[21px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Product Details</p>
          <button
            onClick={handleContinue}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className={`rounded-xl shadow-sm p-4 md:p-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Product Information</h2>

          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                placeholder="e.g., Wireless Bluetooth Headphones"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                placeholder="Describe your product in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  Price (UGX) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-12 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  <div className={`absolute left-3 top-3 font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-black'
                  }`}>UGX</div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  placeholder="e.g., 100"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Grid className="w-4 h-4 mr-2 text-gray-500" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  disabled={loadingCategories}
                >
                  <option value="">Select a category</option>
                  {loadingCategories ? (
                    <option disabled>Loading categories...</option>
                  ) : (
                    categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 flex items-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Package className="w-4 h-4 mr-2 text-gray-500" />
                  Unit *
                </label>
                <select
                  name="unit_name"
                  value={formData.unit_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  required
                >
                  <option value="">Select unit</option>
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  name="min_order"
                  value={formData.min_order}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  placeholder="1"
                  min="1"
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Minimum number of units per order</p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Maximum Order Quantity
                </label>
                <input
                  type="number"
                  name="max_order"
                  value={formData.max_order}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  placeholder="1000"
                  min="1"
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Maximum number of units per order</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct2;