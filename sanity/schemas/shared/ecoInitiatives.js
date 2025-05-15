export default {
  name: 'ecoInitiatives',
  title: 'Eco Initiatives',
  type: 'object',
  fields: [
    {
      name: 'sustainableEnergy',
      title: 'Sustainable Energy',
      type: 'boolean',
      description: 'Uses renewable energy sources'
    },
    {
      name: 'wasteManagement',
      title: 'Waste Management',
      type: 'boolean',
      description: 'Has recycling and composting programs'
    },
    {
      name: 'waterConservation',
      title: 'Water Conservation',
      type: 'boolean',
      description: 'Implements water-saving practices'
    },
    {
      name: 'localSourcing',
      title: 'Local Sourcing',
      type: 'boolean',
      description: 'Sources products/materials locally'
    },
    {
      name: 'plasticFree',
      title: 'Plastic Free',
      type: 'boolean',
      description: 'Maintains plastic-free practices'
    },
    {
      name: 'veganOptions',
      title: 'Vegan Options',
      type: 'boolean',
      description: 'Offers vegan-friendly options'
    },
    {
      name: 'certifications',
      title: 'Eco Certifications',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'LEED Certified', value: 'leed' },
          { title: 'Green Key', value: 'greenKey' },
          { title: 'Earth Check', value: 'earthCheck' },
          { title: 'Thai Green Hotel', value: 'thaiGreenHotel' }
        ]
      }
    },
    {
      name: 'additionalInitiatives',
      title: 'Additional Initiatives',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ]
}
