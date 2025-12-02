import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import type { Template } from '../types';

const Photobooth: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [imgDimensions, setImgDimensions] = useState<{ width: number, height: number } | null>(null);
    const [videoStyle, setVideoStyle] = useState<React.CSSProperties | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    useEffect(() => {
        if (stream && videoRef.current) {
            console.log("Attaching stream to video element");
            videoRef.current.srcObject = stream;
        }
    }, [stream, videoStyle]);

    const startCamera = async () => {
        try {
            console.log("Starting camera...");
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log("Camera started, stream:", mediaStream);
            setStream(mediaStream);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleSelectTemplate = (template: Template) => {
        console.log("Selected template:", template);
        setSelectedTemplate(template);
        startCamera();
    };

    const handleBack = () => {
        stopCamera();
        setSelectedTemplate(null);
        setCapturedImage(null);
        setVideoStyle(null);
        setImgDimensions(null);
    };

    const drawVideoCover = (ctx: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, w: number, h: number) => {
        const videoRatio = video.videoWidth / video.videoHeight;
        const rectRatio = w / h;

        let sx, sy, sw, sh;

        if (rectRatio > videoRatio) {
            sw = video.videoWidth;
            sh = video.videoWidth / rectRatio;
            sx = 0;
            sy = (video.videoHeight - sh) / 2;
        } else {
            sh = video.videoHeight;
            sw = video.videoHeight * rectRatio;
            sy = 0;
            sx = (video.videoWidth - sw) / 2;
        }

        ctx.save();
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
        ctx.restore();
    };

    const handleCapture = async () => {
        if (!videoRef.current || !selectedTemplate || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const templateImg = new Image();
        templateImg.crossOrigin = "anonymous";
        templateImg.src = `http://localhost:5000/${selectedTemplate.image_path}`;

        templateImg.onload = () => {
            canvas.width = templateImg.width;
            canvas.height = templateImg.height;

            let config = selectedTemplate.config_json;
            if (typeof config === 'string') config = JSON.parse(config);

            if (config.slots) {
                config.slots.forEach((slot: any) => {
                    drawVideoCover(ctx, video, slot.x, slot.y, slot.width, slot.height);
                });
            }

            ctx.drawImage(templateImg, 0, 0);

            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            stopCamera();
        };
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleDownload = () => {
        if (capturedImage) {
            const link = document.createElement('a');
            link.href = capturedImage;
            link.download = `photobox-${Date.now()}.png`;
            link.click();
        }
    };

    if (!selectedTemplate) {
        return (
            <div className="min-h-screen bg-gray-900 p-8 text-white relative">
                <Link to="/admin" className="absolute top-4 right-4 text-gray-500 hover:text-white text-sm">
                    Admin
                </Link>
                <h1 className="text-4xl font-bold mb-8 text-center">Select a Frame</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className="cursor-pointer border border-gray-700 rounded-lg p-2 hover:border-blue-500 transition"
                        >
                            <img
                                src={`http://localhost:5000/${template.image_path}`}
                                alt={template.name}
                                className="w-full h-auto object-contain bg-gray-800 rounded"
                            />
                            <p className="text-center mt-2 font-semibold">{template.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            {capturedImage ? (
                <div className="flex flex-col items-center">
                    <img src={capturedImage} alt="Captured" className="max-h-[80vh] border-4 border-white shadow-lg" />
                    <div className="mt-6 flex gap-4">
                        <button
                            onClick={handleRetake}
                            className="bg-yellow-600 text-white px-6 py-3 rounded-full font-bold hover:bg-yellow-700"
                        >
                            Retake
                        </button>
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700"
                        >
                            Download
                        </button>
                        <button
                            onClick={handleBack}
                            className="bg-gray-600 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-700"
                        >
                            Back to Menu
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative inline-block">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute object-cover z-10"
                        style={{
                            transform: 'scaleX(-1)',
                            ...(videoStyle || { left: 0, top: 0, width: '100%', height: '100%' })
                        }}
                        onLoadedMetadata={() => {
                            console.log("Video metadata loaded, attempting to play");
                            videoRef.current?.play().catch(e => console.error("Play error:", e));
                        }}
                    />

                    <img
                        src={`http://localhost:5000/${selectedTemplate.image_path}`}
                        className="relative block max-h-[80vh] w-auto z-20 pointer-events-none"
                        alt="Frame Overlay"
                        onLoad={(e) => {
                            const img = e.currentTarget;
                            console.log("Image loaded", img.naturalWidth, img.naturalHeight);
                            setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });

                            let config = selectedTemplate.config_json;
                            if (typeof config === 'string') config = JSON.parse(config);
                            console.log("Template Config:", JSON.stringify(config));

                            if (config.slots && config.slots.length > 0) {
                                const slot = config.slots[0];
                                const left = (slot.x / img.naturalWidth) * 100;
                                const top = (slot.y / img.naturalHeight) * 100;
                                const width = (slot.width / img.naturalWidth) * 100;
                                const height = (slot.height / img.naturalHeight) * 100;

                                const style = {
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    width: `${width}%`,
                                    height: `${height}%`
                                };
                                console.log("Calculated Video Style:", JSON.stringify(style));
                                setVideoStyle(style);
                            } else {
                                console.log("No slots found, defaulting to full size");
                                setVideoStyle({ left: '0%', top: '0%', width: '100%', height: '100%' });
                            }
                        }}
                    />

                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex gap-4 w-full justify-center">
                        <button
                            onClick={handleBack}
                            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCapture}
                            className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-gray-200"
                        >
                            Capture
                        </button>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}
        </div>
    );
};

export default Photobooth;
