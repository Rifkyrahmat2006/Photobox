import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas, Rect, Image as FabricImage } from 'fabric';
import axios from 'axios';

const EditTemplate: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
    const [slotRect, setSlotRect] = useState<Rect | null>(null);
    const navigate = useNavigate();
    const fabricRef = useRef<Canvas | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (canvasRef.current && !fabricRef.current) {
            const canvas = new Canvas(canvasRef.current, {
                width: 500,
                height: 500,
                backgroundColor: '#f0f0f0'
            });
            fabricRef.current = canvas;
            setFabricCanvas(canvas);
        }

        return () => {
            if (fabricRef.current) {
                fabricRef.current.dispose();
                fabricRef.current = null;
                setFabricCanvas(null);
            }
        }
    }, []);

    useEffect(() => {
        if (id && fabricCanvas) {
            fetchTemplate();
        }
    }, [id, fabricCanvas]);

    const fetchTemplate = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/templates/${id}`);
            const template = response.data;
            setName(template.name);

            // Load image
            const imgUrl = `http://localhost:5000/${template.image_path}`;
            const imgInstance = await FabricImage.fromURL(imgUrl);

            if (fabricCanvas) {
                fabricCanvas.setDimensions({ width: imgInstance.width, height: imgInstance.height });
                fabricCanvas.backgroundImage = imgInstance;
                fabricCanvas.requestRenderAll();

                // Load slot
                let config = template.config_json;
                if (typeof config === 'string') config = JSON.parse(config);

                if (config.slots && config.slots.length > 0) {
                    const slot = config.slots[0];
                    const rect = new Rect({
                        left: slot.x,
                        top: slot.y,
                        width: slot.width,
                        height: slot.height,
                        fill: 'rgba(0,0,0,0.3)',
                        stroke: 'red',
                        strokeWidth: 2,
                        transparentCorners: false,
                        cornerColor: 'blue',
                        cornerStrokeColor: 'blue',
                        borderColor: 'red',
                        cornerSize: 12,
                        padding: 10,
                        cornerStyle: 'circle',
                        borderDashArray: [3, 3]
                    });
                    fabricCanvas.add(rect);
                    fabricCanvas.setActiveObject(rect);
                    setSlotRect(rect);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching template:', error);
            alert('Failed to load template');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);

            const reader = new FileReader();
            reader.onload = async (event) => {
                if (event.target?.result && fabricCanvas) {
                    const imgObj = new Image();
                    imgObj.src = event.target.result as string;
                    imgObj.onload = async () => {
                        const imgInstance = await FabricImage.fromURL(imgObj.src);

                        fabricCanvas.setDimensions({ width: imgObj.width, height: imgObj.height });
                        fabricCanvas.backgroundImage = imgInstance;
                        fabricCanvas.requestRenderAll();

                        // Keep existing slot if possible, or reset if needed. 
                        // For now, we keep the slot rect on screen so user can adjust it to new image.
                        if (slotRect) {
                            fabricCanvas.bringObjectToFront(slotRect);
                        }
                    }
                }
            };
            reader.readAsDataURL(f);
        }
    };

    const handleSubmit = async () => {
        if (!name || !slotRect) {
            alert('Please fill name and define a slot.');
            return;
        }

        const { left, top, width, height, scaleX, scaleY } = slotRect;

        const finalX = left;
        const finalY = top;
        const finalW = width * scaleX;
        const finalH = height * scaleY;

        const config = {
            slots: [
                { x: finalX, y: finalY, width: finalW, height: finalH }
            ]
        };

        const formData = new FormData();
        formData.append('name', name);
        if (file) {
            formData.append('file', file);
        }
        formData.append('config_json', JSON.stringify(config));
        formData.append('layout_type', 'single');

        try {
            await axios.put(`http://localhost:5000/api/admin/templates/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Template updated successfully!');
            navigate('/admin');
        } catch (error) {
            console.error(error);
            alert('Update failed.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6">Edit Template</h1>
            <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Template Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Change Frame Image (Optional)</label>
                    <input
                        type="file"
                        accept="image/png"
                        onChange={handleFileChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Adjust Photo Slot</label>
                    <p className="text-sm text-gray-500 mb-2">Drag and resize the red box to define where the user's photo will appear.</p>
                    <div className="border overflow-auto">
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Update Template
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditTemplate;
