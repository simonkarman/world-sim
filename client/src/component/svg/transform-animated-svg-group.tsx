import React, { forwardRef, ReactNode, useCallback, useEffect, useRef } from 'react';
import { EasingFunction } from '@/component/svg/easing-function';

interface Matrix2D {
  a: number; // scaleX * cos(rotation) - skewY * sin(rotation)
  b: number; // scaleX * sin(rotation) + skewY * cos(rotation)
  c: number; // -scaleY * sin(rotation) + skewX * cos(rotation)
  d: number; // scaleY * cos(rotation) + skewX * sin(rotation)
  e: number; // translateX
  f: number; // translateY
}

interface DecomposedTransform {
  translateX: number;
  translateY: number;
  rotation: number; // in radians
  scaleX: number;
  scaleY: number;
}

export interface TransformAnimatedSvgGroupProps extends Omit<React.SVGProps<SVGGElement>, 'ref'> {
  transform?: string;
  transitionDuration?: number;
  transitionEasing?: EasingFunction;
  children?: ReactNode;
}

export const TransformAnimatedSvgGroup = forwardRef<SVGGElement, TransformAnimatedSvgGroupProps>(({
  transform = '',
  transitionDuration = 500,
  transitionEasing = (t: number): number => t * (2 - t), // easeOutQuad
  children,
  ...groupProps
}, ref) => {
  const internalGroupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentTransformRef = useRef<DecomposedTransform | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Use the forwarded ref or the internal ref
  const groupRef = ref || internalGroupRef;

  // Create identity matrix
  const createIdentityMatrix = useCallback((): Matrix2D => ({
    a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
  }), []);

  // Multiply two matrices
  const multiplyMatrices = useCallback((m1: Matrix2D, m2: Matrix2D): Matrix2D => ({
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  }), []);

  // Parse transform string and convert to matrix
  const parseTransformToMatrix = useCallback((transformString: string): Matrix2D => {
    let matrix = createIdentityMatrix();

    if (!transformString.trim()) return matrix;

    // Parse all transform functions in order
    const transformRegex = /(translate|translateX|translateY|scale|scaleX|scaleY|rotate|skewX|skewY|matrix)\s*\(\s*([^)]*)\s*\)/g;
    let match;

    while ((match = transformRegex.exec(transformString)) !== null) {
      const [, func, args] = match;
      const values = args.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

      let transformMatrix = createIdentityMatrix();

      switch (func) {
        case 'translate':
          transformMatrix.e = values[0] || 0;
          transformMatrix.f = values[1] || 0;
          break;
        case 'translateX':
          transformMatrix.e = values[0] || 0;
          break;
        case 'translateY':
          transformMatrix.f = values[0] || 0;
          break;
        case 'scale':
          transformMatrix.a = values[0] || 1;
          transformMatrix.d = values.length > 1 ? values[1] : (values[0] || 1);
          break;
        case 'scaleX':
          transformMatrix.a = values[0] || 1;
          break;
        case 'scaleY':
          transformMatrix.d = values[0] || 1;
          break;
        case 'rotate':
          if (values.length >= 1) {
            const angle = (values[0] * Math.PI) / 180; // Convert to radians
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            if (values.length >= 3) {
              // rotate(angle, cx, cy) = translate(cx, cy) rotate(angle) translate(-cx, -cy)
              const cx = values[1];
              const cy = values[2];

              // Create compound transform: translate(cx, cy) * rotate(angle) * translate(-cx, -cy)
              const t1: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
              const r: Matrix2D = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
              const t2: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };

              transformMatrix = multiplyMatrices(multiplyMatrices(t1, r), t2);
            } else {
              // Simple rotation around origin
              transformMatrix.a = cos;
              transformMatrix.b = sin;
              transformMatrix.c = -sin;
              transformMatrix.d = cos;
            }
          }
          break;
        case 'skewX':
          if (values.length >= 1) {
            const angle = (values[0] * Math.PI) / 180;
            transformMatrix.c = Math.tan(angle);
          }
          break;
        case 'skewY':
          if (values.length >= 1) {
            const angle = (values[0] * Math.PI) / 180;
            transformMatrix.b = Math.tan(angle);
          }
          break;
        case 'matrix':
          if (values.length >= 6) {
            transformMatrix = {
              a: values[0],
              b: values[1],
              c: values[2],
              d: values[3],
              e: values[4],
              f: values[5],
            };
          }
          break;
      }

      // Apply this transform to the accumulated matrix
      matrix = multiplyMatrices(matrix, transformMatrix);
    }

    return matrix;
  }, [createIdentityMatrix, multiplyMatrices]);

  // Polar decomposition: extract rotation and scaling from matrix
  const decomposeMatrix = useCallback((matrix: Matrix2D): DecomposedTransform => {
    const { a, b, c, d, e, f } = matrix;

    // Translation is straightforward
    const translateX = e;
    const translateY = f;

    // For the 2x2 transformation part, we use polar decomposition
    // This gives us rotation and scale without interpolation artifacts

    // Calculate rotation using atan2 (this extracts the rotation component properly)
    const rotation = Math.atan2(b, a);

    // Calculate scales using the magnitude of the basis vectors
    // After rotation extraction, we can get the true scaling
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Remove rotation to get pure scaling
    // [scaleX, 0] = [cos, sin] * [a, b]
    // [0, scaleY]   [-sin, cos]  [c, d]
    const scaleX = cos * a + sin * b;
    const scaleY = -sin * c + cos * d;

    return {
      translateX,
      translateY,
      rotation,
      scaleX: Math.abs(scaleX) > 0.0001 ? scaleX : 1,
      scaleY: Math.abs(scaleY) > 0.0001 ? scaleY : 1,
    };
  }, []);

  // Recompose decomposed transform into a transform string
  const recomposeTransform = useCallback((decomposed: DecomposedTransform): string => {
    const { translateX, translateY, rotation, scaleX, scaleY } = decomposed;
    const parts = [];

    // Apply transforms in order: translate, rotate, scale
    if (Math.abs(translateX) > 0.001 || Math.abs(translateY) > 0.001) {
      parts.push(`translate(${translateX.toFixed(3)}, ${translateY.toFixed(3)})`);
    }

    if (Math.abs(rotation) > 0.001) {
      const degrees = (rotation * 180) / Math.PI;
      parts.push(`rotate(${degrees.toFixed(3)})`);
    }

    if (Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001) {
      if (Math.abs(scaleX - scaleY) < 0.001) {
        parts.push(`scale(${scaleX.toFixed(3)})`);
      } else {
        parts.push(`scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`);
      }
    }

    return parts.join(' ');
  }, []);

  // Interpolate between two decomposed transforms
  const interpolateDecomposed = useCallback((
    from: DecomposedTransform,
    to: DecomposedTransform,
    progress: number,
  ): DecomposedTransform => {
    // Handle rotation interpolation (shortest path)
    let rotationDiff = to.rotation - from.rotation;

    // Normalize to [-π, π] range for shortest path
    while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

    return {
      translateX: from.translateX + (to.translateX - from.translateX) * progress,
      translateY: from.translateY + (to.translateY - from.translateY) * progress,
      rotation: from.rotation + rotationDiff * progress,
      scaleX: from.scaleX + (to.scaleX - from.scaleX) * progress,
      scaleY: from.scaleY + (to.scaleY - from.scaleY) * progress,
    };
  }, []);

  // Animation function using decomposed transform interpolation
  const animateTransform = useCallback((
    fromTransform: DecomposedTransform,
    toTransform: DecomposedTransform,
    duration: number = 500,
    easing: EasingFunction = (t: number) => t,
  ): void => {
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const currentTransform = interpolateDecomposed(fromTransform, toTransform, easedProgress);

      if (groupRef && 'current' in groupRef && groupRef.current) {
        groupRef.current.setAttribute('transform', recomposeTransform(currentTransform));
      }

      currentTransformRef.current = currentTransform;

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
  }, [groupRef, recomposeTransform, interpolateDecomposed]);

  // Effect to handle transform changes
  useEffect(() => {
    const matrix = parseTransformToMatrix(transform);
    const newTransform = decomposeMatrix(matrix);

    // Initialize without animation on first render
    if (!isInitializedRef.current) {
      currentTransformRef.current = newTransform;
      if (groupRef && 'current' in groupRef && groupRef.current) {
        groupRef.current.setAttribute('transform', transform || '');
      }
      isInitializedRef.current = true;
      return;
    }

    const currentTransform = currentTransformRef.current;
    if (!currentTransform) {
      currentTransformRef.current = newTransform;
      if (groupRef && 'current' in groupRef && groupRef.current) {
        groupRef.current.setAttribute('transform', transform || '');
      }
      return;
    }

    // Check if transform actually changed
    const tolerance = 0.001;
    const hasChanged =
      Math.abs(currentTransform.translateX - newTransform.translateX) > tolerance ||
      Math.abs(currentTransform.translateY - newTransform.translateY) > tolerance ||
      Math.abs(currentTransform.rotation - newTransform.rotation) > tolerance ||
      Math.abs(currentTransform.scaleX - newTransform.scaleX) > tolerance ||
      Math.abs(currentTransform.scaleY - newTransform.scaleY) > tolerance;

    if (hasChanged) {
      animateTransform(currentTransform, newTransform, transitionDuration, transitionEasing);
    }
  }, [transform, parseTransformToMatrix, decomposeMatrix, animateTransform, transitionDuration, transitionEasing, groupRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <g
      ref={groupRef}
      {...groupProps}
      // Don't set transform directly - we handle it in the animation
    >
      {children}
    </g>
  );
});

TransformAnimatedSvgGroup.displayName = 'TransformAnimatedSvgGroup';
