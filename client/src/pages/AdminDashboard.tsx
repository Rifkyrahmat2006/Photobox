import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { Template } from '../types';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/templates/${id}`);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button
                    onClick={() => navigate('/admin/upload')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Upload New Template
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Existing Templates</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : templates.length === 0 ? (
                    <p className="text-gray-500">No templates found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div key={template.id} className="border rounded-lg p-4">
                                <img
                                    src={`http://localhost:5000/${template.image_path}`}
                                    alt={template.name}
                                    className="w-full h-48 object-contain bg-gray-200 mb-4 rounded"
                                />
                                <h3 className="font-bold text-lg">{template.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">Layout: {template.layout_type}</p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/edit/${template.id}`)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
