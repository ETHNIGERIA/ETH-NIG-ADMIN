'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  eventToEdit?: {
    id?: string;
    title?: string;
    location?: string;
    date?: { seconds: number };
    endDate?: { seconds: number };
    description?: string;
    link?: string;
    image?: string;
    isPayable?: boolean;
    price?: number | null;
    currency?: string;
    paymentDescription?: string;
    paymentBenefits?: string[];
  } | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSaved, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPayable, setIsPayable] = useState(false);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentBenefitsText, setPaymentBenefitsText] = useState('');

  // Populate form when editing an event
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setLocation(eventToEdit.location || '');
      setDescription(eventToEdit.description || '');
      setLink(eventToEdit.link || '');
      setExistingImageUrl(eventToEdit.image || '');
      setIsPayable(Boolean(eventToEdit.isPayable));
      setPrice(eventToEdit.price != null ? String(eventToEdit.price) : '');
      setCurrency(eventToEdit.currency || 'NGN');
      setPaymentDescription(eventToEdit.paymentDescription || '');
      setPaymentBenefitsText((eventToEdit.paymentBenefits || []).join('\n'));
      if (eventToEdit.date?.seconds) {
        const d = new Date(eventToEdit.date.seconds * 1000);
        setDate(d.toISOString().split('T')[0]); // yyyy-mm-dd format
      } else {
        setDate('');
      }
      if (eventToEdit.endDate?.seconds) {
        const d = new Date(eventToEdit.endDate.seconds * 1000);
        setEndDate(d.toISOString().split('T')[0]);
      } else {
        setEndDate('');
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
    setEndDate('');
    setDescription('');
    setLink('');
    setImageFile(null);
    setExistingImageUrl('');
    setError('');
    setIsPayable(false);
    setPrice('');
    setCurrency('NGN');
    setPaymentDescription('');
    setPaymentBenefitsText('');
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

    if (isPayable) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setError('Please enter a valid price for a payable event.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }


      const parsedPrice = Number(price);
      const paymentBenefits = paymentBenefitsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const eventData: {
        title: string;
        location: string;
        date: Timestamp;
        endDate?: Timestamp;
        description: string;
        link: string;
        image: string;
        isPayable: boolean;
        price: number | null;
        currency: string;
        paymentDescription: string;
        paymentBenefits: string[];
        updatedAt: Timestamp;
        createdAt?: Timestamp;
      } = {
        title,
        location,
        date: Timestamp.fromDate(new Date(date)),
        description,
        link,
        image: imageUrl,
        isPayable,
        price: isPayable ? parsedPrice : null,
        currency: isPayable ? currency : 'NGN',
        paymentDescription: isPayable ? paymentDescription : '',
        paymentBenefits: isPayable ? paymentBenefits : [],
        updatedAt: Timestamp.now(),
      };

      if (endDate) {
        eventData.endDate = Timestamp.fromDate(new Date(endDate));
      }

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
              <label className="block font-semibold mb-1" htmlFor="endDate">
                End Date (Optional)
              </label>
              <input
                id="endDate"
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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

            <div className="rounded-md border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold" htmlFor="isPayable">
                  Payable Event
                </label>
                <input
                  id="isPayable"
                  type="checkbox"
                  checked={isPayable}
                  onChange={(e) => setIsPayable(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              {isPayable && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1" htmlFor="price">
                        Amount <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required={isPayable}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1" htmlFor="currency">
                        Currency
                      </label>
                      <select
                        id="currency"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1" htmlFor="paymentDescription">
                      What they get
                    </label>
                    <textarea
                      id="paymentDescription"
                      rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Example: Full conference access, workshop pass, and community dinner"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1" htmlFor="paymentBenefits">
                      Benefits (one per line)
                    </label>
                    <textarea
                      id="paymentBenefits"
                      rows={4}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder={'VIP badge\nLunch included\nAccess to recordings'}
                      value={paymentBenefitsText}
                      onChange={(e) => setPaymentBenefitsText(e.target.value)}
                    />
                  </div>
                </>
              )}
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
