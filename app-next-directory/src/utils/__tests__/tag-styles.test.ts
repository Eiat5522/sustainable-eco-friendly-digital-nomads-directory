/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { getTagColorClasses } from '../tag-styles';

describe('tag-styles', () => {
  describe('getTagColorClasses', () => {
    describe('eco category', () => {
      it('should return emerald colors for solar/renewable/energy tags', () => {
        expect(getTagColorClasses('Solar Panels', 'eco')).toBe('bg-emerald-100 text-emerald-700');
        expect(getTagColorClasses('Renewable Energy', 'eco')).toBe('bg-emerald-100 text-emerald-700');
        expect(getTagColorClasses('energy efficient', 'eco')).toBe('bg-emerald-100 text-emerald-700');
      });

      it('should return lime colors for waste/zero/recycling tags', () => {
        expect(getTagColorClasses('Zero Waste', 'eco')).toBe('bg-lime-100 text-lime-700');
        expect(getTagColorClasses('Recycling Program', 'eco')).toBe('bg-lime-100 text-lime-700');
        expect(getTagColorClasses('waste management', 'eco')).toBe('bg-lime-100 text-lime-700');
      });

      it('should return cyan colors for water conservation tags', () => {
        expect(getTagColorClasses('Water Conservation', 'eco')).toBe('bg-cyan-100 text-cyan-700');
        expect(getTagColorClasses('water saving', 'eco')).toBe('bg-cyan-100 text-cyan-700');
      });

      it('should return teal colors for vegan/vegetarian/organic tags', () => {
        expect(getTagColorClasses('Vegan Options', 'eco')).toBe('bg-teal-100 text-teal-700');
        expect(getTagColorClasses('Vegetarian Menu', 'eco')).toBe('bg-teal-100 text-teal-700');
        expect(getTagColorClasses('Organic Food', 'eco')).toBe('bg-teal-100 text-teal-700');
      });

      it('should return green colors for garden/bike/walk/green tags', () => {
        expect(getTagColorClasses('Community Garden', 'eco')).toBe('bg-green-100 text-green-700');
        expect(getTagColorClasses('Bike Friendly', 'eco')).toBe('bg-green-100 text-green-700');
        expect(getTagColorClasses('Walking Distance', 'eco')).toBe('bg-green-100 text-green-700');
        expect(getTagColorClasses('Green Space', 'eco')).toBe('bg-green-100 text-green-700');
      });

      it('should return default emerald colors for unmatched eco tags', () => {
        expect(getTagColorClasses('Eco-Friendly', 'eco')).toBe('bg-emerald-100 text-emerald-700');
        expect(getTagColorClasses('Sustainable', 'eco')).toBe('bg-emerald-100 text-emerald-700');
      });

      it('should be case insensitive', () => {
        expect(getTagColorClasses('SOLAR PANELS', 'eco')).toBe('bg-emerald-100 text-emerald-700');
        expect(getTagColorClasses('VeGaN oPtIoNs', 'eco')).toBe('bg-teal-100 text-teal-700');
      });
    });

    describe('amenity category', () => {
      it('should return blue colors for wifi/internet tags', () => {
        expect(getTagColorClasses('WiFi', 'amenity')).toBe('bg-blue-100 text-blue-700');
        expect(getTagColorClasses('High-speed Internet', 'amenity')).toBe('bg-blue-100 text-blue-700');
      });

      it('should return indigo colors for meeting/conference tags', () => {
        expect(getTagColorClasses('Meeting Room', 'amenity')).toBe('bg-indigo-100 text-indigo-700');
        expect(getTagColorClasses('Conference Space', 'amenity')).toBe('bg-indigo-100 text-indigo-700');
        expect(getTagColorClasses('Call Booth', 'amenity')).toBe('bg-indigo-100 text-indigo-700');
      });

      it('should return purple colors for 24/7 access tags', () => {
        expect(getTagColorClasses('24/7 Access', 'amenity')).toBe('bg-purple-100 text-purple-700');
        expect(getTagColorClasses('24-7 Open', 'amenity')).toBe('bg-purple-100 text-purple-700');
        expect(getTagColorClasses('24x7 Available', 'amenity')).toBe('bg-purple-100 text-purple-700');
        expect(getTagColorClasses('access anytime', 'amenity')).toBe('bg-purple-100 text-purple-700');
      });

      it('should return amber colors for kitchen/restaurant tags', () => {
        expect(getTagColorClasses('Kitchen', 'amenity')).toBe('bg-amber-100 text-amber-800');
        expect(getTagColorClasses('Restaurant', 'amenity')).toBe('bg-amber-100 text-amber-800');
        expect(getTagColorClasses('Bar', 'amenity')).toBe('bg-amber-100 text-amber-800');
        expect(getTagColorClasses('Cafe', 'amenity')).toBe('bg-amber-100 text-amber-800');
      });

      it('should return orange colors for security tags', () => {
        expect(getTagColorClasses('Security', 'amenity')).toBe('bg-orange-100 text-orange-700');
        expect(getTagColorClasses('Locker Storage', 'amenity')).toBe('bg-orange-100 text-orange-700');
        expect(getTagColorClasses('Safe Box', 'amenity')).toBe('bg-orange-100 text-orange-700');
      });

      it('should return sky colors for bike/parking tags', () => {
        expect(getTagColorClasses('Bike Parking', 'amenity')).toBe('bg-sky-100 text-sky-700');
        expect(getTagColorClasses('Parking Available', 'amenity')).toBe('bg-sky-100 text-sky-700');
      });

      it('should return green colors for garden/terrace/rooftop tags', () => {
        expect(getTagColorClasses('Garden', 'amenity')).toBe('bg-green-100 text-green-700');
        expect(getTagColorClasses('Terrace', 'amenity')).toBe('bg-green-100 text-green-700');
        expect(getTagColorClasses('Rooftop', 'amenity')).toBe('bg-green-100 text-green-700');
      });

      it('should return default blue colors for unmatched amenity tags', () => {
        expect(getTagColorClasses('Swimming Pool', 'amenity')).toBe('bg-blue-100 text-blue-700');
        expect(getTagColorClasses('Gym', 'amenity')).toBe('bg-blue-100 text-blue-700');
      });

      it('should be case insensitive', () => {
        expect(getTagColorClasses('WIFI', 'amenity')).toBe('bg-blue-100 text-blue-700');
        expect(getTagColorClasses('MeEtInG RoOm', 'amenity')).toBe('bg-indigo-100 text-indigo-700');
      });
    });

    describe('edge cases', () => {
      it('should handle empty strings', () => {
        expect(getTagColorClasses('', 'eco')).toBe('bg-emerald-100 text-emerald-700');
        expect(getTagColorClasses('', 'amenity')).toBe('bg-blue-100 text-blue-700');
      });

      it('should handle special characters', () => {
        expect(getTagColorClasses('Wi-Fi & Internet', 'amenity')).toBe('bg-blue-100 text-blue-700');
        expect(getTagColorClasses('24/7', 'amenity')).toBe('bg-purple-100 text-purple-700');
      });
    });
  });
});
