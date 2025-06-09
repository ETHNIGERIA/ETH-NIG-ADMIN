'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  eventToEdit?: {
    id?: string;
    title?: string;
    location?: string;
    date?: { seconds: number };
    description?: string;
    link?: string;
    image?: string;
  } | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSaved, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Populate form when editing an event
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setLocation(eventToEdit.location || '');
      setDescription(eventToEdit.description || '');
      setLink(eventToEdit.link || '');
      setExistingImageUrl(eventToEdit.image || '');
      if (eventToEdit.date?.seconds) {
        const d = new Date(eventToEdit.date.seconds * 1000);
        setDate(d.toISOString().split('T')[0]); // yyyy-mm-dd format
      } else {
        setDate('');
      }
      setImageFile(null);
      setError('');
    } else {
      // Reset if creating new
      resetForm();
    }
  }, [eventToEdit]);

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDate('');
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


  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!title || !location || !date) {
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


      const eventData: {
        title: string;
        location: string;
        date: Timestamp;
        description: string;
        link: string;
        image: string;
        updatedAt: Timestamp;
        createdAt?: Timestamp;
      } = {
        title,
        location,
        date: Timestamp.fromDate(new Date(date)),
        description,
        link,
        image: imageUrl,
        updatedAt: Timestamp.now(),
      };

      if (eventToEdit?.id) {
        const eventRef = doc(db, 'events', eventToEdit.id);
        await updateDoc(eventRef, eventData);
      } else {
        eventData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'events'), eventData);
      }

      resetForm();
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save event. Please try again.');
    }

    setLoading(false);
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black opacity-50 z-40"></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto mx-4 p-6 relative shadow-xl">
          {/* Close button */}
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 font-bold text-xl"
            aria-label="Close modal"
          >
            &times;
          </button>

          {/* Heading */}
          <h2 className="text-2xl font-bold mb-6">
            {eventToEdit ? 'Edit Event' : 'Create Event'}
          </h2>

          {error && <p className="mb-4 text-red-600 font-semibold">{error}</p>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1" htmlFor="title">
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
              <label className="block font-semibold mb-1" htmlFor="location">
                Location <span className="text-red-600">*</span>
              </label>
              <input
                id="location"
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" htmlFor="date">
                Date <span className="text-red-600">*</span>
              </label>
              <input
                id="date"
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" htmlFor="link">
                Link (optional)
              </label>
              <input
                id="link"
                type="url"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" htmlFor="image">
                Image               </label>
              <input
                id="image"
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
              style={{ backgroundColor: '#003D11' }}
              className="text-white px-6 py-2 rounded hover:bg-[#3C9B3E] transition disabled:opacity-50"
            >
              {loading
                ? eventToEdit
                  ? 'Saving...'
                  : 'Creating...'
                : eventToEdit
                  ? 'Save Changes'
                  : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateEventModal;
