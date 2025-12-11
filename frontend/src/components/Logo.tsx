import React from 'react';

interface LogoProps {
  className?: string;
  withText?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className = '', withText = true, onClick }) => {
  return (
    <div 
      className={`flex items-center ${className} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-xl">
        HF
      </div>
      {withText && (
        <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          HireFlow
        </span>
      )}
    </div>
  );
};

export default Logo;
