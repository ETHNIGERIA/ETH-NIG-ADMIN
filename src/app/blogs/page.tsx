'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Pencil, Trash2 } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import Loader from '@/components/Loader';

interface Blog {
  id: string;
  title: string;
  content: string;
  description: string;
  image?: string;
  createdAt?: { seconds: number };
}

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBlogs = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'blogs'));
    const blogData: Blog[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Blog[];
    setBlogs(blogData);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this blog?')) {
      await deleteDoc(doc(db, 'blogs', id));
      fetchBlogs(); // Refresh after delete
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <div className='flex justify-between'>
          <h1 className="text-2xl font-bold mb-6">Blog Posts</h1>
          <button
            onClick={() => router.push('/blogs/new')}
            className="bg-[#003D11] text-white px-4 py-2 rounded hover:bg-[#3C9B3E] transition"
          >
            Create Blog
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-xl shadow p-4 flex flex-col relative">
                {blog.image && (
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="h-40 w-full object-cover rounded mb-3"
                  />
                )}
                <h2 className="text-lg font-bold mb-2">{blog.title}</h2>
                <p className="text-sm text-gray-600 line-clamp-3">{blog.description}</p>

                <div className="absolute top-3 right-3 flex space-x-2">
                  <button onClick={() => router.push(`/blogs/new?id=${blog.id}`)} className="text-blue-500 hover:text-blue-700">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BlogsPage;
