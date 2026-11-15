import { useState } from 'react';
import type { ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { images } from '@/content/media.generated';
import type { ImageId } from '@/content/media.generated';
import { cn } from '@/lib/cn';
import { Icon } from '@/lib/icon';

const src = (id: string, w: number, ext: string) => `/images/${id}-${w}.${ext}`;

/**
 * Art-directed responsive image: AVIF → WebP → JPEG, intrinsic dimensions to
 * prevent layout shift, focal-point cropping and a visible failed-media state.
 * `priority` is reserved for genuine first-viewport (LCP) images only.
 */
export function ResponsiveImage({
  id,
  sizes,
  className,
  imgClassName,
  priority = false,
  decorative = false,
  alt,
  aspect,
  fit = 'cover',
  parallax = false,
}: {
  id: ImageId;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  decorative?: boolean;
  alt?: string;
  /** CSS aspect-ratio for the frame, e.g. "4 / 5". Defaults to the image's own ratio. */
  aspect?: string;
  fit?: 'cover' | 'contain';
  /** Depth parallax inside a fixed frame (motion.css). Use on at most two or three editorial images per page. */
  parallax?: boolean;
}) {
  const img = images[id];
  const [failed, setFailed] = useState(false);
  const widths = img.widths as readonly number[];
  const largest = widths[widths.length - 1] ?? img.width;
  const set = (ext: string) => widths.map((w) => `${src(img.id, w, ext)} ${w}w`).join(', ');
  const ratio = aspect ?? `${img.width} / ${img.height}`;
  const altText = decorative ? '' : (alt ?? img.alt);

  return (
    <div className={cn('relative overflow-hidden bg-onyx-raised', className)} style={{ aspectRatio: ratio }} data-parallax-frame={parallax && !failed ? '' : undefined}>
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-platinum" role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : altText}>
          <Icon as={ImageOff} size={24} />
          <span className="t-caption">Image unavailable</span>
        </div>
      ) : (
        <MaybeLayer on={parallax}>
        <picture>
          <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
          <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
          <img
            src={src(img.id, largest, 'jpg')}
            srcSet={set('jpg')}
            sizes={sizes}
            width={img.width}
            height={img.height}
            alt={altText}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onError={() => setFailed(true)}
            className={cn('absolute inset-0 h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain', imgClassName)}
            style={{ objectPosition: `${img.focal[0] * 100}% ${img.focal[1] * 100}%` }}
          />
        </picture>
        </MaybeLayer>
      )}
    </div>
  );
}

function MaybeLayer({ on, children }: { on: boolean; children: ReactNode }) {
  return on ? <div data-parallax-layer="media">{children}</div> : <>{children}</>;
}

export function Figure({ id, caption, sizes, className, aspect }: { id: ImageId; caption?: string; sizes: string; className?: string; aspect?: string }) {
  return (
    <figure className={className}>
      <ResponsiveImage id={id} sizes={sizes} aspect={aspect} />
      {caption ? <figcaption className="t-caption text-2 mt-3 max-w-[60ch]">{caption}</figcaption> : null}
    </figure>
  );
}
