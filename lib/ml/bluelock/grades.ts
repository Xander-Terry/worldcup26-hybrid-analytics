import { GRADE_BANDS, type LetterGrade } from '@/config/ml-bluelock'

export function scoreToGrade(score: number): LetterGrade {
  for (const band of GRADE_BANDS) {
    if (score >= band.min && score <= band.max) {
      return band.grade as LetterGrade
    }
  }
  return 'G'
}
