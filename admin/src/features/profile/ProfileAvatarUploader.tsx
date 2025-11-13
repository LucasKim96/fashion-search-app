"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Camera, X, Check, ZoomIn, Crop} from "lucide-react";
import { useUser } from "@shared/features/user/user.hooks";
import { UserProfile, getCroppedImg } from "@shared/core";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    profile: UserProfile;
    size?: number;
}

export const ProfileAvatarUploader: React.FC<Props> = ({ profile, size = 120 }) => {
    const { updateAvatar } = useUser();
    const [preview, setPreview] = useState<string>(profile.avatarUrl || "");
    const [showCrop, setShowCrop] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // crop state
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        setPreview(profile.avatarUrl || "");
    }, [profile.avatarUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
        const objectUrl = URL.createObjectURL(file);
        setImageSrc(objectUrl);
        setShowCrop(true);
        }
    };

    const onCropComplete = useCallback((_: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCropSave = async () => {
        if (imageSrc && profile.userId && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const file = new File([croppedBlob], "avatar.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
        });

        const croppedUrl = URL.createObjectURL(file);
        setPreview(croppedUrl);
        setShowCrop(false);
        await updateAvatar(profile.userId, file);
        }
    };

    const handleCropCancel = () => {
        setShowCrop(false);
        setImageSrc(null);
    };

    return (
        <div className="relative w-fit">
            {/* Avatar hình tròn */}
            <div
                className="group relative cursor-pointer overflow-hidden rounded-full shadow-xl transition-all duration-300"
                style={{ width: size, height: size }}
                onClick={() => setShowPreviewModal(true)}
            >
                {/* Ảnh avatar */}
                <img
                    src={preview || "/default-avatar.png"}
                    alt="Avatar"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 group-hover:brightness-110"
                />

                {/* Viền trắng mờ sang trọng */}
                <div className="absolute inset-0 rounded-full ring-2 ring-white/80 pointer-events-none" />

                {/* Hiệu ứng overlay khi hover */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 backdrop-blur-[1px] transition-all duration-500 flex items-center justify-center">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/30 shadow-inner scale-90 group-hover:scale-100 transition-all duration-300">
                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                </div>
            </div>


            {/* Icon chỉnh sửa - tách biệt click */}
            <label className="absolute bottom-1 right-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2 rounded-full cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
            </label>


            {/* Crop Modal */}
            {showCrop && imageSrc && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pt-10">
                    {/* Wrapper ngoài cho modal + title + cropper + buttons */}
                    <div className="bg-white p-4 rounded-lg relative w-[500px] h-[550px] flex flex-col">
                    
                        {/* Title */}
                        <div className="flex items-center justify-center mb-4">
                        {/* Optional Icon */}
                        <div className="mr-2">
                            <Crop className="w-6 h-6 text-blue-500 animate-bounce" />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg">
                            Crop Your Image
                        </h2>
                        </div>

                        {/* Cropper Container - Must be flex-1 to take up remaining space. */}
                        <div className="flex-1 relative"> 
                            <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}         
                            />
                        </div>

                        {/* Controls */}
                        <div className="mt-6 flex justify-center gap-6">
                            {/* Cancel Button */}
                            <button
                                onClick={handleCropCancel}
                                className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200"
                            >
                                <X className="w-5 h-5" />
                                Cancel
                            </button>

                            {/* Save Button */}
                            <button
                                onClick={handleCropSave}
                                className="flex items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200"
                            >
                                <Check className="w-5 h-5" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hiển thị ảnh */}
            <AnimatePresence>
                {showPreviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pt-20 fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
                    >
                        {/* Nền mờ + hiệu ứng ánh sáng */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="relative rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"
                        >
                            {/* Ảnh */}
                            {/* <img
                            src={preview || "/default-avatar.png"}
                            alt="Full avatar"
                            className="rounded-2xl object-contain max-w-[90vw] max-h-[80vh] transition-transform duration-500 hover:scale-[1.02]"
                            /> */}
                            <div className="relative p-[3px] rounded-3xl bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                <div className="rounded-3xl bg-black/40 backdrop-blur-sm overflow-hidden border border-white/10">
                                    <img
                                    src={preview || "/default-avatar.png"}
                                    alt="Full avatar"
                                    className="object-contain max-w-[90vw] max-h-[80vh] rounded-2xl"
                                    />
                                </div>
                            </div>

                            {/* Hiệu ứng viền phát sáng */}
                            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/30 pointer-events-none"></div>

                            {/* Nút đóng */}
                            <button
                            onClick={() => setShowPreviewModal(false)}
                            className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                            <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



        </div>
    );
};


// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { Camera, X, Check } from "lucide-react";
// import { useUser } from "@shared/features/user/user.hooks";
// import { UserProfile, getCroppedImg } from "@shared/core";
// import Cropper from "react-easy-crop";

// interface Props {
//     profile: UserProfile;
//     size?: number;
// }

// export const ProfileAvatarUploader: React.FC<Props> = ({ profile, size = 120 }) => {
//     const { updateAvatar } = useUser();
//     const [preview, setPreview] = useState<string>(profile.avatarUrl || "");
//     const [showCrop, setShowCrop] = useState(false);
//     const [imageSrc, setImageSrc] = useState<string | null>(null);

//     // crop state
//     const [crop, setCrop] = useState({ x: 0, y: 0 });
//     const [zoom, setZoom] = useState(1);
//     const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

//     useEffect(() => {
//         setPreview(profile.avatarUrl || "");
//     }, [profile.avatarUrl]);

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//         const objectUrl = URL.createObjectURL(file);
//         setImageSrc(objectUrl);
//         setShowCrop(true);
//         }
//     };

//     const onCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
//         setCroppedAreaPixels(croppedPixels);
//     }, []);

//     const handleCropSave = async () => {
//     if (imageSrc && profile.userId && croppedAreaPixels) {
//         const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
//         const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg", lastModified: Date.now() });

//         const croppedUrl = URL.createObjectURL(file);
//         setPreview(croppedUrl);
//         setShowCrop(false);

//         // gửi ảnh đã crop lên server
//         await updateAvatar(profile.userId, file);
//     }
//     };


//     const handleCropCancel = () => {
//         setShowCrop(false);
//         setImageSrc(null);
//     };

//     return (
//         <div className="relative w-fit">
//         {/* Avatar hình tròn */}
//         <img
//             src={preview || "/default-avatar.png"}
//             alt="Avatar"
//             className="rounded-full object-cover border border-gray-300"
//             style={{ width: size, height: size }}
//         />

//         {/* Icon chỉnh sửa */}
//         <label className="absolute bottom-0 right-0 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer transition">
//             <Camera className="w-4 h-4" />
//             <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
//         </label>

//         {/* Crop Modal */}
//         {showCrop && imageSrc && (
//             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//             <div className="bg-white p-4 rounded-lg relative w-[400px] h-[400px]">
//                 <Cropper
//                 image={imageSrc}
//                 crop={crop}
//                 zoom={zoom}
//                 aspect={1}
//                 cropShape="round"
//                 showGrid={false}
//                 onCropChange={setCrop}
//                 onZoomChange={setZoom}
//                 onCropComplete={onCropComplete}
//                 />
//                 {/* Controls */}
//                 <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4">
//                 <button onClick={handleCropCancel} className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded">
//                     <X className="w-4 h-4" /> Cancel
//                 </button>
//                 <button onClick={handleCropSave} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded">
//                     <Check className="w-4 h-4" /> Save
//                 </button>
//                 </div>
//             </div>
//             </div>
//         )}
//         </div>
//     );
// };

