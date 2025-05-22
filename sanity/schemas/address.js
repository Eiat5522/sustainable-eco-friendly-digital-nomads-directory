export default {
  name: 'address',
  title: 'Address',
  type: 'object',
  fields: [
    {
      name: 'streetAddress',
      title: 'Street Address',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'city',
      title: 'City',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'province',
      title: 'Province',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'postalCode',
      title: 'Postal Code',
      type: 'string'
    }
  ]
}
