import {from, Observable, Subject} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import axios from "axios";
import {xml2js} from "xml-js";
import * as moment from 'moment'
import {QueryResult} from "./programs";

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
    TitleItem: _TitleItem | _TitleItem[]
  }
}

interface _Root {
  TitleLookupResponse: _TitleLookupResponse
}

export type TID = string
export interface TitleItem {
  TID: number
  LastUpdate: moment.Moment
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
        const titleItem: _TitleItem = Array.isArray(data.TitleLookupResponse.TitleItems) ?
          data.TitleLookupResponse.TitleItems[0] : data.TitleLookupResponse.TitleItems

        return <TitleItem>{
          TID: Number(titleItem.TID._text),
          LastUpdate: moment(titleItem.LastUpdate._text)
        }
      })
    )
  }

  next(tid: TID) {
    this._query$.next(tid)
  }

  get asObservable(): Observable<TitleItem> {
    return this._observable$
  }
}
