import type { LetterGrade } from '@/config/ml-bluelock'

export type BLCategory = 'shoot' | 'offense' | 'dribble' | 'pass' | 'speed' | 'defense'

export type BLStrikerVector = {
  player_id: string
  shoot: number
  offense: number
  dribble: number
  pass: number
  speed: number
  defense: number
}

export type BLGrades = {
  grade_shoot: LetterGrade
  grade_offense: LetterGrade
  grade_dribble: LetterGrade
  grade_pass: LetterGrade
  grade_speed: LetterGrade
  grade_defense: LetterGrade
  overall_grade: LetterGrade
  overall_score: number
}

export type EgoCoord = {
  player_id: string
  ego_x: number
  ego_y: number
}

export type BLStrikerFull = BLStrikerVector & BLGrades & EgoCoord & {
  cluster_id: number
  archetype_label: string
}
