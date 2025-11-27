import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] text-center px-6">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          ✨
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Aplikujem outfit...</h2>
      <p className="text-slate-500 max-w-xs">
        Umelá inteligencia práve oblieka tvoju postavu. Toto môže trvať niekoľko sekúnd.
      </p>
    </div>
  );
};

export default LoadingScreen;