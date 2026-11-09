/** Şehir rehberi veri şeması. Her il için bir dosya: src/data/guide/<plaka>.json, resimler src/data/guide/img/<plaka>-<id>.jpg */
export interface GuideImage { file: string; author: string; licence: string; source_url: string }
export interface GuideItem {
  id: string
  title_en: string
  title_tr: string
  text_en: string
  text_tr: string
  /** yer için */ lat?: number
  lon?: number
  /** yemek için */ local_name?: string
  ingredients_en?: string
  where_en?: string
  /** kültür notu */ culture_en?: string
  culture_tr?: string
  image?: GuideImage | null
  /** metnin kaynağı (Wikipedia/Wikivoyage vb.) ve lisansı */ source_url: string
  text_licence: string
}
export interface CityGuideData {
  plate: string
  name: string
  intro_en: string
  intro_tr: string
  culture: GuideItem[]
  sights: GuideItem[]
  foods: GuideItem[]
  streets: GuideItem[]
}
