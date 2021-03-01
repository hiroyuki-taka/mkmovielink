import {Programs} from "../src/programs";
import {Channels} from "../src/channels";
import {combineLatest} from "rxjs";
import {DateTime} from "luxon";
import {ChMap, QueryResult} from "../src/types";
import {HttpClient} from "../src/httpClient";

describe('programs', () => {

  const httpClient = new HttpClient()
  const programs = new Programs(httpClient)
  const channel = new Channels(httpClient)

  it('20210113_000000', async () => {
    return new Promise((resolve, reject) => {
      combineLatest([programs.findJson({
        channel: '23',
        start: DateTime.fromISO('2021-01-12T01:30:00+09')
      }), channel.asObservable])
        .subscribe(([queryResult, chMap]: [QueryResult, ChMap]) => {
          const mirakurunChId = queryResult.query.channel
          const targetChannel = chMap[mirakurunChId]

          console.log(JSON.stringify(queryResult, undefined, 2))
          console.log('targetChannel', targetChannel)
          if (targetChannel === undefined || typeof targetChannel === 'string') {
            return
          } else {
            queryResult.programs
              // 1週間分の番組表の中から、チャンネル+開始時間が一致する番組を検索
              .filter(p => p.ChID == targetChannel.ChID && p.StTime.equals(queryResult.query.start))
              .forEach(p => {
                console.log(JSON.stringify(p))
              })
          }

          resolve()
        })
    })
  })


})
