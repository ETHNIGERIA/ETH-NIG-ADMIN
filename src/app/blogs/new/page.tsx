'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { db } from '@/firebase';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { useRouter, useSearchParams } from 'next/navigation';

const CreateBlog = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get('id'); // assuming URL like /create-blog?id=123

  // Load existing blog data if editing
  useEffect(() => {
    if (!blogId) return;

    const fetchBlog = async () => {
      try {
        const docRef = doc(db, 'blogs', blogId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setContent(data.content || '');
          setDescription(data.description || '');
          setExistingImageUrl(data.image || '');
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        setError('Failed to load blog data');
        console.error(err);
      }
    };

    fetchBlog();
  }, [blogId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.uploadResult.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      if (blogId) {
        // Edit mode: update existing blog
        const blogRef = doc(db, 'blogs', blogId);
        await updateDoc(blogRef, {
          title: title.trim(),
          content: content.trim(),
          description: description.trim(),
          updatedAt: Timestamp.now(),
          image: imageUrl,
        });
        setSuccessMsg('Blog updated successfully!');
      } else {
        // Create mode: add new blog
        await addDoc(collection(db, 'blogs'), {
          title: title.trim(),
          content: content.trim(),
          description: description.trim(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          image: imageUrl,
        });
        setSuccessMsg('Blog created successfully!');
      }

      router.push('/blogs');
    } catch (err) {
      setError('Failed to save blog. Please try again.');
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{blogId ? 'Edit Blog Post' : 'Create New Blog Post'}</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {successMsg && <p className="text-green-600 mb-4">{successMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block font-semibold mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1" htmlFor="image">
              Image
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="mt-2 max-h-32 rounded" />
            ) : existingImageUrl ? (
              <img src={existingImageUrl} alt="Blog" className="mt-2 max-h-32 rounded" />
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className="block font-semibold mb-1">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block font-semibold mb-1">
              Content (Markdown) <span className="text-red-600">*</span>
            </label>
            <MdEditor
              modelValue={content}
              onChange={setContent}
              language="en-US"
              toolbars={[
                "bold",
                "underline",
                "italic",
                "strikeThrough",
                "title",
                "sub",
                "sup",
                "quote",
                "unorderedList",
                "orderedList",
                "link",
                "code",
              ]}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : blogId ? 'Update Blog' : 'Create Blog'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CreateBlog;
