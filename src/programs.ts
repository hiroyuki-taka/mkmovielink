import axios from "axios";
import {xml2js} from "xml-js";
import {from, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DateTime} from "luxon";

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
  start: DateTime
}

export interface QueryResult {
  query: Query
  programs: ProgItem[]
}

export interface ProgItem {
  id: number
  PID: string
  TID: string
  StTime: DateTime
  StOffset: number
  EdTime: DateTime
  Count?: number
  ChID: number
  STSubTitle?: string
}

export class Programs {

  constructor() {
  }

  find(query: Query): Observable<QueryResult> {
    let date = query.start

    // 指定した日付を含む日曜から土曜まで
    const start = date.startOf('week')
    const end = date.plus({'week': 1}).startOf('week')

    const range = `${start.toFormat('yyyyMMdd')}_000000-${end.toFormat('yyyyMMdd')}_000000`

    return from(axios.get(`http://cal.syoboi.jp/db.php?Command=ProgLookup&JOIN=SubTitles&Range=${range}`,
      {
        transformResponse: response => {
          return xml2js(response as string, {compact: true})
        }
      })).pipe(
      map(response => {
        const data = response.data as _Root

        return <QueryResult>{
          query: query,
          programs: data.ProgLookupResponse.ProgItems!.ProgItem
            .map(_p => {
              return <ProgItem>{
                id: Number(_p._attributes.id),
                PID: _p.PID._text,
                TID: _p.TID._text,
                StTime: DateTime.fromFormat(_p.StTime._text, 'yyyy-MM-dd HH:mm:ss'),
                StOffset: Number(_p.StOffset._text),
                EdTime: DateTime.fromFormat(_p.EdTime._text, 'yyyy-MM-dd HH:mm:ss'),
                Count: Number(_p.Count._text),
                ChID: Number(_p.ChID._text),
                STSubTitle: _p.STSubTitle._text
              }
            })
        }
      })
    )
  }
}
