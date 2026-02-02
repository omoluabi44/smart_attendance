"use client";

import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import axios from "axios";
import {toast} from "react-toastify";
import {ClipLoader} from "react-spinners";
import {montserrat} from "@/app/ui/fonts";
import CPLogo from "../CPLogo";
import {PhotoIcon, XMarkIcon} from "@heroicons/react/24/outline";

export default function FaceCardUpload() {
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [spinner, setSpinner] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
      const userId = searchParams.get("id");


    const API_URL = "https://face.coursepass.app/api/v1/";

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Check if total images (existing + new) exceed 5
        if (images.length + files.length > 5) {
            toast.warning("You can only upload a maximum of 5 face cards.");
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        // Generate previews
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setImages(updatedImages);
        setPreviews(updatedPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (images.length < 5) {
            toast.error("Please upload exactly 5 face cards.");
            return;
        }

        setSpinner(true);
        const formData = new FormData();

        // Append images to formData
        images.forEach((image) => {
            formData.append("images", image);
        });

        // Append userId if required by your backend
        if (userId) formData.append("user_id", userId);

        try {
            const response = await axios.post(`${API_URL}register-faces`, formData, {
                headers: {"Content-Type": "multipart/form-data"},
            });

            toast.success(response.data?.message || "Face cards uploaded successfully!");
            router.push("/dashboard"); // Redirect to next logical step
        } catch (error) {
            console.log(error.response?.data?.error);
            
            toast.error(error.response?.data?.error || "Upload failed. Please try again.");
        } finally {
            setSpinner(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                <div className="flex justify-center mb-6">
                    <CPLogo />
                </div>

                <div className="text-center mb-8">
                    <h2 className={`${montserrat.className} text-2xl font-bold`}>Face Verification</h2>
                    <p className="text-sm text-gray-600 mt-2">
                        Please upload 5 clear photos of your face for registration.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Upload Area */}
                    <div className="grid grid-cols-3 gap-3">
                        {previews.map((src, index) => (
                            <div key={index} className="relative h-24 w-full border rounded-lg overflow-hidden bg-gray-100">
                                <img src={src} alt="preview" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}

                        {images.length < 5 && (
                            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                                <span className="text-[10px] text-gray-500 mt-1">Add Photo</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            {images.length} of 5 photos uploaded
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={spinner || images.length !== 5}
                        className={`w-full rounded-lg py-3 text-sm font-medium text-white transition flex justify-center items-center gap-2 ${spinner || images.length !== 5
                                ? "bg-blue-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {spinner && <ClipLoader color="#fff" size={16} />}
                        {spinner ? "Uploading..." : "Register Faces"}
                    </button>
                </form>
            </div>
        </div>
    );
}