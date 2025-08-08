"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Leaf } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import SanityImage from "@/components/SanityImage";
import Image from "next/image";

import type { AppCity } from '@/types/appView';

export const EcoCityCarousel = ({ cities = [] }: { cities: AppCity[] }) => {
  const isTestEnv = process.env.NODE_ENV === 'test';
  useEffect(() => {
    console.log('[DEBUG] CityCarousel received cities:', cities);
    cities.forEach(city => {
      console.log('[DEBUG] City image:', city.image);
    });
  }, [cities]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(undefined);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-24 bg-gradient-to-b from-green-50/50 to-transparent">
      <div className="container mx-auto">
        <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium text-green-900 md:text-4xl lg:text-5xl">
              Eco-Friendly Destinations
            </h2>
            <p className="max-w-lg text-green-700/80">
              Discover sustainable cities that are leading the way in eco-friendly initiatives and digital nomad communities.
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto hover:bg-green-100"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto hover:bg-green-100"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            breakpoints: {
              "(max-width: 768px)": {
                dragFree: true,
              },
            },
          }}
        >
          <CarouselContent className="ml-0 2xl:ml-[max(8rem,calc(50vw-700px))] 2xl:mr-[max(0rem,calc(50vw-700px))]">
            {cities.map((city) => {
              const imageSrc = city.image?.asset?.url || '/images/fallback.png';
              return (
                <CarouselItem
                  key={city._id}
                  className="max-w-[320px] pl-[20px] lg:max-w-[360px]"
                >
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="group relative h-[27rem] max-w-full overflow-hidden rounded-xl">
                      <SanityImage
                        image={city.primaryImage}
                        alt={city.name || 'Image unavailable'}
                        fill
                        sizes="(max-width: 768px) 100vw, 360px"
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        {...(isTestEnv && {
                          'data-testid': 'city-carousel-image',
                          'data-src': imageSrc,
                          'data-alt': city.name || 'Image unavailable',
                        })}
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1 px-3 py-1.5 text-white">
                          <Leaf className="size-4" />
                          <span className="text-sm font-medium">
                            {city.sustainabilityScore}/100
                          </span>
                        </Badge>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-white md:p-8">
                        <div className="mb-2 pt-4 text-xl font-semibold">
                          {city.name}
                        </div>

                        <div className="mb-6 w-full">
                          <h4 className="text-sm font-medium uppercase tracking-wider opacity-80 mb-2">
                            Eco Highlights
                          </h4>
                          <ul className="space-y-1">
                            {(city.highlights || []).map((highlight, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <span className="size-1.5 rounded-full bg-green-400"></span>
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          variant="outline"
                          className="border-white/30 bg-black/20 text-white hover:bg-black/40 group"
                        >
                          Explore City
                          <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
        <div className="mt-8 flex justify-center gap-2">
          {cities.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentSlide === index ? "bg-green-600" : "bg-green-200"
              }`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <CarouselPrevious />
      <CarouselNext />
    </section>
  );
};

export default EcoCityCarousel;