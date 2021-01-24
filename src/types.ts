import {DateTime} from "luxon";

export type MirakurunChID = string
export type MirakurunChName = string
export type Filename = string
export type DirectoryName = string
export type TID = string


export interface TargetFile {
  folder: string
  name: Filename
  mirakurunChId: string
  title: string
  start: DateTime
  ass: Filename
  extends: {[key: string]: Filename}
}

export interface ChItem {
  ChID: number
  ChName: string
  ChGID: number
  ChNumber: number
  ChURL: string
  ChiEPGName: string
  ChEPGURL: string
}

export function isChItem(arg: any): arg is ChItem {
  return arg && arg.ChID !== undefined
}

export interface ChMap {
  [key: string /* MirakurunChID */]: ChItem | undefined | MirakurunChName
}

export interface TitleItem {
  TID: TID
  LastUpdate: DateTime
  Title: string
  TitleYomi: string
  FirstYear: number
  FirstMonth: number
  FirstEndYear?: number
  FirstEndMonth?: number
  SubTitles: { [key: number]: string }
}


export interface Query {
  channel: string
  start: DateTime
}

export interface QueryResult {
  query: Query
  programs: ProgItem[]
}

export interface ProgItem {
  id: number
  PID: string
  TID: TID
  StTime: DateTime
  StOffset: number
  EdTime: DateTime
  Count?: number
  ChID: number
  STSubTitle?: string
}

