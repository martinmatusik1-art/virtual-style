import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  subLabel: string;
  onImageSelected: (image: ImageFile) => void;
  currentImage?: ImageFile | null;
  icon: React.ReactNode;
  preferCamera?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  subLabel, 
  onImageSelected, 
  currentImage,
  icon,
  preferCamera = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to resize image to max dimensions to save data and speed up AI
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200; // Max dimension 1200px is enough for AI

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 0.8 quality
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const resizedDataUrl = await resizeImage(file);
      // Extract Base64 data
      const base64Data = resizedDataUrl.split(',')[1];
      
      onImageSelected({
        preview: resizedDataUrl,
        base64: base64Data,
        mimeType: 'image/jpeg'
      });
    } catch (err) {
      console.error("Error processing image", err);
      alert("Nepodarilo sa spracovať obrázok. Skúste iný.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        onClick={triggerSelect}
        className={`
          relative w-full aspect-[3/4] max-w-sm rounded-2xl border-2 border-dashed 
          flex flex-col items-center justify-center cursor-pointer transition-all duration-300
          overflow-hidden shadow-sm touch-manipulation
          ${currentImage ? 'border-purple-500 bg-purple-50' : 'border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100'}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-2" />
            <span className="text-sm">Spracovávam fotku...</span>
          </div>
        ) : currentImage ? (
          <img 
            src={currentImage.preview} 
            alt="Selected" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-center p-6 space-y-4">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-full shadow-sm">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
              <p className="text-sm text-slate-500 mt-1">{subLabel}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-md flex items-center gap-2">
                {preferCamera ? <Camera className="w-4 h-4"/> : <ImageIcon className="w-4 h-4"/>}
                {preferCamera ? 'Odfotiť' : 'Vybrať fotku'}
              </span>
            </div>
          </div>
        )}
        
        {currentImage && !isProcessing && (
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
             <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
               Zmeniť fotku
             </span>
           </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={preferCamera ? "environment" : undefined}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;