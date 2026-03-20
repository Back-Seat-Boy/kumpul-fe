import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/Button";

export const ProofUploader = ({ onUpload, isUploading }) => {
  const [preview, setPreview] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      setPreview(result);
      // Remove data:image/... prefix
      const base64 = result.split(",")[1];
      setBase64Image(base64);
    };
  };

  const handleClear = () => {
    setPreview(null);
    setBase64Image(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!base64Image) return;
    await onUpload(base64Image);
    handleClear();
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload payment proof</p>
            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {preview && (
        <Button
          onClick={handleUpload}
          loading={isUploading}
          className="w-full"
        >
          <Upload className="w-4 h-4" />
          Submit Payment Proof
        </Button>
      )}
    </div>
  );
};

export default ProofUploader;
