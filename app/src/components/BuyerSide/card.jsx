// card.jsx - SIMPLEST DARK MODE (follows the page instantly)
import { useDarkMode } from '../../utils/DarkModeContext';

export const Card = ({ className = '', children, variant = 'default' }) => {
  const { isDarkMode } = useDarkMode();

  const variants = {
    default: isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200',
    
    elevated: isDarkMode 
      ? 'bg-gray-800 shadow-lg border border-gray-700' 
      : 'bg-white shadow-md border border-gray-100',
    
    outline: isDarkMode 
      ? 'bg-transparent border border-gray-600' 
      : 'bg-transparent border border-gray-300',
    
    promoted: isDarkMode 
      ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-l-4 border-blue-400' 
      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500'
  };

  return (
    <div 
      className={`
        rounded-xl 
        transition-all duration-300 
        ${variants[variant]} 
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ className = '', children }) => {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`p-4 transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
};