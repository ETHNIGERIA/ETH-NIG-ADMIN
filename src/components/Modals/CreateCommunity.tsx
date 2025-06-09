'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  communityToEdit?: {
    id?: string;
    name?: string;
    location?: string;
    description?: string;
    link?: string;
    image?: string;
  } | null;
}

const CreateEditCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  communityToEdit
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (communityToEdit) {
      setName(communityToEdit.name || '');
      setLocation(communityToEdit.location || '');
      setDescription(communityToEdit.description || '');
      setLink(communityToEdit.link || '');
      setExistingImageUrl(communityToEdit.image || '');
      setImageFile(null);
      setError('');
    } else {
      resetForm();
    }
  }, [communityToEdit]);

  const resetForm = () => {
    setName('');
    setLocation('');
    setDescription('');
    setLink('');
    setImageFile(null);
    setExistingImageUrl('');
    setError('');
  };

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
    return data.uploadResult.secure_url; // Use this URL in your Firestore event data
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = existingImageUrl;


      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const communityData: {
        name: string;
        location: string;
        description: string;
        link: string;
        image: string;
        updatedAt: Timestamp;
        createdAt?: Timestamp;
      } = {
        name,
        location,
        description,
        link,
        image: imageUrl,
        updatedAt: Timestamp.now(),
      };

      if (communityToEdit?.id) {
        const refToUpdate = doc(db, 'communities', communityToEdit.id);
        await updateDoc(refToUpdate, communityData);
      } else {
        communityData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'communities'), communityData);
      }

      resetForm();
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save community. Please try again.');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black opacity-50 z-40"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto mx-4 p-6 relative shadow-xl">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
          >
            &times;
          </button>

          <h2 className="text-2xl font-bold mb-6">
            {communityToEdit ? 'Edit Community' : 'Create Community'}
          </h2>

          {error && <p className="mb-4 text-red-600 font-semibold">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Name <span className="text-red-600">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Location <span className="text-red-600">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Link (optional)</label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="mt-2 max-h-32 rounded" />
              ) : existingImageUrl ? (
                <img src={existingImageUrl} alt="Event" className="mt-2 max-h-32 rounded" />
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-6 py-2 rounded transition disabled:opacity-50"
            >
              {loading
                ? communityToEdit
                  ? 'Saving...'
                  : 'Creating...'
                : communityToEdit
                  ? 'Save Changes'
                  : 'Create Community'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateEditCommunityModal;
