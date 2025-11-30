import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';
import { Camera, Image as ImageIcon, Loader2, RotateCcw } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  subLabel: string;
  onImageSelected: (image: ImageFile) => void;
  currentImage?: ImageFile | null;
  icon: React.ReactNode;
  cameraFacing?: 'user' | 'environment'; // 'user' = selfie, 'environment' = zadná kamera
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  subLabel, 
  onImageSelected, 
  currentImage,
  icon,
  cameraFacing = 'environment'
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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
      // Reset inputs so same file can be selected again if needed
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        className={`
          relative w-full aspect-[3/4] max-w-sm rounded-2xl border-2 border-dashed 
          flex flex-col items-center justify-center transition-all duration-300
          overflow-hidden shadow-sm
          ${currentImage ? 'border-purple-500 bg-purple-50' : 'border-slate-300 bg-white'}
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-2" />
            <span className="text-sm">Spracovávam fotku...</span>
          </div>
        ) : currentImage ? (
          <>
            <img 
              src={currentImage.preview} 
              alt="Selected" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
               <button 
                onClick={triggerCamera}
                className="p-3 bg-white/90 backdrop-blur text-slate-900 rounded-full shadow-lg hover:bg-white active:scale-95 transition-all"
                title="Prefotiť"
               >
                 <RotateCcw className="w-5 h-5" />
               </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center p-6 w-full">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-full shadow-sm mb-4">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">{subLabel}</p>
            
            <div className="flex flex-col w-full gap-3 max-w-[200px]">
              <button 
                onClick={triggerCamera}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-md"
              >
                <Camera className="w-5 h-5" />
                Odfotiť
              </button>
              <button 
                onClick={triggerGallery}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
              >
                <ImageIcon className="w-5 h-5" />
                Galéria
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Input pre kameru (spúšťa fotoaparát na mobile) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture={cameraFacing}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Input pre galériu (otvára výber súborov) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;
