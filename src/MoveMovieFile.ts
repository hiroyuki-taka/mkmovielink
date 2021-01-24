import {DirectoryName, isChItem, ProgItem, TargetFile, TitleItem} from "./types";
import * as log4js from 'log4js'
import {LocalFiles} from "./local_files";
import {DateTime} from "luxon";
import {map, mergeMap, take, tap} from "rxjs/operators";
import {combineLatest, EMPTY, NEVER, Observable, of} from "rxjs";
import {Programs} from "./programs";
import {Channels} from "./channels";
import {Titles} from "./titles";

export class MoveMovieFile {

  readonly logger: log4js.Logger
  readonly localFiles: LocalFiles
  readonly programs: Programs
  readonly channels: Channels
  readonly titles: Titles

  constructor() {
    this.logger = log4js.getLogger('MoveTargetFolder')
    this.localFiles = new LocalFiles()
    this.programs = new Programs()
    this.channels = new Channels()
    this.titles = new Titles()
  }

  execute(movieRoot: DirectoryName, storageRoot: DirectoryName) {
    return this.localFiles.list(movieRoot).pipe(
      mergeMap<TargetFile[], Observable<TargetFile>>(fileList => of(...fileList)),
      take(30),
      mergeMap(file => combineLatest([
        of(file),
        this.programs.find({channel: file.mirakurunChId, start: file.start}),
        this.channels.asObservable
      ])),
      mergeMap(([file, queryResult, chMap]) => {
        const mirakurunChId = queryResult.query.channel
        const targetChannel = chMap[mirakurunChId]

        if (isChItem(targetChannel)) {
          // 1週間分の番組表の中から、チャンネル+開始時間が一致する番組を検索
          const program = queryResult.programs
            .find(p => p.ChID === targetChannel.ChID && p.StTime.equals(queryResult.query.start))

          if (program) {
            this.logger.info(`find targetProgram: ${JSON.stringify(program)}`)
            return combineLatest<[TargetFile, ProgItem, TitleItem]>([of(file), of(program), this.titles.find(program.TID)])
          }
        }
        return EMPTY
      }),
      map(([file, program, title]) => {
        this.logger.info('title: ' + title)
        return ''
      })
    )
  }

  private toSeason(start: DateTime): string {
    return `${start.year}${Math.ceil(start.month/4)+1}Q`
  }
}
