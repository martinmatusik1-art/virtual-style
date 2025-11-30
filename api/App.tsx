import React, { useState, useCallback } from 'react';
import { Camera, Shirt, Sparkles, ChevronLeft, RotateCcw, Download, UserRound } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import LoadingScreen from './components/LoadingScreen';
import { generateTryOnImage } from './services/geminiService';
import { AppStep, ImageFile } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_PERSON);
  const [personImage, setPersonImage] = useState<ImageFile | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageFile | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep = useCallback(async () => {
    if (step === AppStep.UPLOAD_PERSON && personImage) {
      setStep(AppStep.UPLOAD_CLOTHING);
    } else if (step === AppStep.UPLOAD_CLOTHING && clothingImage) {
      setStep(AppStep.PROCESSING);
      setError(null);
      
      try {
        if (!personImage || !clothingImage) throw new Error("Chýbajú obrázky");

        const resultUrl = await generateTryOnImage(
          personImage.base64,
          personImage.mimeType,
          clothingImage.base64,
          clothingImage.mimeType
        );

        setResultImage(resultUrl);
        setStep(AppStep.RESULT);
      } catch (err: any) {
        setError(err.message || "Nastala chyba pri generovaní. Skúste to prosím znova.");
        setStep(AppStep.UPLOAD_CLOTHING); // Go back to allow retry
      }
    }
  }, [step, personImage, clothingImage]);

  const handleReset = () => {
    // Keep person image, reset clothing and result for quick re-try in store
    setClothingImage(null);
    setResultImage(null);
    setError(null);
    setStep(AppStep.UPLOAD_CLOTHING);
  };

  const handleFullReset = () => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
    setStep(AppStep.UPLOAD_PERSON);
  };

  const handleBack = () => {
    if (step === AppStep.UPLOAD_CLOTHING) setStep(AppStep.UPLOAD_PERSON);
    if (step === AppStep.RESULT) setStep(AppStep.UPLOAD_CLOTHING);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between pt-safe-top">
        <div className="flex items-center gap-2">
          {(step === AppStep.UPLOAD_CLOTHING || step === AppStep.RESULT) && (
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
          )}
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent select-none">
            Virtual Style
          </h1>
        </div>
        {step === AppStep.RESULT && (
           <button onClick={handleFullReset} className="text-sm font-medium text-slate-500 hover:text-purple-600 px-2 py-1">
             Nová osoba
           </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar pb-safe-bottom">
        
        {/* Progress Indicators */}
        <div className="flex gap-2 mb-8">
          {[AppStep.UPLOAD_PERSON, AppStep.UPLOAD_CLOTHING, AppStep.RESULT].map((s, idx) => {
             const isActive = step === s || (step === AppStep.PROCESSING && s === AppStep.RESULT);
             let isPassed = false;
             if (step === AppStep.UPLOAD_CLOTHING && idx === 0) isPassed = true;
             if ((step === AppStep.PROCESSING || step === AppStep.RESULT) && idx <= 1) isPassed = true;

             return (
               <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                 isActive ? 'bg-purple-600' : isPassed ? 'bg-purple-300' : 'bg-slate-200'
               }`} />
             );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Step 1: Upload Person */}
        {step === AppStep.UPLOAD_PERSON && (
          <div className="flex flex-col gap-6 animate-fade-in">
             <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Tvoja fotka</h2>
              <p className="text-slate-500 mt-2">Nahraj fotku celej postavy z galérie alebo sa odfoť.</p>
            </div>
            <ImageUploader
              label="Fotka postavy"
              subLabel="Vyber z galérie alebo odfoť"
              icon={<UserRound className="w-10 h-10" />}
              currentImage={personImage}
              onImageSelected={setPersonImage}
              preferCamera={false} // Allow gallery access for person
            />
             <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
               💡 <strong>Tip:</strong> Použi fotku, kde stojíš rovno a máš na sebe jednoduché oblečenie.
             </div>
          </div>
        )}

        {/* Step 2: Upload Clothing */}
        {step === AppStep.UPLOAD_CLOTHING && (
          <div className="flex flex-col gap-6 animate-fade-in">
             <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Oblečenie</h2>
              <p className="text-slate-500 mt-2">Odfoť kus oblečenia v obchode.</p>
            </div>
            <ImageUploader
              label="Kus oblečenia"
              subLabel="Klikni pre spustenie fotoaparátu"
              icon={<Camera className="w-10 h-10" />}
              currentImage={clothingImage}
              onImageSelected={setClothingImage}
              preferCamera={true} // Prefer camera for clothing (shopping mode)
            />
            <div className="p-4 bg-purple-50 rounded-xl text-sm text-purple-700">
               💡 <strong>Tip:</strong> Oblečenie odfoť zavesené na vešiaku alebo položené, ideálne s dobrým svetlom.
             </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === AppStep.PROCESSING && <LoadingScreen />}

        {/* Step 4: Result */}
        {step === AppStep.RESULT && resultImage && (
          <div className="flex flex-col gap-6 animate-fade-in pb-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Výsledok</h2>
              <p className="text-slate-500 mt-2">Vyzeráš skvele!</p>
            </div>
            
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50">
              <img src={resultImage} alt="Virtual Try On Result" className="w-full h-auto" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a 
                href={resultImage} 
                download="virtual-style-result.png"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
              >
                <Download className="w-5 h-5" />
                Uložiť
              </a>
              <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white border border-transparent rounded-xl font-medium hover:bg-slate-800 active:scale-95 transition-all shadow-md shadow-purple-200"
              >
                <RotateCcw className="w-5 h-5" />
                Ďalší kúsok
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer Action Button (Sticky) */}
      {(step === AppStep.UPLOAD_PERSON || step === AppStep.UPLOAD_CLOTHING) && (
        <div className="p-6 bg-white border-t border-slate-100 sticky bottom-0 z-20 pb-8">
          <button
            onClick={handleNextStep}
            disabled={step === AppStep.UPLOAD_PERSON ? !personImage : !clothingImage}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
              ${(step === AppStep.UPLOAD_PERSON ? !personImage : !clothingImage)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-purple-200'}
            `}
          >
            {step === AppStep.UPLOAD_CLOTHING ? (
              <>Vyskúšať <Sparkles className="w-5 h-5" /></>
            ) : (
              'Pokračovať'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
