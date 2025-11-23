import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'amenity',
  title: 'Amenity',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.max(300),
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
});
