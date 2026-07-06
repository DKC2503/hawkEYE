import React from 'react';
import visakhapatnamSkyToCity from '../../assets/hero/visakhapatnam-sky-to-city.jpg';

interface ResponsiveHeroMediaProps {
  scrollProgress: number;
}

export const ResponsiveHeroMedia: React.FC<ResponsiveHeroMediaProps> = ({
  scrollProgress,
}) => {
  // Compute transform: translate3d(0, ${-scrollProgress * 35}%, 0) scale(${1.02 + scrollProgress * 0.05})
  // At scrollProgress = 0: translate3d(0, 0%, 0) -> Viewport shows top dramatic sky & clouds
  // At scrollProgress = 1: translate3d(0, -35%, 0) -> Camera view descends smoothly into coastal city skyline & roads!
  const bgTranslateY = -scrollProgress * 35;
  const bgScale = 1.02 + scrollProgress * 0.05;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <img
        src={visakhapatnamSkyToCity}
        alt="Visakhapatnam Sky to City Descent"
        style={{
          transform: `translate3d(0, ${bgTranslateY}%, 0) scale(${bgScale})`,
          willChange: 'transform',
        }}
        className="city-background-media absolute top-0 left-0 w-full h-[155%] object-cover object-top transition-transform duration-75 ease-out"
        loading="eager"
      />
    </div>
  );
};
