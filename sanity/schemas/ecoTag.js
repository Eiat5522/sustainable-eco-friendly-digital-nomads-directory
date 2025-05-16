import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'ecoTag',
  title: 'Eco Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})
