"use client";

import { useState, useEffect } from 'react';

interface AuthenticatedImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Image component that includes JWT token for authenticated image requests
 * Converts S3 URLs to API proxy URLs and adds authentication
 */
export function AuthenticatedImage({ src, alt, className, fallback }: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Convert S3 URL to API proxy URL if needed
        let imageUrl = src;
        if (src.includes('idrivee2.com') || src.includes('amazonaws.com')) {
          // Extract the S3 key from the URL
          // Example: https://s3.ap-southeast-1.idrivee2.com/primecare-riders-2025/riders/filename.jpg
          const url = new URL(src);
          const pathParts = url.pathname.split('/');
          // Remove empty first element and bucket name: ['', 'bucket', 'riders', 'filename.jpg']
          const keyParts = pathParts.slice(2); // ['riders', 'filename.jpg']

          if (keyParts.length >= 2) {
            const folder = keyParts[0];
            const filename = keyParts.slice(1).join('/');
            // Use API proxy URL
            imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/images/${folder}/${filename}`;
          }
        }

        // Get JWT token from localStorage (hospital dashboard uses 'auth_token')
        const token = localStorage.getItem('auth_token');

        if (!token) {
          console.warn('No auth token found for authenticated image');
          setError(true);
          setLoading(false);
          return;
        }

        // Fetch image with authentication
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        // Convert response to blob and create object URL
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setLoading(false);

      } catch (err) {
        console.error('Error loading authenticated image:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup object URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`${className} animate-pulse bg-gray-200`}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return fallback ? <>{fallback}</> : (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">No image</span>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}
