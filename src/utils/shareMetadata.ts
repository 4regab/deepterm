import { SharedMaterialDataSchema, type SharedMaterialData } from '@/lib/schemas/sharing'

export interface SharePageMeta {
  title: string
  typeLabel: 'Flashcards' | 'Reviewer'
  itemCount: number
  description: string
}

export function parseSharedMaterial(data: unknown): SharedMaterialData | null {
  const parsed = SharedMaterialDataSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

export function buildSharePageMeta(data: SharedMaterialData): SharePageMeta {
  const title = data.material.title?.trim() || 'Shared Study Material'

  if (data.type === 'flashcard_set') {
    const itemCount = data.items.length
    return {
      title,
      typeLabel: 'Flashcards',
      itemCount,
      description: `Study ${title} - ${itemCount} flashcards on DeepTerm. Free AI-powered study tools.`,
    }
  }

  const itemCount = data.categories.reduce((sum, category) => sum + category.terms.length, 0)
  return {
    title,
    typeLabel: 'Reviewer',
    itemCount,
    description: `Study ${title} - ${itemCount} reviewer terms on DeepTerm. Free AI-powered study tools.`,
  }
}
