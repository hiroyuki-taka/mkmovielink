import {from, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {xml2js} from "xml-js";
import {DateTime, IANAZone} from "luxon";
import {TID, TitleItem} from "./types";
import {Http} from "./http";
import * as log4js from "log4js";

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


export class Titles {
  readonly logger: log4js.Logger

  constructor(readonly httpClient: Http) {
    this.logger = log4js.getLogger('Titles')
  }

  private convertSubTitle(t: TextElement): { [key: number]: string } {
    const result: { [key: number]: string } = {}
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

  find(tid: TID): Observable<TitleItem> {
    this.logger.info(`tid=${tid}, find`)
    return from(this.httpClient.request('get', `http://cal.syoboi.jp/db.php?Command=TitleLookup&TID=${tid}`, response => {
      return xml2js(response as string, {compact: true})
    })).pipe(
      map(response => {
        this.logger.info(`tid=${tid}, receive TitleLookup response`)

        const data = response.data as _Root
        const titleItem = data.TitleLookupResponse.TitleItems.TitleItem

        return <TitleItem>{
          TID: titleItem.TID._text,
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
}
