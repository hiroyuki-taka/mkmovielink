import axios, {AxiosResponse} from "axios";
import * as moment from "moment";
import {xml2js} from "xml-js";
import {from, Observable, of, Subject, zip} from "rxjs";
import {map, mergeMap} from "rxjs/operators";

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
  Result: {}
  ProgItems?: _ProgItems
}

interface _Root {
  ProgLookupResponse: _ProgLookupResponse
}

export interface Query {
  channel: string
  start: Date | moment.Moment
}

export interface QueryResult {
  query: Query
  programs: ProgItem[]
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

  private readonly _query$: Subject<Query>
  private readonly _observable$: Observable<QueryResult>

  constructor() {
    this._query$ = new Subject<Query>();
    this._observable$ = this._query$.pipe(
      mergeMap((query: Query) => {
        let date = query.start
        if (!moment.isMoment(date)) {
          date = moment(date)
        }

        // 指定した日付を含む日曜から土曜まで
        const start = date.clone().day(0)
        const end = date.clone().day(7)

        const range = `${start.format('YYYYMMDD')}_000000-${end.format('YYYYMMDD')}_000000`
        const httpRequest: Observable<AxiosResponse<_Root>> = from(axios.get(`http://cal.syoboi.jp/db.php?Command=ProgLookup&JOIN=SubTitles&Range=${range}`,
          {
            transformResponse: response => {
              return xml2js(response as string, {compact: true})
            }
          }))

        return zip(httpRequest, of(query))
      }),
      map(([response, query]: [AxiosResponse, Query]) => {
        const data = response.data as _Root

        return <QueryResult>{
          query: query,
          programs: data.ProgLookupResponse.ProgItems!.ProgItem
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
        }
      })
    )
  }

  next(q: Query) {
    this._query$.next(q)
  }

  get asObservable(): Observable<QueryResult> {
    return this._observable$
  }
}
