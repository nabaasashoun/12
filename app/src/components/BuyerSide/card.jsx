export const Card = ({ className, children, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md border-0',
    outline: 'border border-gray-300 bg-transparent',
    promoted: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500'
  };
  
  return (
    <div className={`rounded-lg ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ className, children }) => (
  <div className={`p-2 ${className}`}>{children}</div>
);