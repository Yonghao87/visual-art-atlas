export const categories = {
  world_painting: {
    label: '世界绘画',
    english: 'World painting',
    code: '01',
    description: '在笔触与光线之间，重新观看世界。',
    color: '#586c65',
  },
  eastern_art: {
    label: '东方艺术',
    english: 'Eastern art',
    code: '02',
    description: '线、墨、纸与留白的无限可能。',
    color: '#445970',
  },
  digital_art: {
    label: '数字绘画',
    english: 'Digital art',
    code: '03',
    description: '从一块色彩，抵达想象的世界。',
    color: '#68576d',
  },
  graphic_design: {
    label: '平面设计',
    english: 'Graphic design',
    code: '04',
    description: '让文字与形状成为有秩序的声音。',
    color: '#994737',
  },
  architecture: {
    label: '建筑空间',
    english: 'Architecture',
    code: '05',
    description: '在实体、光与空隙中寻找尺度。',
    color: '#7c776b',
  },
  fashion_craft: {
    label: '服装雕塑工艺',
    english: 'Fashion & craft',
    code: '06',
    description: '材料中的身体，时间中的手艺。',
    color: '#886b55',
  },
  product_design: {
    label: '产品与跨界',
    english: 'Objects & beyond',
    code: '07',
    description: '用日常之物，理解设计的分寸。',
    color: '#5b655c',
  },
} as const;
export type Category = keyof typeof categories;
export const categoryKeys = Object.keys(categories) as [
  Category,
  ...Category[],
];
export const topicTypes = {
  movement: '艺术流派',
  artist: '创作者',
  artwork: '作品档案',
  technique: '技法与材料',
  design_method: '设计方法',
  cross_disciplinary: '跨界主题',
} as const;
export type TopicType = keyof typeof topicTypes;
export const topicTypeKeys = Object.keys(topicTypes) as [
  TopicType,
  ...TopicType[],
];
export const featureKeys = [
  'composition',
  'lighting',
  'color',
  'form',
  'linework',
  'texture',
  'material',
  'space',
  'typography',
  'other',
] as const;
export const synonyms = [
  ['浮世绘', 'ukiyo-e', 'ukiyo e'],
  ['印象派', 'impressionism'],
  ['包豪斯', 'bauhaus'],
  ['明暗对照', 'chiaroscuro'],
  ['迪特·拉姆斯', 'dieter rams'],
  ['勒·柯布西耶', 'le corbusier'],
  ['罗丹', 'rodin'],
  ['留白', 'negative space'],
] as const;
