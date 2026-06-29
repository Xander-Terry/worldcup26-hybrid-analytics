export const NATIONALITY_FLAGS: Record<string, string> = {
  // Americas
  Argentina:   "🇦🇷", Brazil:      "🇧🇷", Canada:    "🇨🇦",
  Colombia:    "🇨🇴", Ecuador:     "🇪🇨", Mexico:    "🇲🇽",
  Panama:      "🇵🇦", Paraguay:    "🇵🇾", Uruguay:   "🇺🇾",
  "United States": "🇺🇸", Bolivia: "🇧🇴", Peru:      "🇵🇪",
  Venezuela:   "🇻🇪", Cuba:        "🇨🇺", Haiti:     "🇭🇹",
  Honduras:    "🇭🇳", "Costa Rica":"🇨🇷", 

  // Europe
  England:     "🇬🇧", France:      "🇫🇷", Germany:   "🇩🇪",
  Spain:       "🇪🇸", Portugal:    "🇵🇹", Italy:     "🇮🇹",
  Netherlands: "🇳🇱", Belgium:     "🇧🇪", Switzerland:"🇨🇭",
  Croatia:     "🇭🇷", Denmark:     "🇩🇰", Norway:    "🇳🇴",
  Sweden:      "🇸🇪", Poland:      "🇵🇱", Austria:   "🇦🇹",
  Scotland:    "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Wales:     "🏴󠁧󠁢󠁷󠁬", Serbia:    "🇷🇸",
  Romania:     "🇷🇴", Hungary:     "🇭🇺", Slovakia:  "🇸🇰",
  Ukraine:     "🇺🇦", Czechia:     "🇨🇿", Greece:    "🇬🇷",
  Turkey:      "🇹🇷", Türkiye:     "🇹🇷", Slovenia:  "🇸🇮",
  Albania:     "🇦🇱", Georgia:     "🇬🇪",

  // Africa
  Morocco:     "🇲🇦", Senegal:     "🇸🇳", Nigeria:   "🇳🇬",
  Egypt:       "🇪🇬", Algeria:     "🇩🇿", Tunisia:   "🇹🇳",
  Ghana:       "🇬🇭", Cameroon:    "🇨🇲", Mali:      "🇲🇱",
  "Ivory Coast":"🇨🇮", "Côte d'Ivoire":"🇨🇮",
  "South Africa":"🇿🇦", Angola:    "🇦🇴", "DR Congo":"🇨🇩",
  "Congo DR":  "🇨🇩", Tanzania:   "🇹🇿", Mozambique:"🇲🇿",

  // Asia / Oceania
  Japan:       "🇯🇵", "South Korea":"🇰🇷", "Korea Republic":"🇰🇷",
  Australia:   "🇦🇺", Iran:        "🇮🇷", "IR Iran": "🇮🇷",
  "Saudi Arabia":"🇸🇦", Qatar:     "🇶🇦", Iraq:      "🇮🇶",
  Jordan:      "🇯🇴", China:       "🇨🇳", Indonesia: "🇮🇩",
  Uzbekistan:  "🇺🇿", Tajikistan:  "🇹🇯",
  "New Zealand":"🇳🇿",

  // Caribbean
  Jamaica:     "🇯🇲", Trinidad:    "🇹🇹",
  "Cabo Verde":"🇨🇻", Curaçao:    "🇨🇼",
}

export function getFlag(nationality: string): string {
  return NATIONALITY_FLAGS[nationality] ?? "🏳️"
}