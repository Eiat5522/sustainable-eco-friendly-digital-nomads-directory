/**
 * Rich Text schema for Sanity CMS
 * Demonstrates complex portable text features
 */

export default {
  name: 'richText',
  title: 'Rich Text',
  type: 'object',
  validation: Rule => Rule.required(),
  fields: [
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      validation: Rule => Rule.required().min(1).error('Content cannot be empty'),
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' }
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
              { title: 'Underline', value: 'underline' },
              { title: 'Strike', value: 'strike-through' }
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL'
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new window',
                    initialValue: true
                  }
                ]
              },
              {
                name: 'internalReference',
                type: 'object',
                title: 'Internal Reference',
                fields: [
                  {
                    name: 'reference',
                    type: 'reference',
                    title: 'Reference',
                    to: [
                      { type: 'listing' },
                      { type: 'blogPost' }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              validation: Rule => Rule.required()
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        },
        {
          type: 'code',
          options: {
            languageAlternatives: [
              { title: 'JavaScript', value: 'javascript' },
              { title: 'HTML', value: 'html' },
              { title: 'CSS', value: 'css' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'Python', value: 'python' }
            ]
          }
        }
      ]
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'string',
      validation: Rule => Rule
        .required()
        .min(10)
        .max(300)
        .error('Excerpt must be between 10 and 300 characters')
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      validation: Rule => Rule.required(),
      fields: [
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          validation: Rule => Rule
            .required()
            .min(1)
            .max(10)
            .unique()
            .error('Must have 1-10 unique keywords'),
          of: [{ type: 'string' }]
        },
        {
          name: 'readTime',
          title: 'Read Time (minutes)',
          type: 'number',
          validation: Rule => Rule
            .required()
            .min(1)
            .max(60)
            .integer()
            .error('Read time must be between 1-60 minutes')
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'excerpt',
      subtitle: 'metadata.readTime'
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'No excerpt provided',
        subtitle: subtitle ? `${subtitle} min read` : 'Read time not set'
      }
    }
  }
}
