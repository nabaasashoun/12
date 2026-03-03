import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X, FileText, List, AlertCircle, Star } from 'lucide-react';
import { useAddProduct } from '../../utils/AddProductContext';

const AddProduct3 = () => {
  const navigate = useNavigate();
  const { 
    productImages, 
    formData, 
    selectedCategory,
    questions,
    updateQuestions,
    resetForm 
  } = useAddProduct();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipQuestions, setSkipQuestions] = useState(false);
  const [hasMandatoryQuestion, setHasMandatoryQuestion] = useState(false);

  useEffect(() => {
    const mandatoryExists = questions.some(q => q.required && q.question.trim() !== '');
    setHasMandatoryQuestion(mandatoryExists);
  }, [questions]);

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    
    if (field === 'required' && value === true) {
      updatedQuestions.forEach((q, i) => {
        if (i !== index) {
          q.required = false;
        }
      });
    }
    
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    updateQuestions(updatedQuestions);
  };

  const setAsMandatory = (questionIndex) => {
    const updatedQuestions = [...questions];
    
    updatedQuestions.forEach(q => {
      q.required = false;
    });
    
    updatedQuestions[questionIndex].required = true;
    updateQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length < 5) {
      updatedQuestions[questionIndex].options.push('');
      updateQuestions(updatedQuestions);
    }
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    updateQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    updateQuestions(updatedQuestions);
  };

  const toggleQuestionType = (questionIndex) => {
    const updatedQuestions = [...questions];
    const newType = updatedQuestions[questionIndex].type === 'text' ? 'multi-select' : 'text';
    updatedQuestions[questionIndex].type = newType;
    
    if (newType === 'text') {
      updatedQuestions[questionIndex].options = [];
    }
    
    updateQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

    if (productImages.filter(img => img !== null).length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    if (!skipQuestions) {
      const validQuestions = questions.filter(q => q.question.trim() !== '');
      const mandatoryQuestionExists = validQuestions.some(q => q.required);
      
      if (validQuestions.length > 0 && !mandatoryQuestionExists) {
        alert('Please mark at least one question as mandatory (click the star icon)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('unit_price', formData.unit_price);
      formDataToSend.append('stock_quantity', formData.stock_quantity);
      formDataToSend.append('unit_name', formData.unit_name || 'piece');
      formDataToSend.append('min_order', formData.min_order || 1);
      formDataToSend.append('max_order', formData.max_order || 1000);
      
      if (selectedCategory) {
        formDataToSend.append('category', selectedCategory);
      }

      const validQuestions = skipQuestions ? [] : questions.filter(q => q.question.trim() !== '');
      formDataToSend.append('questions_input', JSON.stringify(validQuestions));

      const mainImageIndex = productImages.findIndex(img => img !== null);
      if (mainImageIndex !== -1) {
        const imageData = productImages[mainImageIndex];
        if (imageData.url.startsWith('data:')) {
          const response = await fetch(imageData.url);
          const blob = await response.blob();
          formDataToSend.append('product_photo', blob, `product_${Date.now()}.jpg`);
        } else if (imageData.file) {
          formDataToSend.append('product_photo', imageData.file);
        }
      }

      const imagePromises = productImages
        .filter(img => img !== null)
        .map(async (imageData, index) => {
          if (imageData.file instanceof File) {
            return { file: imageData.file, index };
          } else if (imageData.url && imageData.url.startsWith('data:')) {
            const response = await fetch(imageData.url);
            const blob = await response.blob();
            return { file: blob, index };
          }
          return null;
        });

      const resolvedImages = (await Promise.all(imagePromises)).filter(Boolean);
      resolvedImages.forEach(({ file }) => {
        formDataToSend.append('images', file);
      });

      console.log('Sending product data:', Object.fromEntries(formDataToSend));

      const response = await fetch('/api/products/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        alert('Product added successfully!');
        
        resetForm();
        navigate('/seller/home');
      } else {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Unknown error';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Server error (JSON):', errorData);
          if (errorData.errors) {
            errorMessage = Object.entries(errorData.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('\n');
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        } else {
          const errorText = await response.text();
          console.error('Server error (text):', errorText);
          errorMessage = errorText;
        }
        
        alert(`Failed to add product (${response.status}): ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setSkipQuestions(true);
    const validQuestions = questions.filter(q => q.question.trim() !== '');
    if (validQuestions.length > 0) {
      if (window.confirm('You have questions filled. Are you sure you want to skip?')) {
        updateQuestions(validQuestions);
      } else {
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/seller/add-product/step2')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
          <p className="text-[18px] font-bold text-gray-900">Product Qtns (Optional)</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Skip
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Custom Questions for Buyers</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add up to 3 questions that buyers must answer when ordering. 
                <span className="font-semibold text-blue-600"> You must mark at least one question as mandatory (★)</span> 
                so buyers must answer it even if they skip other questions.
              </p>
              
              {!skipQuestions && !hasMandatoryQuestion && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <p className="text-sm text-red-800">
                      <span className="font-bold">Important:</span> You must mark at least one question as mandatory 
                      (click the star icon ★ next to a question). Buyers will be required to answer this question.
                    </p>
                  </div>
                </div>
              )}

              {skipQuestions && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      You have chosen to skip questions. Buyers will not be prompted to answer any questions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!skipQuestions && (
              <div className="space-y-8">
                {questions.map((question, questionIndex) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 mr-2">Question {questionIndex + 1}</h3>
                        
                        {question.required && (
                          <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                            Mandatory
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => setAsMandatory(questionIndex)}
                          className={`flex items-center ${question.required ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                          title={question.required ? "This question is mandatory" : "Set as mandatory question"}
                        >
                          <Star className={`w-5 h-5 ${question.required ? 'fill-yellow-500' : ''}`} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => toggleQuestionType(questionIndex)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          {question.type === 'text' ? (
                            <>
                              <FileText className="w-4 h-4 mr-1" />
                              Text
                            </>
                          ) : (
                            <>
                              <List className="w-4 h-4 mr-1" />
                              Multi-select
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                        className={`w-full px-4 py-3 border ${question.required ? 'border-yellow-300' : 'border-gray-300'} text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="e.g., What color would you like?"
                      />
                      {question.required && (
                        <p className="text-xs text-yellow-600 mt-1 ml-1">
                          Buyers must answer this question before purchase
                        </p>
                      )}
                    </div>

                    {question.type === 'multi-select' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Options (Max 5)</label>
                          {question.options.length < 5 && (
                            <button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Option
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                                className="ml-2 p-2 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">Important Note:</p>
                      <p className="text-sm text-blue-700">
                        The <span className="font-semibold">mandatory question (★)</span> must be answered by buyers before they can complete their purchase. 
                        Other questions are optional for buyers to answer. 
                        <span className="font-semibold"> You must set at least one mandatory question if you add any questions.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-gray-600">
                {!skipQuestions && hasMandatoryQuestion && (
                  <div className="flex items-center text-green-600">
                    <Check className="w-4 h-4 mr-1" />
                    Mandatory question is set. Buyers must answer it before purchase.
                  </div>
                )}
                {!skipQuestions && !hasMandatoryQuestion && questions.some(q => q.question.trim() !== '') && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Please set a mandatory question (click the star icon ★)
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || (!skipQuestions && questions.some(q => q.question.trim() !== '') && !hasMandatoryQuestion)}
                className={`w-full md:w-auto px-8 py-3 font-medium rounded-lg transition-colors flex items-center justify-center shadow-md ${
                  isSubmitting || (!skipQuestions && questions.some(q => q.question.trim() !== '') && !hasMandatoryQuestion)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Posting Product...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Post Product
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct3;