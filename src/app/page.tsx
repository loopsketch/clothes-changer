"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

type UploadedImage = {
  url: string;
  base64: string;
  mimeType: string;
};

type UploadAreaProps = {
  label: string;
  icon: string;
  image: UploadedImage | null;
  onImageSelect: (image: UploadedImage) => void;
  onImageRemove: () => void;
};

function UploadArea({ label, icon, image, onImageSelect, onImageRemove }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      onImageSelect({ url: dataUrl, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
        <span className="text-lg">{icon}</span>
        {label}
      </p>
      <div
        className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => !image && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {image ? (
          <>
            <Image
              src={image.url}
              alt={label}
              fill
              className="object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove();
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white text-sm z-10 active:bg-black/80"
              aria-label="画像を削除"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-4xl">{icon}</span>
            <span className="text-sm">タップして選択</span>
            <span className="text-xs text-gray-300">またはドロップ</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {!image && (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-2 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-xl active:bg-indigo-100 transition-colors"
        >
          画像を選択する
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [clothingImage, setClothingImage] = useState<UploadedImage | null>(null);
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = clothingImage && personImage && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clothingImage: clothingImage.base64,
          personImage: personImage.base64,
          clothingMimeType: clothingImage.mimeType,
          personMimeType: personImage.mimeType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setResult(data.result);
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setClothingImage(null);
    setPersonImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-md mx-auto px-4 pb-12">
        {/* ヘッダー */}
        <div className="pt-12 pb-8 text-center">
          <div className="text-5xl mb-3">👗</div>
          <h1 className="text-2xl font-bold text-gray-800">着せ替えAI</h1>
          <p className="mt-1 text-sm text-gray-500">
            服と人物の画像をアップロードして<br />コーディネートを分析します
          </p>
        </div>

        {/* アップロードエリア */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <UploadArea
              label="服の画像"
              icon="👕"
              image={clothingImage}
              onImageSelect={setClothingImage}
              onImageRemove={() => setClothingImage(null)}
            />
            <UploadArea
              label="人物の画像"
              icon="🧑"
              image={personImage}
              onImageSelect={setPersonImage}
              onImageRemove={() => setPersonImage(null)}
            />
          </div>

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`mt-5 w-full py-4 rounded-2xl font-semibold text-base transition-all ${
              canSubmit
                ? "bg-indigo-600 text-white active:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AIが分析中...
              </span>
            ) : (
              "コーディネートを分析する ✨"
            )}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <p className="text-sm text-red-600 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>✨</span>
              AIのコーディネート分析
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
            <button
              onClick={handleReset}
              className="mt-5 w-full py-3 rounded-2xl font-medium text-sm text-indigo-600 bg-indigo-50 active:bg-indigo-100 transition-colors"
            >
              もう一度試す
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
