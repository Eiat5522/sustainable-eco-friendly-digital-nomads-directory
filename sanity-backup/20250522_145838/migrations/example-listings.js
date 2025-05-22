/**
 * Example listings for Sanity CMS
 * Based on real data from research
 */

export const exampleListings = [
  // BANGKOK COWORKING SPACES
  {
    _type: 'listing',
    name: 'Park Ventures Ecoplex by Servcorp',
    category: 'coworking',
    slug: {
      _type: 'slug',
      current: 'park-ventures-ecoplex-servcorp'
    },
    city: { _type: 'reference', _ref: 'bangkok' },
    addressString: 'Level 18, 57 Wireless Road, Lumpini, Pathumwan, Bangkok 10330',
    coordinates: {
      _type: 'geopoint',
      lat: 13.7435,
      lng: 100.5456
    },
    descriptionShort: 'Premium eco-friendly coworking space in the heart of Bangkok with state-of-the-art facilities and sustainability focus.',
    descriptionLong: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Located in the environmentally conscious Park Ventures Ecoplex, this premium coworking space combines luxury with sustainability. The space features energy-efficient systems, natural lighting, and a direct connection to BTS Ploenchit via skywalk. With neighbors like HSBC and Google, it offers a prestigious business address while maintaining strong environmental credentials.'
          }
        ]
      }
    ],
    ecoFocusTags: [
      { _type: 'reference', _ref: 'energy_efficient_systems' },
      { _type: 'reference', _ref: 'natural_lighting' },
      { _type: 'reference', _ref: 'green_building_materials' },
      { _type: 'reference', _ref: 'waste_reduction' }
    ],
    ecoNotesDetailed: 'The building incorporates sustainable materials and energy-efficient systems throughout. Features modern relaxation areas and innovative building infrastructure designed to minimize environmental impact. The space promotes efficient resource use through shared facilities and environmentally conscious operations.',
    sourceUrls: [
      'https://www.servcorp.co.th/en/coworking/locations/bangkok/park-ventures-ecoplex/'
    ],
    digitalNomadFeatures: [
      { _type: 'reference', _ref: 'fast_wifi' },
      { _type: 'reference', _ref: 'meeting_rooms_available' },
      { _type: 'reference', _ref: 'quiet_work_zones' },
      { _type: 'reference', _ref: '24_7_access' }
    ],
    lastVerifiedDate: '2025-05-15',
    contactInfo: {
      email: 'bangkok@servcorp.co.th',
      phone: '+66 2 119 8111',
      socialMedia: [
        {
          platform: 'facebook',
          url: 'https://www.facebook.com/ServcorpThailand/'
        }
      ]
    },
    customTags: [
      'premium',
      'central-location',
      'bts-access',
      'professional'
    ],
    accessibility: [
      'wheelchair',
      'step_free',
      'accessible_bathroom'
    ],
    coworkingDetails: {
      operatingHours: 'Monday to Friday: 8:30 AM - 6:00 PM (24/7 access available for members)',
      pricingPlans: [
        {
          type: 'hot_desk',
          priceTHB: 3420,
          description: 'Hot desk package with business hours access, includes meeting rooms and refreshments'
        },
        {
          type: 'dedicated_desk',
          priceTHB: 5600,
          description: '24/7 access with lockable cabinet and fixed desk'
        },
        {
          type: 'day_pass',
          priceTHB: 1500,
          description: 'Pay-as-you-go model with day pass access and meeting room availability'
        }
      ],
      amenities: [
        'high_speed_wifi',
        'meeting_rooms',
        'phone_booths',
        'printer_scanner_copier',
        'free_coffee_tea',
        'kitchen_access_shared',
        'personal_lockers',
        'ac_rooms'
      ],
      internetSpeed: {
        download: 1000,
        upload: 1000,
        lastTested: '2025-05-01T09:00:00Z',
        redundancy: true
      },
      accessPolicy: {
        hours: true,
        membershipRequired: true,
        dayPassAvailable: true,
        guestPolicy: 'paid'
      }
    }
  },

  // Another Bangkok Coworking Space
  {
    _type: 'listing',
    name: 'JustCo One City Centre',
    category: 'coworking',
    slug: {
      _type: 'slug',
      current: 'justco-one-city-centre'
    },
    city: { _type: 'reference', _ref: 'bangkok' },
    addressString: 'Floors 37-40, One City Centre, Ploenchit, Bangkok',
    coordinates: {
      _type: 'geopoint',
      lat: 13.7436,
      lng: 100.5431
    },
    descriptionShort: 'Nature-infused coworking space with biophilic design elements and stunning city views.',
    descriptionLong: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Located on floors 37-40 of One City Centre, JustCo integrates nature into its workspace through biophilic design elements, including live plants, natural wood furnishings, and expansive windows that let in ample sunlight. The design emphasizes sustainability and a connection with nature while providing state-of-the-art facilities for modern work needs.'
          }
        ]
      }
    ],
    ecoFocusTags: [
      { _type: 'reference', _ref: 'biophilic_design' },
      { _type: 'reference', _ref: 'natural_lighting' },
      { _type: 'reference', _ref: 'energy_efficient_systems' }
    ],
    ecoNotesDetailed: 'Strong emphasis on biophilic design with natural elements and live plants. Features natural wood and rattan elements in flooring and furniture. Maximized natural lighting through floor-to-ceiling windows. Creates a tranquil oasis resonating with the innate need to connect with nature.',
    sourceUrls: [
      'https://www.justcoglobal.com/th/en/locations/one-city-centre'
    ],
    digitalNomadFeatures: [
      { _type: 'reference', _ref: 'fast_wifi' },
      { _type: 'reference', _ref: 'meeting_rooms_available' },
      { _type: 'reference', _ref: 'quiet_work_zones' }
    ],
    lastVerifiedDate: '2025-05-15',
    contactInfo: {
      email: 'enquiry.th@justcoglobal.com',
      phone: '+66 2 119 9100',
      socialMedia: [
        {
          platform: 'linkedin',
          url: 'https://www.linkedin.com/company/justco-thailand'
        }
      ]
    },
    customTags: [
      'biophilic',
      'city-views',
      'premium-location',
      'modern'
    ],
    accessibility: [
      'wheelchair',
      'step_free',
      'accessible_bathroom',
      'accessible_parking'
    ],
    coworkingDetails: {
      operatingHours: 'Monday to Friday: 9:00 AM - 6:00 PM (24/7 access for dedicated members)',
      pricingPlans: [
        {
          type: 'hot_desk',
          priceTHB: 3900,
          description: 'Flexible hot desk access with standard amenities'
        },
        {
          type: 'dedicated_desk',
          priceTHB: 6500,
          description: 'Dedicated desk with 24/7 access and storage'
        },
        {
          type: 'private_office',
          priceTHB: 15000,
          description: 'Private office space for teams'
        }
      ],
      amenities: [
        'high_speed_wifi',
        'meeting_rooms',
        'phone_booths',
        'printer_scanner_copier',
        'kitchen_access_shared',
        'event_space_available',
        'bike_parking',
        'car_parking'
      ],
      internetSpeed: {
        download: 800,
        upload: 800,
        lastTested: '2025-05-10T14:00:00Z',
        redundancy: true
      },
      accessPolicy: {
        hours: true,
        membershipRequired: true,
        dayPassAvailable: true,
        guestPolicy: 'paid'
      }
    }
  },

  // BANGKOK CAFES
  {
    _type: 'listing',
    name: 'Vistro Vegan Café',
    category: 'cafe',
    slug: {
      _type: 'slug',
      current: 'vistro-vegan-cafe'
    },
    city: { _type: 'reference', _ref: 'bangkok' },
    addressString: 'Sukhumvit 24, Klongton, Klongtoey, Bangkok 10110',
    coordinates: {
      _type: 'geopoint',
      lat: 13.7288,
      lng: 100.5694
    },
    descriptionShort: 'Artistic vegan café with excellent workspace amenities and innovative plant-based cuisine.',
    descriptionLong: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'A visually stunning vegan restaurant and café that combines artistic décor with sustainable practices. Known for their innovative plant-based menu and signature beverages like banana cream latte, Vistro creates an ideal environment for digital nomads with its spacious seating and reliable WiFi. The café emphasizes zero-waste practices and sources ingredients locally where possible.'
          }
        ]
      }
    ],
    ecoFocusTags: [
      { _type: 'reference', _ref: 'zero_waste' },
      { _type: 'reference', _ref: 'local_sourcing' },
      { _type: 'reference', _ref: 'plant_based_menu' }
    ],
    ecoNotesDetailed: 'Implements comprehensive zero-waste practices including composting and minimal packaging. Sources ingredients from local organic farms and uses eco-friendly packaging materials. The café actively promotes sustainable dining practices and environmental awareness.',
    sourceUrls: [
      'https://www.vistro.co.th/',
      'https://www.facebook.com/vistrobangkok/'
    ],
    digitalNomadFeatures: [
      { _type: 'reference', _ref: 'fast_wifi' },
      { _type: 'reference', _ref: 'power_outlets_abundant' }
    ],
    lastVerifiedDate: '2025-05-15',
    contactInfo: {
      email: 'hello@vistro.co.th',
      phone: '+66 2 000 0000',
      socialMedia: [
        {
          platform: 'instagram',
          url: 'https://www.instagram.com/vistrobangkok/'
        }
      ]
    },
    customTags: [
      'vegan',
      'workspace-friendly',
      'artistic',
      'healthy'
    ],
    cafeDetails: {
      operatingHours: 'Tuesday to Sunday: 10:00 AM - 9:00 PM (Closed on Mondays)',
      priceIndication: '$$',
      menuHighlights: [
        'specialty_coffee_beans',
        'extensive_vegan_options',
        'fresh_pressed_juices_smoothies',
        'gluten_free_options',
        'plant_based_menu'
      ],
      workspaceAmenities: [
        'fast_wifi',
        'power_outlets',
        'large_tables',
        'quiet_zones',
        'outdoor_seating'
      ],
      maxRecommendedStay: 4,
      noiseLevel: 'low',
      powerOutlets: {
        availability: 'good',
        notes: 'Power outlets available at most wall-adjacent tables and in the dedicated workspace area'
      },
      workPolicy: {
        laptopsAllowed: true,
        timeLimit: 240,
        peakHoursPolicy: 'limited_peak',
        peakHours: '12:00 PM - 2:00 PM weekends'
      },
      veganFriendly: {
        isVeganFriendly: true,
        veganOptions: 100
      }
    }
  },

  // Chiang Mai Eco-friendly Accommodation
  {
    _type: 'listing',
    name: 'Green Living Retreat',
    category: 'accommodation',
    slug: {
      _type: 'slug',
      current: 'green-living-retreat-chiang-mai'
    },
    city: { _type: 'reference', _ref: 'chiangmai' },
    addressString: 'Soi 9, Nimmanhaemin Road, Suthep, Chiang Mai 50200',
    coordinates: {
      _type: 'geopoint',
      lat: 18.7953,
      lng: 98.9687
    },
    descriptionShort: 'Sustainable boutique accommodation in Nimman area with dedicated workspaces and eco-friendly practices.',
    descriptionLong: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Green Living Retreat combines modern comfort with sustainable living in the heart of Chiang Mai\'s trendy Nimman area. The property features solar-powered facilities, rainwater harvesting, and organic gardens. Each room is equipped with ergonomic workspaces and high-speed internet, making it perfect for digital nomads who prioritize both productivity and environmental consciousness.'
          }
        ]
      }
    ],
    ecoFocusTags: [
      { _type: 'reference', _ref: 'solar_power' },
      { _type: 'reference', _ref: 'water_conservation' },
      { _type: 'reference', _ref: 'organic_food' },
      { _type: 'reference', _ref: 'waste_reduction' }
    ],
    ecoNotesDetailed: 'Powered by solar panels providing 70% of energy needs. Implements comprehensive rainwater harvesting system and grey water recycling. Maintains organic garden for guest use. Zero-waste initiatives including composting and plastic-free policies. Regular workshops on sustainable living practices.',
    sourceUrls: [
      'https://www.greenlivingretreat.com'
    ],
    digitalNomadFeatures: [
      { _type: 'reference', _ref: 'fast_wifi' },
      { _type: 'reference', _ref: 'ergonomic_seating' },
      { _type: 'reference', _ref: 'coworking_option_available' }
    ],
    lastVerifiedDate: '2025-05-15',
    contactInfo: {
      email: 'stay@greenlivingretreat.com',
      phone: '+66 53 123 456',
      socialMedia: [
        {
          platform: 'instagram',
          url: 'https://www.instagram.com/greenlivingretreat'
        }
      ]
    },
    customTags: [
      'sustainable-living',
      'digital-nomad-friendly',
      'organic-garden',
      'wellness'
    ],
    accessibility: [
      'wheelchair',
      'step_free'
    ],
    accommodationDetails: {
      accommodationType: 'eco_lodge',
      workspaceQuality: {
        hasWorkspace: true,
        workspaceType: 'ergonomic',
        workspaceFeatures: [
          'ergonomic_chair',
          'desk_lamp',
          'natural_light'
        ]
      },
      stayDuration: {
        minimumNights: 7,
        maximumNights: 180,
        longTermAvailable: true,
        longTermDiscount: '20% discount for stays over 30 nights'
      },
      coworkingPartnership: {
        hasPartnership: true,
        partner: { _type: 'reference', _ref: 'punspace-nimman' },
        discountDetails: '20% off daily passes at Punspace Nimman for guests'
      },
      roomTypes: [
        {
          type: 'studio',
          pricePerNight: 1800,
          features: [
            'ac',
            'private_bathroom',
            'workspace',
            'kitchen'
          ]
        },
        {
          type: 'one_bedroom',
          pricePerNight: 2500,
          features: [
            'ac',
            'private_bathroom',
            'workspace',
            'kitchen',
            'balcony'
          ]
        }
      ]
    }
  }

  // Add more listings...
];
