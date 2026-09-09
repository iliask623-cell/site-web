export interface Wilaya {
  code: string
  fr: string
  ar: string
  center: [number, number]
}

export const WILAYAS: Wilaya[] = [
  { code: '01', fr: 'Adrar', ar: 'أدرار', center: [27.87, -0.29] },
  { code: '02', fr: 'Chlef', ar: 'الشلف', center: [36.165, 1.335] },
  { code: '03', fr: 'Laghouat', ar: 'الأغواط', center: [33.8, 2.865] },
  { code: '04', fr: 'Oum El Bouaghi', ar: 'أم البواقي', center: [35.876, 7.114] },
  { code: '05', fr: 'Batna', ar: 'باتنة', center: [35.556, 6.174] },
  { code: '06', fr: 'Béjaïa', ar: 'بجاية', center: [36.753, 5.084] },
  { code: '07', fr: 'Biskra', ar: 'بسكرة', center: [34.85, 5.728] },
  { code: '08', fr: 'Béchar', ar: 'بشار', center: [31.615, -2.218] },
  { code: '09', fr: 'Blida', ar: 'البليدة', center: [36.47, 2.828] },
  { code: '10', fr: 'Bouira', ar: 'البويرة', center: [36.373, 3.902] },
  { code: '11', fr: 'Tamanrasset', ar: 'تمنراست', center: [22.785, 5.522] },
  { code: '12', fr: 'Tébessa', ar: 'تبسة', center: [35.404, 8.124] },
  { code: '13', fr: 'Tlemcen', ar: 'تلمسان', center: [34.878, -1.315] },
  { code: '14', fr: 'Tiaret', ar: 'تيارت', center: [35.371, 1.317] },
  { code: '15', fr: 'Tizi Ouzou', ar: 'تيزي وزو', center: [36.717, 4.045] },
  { code: '16', fr: 'Alger', ar: 'الجزائر', center: [36.753, 3.058] },
  { code: '17', fr: 'Djelfa', ar: 'الجلفة', center: [34.673, 3.263] },
  { code: '18', fr: 'Jijel', ar: 'جيجل', center: [36.822, 5.766] },
  { code: '19', fr: 'Sétif', ar: 'سطيف', center: [36.19, 5.411] },
  { code: '20', fr: 'Saïda', ar: 'سعيدة', center: [34.83, 0.151] },
  { code: '21', fr: 'Skikda', ar: 'سكيكدة', center: [36.879, 6.909] },
  { code: '22', fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس', center: [35.19, -0.63] },
  { code: '23', fr: 'Annaba', ar: 'عنابة', center: [36.9, 7.767] },
  { code: '24', fr: 'Guelma', ar: 'قالمة', center: [36.462, 7.427] },
  { code: '25', fr: 'Constantine', ar: 'قسنطينة', center: [36.365, 6.615] },
  { code: '26', fr: 'Médéa', ar: 'المدية', center: [36.264, 2.754] },
  { code: '27', fr: 'Mostaganem', ar: 'مستغانم', center: [35.935, 0.089] },
  { code: '28', fr: "M'Sila", ar: 'المسيلة', center: [35.705, 4.541] },
  { code: '29', fr: 'Mascara', ar: 'معسكر', center: [35.397, 0.14] },
  { code: '30', fr: 'Ouargla', ar: 'ورقلة', center: [31.949, 5.325] },
  { code: '31', fr: 'Oran', ar: 'وهران', center: [35.697, -0.633] },
  { code: '32', fr: 'El Bayadh', ar: 'البيض', center: [33.68, 1.019] },
  { code: '33', fr: 'Illizi', ar: 'إليزي', center: [26.483, 8.466] },
  { code: '34', fr: 'Bordj Bou Arréridj', ar: 'برج بوعريريج', center: [36.073, 4.76] },
  { code: '35', fr: 'Boumerdès', ar: 'بومرداس', center: [36.766, 3.477] },
  { code: '36', fr: 'El Tarf', ar: 'الطارف', center: [36.767, 8.313] },
  { code: '37', fr: 'Tindouf', ar: 'تندوف', center: [27.671, -8.147] },
  { code: '38', fr: 'Tissemsilt', ar: 'تيسمسيلت', center: [35.607, 1.811] },
  { code: '39', fr: 'El Oued', ar: 'الوادي', center: [33.368, 6.867] },
  { code: '40', fr: 'Khenchela', ar: 'خنشلة', center: [35.436, 7.143] },
  { code: '41', fr: 'Souk Ahras', ar: 'سوق أهراس', center: [36.286, 7.951] },
  { code: '42', fr: 'Tipaza', ar: 'تيبازة', center: [36.589, 2.447] },
  { code: '43', fr: 'Mila', ar: 'ميلة', center: [36.45, 6.264] },
  { code: '44', fr: 'Aïn Defla', ar: 'عين الدفلى', center: [36.264, 1.966] },
  { code: '45', fr: 'Naâma', ar: 'النعامة', center: [33.266, -0.317] },
  { code: '46', fr: 'Aïn Témouchent', ar: 'عين تموشنت', center: [35.298, -1.14] },
  { code: '47', fr: 'Ghardaïa', ar: 'غرداية', center: [32.491, 3.673] },
  { code: '48', fr: 'Relizane', ar: 'غليزان', center: [35.737, 0.556] },
  { code: '49', fr: 'Timimoun', ar: 'تيميمون', center: [29.263, 0.231] },
  { code: '50', fr: 'Bordj Badji Mokhtar', ar: 'برج باجي مختار', center: [21.328, 0.949] },
  { code: '51', fr: 'Ouled Djellal', ar: 'أولاد جلال', center: [34.428, 5.068] },
  { code: '52', fr: 'Béni Abbès', ar: 'بني عباس', center: [30.131, -2.164] },
  { code: '53', fr: 'In Salah', ar: 'عين صالح', center: [27.194, 2.478] },
  { code: '54', fr: 'In Guezzam', ar: 'عين قزام', center: [19.573, 5.767] },
  { code: '55', fr: 'Touggourt', ar: 'تقرت', center: [33.104, 6.059] },
  { code: '56', fr: 'Djanet', ar: 'جانت', center: [24.554, 9.483] },
  { code: '57', fr: "El M'Ghair", ar: 'المغير', center: [33.95, 5.917] },
  { code: '58', fr: 'El Meniaa', ar: 'المنيعة', center: [30.579, 2.883] },
]

export function wilayaName(code: string, lang: string): string {
  const w = WILAYAS.find((w) => w.code === code)
  if (!w) return code
  return lang === 'ar' ? `${w.code} - ${w.ar}` : `${w.code} - ${w.fr}`
}

export function wilayaCenter(code: string): [number, number] {
  return WILAYAS.find((w) => w.code === code)?.center ?? [36.753, 3.058]
}
