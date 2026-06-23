// src/components/BuyerSide/ReportModal.jsx
import React, { useState } from 'react';
import { X, AlertTriangle, Flag, Send, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const ReportModal = ({ isOpen, onClose, sellerId, sellerName, productId, productName, isDarkMode }) => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'fraud', label: 'Fraud / Scam' },
    { value: 'fake_product', label: 'Fake / Counterfeit Product' },
    { value: 'harassment', label: 'Harassment / Abuse' },
    { value: 'spam', label: 'Spam / Misleading' },
    { value: 'wrong_category', label: 'Wrong Category' },
    { value: 'price_manipulation', label: 'Price Manipulation' },
    { value: 'intellectual_property', label: 'Intellectual Property Violation' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportType) {
      setError('Please select a report type');
      return;
    }
    
    if (!description || description.trim().length < 10) {
      setError('Please provide a detailed description (minimum 10 characters)');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const reportData = {
        seller_id: sellerId,
        product_id: productId || null,
        report_type: reportType,
        description: description.trim(),
        evidence: evidence.trim(),
      };
      
      const result = await api.createReport(reportData);
      
      if (result.error) {
        setError(result.error || 'Failed to submit report');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setReportType('');
          setDescription('');
          setEvidence('');
          setError('');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className={`rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <Flag className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Report Seller
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Report {sellerName || 'this seller'} to the admin
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
            }`}>
              <CheckCircle className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Report Submitted
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Thank you for reporting. The admin will review this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Product being reported (if applicable) */}
            {productName && (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-medium">Product:</span> {productName}
                </p>
              </div>
            )}

            {/* Report Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Report Type <span className="text-red-500">*</span>
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select a reason...</option>
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="Please describe the issue in detail..."
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Minimum 10 characters
              </p>
            </div>

            {/* Evidence */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional Evidence (Optional)
              </label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows="2"
                placeholder="Provide any additional evidence or details..."
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Warning message */}
            <div className={`p-3 rounded-lg text-xs ${isDarkMode ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Please only report genuine issues. False reports may lead to account action.
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center justify-center gap-2 ${
                  isDarkMode ? 'hover:bg-red-700' : ''
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;