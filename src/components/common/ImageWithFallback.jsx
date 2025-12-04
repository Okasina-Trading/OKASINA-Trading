import React, { useState, useEffect } from 'react';
import { logger } from '../../services/logger';

const ImageWithFallback = ({
    src,
    alt,
    className = '',
    fallbackSrc = 'https://via.placeholder.com/400x300?text=Image+Unavailable',
    ...props
}) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
        setRetryCount(0);
    }, [src]);

    const handleError = () => {
        if (retryCount < 1) {
            // Retry once with same URL (sometimes transient network issues)
            logger.warn('Image load failed, retrying...', { src });
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
                setImgSrc(`${src}?retry=${Date.now()}`); // Force reload
            }, 1000);
        } else {
            // Fallback
            if (!hasError) {
                logger.error('Image load permanently failed, using fallback', { src });
                setHasError(true);
                setImgSrc(fallbackSrc);
            }
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={`${className} ${hasError ? 'opacity-80 grayscale' : ''}`}
            onError={handleError}
            {...props}
        />
    );
};

export default ImageWithFallback;
