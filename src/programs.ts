import {xml2js} from "xml-js";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DateTime} from "luxon";
import {ProgItem, Query, QueryResult} from "./types";
import {Http} from "./http";
import * as log4js from "log4js";

interface _ProgItem {
  _attributes: { id: string }
  PID: { _text: string },
  TID: { _text: string },
  StTime: { _text: string },
  StOffset: { _text: string },
  EdTime: { _text: string },
  Count: { _text?: string },
  ChID: { _text: string },
  SubTitle: { _text: string },
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


export class Programs {
  readonly logger: log4js.Logger
  private requestId = 0;

  constructor(readonly httpClient: Http) {
    this.logger = log4js.getLogger('LocalFiles')
  }

  find(query: Query): Observable<QueryResult> {
    const queryId = this.requestId++
    this.logger.info(`reqId: ${queryId}, find: ${JSON.stringify(query)}`)

    let date = query.start

    // 指定した日付を含む日曜から土曜まで
    const start = date.startOf('week')
    const end = date.plus({'week': 1}).startOf('week')

    const range = `${start.toFormat('yyyyMMdd')}_000000-${end.toFormat('yyyyMMdd')}_000000`

    return this.httpClient.request<_Root>('get', `http://cal.syoboi.jp/db.php?Command=ProgLookup&JOIN=SubTitles&Range=${range}`,
      response => xml2js(response as string, {compact: true})).pipe(
      map(response => {
        this.logger.info(`reqId: ${queryId} receive ProgLookup response`)
        const data = response.data

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
                Count: _p.Count._text ? Number(_p.Count._text) : undefined,
                ChID: Number(_p.ChID._text),
                SubTitle: _p.SubTitle._text,
                STSubTitle: _p.STSubTitle._text
              }
            })
        }
      })
    )
  }
}
