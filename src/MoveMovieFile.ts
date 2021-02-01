import {DirectoryName, isChItem, ProgItem, TargetFile, TitleItem} from "./types";
import * as log4js from 'log4js'
import {LocalFiles} from "./local_files";
import {DateTime} from "luxon";
import {map, max, mergeMap, take, tap} from "rxjs/operators";
import {combineLatest, EMPTY, NEVER, Observable, of} from "rxjs";
import {Programs} from "./programs";
import {Channels} from "./channels";
import {Titles} from "./titles";
import * as path from "path";
import {Http} from "./http";

export class MoveMovieFile {

  readonly logger: log4js.Logger
  readonly httpClient: Http
  readonly localFiles: LocalFiles
  readonly programs: Programs
  readonly channels: Channels
  readonly titles: Titles

  constructor() {
    this.logger = log4js.getLogger('MoveTargetFolder')
    this.localFiles = new LocalFiles()
    this.httpClient = new Http()
    this.programs = new Programs(this.httpClient)
    this.channels = new Channels(this.httpClient)
    this.titles = new Titles(this.httpClient)
  }

  execute(movieRoot: DirectoryName, storageRoot: DirectoryName, kanaRoot: DirectoryName) {
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
        const newName = `[${file.mirakurunChId}] #${this.toCount(program, title)} ${program.STSubTitle}`
        const containerDirectory = `${this.toSeason(title.FirstYear, title.FirstMonth)} ${title.Title}`

        this.logger.info('move %s -> %s',
          path.join(file.folder, file.title),
          path.join(storageRoot, containerDirectory, `${newName}.mp4`))
        this.logger.info('ln -s %s -> %s',
          path.join(storageRoot, containerDirectory, `${newName}.mp4`),
          path.join(kanaRoot, title.TitleYomi.slice(0, 1), containerDirectory, `${newName}.mp4`))

        if (file.ass) {
          this.logger.info('move %s -> %s',
            path.join(file.folder, file.ass),
            path.join(storageRoot, containerDirectory, `${newName}.ass`))
          this.logger.info('ln -s %s -> %s',
            path.join(storageRoot, containerDirectory, `${newName}.ass`),
            path.join(kanaRoot, title.TitleYomi.slice(0, 1), containerDirectory, `${newName}.ass`))
        }

        Object.entries(file.extends).forEach(([key, name]) => {
          this.logger.info('move %s -> %s', path.join(file.folder, name), path.join(storageRoot, containerDirectory, `${newName}${key}`))
        })
        return ''
      })
    )
  }

  private toSeason(firstStartYear: number, firstStartMonth: number): string {
    return `${firstStartYear}${Math.ceil(firstStartMonth/4)+1}Q`
  }

  private toCount(program: ProgItem, title: TitleItem): string {
    if (title.SubTitles) {
      const maxLength = Math.max(...Object.keys(title.SubTitles).map(x => String(x).length))
      return String(program.Count).padStart(maxLength, '0')
    }

    return String(program.Count).padStart(2, '0')
  }
}
