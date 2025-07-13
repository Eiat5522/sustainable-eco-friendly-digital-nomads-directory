"use client";

import React, { useEffect, ReactNode } from "react";
import useEmblaCarousel, { UseEmblaCarouselType } from "embla-carousel-react";

export type CarouselApi = any;

interface CarouselProps {
  setApi: (api: CarouselApi) => void;
  opts?: any;
  children: ReactNode;
}

export const Carousel: React.FC<CarouselProps> = ({ setApi, opts, children }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(opts || {});

  useEffect(() => {
    if (emblaApi) {
      setApi(emblaApi);
    }
  }, [emblaApi, setApi]);

  return (
    <div className="embla" ref={emblaRef}>
      {children}
    </div>
  );
};

export const CarouselContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children }) => (
  <div className={"embla__container flex " + (className || "")}>{children}</div>
);

export const CarouselItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children }) => (
  <div className={"embla__slide " + (className || "")}>{children}</div>
);

export const CarouselPrevious: React.FC<{ onClick?: () => void }> = ({ onClick }) => null;
export const CarouselNext: React.FC<{ onClick?: () => void }> = ({ onClick }) => null;
