import React, { useState, useEffect } from "react";
import { Input, GradientButton, useNotification } from "@shared/core";
import { Edit2, Trash2, Eye, Shapes, X, Check, EyeOff } from "lucide-react";
import { useAttribute, Attribute } from "@shared/features/attribute";

interface AttributeHeaderProps {
    attribute: Attribute;
    onUpdated?: () => void;
    disableActions?: boolean;
}

export const AttributeHeader: React.FC<AttributeHeaderProps> = ({ attribute, onUpdated, disableActions}) => {
    const { updateAdminAttributeLabel, deleteAdminAttribute, hideAdminAttribute } = useAttribute();
    const { showConfirm } = useNotification();

    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(attribute.label);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingHide, setLoadingHide] = useState(false);

    // Đồng bộ label khi attribute thay đổi
    useEffect(() => {
        setLabel(attribute.label);
        setIsEditing(false);
    }, [attribute]);

    // ======= Handlers =======
    const saveLabel = async () => {
        if (!label.trim() || label === attribute.label) {
            setIsEditing(false);
            setLabel(attribute.label);
            return;
        }
        setLoadingEdit(true);
        try {
            await updateAdminAttributeLabel(attribute._id, { label });
            setIsEditing(false);
            if (onUpdated) onUpdated(); // reload parent
        } finally {
            setLoadingEdit(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setLabel(attribute.label);
    };

    const handleDelete = () => {
        showConfirm({
            message: "Bạn có chắc chắn muốn xóa thuộc tính và các giá trị thuộc tính này?",
            onConfirm: async () => {
                setLoadingDelete(true);
                try {
                    await deleteAdminAttribute(attribute._id);
                    onUpdated?.();
                } finally {
                    setLoadingDelete(false);
                }
            }
        });
    };

    const handleToggleStatus = () => {
        showConfirm({
            message: `Bạn có chắc chắn muốn ${attribute.isActive ? "ẩn" : "hiện"} thuộc tính và các giá trị thuộc tính này?`,
            onConfirm: async () => {
                setLoadingHide(true);
                try {
                    await hideAdminAttribute(attribute._id);
                    onUpdated?.();
                } finally {
                    setLoadingHide(false);
                }
            }
        });
    };

    return (
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2">
                <Shapes className="w-6 h-6 text-indigo-500" />
                {isEditing ? (
                <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    autoFocus
                    disabled={loadingEdit}
                />
                ) : (
                label
                )}
                <span className="absolute left-0 -bottom-1 w-80 h-[1px] bg-indigo-700 rounded-full"></span>
            </h2>
            {!disableActions && (            
                <div className="flex gap-2">
                    {isEditing ? (
                    <>
                        <GradientButton
                        label="Hủy"
                        icon={X}
                        gradient="bg-gradient-to-r from-gray-400 to-gray-500"
                        hoverGradient="hover:from-gray-300 hover:to-gray-400"
                        onClick={cancelEdit}
                        disabled={loadingEdit}
                        />
                        <GradientButton
                        label="Lưu"
                        icon={Check}
                        gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
                        hoverGradient="hover:from-blue-600 hover:to-indigo-700"
                        onClick={saveLabel}
                        disabled={loadingEdit}
                        />
                    </>
                    ) : (
                    <>
                        <GradientButton
                        label="Sửa"
                        icon={Edit2}
                        gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
                        hoverGradient="hover:from-blue-600 hover:to-indigo-800"
                        onClick={() => setIsEditing(true)}
                        />
                        <GradientButton
                        label={attribute.isActive ? "Ẩn" : "Hiện"}
                        icon={attribute.isActive ? EyeOff : Eye}
                        gradient="bg-gradient-to-r from-gray-400 to-gray-500"
                        hoverGradient="hover:from-gray-600 hover:to-gray-700"
                        onClick={handleToggleStatus}
                        disabled={loadingHide}
                        />
                        <GradientButton
                        label="Xóa"
                        icon={Trash2}
                        gradient="bg-gradient-to-r from-red-500 to-pink-600"
                        hoverGradient="hover:from-red-600 hover:to-pink-700"
                        onClick={handleDelete}
                        disabled={loadingDelete}
                        />
                    </>
                    )}
                </div>
            )}
        </div>
    );
};

// import React, { useState, useEffect } from "react";
// import { Input, GradientButton } from "@shared/core";
// import { Edit2, Trash2, Eye, Shapes, X, Check } from "lucide-react";
// import { useAttribute, Attribute } from "@shared/features/attribute";

// interface AttributeHeaderProps {
//     attribute: Attribute;
// }

// export const AttributeHeader: React.FC<AttributeHeaderProps> = ({ attribute }) => {
//     const { getAdminAttributes, updateAdminAttributeLabel, deleteAdminAttribute, hideAdminAttribute} = useAttribute();
//     const [isEditing, setIsEditing] = useState(false);
//     const [label, setLabel] = useState(attribute.label);
//     const [loadingEdit, setLoadingEdit] = useState(false);
//     const [loadingDelete, setLoadingDelete] = useState(false);
//     const [loadingHide, setLoadingHide] = useState(false);


//     // Đồng bộ label với attribute khi attribute thay đổi
//     useEffect(() => {
//         setLabel(attribute.label);
//         setIsEditing(false);
//     }, [attribute]);

//     const saveLabel = async () => {
//         if (!label.trim() || label === attribute.label) {
//         setIsEditing(false);
//         setLabel(attribute.label);
//         return;
//         }

//         setLoadingEdit(true);
//         try {
//             await updateAdminAttributeLabel(attribute._id, { label });
//             setIsEditing(false);
//         } finally {
//             setLoadingEdit(false);
//         }
//     };

//     const cancelEdit = () => {
//         setIsEditing(false);
//         setLabel(attribute.label);
//     };

//     const handleDelete = async () => {
//         setLoadingDelete(true);
//     try {
//         await deleteAdminAttribute(attribute._id);
//     } finally {
//         setLoadingDelete(false);
//     }
//     };

//     const handleToggleStatus = async () => {
//         setLoadingHide(true);
//         try {
//             await hideAdminAttribute(attribute._id);
//         } finally {
//             setLoadingHide(false);
//         }
//     };

//     return (
//         <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2">
//             <Shapes className="w-6 h-6 text-indigo-500" />
//             {isEditing ? (
//             <Input
//                 value={label}
//                 onChange={(e) => setLabel(e.target.value)}
//                 autoFocus
//                 disabled={loadingEdit}
//             />
//             ) : (
//             label
//             )}
//             <span className="absolute left-0 -bottom-1 w-80 h-[1px] bg-indigo-700 rounded-full"></span>
//         </h2>

//         <div className="flex gap-2">
//             {isEditing ? (
//             <>
//                 <GradientButton
//                 label="Hủy"
//                 icon={X}
//                 gradient="bg-gradient-to-r from-gray-400 to-gray-500"
//                 hoverGradient="hover:from-gray-300 hover:to-gray-400"
//                 onClick={cancelEdit}
//                 disabled={loadingEdit}
//                 />
//                 <GradientButton
//                 label="Lưu"
//                 icon={Check}
//                 gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
//                 hoverGradient="hover:from-blue-600 hover:to-indigo-700"
//                 onClick={saveLabel}
//                 disabled={loadingEdit}
//                 />
//             </>
//             ) : (
//             <>
//                 <GradientButton
//                 label="Ẩn"
//                 icon={Eye}
//                 gradient="bg-gradient-to-r from-gray-400 to-gray-500"
//                 hoverGradient="hover:from-gray-300 hover:to-gray-400"
//                 onClick={handleToggleStatus}
//                 disabled={loadingHide}
//                 />
//                 <GradientButton
//                 label="Sửa"
//                 icon={Edit2}
//                 gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
//                 hoverGradient="hover:from-blue-600 hover:to-indigo-700"
//                 onClick={() => setIsEditing(true)}
//                 />
//                 <GradientButton
//                 label="Xóa"
//                 icon={Trash2}
//                 gradient="bg-gradient-to-r from-red-500 to-pink-600"
//                 hoverGradient="hover:from-red-600 hover:to-pink-700"
//                 onClick={handleDelete}
//                 disabled={loadingDelete}
//                 />
//             </>
//             )}
//         </div>
//         </div>
//     );
// };
