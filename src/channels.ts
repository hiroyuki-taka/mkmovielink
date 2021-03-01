import {combineLatest, Observable, ReplaySubject} from "rxjs";
import {xml2js} from "xml-js";
import {map} from "rxjs/operators";
import * as log4js from 'log4js'
import {HttpClient} from "./httpClient";
import {ChItem, ChMap, MirakurunChID, MirakurunChName} from "./types";

interface TextNode {
  _text: string
}

interface _ChItem {
  ChID: TextNode
  ChName: TextNode
  ChiEPGName: Partial<TextNode>
  ChURL: TextNode
  ChEPGURL: TextNode
  ChComment: Partial<TextNode>
  ChGID: TextNode
  ChNumber: TextNode
}

interface _Root {
  ChLookupResponse: {
    ChItems: {
      ChItem: _ChItem[]
    }
  }
}

interface MirakurunService {
  type: 'GR' | 'CS' | 'BS',
  channel: string
  name: string
  services: {
    name: string
  }[]
}


export class Channels {

  readonly channels$: Observable<ChMap>
  readonly logger: log4js.Logger

  constructor(readonly httpClient: HttpClient) {
    this.logger = log4js.getLogger('Channel')

    const r$ = new ReplaySubject<ChMap>(1)
    this.channels$ = r$

    // しょぼカルのチャンネル一覧取得
    const c$ = this.httpClient.request<_Root>('get', 'http://cal.syoboi.jp/db.php?Command=ChLookup', data => {
      return xml2js(data, {compact: true})
    }).pipe(
      map(response => {
        return response.data.ChLookupResponse.ChItems.ChItem
          .map(_p => {
            return <ChItem>{
              ChID: Number(_p.ChID._text),
              ChName: _p.ChName._text,
              ChiEPGName: _p.ChiEPGName._text,
              ChURL: _p.ChURL._text,
              ChEPGURL: _p.ChEPGURL._text,
              ChComment: _p.ChComment._text,
              ChGID: Number(_p.ChGID._text),
              ChNumber: Number(_p.ChNumber._text)
            }
          })
      })
    )

    // mirakurunのチャンネル一覧取得
    const d$ = this.httpClient.request<MirakurunService[]>('get', 'http://192.168.0.170:40772/api/channels').pipe(
      map(response => {
        const result: { [key: string]: string } = {};
        response.data.forEach(value => {
          switch (value.type) {
            case 'GR':
              // 半角へ変換
              const name = value.name
                .replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
              result[name] = value.channel
              break
            case 'BS':
              value.services.forEach(s => {
                const name = s.name
                  .replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
                result[name] = value.channel
              })
              break
            case 'CS':
              value.services.forEach(s => {
                const name = s.name
                  .replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
                if (name === 'AT-X' || name === 'BSアニマックス' || name === 'キッズステーション') {
                  result[name] = value.channel
                }
              })
              break
          }
        })
        return result
      })
    )

    // 結合
    combineLatest([c$, d$])
      .subscribe(([c, d]) => {
        const chmap: ChMap = {}

        Object.keys(d).forEach((name: MirakurunChName) => {
          const id: MirakurunChID = d[name]
          const searchKey = name
            .replace('NHKEテレ', 'NHK Eテレ')
            .replace('日テレ', '日本テレビ')
            .replace('チバテレ', 'チバテレビ')
            .replace('J:COMチャンネル', 'J:COMテレビ')
            .replace('NHKBS1', 'NHK-BS1')
            .replace('BS朝日1', 'BS朝日')
            .replace('BS日本テレビ', 'BS日テレ')
            .replace('NHKBSプレミアム', 'NHK BSプレミアム')
            .replace('BSフジ・181', 'BSフジ')
            .replace('TOKYO　MX', 'TOKYO MX')
            .replace('BSアニマックス', 'アニマックス')

          chmap[id] = c.find(chItem => chItem.ChName == searchKey)
        })
        r$.next(chmap)
        r$.complete()
      })
  }

  get asObservable(): Observable<ChMap> {
    return this.channels$
  }
}
