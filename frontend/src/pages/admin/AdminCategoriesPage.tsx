import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FolderTree } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import type { Category } from '../../types';

import { fetchJsonSafely, getMockCategories } from '../../utils/api';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => getMockCategories());
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetchJsonSafely('/api/categories');
      if (res.ok && Array.isArray(res.data?.categories) && res.data.categories.length > 0) {
        setCategories(prev => JSON.stringify(prev) === JSON.stringify(res.data.categories) ? prev : res.data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetchJsonSafely('/api/categories/admin', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });

      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      } else {
        alert(res.data?.error || 'Failed to create category.');
      }
    } catch (err) {
      alert('Error creating category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetchJsonSafely(`/api/categories/admin/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCategories();
      } else {
        alert(res.data?.error || 'Failed to delete category.');
      }
    } catch (err) {
      alert('Error deleting category.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <FolderTree className="w-3.5 h-3.5 text-primary" />
            <span>Taxonomy Management</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">
            Category Management
          </h1>
          <p className="text-xs text-[#52606D] mt-0.5">
            Configure domains and thematic categories used for classifying alumni achievements.
          </p>
        </div>

        {/* Create Category Form */}
        <div className="bg-[#FFFFFF] rounded-md p-5 sm:p-6 shadow-2xs border border-[#D9DDE1] space-y-3.5">
          <h3 className="text-xs font-bold text-[#172B3A] uppercase tracking-wider">
            Add New Domain / Category
          </h3>
          <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Category Name (e.g. Clean Tech)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#FFFFFF] rounded-md p-4 border border-[#D9DDE1] shadow-2xs flex items-start justify-between gap-2 hover:border-[#CBD5E1] transition-colors"
            >
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {cat.name}
                </h4>
                {cat.description && (
                  <p className="text-xs text-[#52606D] mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-[#7A8793] hover:text-[#DC2626] p-1 cursor-pointer rounded hover:bg-[#FEF2F2] transition-colors shrink-0"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

