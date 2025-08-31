import React from 'react';
import { Eye, Image as ImageIcon } from 'lucide-react';

interface ImageManagerProps {
  imageUrl?: string;
  imageFile?: File | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function ImageManager({ 
  imageUrl, 
  imageFile, 
  alt, 
  className = "w-full h-32 object-cover rounded-lg",
  fallbackIcon = <Eye className="w-8 h-8 text-white opacity-50" />
}: ImageManagerProps) {
  
      // If there's an uploaded file, create local URL
  const [localImageUrl, setLocalImageUrl] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setLocalImageUrl(url);
      
      // Cleanup function
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  // Priority: local file, then external URL, finally default image
  const displayImageUrl = localImageUrl || imageUrl;

  if (displayImageUrl) {
    return (
      <div className="relative">
        <img
          src={displayImageUrl}
          alt={alt}
          className={className}
                onError={(e) => {
        // If image loading fails, hide image and show default icon
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallbackDiv = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
            if (fallbackDiv) {
              fallbackDiv.style.display = 'flex';
            }
          }}
        />
        <div className={`fallback-icon hidden absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center ${className}`}>
          {fallbackIcon}
        </div>
      </div>
    );
  }

  // Default display
  return (
    <div className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center ${className}`}>
      {fallbackIcon}
    </div>
  );
}

// Component for displaying NFT collection images
export function NFTCollectionImage({ 
  imageUrl, 
  imageFile, 
  name, 
  className = "w-full h-32 object-cover rounded-lg" 
}: {
  imageUrl?: string;
  imageFile?: File | null;
  name: string;
  className?: string;
}) {
  return (
    <ImageManager
      imageUrl={imageUrl}
      imageFile={imageFile}
      alt={`${name} NFT Collection`}
      className={className}
      fallbackIcon={<ImageIcon className="w-8 h-8 text-white opacity-50" />}
    />
  );
}

// Component for displaying launch images
export function LaunchImage({ 
  imageUrl, 
  name, 
  className = "w-full h-32 object-cover rounded-lg" 
}: {
  imageUrl?: string;
  name: string;
  className?: string;
}) {
  return (
    <ImageManager
      imageUrl={imageUrl}
      alt={`${name} Launch`}
      className={className}
      fallbackIcon={<Eye className="w-8 h-8 text-white opacity-50" />}
    />
  );
}
