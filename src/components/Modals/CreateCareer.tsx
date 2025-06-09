import { useEffect, useState } from 'react';
import { addDoc, collection, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

type Career = {
  id: string;
  title?: string;
  location?: string;
  type?: string;
  description?: string;
  link?: string;
  [key: string]: any;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  careerToEdit: Career | null;
};

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];

const CreateCareer = ({ isOpen, onClose, onSaved, careerToEdit }: Props) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (careerToEdit) {
      setTitle(careerToEdit.title || '');
      setLocation(careerToEdit.location || '');
      setType(careerToEdit.type || '');
      setDescription(careerToEdit.description || '');
      setLink(careerToEdit.link || '');
    } else {
      resetForm();
    }
  }, [careerToEdit]);

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setType('');
    setDescription('');
    setLink('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !location || !type) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const careerData = {
        title,
        location,
        type,
        description,
        link,
        updatedAt: Timestamp.now(),
      };

      if (careerToEdit?.id) {
        const careerRef = doc(db, 'careers', careerToEdit.id);
        await updateDoc(careerRef, careerData);
      } else {
        await addDoc(collection(db, 'careers'), {
          ...careerData,
          createdAt: Timestamp.now(),
        });
      }

      resetForm();
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving career:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black opacity-50 z-40"></div>

      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-lg p-6 max-h-[95vh] overflow-y-auto rounded shadow-lg relative">
          <h2 className="text-xl font-bold mb-4">{careerToEdit ? 'Edit Career' : 'Add Career'}</h2>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select Type</option>
                {jobTypes.map((jobType) => (
                  <option key={jobType} value={jobType}>
                    {jobType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Application Link</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="px-4 py-2 rounded border border-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#003D11] hover:bg-[#3C9B3E] text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading
                  ? careerToEdit
                    ? 'Saving...'
                    : 'Creating...'
                  : careerToEdit
                    ? 'Save Changes'
                    : 'Create Career'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>

  );
};

export default CreateCareer;
