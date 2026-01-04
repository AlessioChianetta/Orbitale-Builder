
import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { ComponentSkeleton } from '@/components/ui/component-skeleton';

interface LazyComponentProps {
  children: ReactNode;
  skeletonType?: 'hero' | 'features' | 'testimonials' | 'default';
  rootMargin?: string;
  className?: string;
}

export function LazyComponent({ 
  children, 
  skeletonType = 'default',
  rootMargin = '200px',
  className = ''
}: LazyComponentProps) {
  const { elementRef, hasLoaded } = useIntersectionObserver({
    rootMargin,
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div ref={elementRef} className={className}>
      {hasLoaded ? children : <ComponentSkeleton type={skeletonType} />}
    </div>
  );
}
