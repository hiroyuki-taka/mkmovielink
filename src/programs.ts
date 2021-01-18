import {from, Observable, Subject} from "rxjs";
import {map, mergeMap, tap} from "rxjs/operators";
import axios, {AxiosResponse} from "axios";
import * as moment from "moment";
import {xml2js} from "xml-js";

interface _ProgItem {
    _attributes: { id: string }
    PID: { _text: string },
    TID: { _text: string },
    StTime: { _text: string },
    StOffset: { _text: string },
    EdTime: { _text: string },
    Count: { _text?: string },
    ChID: { _text: string },
    STSubTitle: { _text?: string }
}

interface _ProgItems {
  ProgItem: _ProgItem[]
}

interface _ProgLookupResponse {
  ProgItems: _ProgItems
}

interface _Root {
  ProgLookupResponse: _ProgLookupResponse
}

export interface ProgItem {
  id: number
  PID: string
  TID: string
  StTime: moment.Moment
  StOffset: number
  EdTime: moment.Moment
  Count?: number
  ChID: number
  STSubTitle?: string
}


export class Programs {

  query$: Subject<Date | moment.Moment>
  find$: Observable<ProgItem[]>

  constructor() {
    this.query$ = new Subject<Date | moment.Moment>()
    const find$ = new Subject<ProgItem[]>()

    this.find$ = find$

    this.query$
      .pipe(
        map((date: Date|moment.Moment) => {
          if (!moment.isMoment(date)) {
            date = moment(date)
          }

          // 指定した日付を含む日曜から土曜まで
          const start = date.clone().day(0)
          const end = date.clone().day(7)
          return `${start.format('YYYYMMDD')}_000000-${end.format('YYYYMMDD')}_000000`
        }),
        mergeMap((query: string) => from(axios.get(`https://cal.syoboi.jp/db.php?Command=ProgLookup&JOIN=SubTitles&Fiels=TID,StTime,StOffset,EdTime,Count,StSubTitle,ChID&Range=${query}`, {
          method: 'get',
          transformResponse: response => {
            return xml2js(response as string, {compact: true})
          }
        }))),
        map((response: AxiosResponse) => {
          const data = response.data as _Root
          console.log(data.ProgLookupResponse)
          return data.ProgLookupResponse.ProgItems.ProgItem
            .map(_p => {
              return <ProgItem>{
                id: Number(_p._attributes.id),
                PID: _p.PID._text,
                TID: _p.TID._text,
                StTime: moment(_p.StTime._text, 'YYYY-MM-DD HH:mm:ss'),
                StOffset: Number(_p.StOffset._text),
                EdTime: moment(_p.EdTime._text, 'YYYY-MM-DD HH:mm:ss'),
                Count: Number(_p.Count._text),
                ChID: Number(_p.ChID._text),
                STSubTitle: _p.STSubTitle._text
              }
            })
        })
      ).subscribe(doc => {
        find$.next(doc)
      })
  }
}
