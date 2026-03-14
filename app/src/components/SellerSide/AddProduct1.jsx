import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X, FolderOpen, Check } from 'lucide-react';
import { useAddProduct } from '../../utils/AddProductContext';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';

const AddProduct1 = () => {
  const { isDarkMode } = useSellerDarkMode();
  const navigate = useNavigate();
  const { productImages, setProductImages } = useAddProduct();
  const [recentImages, setRecentImages] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [...productImages];
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const firstEmptyBox = newImages.findIndex(img => img === null);
        if (firstEmptyBox !== -1) {
          newImages[firstEmptyBox] = {
            url: e.target.result,
            name: file.name,
            size: file.size,
            file: file
          };
        }
      };
      reader.readAsDataURL(file);
    });
    
    setProductImages(newImages);
    
    const newRecentImages = [
      ...recentImages,
      ...files.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        file: file
      }))
    ];
    
    setRecentImages(newRecentImages);
  };

  const handleFolderUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newRecentImages = imageFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      file: file
    }));
    
    setRecentImages(newRecentImages);
  };

  const removeImage = (index, e) => {
    e.stopPropagation();
    const newImages = [...productImages];
    newImages[index] = null;
    setProductImages(newImages);
  };

  const selectRecentImage = (image, index) => {
    if (multiSelectMode) {
      if (selectedIndexes.includes(index)) {
        setSelectedIndexes(selectedIndexes.filter(i => i !== index));
      } else if (selectedIndexes.length < 4) {
        setSelectedIndexes([...selectedIndexes, index]);
      }
    } else {
      const newImages = [...productImages];
      const firstEmptyBox = newImages.findIndex(img => img === null);
      if (firstEmptyBox !== -1) {
        newImages[firstEmptyBox] = {
          ...image,
          url: image.url
        };
        setProductImages(newImages);
      }
    }
  };

  const handleLongPress = (index) => {
    longPressTimerRef.current = setTimeout(() => {
      setMultiSelectMode(true);
      setSelectedIndexes([index]);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const addSelectedToBoxes = () => {
    const newImages = [...productImages];
    let boxIndex = 0;
    
    selectedIndexes.forEach((recentIndex) => {
      const image = recentImages[recentIndex];
      while (boxIndex < 9 && newImages[boxIndex] !== null) {
        boxIndex++;
      }
      if (boxIndex < 9) {
        newImages[boxIndex] = { ...image, url: image.url };
        boxIndex++;
      }
    });
    
    setProductImages(newImages);
    setMultiSelectMode(false);
    setSelectedIndexes([]);
  };

  const clearMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedIndexes([]);
  };

  const mainImage = productImages[0];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`border-b sticky top-0 z-10 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/seller/home')}
            className={`flex items-center ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
          <p className={`text-[21px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Add Images</p>
          <button
            onClick={() => navigate('/seller/add-product/step2')}
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
        <div className={`mb-2 rounded-xl shadow-sm p-4 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Product Images (Max 9)</h3>
          
          <div 
            className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer h-64 md:h-80 transition-colors duration-300 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}
            onClick={() => fileInputRef.current.click()}
          >
            {mainImage ? (
              <div className="relative w-full h-full">
                <img
                  src={mainImage.url}
                  alt="Main Product Image"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => removeImage(0, e)}
                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 z-10 shadow"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded font-medium">
                  Main Image
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0">
                {productImages.map((_, index) => (
                  <div
                    key={index}
                    className={`
                      ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                      border
                      ${index % 3 !== 2 ? 'border-r-2' : ''}
                      ${index < 6 ? 'border-b-2' : ''}
                    `}
                  />
                ))}
              </div>
            )}

            {productImages.every(img => img === null) && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center bg-opacity-90 ${
                isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                <Camera className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload images</p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>or drag and drop</p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <input
              type="file"
              accept="image/*"
              multiple
              webkitdirectory="true"
              className="hidden"
              ref={folderInputRef}
              onChange={handleFolderUpload}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => folderInputRef.current.click()}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Select Folder
            </button>
          </div>
        </div>

        <div className={`rounded-xl shadow-sm p-4 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Recent Images</h3>
            {multiSelectMode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearMultiSelect}
                  className={`px-3 py-1 text-sm transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={addSelectedToBoxes}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Selected ({selectedIndexes.length})
                </button>
              </div>
            )}
          </div>

          {recentImages.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              <Camera className={`w-12 h-12 mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p>No recent images</p>
              <p className="text-sm mt-1">Upload images or select a folder to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {recentImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 cursor-pointer ${
                    selectedIndexes.includes(index)
                      ? 'border-blue-500'
                      : isDarkMode ? 'border-gray-700' : 'border-transparent'
                  }`}
                  onClick={() => selectRecentImage(image, index)}
                  onMouseDown={() => handleLongPress(index)}
                  onMouseUp={handleTouchEnd}
                  onTouchStart={() => handleLongPress(index)}
                  onTouchEnd={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedIndexes.includes(index) && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {multiSelectMode && (
            <div className={`mt-4 p-3 rounded-lg ${
              isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                <span className="font-medium">Multi-select mode:</span> Tap images to select (max 4), then click "Add Selected"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProduct1;