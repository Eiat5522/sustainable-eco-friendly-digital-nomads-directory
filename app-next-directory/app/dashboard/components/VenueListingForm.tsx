
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { NeoButton } from '@/components/ui/neo-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

const listingFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  type: z.enum(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities']),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  city: z.string().min(1, 'City is required'),
  ecoFocusTags: z.array(z.string()).optional(),
  digitalNomadFeatures: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  accommodationDetails: z.object({
    accommodationType: z.string().optional(),
    pricePerNightThb: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    roomTypesAvailable: z.array(z.object({
      type: z.string(),
      pricePerNight: z.number(),
      features: z.array(z.string()).optional(),
    })).optional(),
    minimumStay: z.number().optional(),
  }).optional(),
  activitiesDetails: z.object({
    activityType: z.string().optional(),
    pricePerPerson: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    duration: z.object({
      value: z.number().optional(),
      unit: z.string().optional(),
    }).optional(),
    groupSize: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    sustainabilityPractices: z.array(z.string()).optional(),
    skillLevel: z.string().optional(),
    languages: z.array(z.string()).optional(),
  }).optional(),
  cafeDetails: z.object({
    priceIndication: z.string().optional(),
    menuHighlights: z.array(z.string()).optional(),
    workspaceAmenities: z.array(z.string()).optional(),
    maxRecommendedStay: z.number().optional(),
    noiseLevel: z.string().optional(),
  }).optional(),
  coworkingDetails: z.object({
    pricingPlans: z.array(z.object({
      type: z.string(),
      price: z.number(),
      period: z.string(),
    })).optional(),
    internetSpeed: z.object({
      download: z.number().optional(),
      upload: z.number().optional(),
    }).optional(),
  }).optional(),
  restaurantDetails: z.object({
    cuisineType: z.array(z.string()).optional(),
    priceRange: z.string().optional(),
    operatingHours: z.string().optional(),
    sustainabilityInitiatives: z.array(z.string()).optional(),
    dietaryOptions: z.array(z.string()).optional(),
    seating: z.array(z.string()).optional(),
    workFriendly: z.array(z.string()).optional(),
    averageMealPriceThb: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
});

export function VenueListingForm({ listing, onSave, saving = false }) {
  const [cities, setCities] = useState([]);
  const [ecoTags, setEcoTags] = useState([]);
  const [digitalNomadFeatures, setDigitalNomadFeatures] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const form = useForm({
    resolver: zodResolver(listingFormSchema),
    defaultValues: listing || {
      name: '',
      shortDescription: '',
      longDescription: '',
      type: 'coworking',
      address: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
      city: '',
      ecoFocusTags: [],
      digitalNomadFeatures: [],
      amenities: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "coworkingDetails.pricingPlans",
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        const data = await response.json();
        setCities(data.cities);
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };

    const fetchEcoTags = async () => {
      try {
        const response = await fetch('/api/eco-tags');
        const data = await response.json();
        setEcoTags(data.ecoTags);
      } catch (error) {
        console.error('Failed to fetch eco tags:', error);
      }
    };

    const fetchDigitalNomadFeatures = async () => {
      try {
        const response = await fetch('/api/digital-nomad-features');
        const data = await response.json();
        setDigitalNomadFeatures(data.digitalNomadFeatures);
      } catch (error) {
        console.error('Failed to fetch digital nomad features:', error);
      }
    };

    const fetchAmenities = async () => {
      try {
        const response = await fetch('/api/amenities');
        const data = await response.json();
        setAmenities(data.amenities);
      } catch (error) {
        console.error('Failed to fetch amenities:', error);
      }
    };

    fetchCities();
    fetchEcoTags();
    fetchDigitalNomadFeatures();
    fetchAmenities();
  }, []);

  const onSubmit = async (data) => {
    try {
      let primaryImageAssetId = null;
      if (data.primaryImage) {
        const formData = new FormData();
        formData.append('file', data.primaryImage);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        primaryImageAssetId = result.asset._id;
      }

      let galleryImageAssetIds = [];
      if (data.galleryImages) {
        for (const file of data.galleryImages) {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          galleryImageAssetIds.push({ _type: 'image', _key: result.asset._id, asset: { _type: 'reference', _ref: result.asset._id } });
        }
      }

      const listingData = {
        ...data,
        primaryImage: primaryImageAssetId ? { _type: 'image', asset: { _type: 'reference', _ref: primaryImageAssetId } } : undefined,
        galleryImages: galleryImageAssetIds.length > 0 ? galleryImageAssetIds : undefined,
      };

      onSave(listingData);
    } catch (error) {
      console.error('Failed to save listing:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., The Green Coworking Space" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief summary of your venue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Long Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A detailed description of your venue" {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="coworking">Coworking Space</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="activities">Activities</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city._id} value={city._id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ecoFocusTags"
          render={() => (
            <FormItem>
              <FormLabel>Eco Focus Tags</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {ecoTags.map((tag) => (
                  <FormField
                    key={tag._id}
                    control={form.control}
                    name="ecoFocusTags"
                    render={({ field }) => {
                      return (
                        <FormItem key={tag._id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(tag._id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), tag._id])
                                  : field.onChange(field.value?.filter((value) => value !== tag._id));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{tag.name}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="digitalNomadFeatures"
          render={() => (
            <FormItem>
              <FormLabel>Digital Nomad Features</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {digitalNomadFeatures.map((feature) => (
                  <FormField
                    key={feature._id}
                    control={form.control}
                    name="digitalNomadFeatures"
                    render={({ field }) => {
                      return (
                        <FormItem key={feature._id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(feature._id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), feature._id])
                                  : field.onChange(field.value?.filter((value) => value !== feature._id));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{feature.name}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amenities"
          render={() => (
            <FormItem>
              <FormLabel>Amenities</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {amenities.map((amenity) => (
                  <FormField
                    key={amenity._id}
                    control={form.control}
                    name="amenities"
                    render={({ field }) => {
                      return (
                        <FormItem key={amenity._id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(amenity._id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), amenity._id])
                                  : field.onChange(field.value?.filter((value) => value !== amenity._id));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{amenity.name}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('type') === 'accommodation' && (
          <div className="space-y-8 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium">Accommodation Details</h3>
            <FormField
              control={form.control}
              name="accommodationDetails.accommodationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accommodation Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an accommodation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="guesthouse">Guesthouse</SelectItem>
                      <SelectItem value="bungalow">Bungalow</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="apartment_condo">Apartment/Condo</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="eco_lodge">Eco Lodge</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accommodationDetails.pricePerNightThb.min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Price Per Night (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accommodationDetails.pricePerNightThb.max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Price Per Night (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accommodationDetails.minimumStay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Stay (nights)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {form.watch('type') === 'activities' && (
          <div className="space-y-8 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium">Activities Details</h3>
            <FormField
              control={form.control}
              name="activitiesDetails.activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yoga_wellness">Yoga/Wellness</SelectItem>
                      <SelectItem value="outdoor_adventure">Outdoor Adventure</SelectItem>
                      <SelectItem value="cultural_experience">Cultural Experience</SelectItem>
                      <SelectItem value="eco_tour">Eco Tour</SelectItem>
                      <SelectItem value="cooking_class">Cooking Class</SelectItem>
                      <SelectItem value="meditation_mindfulness">Meditation/Mindfulness</SelectItem>
                      <SelectItem value="community_service">Community Service</SelectItem>
                      <SelectItem value="sustainable_workshop">Sustainable Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.pricePerPerson.min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Price Per Person (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.pricePerPerson.max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Price Per Person (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.duration.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.duration.unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a duration unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.groupSize.min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Group Size</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.groupSize.max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Group Size</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.skillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="all_levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.sustainabilityPractices"
              render={() => (
                <FormItem>
                  <FormLabel>Sustainability Practices</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'zero_waste', label: 'Zero Waste' },
                      { value: 'local_community_support', label: 'Local Community Support' },
                      { value: 'wildlife_protection', label: 'Wildlife Protection' },
                      { value: 'environmental_education', label: 'Environmental Education' },
                      { value: 'plastic_free', label: 'Plastic-Free' },
                      { value: 'carbon_offset', label: 'Carbon Offset Program' },
                    ].map((practice) => (
                      <FormField
                        key={practice.value}
                        control={form.control}
                        name="activitiesDetails.sustainabilityPractices"
                        render={({ field }) => {
                          return (
                            <FormItem key={practice.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(practice.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), practice.value])
                                      : field.onChange(field.value?.filter((value) => value !== practice.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{practice.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activitiesDetails.languages"
              render={() => (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'en', label: 'English' },
                      { value: 'th', label: 'Thai' },
                      { value: 'zh', label: 'Chinese' },
                      { value: 'ja', label: 'Japanese' },
                      { value: 'ko', label: 'Korean' },
                      { value: 'de', label: 'German' },
                      { value: 'fr', label: 'French' },
                      { value: 'es', label: 'Spanish' },
                    ].map((lang) => (
                      <FormField
                        key={lang.value}
                        control={form.control}
                        name="activitiesDetails.languages"
                        render={({ field }) => {
                          return (
                            <FormItem key={lang.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(lang.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), lang.value])
                                      : field.onChange(field.value?.filter((value) => value !== lang.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{lang.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {form.watch('type') === 'cafe' && (
          <div className="space-y-8 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium">Cafe Details</h3>
            <FormField
              control={form.control}
              name="cafeDetails.priceIndication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Indication</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a price indication" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="$">$</SelectItem>
                      <SelectItem value="$$">$$</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cafeDetails.menuHighlights"
              render={() => (
                <FormItem>
                  <FormLabel>Menu Highlights</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'specialty_coffee_beans', label: 'Specialty Coffee Beans' },
                      { value: 'sourdough_bread_pastries', label: 'Sourdough Bread/Pastries' },
                      { value: 'extensive_vegan_options', label: 'Extensive Vegan Options' },
                      { value: 'fresh_pressed_juices_smoothies', label: 'Fresh Pressed Juices/Smoothies' },
                      { value: 'brunch_menu', label: 'Brunch Menu' },
                      { value: 'local_thai_dishes', label: 'Local Thai Dishes' },
                      { value: 'craft_beer_wine', label: 'Craft Beer/Wine' },
                      { value: 'organic_ingredients', label: 'Organic Ingredients' },
                      { value: 'gluten_free_options', label: 'Gluten-Free Options' },
                      { value: 'plant_based_menu', label: 'Plant-Based Menu' },
                    ].map((highlight) => (
                      <FormField
                        key={highlight.value}
                        control={form.control}
                        name="cafeDetails.menuHighlights"
                        render={({ field }) => {
                          return (
                            <FormItem key={highlight.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(highlight.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), highlight.value])
                                      : field.onChange(field.value?.filter((value) => value !== highlight.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{highlight.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cafeDetails.workspaceAmenities"
              render={() => (
                <FormItem>
                  <FormLabel>Workspace Amenities</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'fast_wifi', label: 'Fast WiFi' },
                      { value: 'power_outlets', label: 'Power Outlets' },
                      { value: 'large_tables', label: 'Large Tables' },
                      { value: 'quiet_zones', label: 'Quiet Zones' },
                      { value: 'outdoor_seating', label: 'Outdoor Seating' },
                    ].map((amenity) => (
                      <FormField
                        key={amenity.value}
                        control={form.control}
                        name="cafeDetails.workspaceAmenities"
                        render={({ field }) => {
                          return (
                            <FormItem key={amenity.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(amenity.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), amenity.value])
                                      : field.onChange(field.value?.filter((value) => value !== amenity.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{amenity.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cafeDetails.maxRecommendedStay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Recommended Stay (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cafeDetails.noiseLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Noise Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a noise level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="very_quiet">Very Quiet</SelectItem>
                      <SelectItem value="low">Low Hum</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">Energetic</SelectItem>
                      <SelectItem value="very_loud">Very Loud</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {form.watch('type') === 'coworking' && (
          <div className="space-y-8 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium">Coworking Details</h3>
            <div>
              <h4 className="text-md font-medium">Pricing Plans</h4>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2 mt-2">
                  <FormField
                    control={form.control}
                    name={`coworkingDetails.pricingPlans.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`coworkingDetails.pricingPlans.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`coworkingDetails.pricingPlans.${index}.period`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <NeoButton type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                    Remove
                  </NeoButton>
                </div>
              ))}
              <NeoButton
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => append({ type: '', price: 0, period: '' })}
              >
                Add Pricing Plan
              </NeoButton>
            </div>
            <FormField
              control={form.control}
              name="coworkingDetails.internetSpeed.download"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Download Speed (Mbps)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coworkingDetails.internetSpeed.upload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Speed (Mbps)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {form.watch('type') === 'restaurant' && (
          <div className="space-y-8 rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium">Restaurant Details</h3>
            <FormField
              control={form.control}
              name="restaurantDetails.priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a price range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="budget">$ (Under $10)</SelectItem>
                      <SelectItem value="moderate">$$ ($10-25)</SelectItem>
                      <SelectItem value="expensive">$$$ ($25-50)</SelectItem>
                      <SelectItem value="luxury">$$$$ ($50+)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.operatingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating Hours</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.cuisineType"
              render={() => (
                <FormItem>
                  <FormLabel>Cuisine Type</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'thai', label: 'Thai' },
                      { value: 'international', label: 'International' },
                      { value: 'vegan_vegetarian', label: 'Vegan/Vegetarian' },
                      { value: 'mediterranean', label: 'Mediterranean' },
                      { value: 'japanese', label: 'Japanese' },
                      { value: 'indian', label: 'Indian' },
                      { value: 'fusion', label: 'Fusion' },
                      { value: 'raw_health', label: 'Raw/Health' },
                      { value: 'local_fusion', label: 'Local Fusion' },
                      { value: 'clean_eating', label: 'Clean Eating' },
                    ].map((cuisine) => (
                      <FormField
                        key={cuisine.value}
                        control={form.control}
                        name="restaurantDetails.cuisineType"
                        render={({ field }) => {
                          return (
                            <FormItem key={cuisine.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(cuisine.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), cuisine.value])
                                      : field.onChange(field.value?.filter((value) => value !== cuisine.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{cuisine.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.sustainabilityInitiatives"
              render={() => (
                <FormItem>
                  <FormLabel>Sustainability Initiatives</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'local_sourcing', label: 'Local Sourcing' },
                      { value: 'organic_ingredients', label: 'Organic Ingredients' },
                      { value: 'zero_waste', label: 'Zero Waste Practices' },
                      { value: 'composting', label: 'Composting' },
                      { value: 'plastic_free', label: 'Plastic-Free' },
                      { value: 'food_waste_reduction', label: 'Food Waste Reduction' },
                      { value: 'sustainable_seafood', label: 'Sustainable Seafood' },
                      { value: 'farm_to_table', label: 'Farm-to-Table' },
                    ].map((initiative) => (
                      <FormField
                        key={initiative.value}
                        control={form.control}
                        name="restaurantDetails.sustainabilityInitiatives"
                        render={({ field }) => {
                          return (
                            <FormItem key={initiative.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(initiative.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), initiative.value])
                                      : field.onChange(field.value?.filter((value) => value !== initiative.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{initiative.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.dietaryOptions"
              render={() => (
                <FormItem>
                  <FormLabel>Dietary Options</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'vegan', label: 'Vegan' },
                      { value: 'vegetarian', label: 'Vegetarian' },
                      { value: 'gluten_free', label: 'Gluten-Free' },
                      { value: 'dairy_free', label: 'Dairy-Free' },
                      { value: 'raw', label: 'Raw' },
                      { value: 'keto', label: 'Keto' },
                      { value: 'halal', label: 'Halal' },
                    ].map((option) => (
                      <FormField
                        key={option.value}
                        control={form.control}
                        name="restaurantDetails.dietaryOptions"
                        render={({ field }) => {
                          return (
                            <FormItem key={option.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), option.value])
                                      : field.onChange(field.value?.filter((value) => value !== option.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{option.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.seating"
              render={() => (
                <FormItem>
                  <FormLabel>Seating Options</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'indoor', label: 'Indoor' },
                      { value: 'outdoor_garden', label: 'Outdoor Garden' },
                      { value: 'rooftop', label: 'Rooftop' },
                      { value: 'bar', label: 'Bar Seating' },
                      { value: 'private_rooms', label: 'Private Rooms' },
                    ].map((seating) => (
                      <FormField
                        key={seating.value}
                        control={form.control}
                        name="restaurantDetails.seating"
                        render={({ field }) => {
                          return (
                            <FormItem key={seating.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(seating.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), seating.value])
                                      : field.onChange(field.value?.filter((value) => value !== seating.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{seating.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.workFriendly"
              render={() => (
                <FormItem>
                  <FormLabel>Work-Friendly Features</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'wifi', label: 'WiFi' },
                      { value: 'power_outlets', label: 'Power Outlets' },
                      { value: 'large_tables', label: 'Large Tables' },
                      { value: 'quiet_areas', label: 'Quiet Areas' },
                      { value: 'long_stay_friendly', label: 'Long Stay Friendly' },
                    ].map((feature) => (
                      <FormField
                        key={feature.value}
                        control={form.control}
                        name="restaurantDetails.workFriendly"
                        render={({ field }) => {
                          return (
                            <FormItem key={feature.value} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(feature.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), feature.value])
                                      : field.onChange(field.value?.filter((value) => value !== feature.value));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{feature.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.averageMealPriceThb.min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Average Meal Price (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurantDetails.averageMealPriceThb.max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Average Meal Price (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input placeholder="contact@venue.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://venue.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Image</FormLabel>
              <FormControl>
                <Input type="file" onChange={(e) => field.onChange(e.target.files[0])} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="galleryImages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gallery Images</FormLabel>
              <FormControl>
                <Input type="file" multiple onChange={(e) => field.onChange(e.target.files)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <NeoButton type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Listing'}
        </NeoButton>
      </form>
    </Form>
  );
}
