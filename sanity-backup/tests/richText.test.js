import { describe, it, expect } from '@jest/globals'
import richTextSchema from '../schemas/richText'

describe('Rich Text Schema', () => {
  describe('Schema Structure', () => {
    it('has correct base configuration', () => {
      expect(richTextSchema.name).toBe('richText')
      expect(richTextSchema.type).toBe('object')
      expect(richTextSchema.fields).toHaveLength(3)
    })

    it('has required content field with correct structure', () => {
      const contentField = richTextSchema.fields.find(f => f.name === 'content')
      expect(contentField).toBeDefined()
      expect(contentField.type).toBe('array')
      expect(contentField.validation).toBeDefined()
      
      const blockType = contentField.of.find(type => type.type === 'block')
      expect(blockType.styles).toHaveLength(5) // Normal, H1-H3, Quote
      expect(blockType.marks.decorators).toHaveLength(5)
      expect(blockType.marks.annotations).toHaveLength(2)
    })

    it('has image type with required alt text', () => {
      const contentField = richTextSchema.fields.find(f => f.name === 'content')
      const imageType = contentField.of.find(type => type.type === 'image')
      const altField = imageType.fields.find(f => f.name === 'alt')
      
      expect(imageType).toBeDefined()
      expect(altField).toBeDefined()
      expect(altField.validation).toBeDefined()
    })
  })

  describe('Validation Rules', () => {
    it('validates excerpt length constraints', () => {
      const excerptField = richTextSchema.fields.find(f => f.name === 'excerpt')
      const validation = excerptField.validation.toString()
      
      expect(validation).toContain('.required()')
      expect(validation).toContain('.min(10)')
      expect(validation).toContain('.max(300)')
    })

    it('validates metadata requirements', () => {
      const metadataField = richTextSchema.fields.find(f => f.name === 'metadata')
      const keywordsField = metadataField.fields.find(f => f.name === 'keywords')
      const readTimeField = metadataField.fields.find(f => f.name === 'readTime')
      
      expect(keywordsField.validation).toBeDefined()
      expect(readTimeField.validation).toBeDefined()
      
      const keywordsValidation = keywordsField.validation.toString()
      expect(keywordsValidation).toContain('.min(1)')
      expect(keywordsValidation).toContain('.max(10)')
      expect(keywordsValidation).toContain('.unique()')
      
      const readTimeValidation = readTimeField.validation.toString()
      expect(readTimeValidation).toContain('.min(1)')
      expect(readTimeValidation).toContain('.max(60)')
      expect(readTimeValidation).toContain('.integer()')
    })
  })

  describe('Preview Configuration', () => {
    it('has correct preview configuration', () => {
      expect(richTextSchema.preview).toBeDefined()
      expect(richTextSchema.preview.select).toEqual({
        title: 'excerpt',
        subtitle: 'metadata.readTime'
      })
    })

    it('formats preview correctly', () => {
      const { prepare } = richTextSchema.preview
      
      expect(prepare({ title: 'Test', subtitle: 5 }))
        .toEqual({
          title: 'Test',
          subtitle: '5 min read'
        })
      
      expect(prepare({}))
        .toEqual({
          title: 'No excerpt provided',
          subtitle: 'Read time not set'
        })
    })
  })
})
