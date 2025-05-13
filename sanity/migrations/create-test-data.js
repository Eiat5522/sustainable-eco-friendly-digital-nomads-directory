/**
 * Test Data Creation Script for Sanity CMS
 * 
 * This script creates sample test data in the Sanity CMS.
 */

import { createClient } from '@sanity/client'

// Sanity client configuration
const client = createClient({
  projectId: 'abcde123', // Our test project ID
  dataset: 'production',
  token: 'skWHATEVERYOURTOKENIS', // Hard-coded for this test
  apiVersion: '2023-05-03', 
  useCdn: false
})

async function createTestData() {
  try {
    // Create city references
    console.log('Creating cities...')
    const bangkokCity = await client.create({
      _type: 'city',
      name: 'Bangkok',
      slug: { 
        _type: 'slug',
        current: 'bangkok' 
      },
      coordinates: {
        lat: 13.7563,
        lng: 100.5018
      }
    })
    
    const chiangMaiCity = await client.create({
      _type: 'city',
      name: 'Chiang Mai',
      slug: { 
        _type: 'slug',
        current: 'chiang-mai' 
      },
      coordinates: {
        lat: 18.7883,
        lng: 98.9853
      }
    })
    
    // Create eco tags
    console.log('Creating eco tags...')
    const ecoTags = await Promise.all([
      client.create({
        _type: 'ecoTag',
        name: 'Zero Waste',
        slug: { 
          _type: 'slug',
          current: 'zero-waste' 
        },
        description: 'Businesses that minimize waste through composting, recycling, and avoiding single-use items.'
      }),
      client.create({
        _type: 'ecoTag',
        name: 'Renewable Energy',
        slug: { 
          _type: 'slug',
          current: 'renewable-energy' 
        },
        description: 'Uses solar, wind, or other sustainable energy sources.'
      }),
      client.create({
        _type: 'ecoTag',
        name: 'Plant-Based Options',
        slug: { 
          _type: 'slug',
          current: 'plant-based-options' 
        },
        description: 'Offers substantial plant-based food options to reduce environmental impact.'
      })
    ])
    
    // Create nomad features
    console.log('Creating nomad features...')
    const nomadFeatures = await Promise.all([
      client.create({
        _type: 'nomadFeature',
        name: 'Fast WiFi',
        slug: { 
          _type: 'slug',
          current: 'fast-wifi' 
        },
        description: 'Reliable high-speed internet suitable for video calls.'
      }),
      client.create({
        _type: 'nomadFeature',
        name: 'Power Outlets',
        slug: { 
          _type: 'slug',
          current: 'power-outlets' 
        },
        description: 'Ample power outlets available for device charging.'
      }),
      client.create({
        _type: 'nomadFeature',
        name: 'Meeting Rooms',
        slug: { 
          _type: 'slug',
          current: 'meeting-rooms' 
        },
        description: 'Private spaces available for meetings or calls.'
      })
    ])
    
    // Create listings
    console.log('Creating sample listings...')
    
    // Sample Coworking Space
    await client.create({
      _type: 'listing',
      name: 'EcoHub Coworking',
      slug: { 
        _type: 'slug',
        current: 'ecohub-coworking' 
      },
      category: 'coworking',
      city: {
        _type: 'reference',
        _ref: bangkokCity._id
      },
      addressString: '123 Sukhumvit Road, Bangkok',
      coordinates: {
        lat: 13.7380,
        lng: 100.5610
      },
      descriptionShort: 'Sustainable coworking space with solar panels and zero waste policy',
      descriptionLong: 'EcoHub is Bangkok\'s premier sustainable coworking space. Our facility runs on 100% renewable energy with solar panels covering our roof. We implement a strict zero waste policy with composting, recycling stations, and reusable items only in our kitchen area. The space features natural lighting, plants throughout, and furniture made from reclaimed materials.\n\nWe offer hot desks, dedicated desks, and private offices with 24/7 access for members. Our community hosts regular events focused on sustainability and digital nomad lifestyle.',
      ecoFocusTags: [
        {
          _type: 'reference',
          _ref: ecoTags[0]._id // Zero Waste
        },
        {
          _type: 'reference',
          _ref: ecoTags[1]._id // Renewable Energy
        }
      ],
      ecoNotesDetailed: 'Our building is LEED Gold certified with energy-efficient systems throughout. We use 100% renewable energy from our rooftop solar installation, supplemented by a renewable energy provider. Our zero waste policy includes composting food waste, comprehensive recycling, and a ban on single-use items. Water is filtered and provided free for members who bring reusable bottles.',
      sourceUrls: ['https://example.com/ecohub'],
      digitalNomadFeatures: [
        {
          _type: 'reference',
          _ref: nomadFeatures[0]._id // Fast WiFi
        },
        {
          _type: 'reference',
          _ref: nomadFeatures[1]._id // Power Outlets
        },
        {
          _type: 'reference',
          _ref: nomadFeatures[2]._id // Meeting Rooms
        }
      ],
      lastVerifiedDate: new Date().toISOString(),
      coworkingDetails: {
        operatingHours: 'Monday to Friday: 7am - 10pm, Weekends: 9am - 6pm',
        pricingPlans: [
          { name: 'Day Pass', price: '฿350' },
          { name: 'Weekly Pass', price: '฿1,800' },
          { name: 'Monthly Hot Desk', price: '฿5,500' },
          { name: 'Monthly Dedicated Desk', price: '฿7,500' }
        ],
        specificAmenities: [
          'High-speed fiber internet',
          'Meeting rooms',
          'Phone booths',
          'Standing desks',
          'Ergonomic chairs',
          'Printer/scanner',
          'Kitchen',
          'Outdoor terrace'
        ]
      }
    })
    
    // Sample Cafe
    await client.create({
      _type: 'listing',
      name: 'Green Leaf Cafe',
      slug: { 
        _type: 'slug',
        current: 'green-leaf-cafe' 
      },
      category: 'cafe',
      city: {
        _type: 'reference',
        _ref: chiangMaiCity._id
      },
      addressString: '456 Nimmanhaemin Road, Chiang Mai',
      coordinates: {
        lat: 18.7953,
        lng: 98.9638
      },
      descriptionShort: 'Eco-friendly cafe with organic coffee and plant-based menu',
      descriptionLong: 'Green Leaf Cafe is a peaceful workspace in the heart of Nimman. We source our coffee beans directly from organic farms in northern Thailand, ensuring fair compensation for farmers. Our menu features a wide range of plant-based options made with locally sourced ingredients.\n\nThe cafe is designed with digital nomads in mind, with plenty of outlets, comfortable seating, and reliable WiFi. Our large windows provide ample natural light, and our garden seating area is perfect for working outdoors.',
      ecoFocusTags: [
        {
          _type: 'reference',
          _ref: ecoTags[0]._id // Zero Waste
        },
        {
          _type: 'reference',
          _ref: ecoTags[2]._id // Plant-Based Options
        }
      ],
      ecoNotesDetailed: 'We source ingredients from local organic farms to reduce our carbon footprint. Our coffee beans are shade-grown and bird-friendly certified. We use biodegradable packaging and encourage customers to bring their own containers for takeaway orders. All food waste is composted and used in our small garden.',
      sourceUrls: ['https://example.com/greenleaf'],
      digitalNomadFeatures: [
        {
          _type: 'reference',
          _ref: nomadFeatures[0]._id // Fast WiFi
        },
        {
          _type: 'reference',
          _ref: nomadFeatures[1]._id // Power Outlets
        }
      ],
      lastVerifiedDate: new Date().toISOString(),
      cafeDetails: {
        operatingHours: 'Daily: 7am - 8pm',
        priceIndication: '฿฿ (80-150 THB)',
        menuHighlights: [
          'Organic Coffee',
          'Plant-Based Breakfast Bowl',
          'Avocado Toast',
          'Vegan Brownies',
          'Fresh Fruit Smoothies'
        ],
        wifiReliabilityNotes: '100 Mbps fiber connection, stable throughout the day.'
      }
    })

    console.log('Test data created successfully!')
  } catch (error) {
    console.error('Error creating test data:', error)
  }
}

createTestData()
