import {from, Observable, Subject} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import axios from "axios";
import {xml2js} from "xml-js";
import * as moment from 'moment'
import {DateTime, IANAZone} from "luxon";

interface TextElement {
  _text?: string
}

interface _TitleItem {
  TID: TextElement
  LastUpdate: TextElement
  Title: TextElement
  ShortTitle: TextElement
  TitleYomi: TextElement
  TitleEn: TextElement
  Comment: TextElement
  Cat: TextElement
  TitleFlag: TextElement
  FirstYear: TextElement
  FirstMonth: TextElement
  FirstEndYear: TextElement
  FirstEndMonth: TextElement
  FirstCh: TextElement
  Keywords: TextElement
  SubTitles: TextElement
}

interface _TitleLookupResponse {
  Result: {}
  TitleItems: {
    TitleItem: _TitleItem
  }
}

interface _Root {
  TitleLookupResponse: _TitleLookupResponse
}

export type TID = string
export interface TitleItem {
  TID: number
  LastUpdate: DateTime
  Title: string
  TitleYomi: string
  FirstYear: number
  FirstMonth: number
  FirstEndYear?: number
  FirstEndMonth?: number
  SubTitles: {[key:number]: string}
}

export class Title {

  private readonly _query$: Subject<TID>
  private readonly _observable$: Observable<TitleItem>

  constructor() {
    this._query$ = new Subject<TID>();
    this._observable$ = this._query$.pipe(
      mergeMap((tid: TID) => {
        return from(axios.get(`http://cal.syoboi.jp/db.php?Command=TitleLookup&TID=${tid}`, {
          transformResponse: response => {
            return xml2js(response as string, {compact: true})
          }
        }))
      }),
      map(response => {
        const data = response.data as _Root
        const titleItem = data.TitleLookupResponse.TitleItems.TitleItem

        return <TitleItem>{
          TID: Number(titleItem.TID._text),
          LastUpdate: DateTime.fromFormat(titleItem.LastUpdate._text!, 'yyyy-MM-dd HH:mm:ss', {
            zone: IANAZone.create('Asia/Tokyo')
          }),
          Title: titleItem.Title._text,
          TitleYomi: titleItem.TitleYomi._text,
          FirstYear: Number(titleItem.FirstYear._text),
          FirstMonth: Number(titleItem.FirstMonth._text),
          FirstEndYear: titleItem.FirstEndYear._text ? Number(titleItem.FirstEndYear._text) : undefined,
          FirstEndMonth: titleItem.FirstEndMonth._text ? Number(titleItem.FirstEndMonth._text) : undefined,
          SubTitles: this.convertSubTitle(titleItem.SubTitles)
        }
      })
    )
  }

  private convertSubTitle(t: TextElement): {[key:number]: string} {
    const result: {[key:number]: string} = {}
    if (t._text) {
      const regex = /\*([0-9]+)\*(.*)/
      const lines = t._text.split('\r\n')

      lines.forEach(line => {
        const m = line.match(regex)
        if (m) {
          result[Number(m[1])] = m[2]
        }
      })
    }
    return result
  }

  next(tid: TID) {
    this._query$.next(tid)
  }

  get asObservable(): Observable<TitleItem> {
    return this._observable$
  }
}
