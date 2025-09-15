import React, { forwardRef, ReactNode, useCallback, useEffect, useRef } from 'react';
import { EasingFunction } from '@/component/svg/easing-function';

interface ViewBoxObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewBoxAnimatedSvgProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  viewBox?: string;
  transitionDuration?: number;
  transitionEasing?: EasingFunction;
  children?: ReactNode;
}

export const ViewBoxAnimatedSvg = forwardRef<SVGSVGElement, ViewBoxAnimatedSvgProps>(({
  viewBox,
  transitionDuration = 500,
  transitionEasing = (t: number): number => t * (2 - t), // easeOutQuad
  children,
  ...svgProps
}, ref) => {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentViewBoxRef = useRef<ViewBoxObject | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Use the forwarded ref or the internal ref
  const svgRef = ref || internalSvgRef;

  // Parse viewBox string into object
  const parseViewBox = useCallback((viewBoxString: string): ViewBoxObject | null => {
    if (!viewBoxString) return null;
    const values = viewBoxString.split(/\s+/).map(Number);
    if (values.length !== 4 || values.some(isNaN)) return null;
    return {
      x: values[0],
      y: values[1],
      width: values[2],
      height: values[3],
    };
  }, []);

  // Convert viewBox object back to string
  const viewBoxToString = useCallback((viewBoxObj: ViewBoxObject): string => {
    return `${viewBoxObj.x} ${viewBoxObj.y} ${viewBoxObj.width} ${viewBoxObj.height}`;
  }, []);

  // Animation function
  const animateViewBox = useCallback((
    fromViewBox: ViewBoxObject,
    toViewBox: ViewBoxObject,
    duration: number = 500,
    easing: EasingFunction = (t: number) => t,
  ): void => {
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const currentViewBox: ViewBoxObject = {
        x: fromViewBox.x + (toViewBox.x - fromViewBox.x) * easedProgress,
        y: fromViewBox.y + (toViewBox.y - fromViewBox.y) * easedProgress,
        width: fromViewBox.width + (toViewBox.width - fromViewBox.width) * easedProgress,
        height: fromViewBox.height + (toViewBox.height - fromViewBox.height) * easedProgress,
      };

      if (svgRef && 'current' in svgRef && svgRef.current) {
        svgRef.current.setAttribute('viewBox', viewBoxToString(currentViewBox));
      }

      currentViewBoxRef.current = currentViewBox;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [svgRef, viewBoxToString]);

  // Effect to handle viewBox changes
  useEffect(() => {
    if (!viewBox) return;

    const newViewBox = parseViewBox(viewBox);
    if (!newViewBox) return;

    // Initialize without animation on first render
    if (!isInitializedRef.current) {
      currentViewBoxRef.current = newViewBox;
      if (svgRef && 'current' in svgRef && svgRef.current) {
        svgRef.current.setAttribute('viewBox', viewBox);
      }
      isInitializedRef.current = true;
      return;
    }

    const currentViewBox = currentViewBoxRef.current;
    if (!currentViewBox) {
      currentViewBoxRef.current = newViewBox;
      if (svgRef && 'current' in svgRef && svgRef.current) {
        svgRef.current.setAttribute('viewBox', viewBox);
      }
      return;
    }

    // Check if viewBox actually changed
    const hasChanged =
      Math.abs(currentViewBox.x - newViewBox.x) > 0.01 ||
      Math.abs(currentViewBox.y - newViewBox.y) > 0.01 ||
      Math.abs(currentViewBox.width - newViewBox.width) > 0.01 ||
      Math.abs(currentViewBox.height - newViewBox.height) > 0.01;

    if (hasChanged) {
      animateViewBox(currentViewBox, newViewBox, transitionDuration, transitionEasing);
    }
  }, [viewBox, parseViewBox, animateViewBox, transitionDuration, transitionEasing, svgRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      {...svgProps}
      // Don't set viewBox directly - we handle it in the animation
    >
      {children}
    </svg>
  );
});
ViewBoxAnimatedSvg.displayName = 'ViewBoxAnimatedSvg';
