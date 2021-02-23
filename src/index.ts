import {Command, flags} from '@oclif/command'
import * as log4js from 'log4js'
import {LocalFiles} from "./local_files";
import {mergeMap} from "rxjs/operators";
import {combineLatest, EMPTY, of} from "rxjs";
import {Programs} from "./programs";
import {Channels} from "./channels";
import {Titles} from "./titles";
import {isChItem, ProgItem, TargetFile, TitleItem} from "./types";
import {Http} from "./http";
import * as path from "path";
import * as fs from 'fs';

const sanitize = require("sanitize-filename");

log4js.configure({
  appenders: {
    out: {type: 'stdout'}
  },
  categories: {
    'default': {appenders: ['out'], level: 'all'},
  }
})

class Mkmovielink extends Command {
  readonly logger: log4js.Logger = log4js.getLogger()

  static description = 'describe the command here'

  static flags = {
    version: flags.version({char: 'v'}),
    encoded: flags.string({char: 'e', description: 'name to encoded movie directory'}),
    name: flags.string({char: 'n', description: 'name to print'}),
    destination: flags.string({char: 'd', description: 'name to target'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Mkmovielink)

    const encoded = flags.encoded ?? '/srv/movie_temp/encoded/アニメ／特撮'
    const storageRoot = flags.name ?? '/srv/movie/'
    const kanaStorageRoot = flags.destination ?? '/srv/movie_kana'

    const httpClient = new Http()
    const programs = new Programs(httpClient)
    const channels = new Channels(httpClient)
    const titles = new Titles(httpClient)

    return new Promise((resolve, reject) => {
      new LocalFiles().list(encoded).pipe(
        mergeMap(files => of(...files)),
        mergeMap(file => combineLatest([
          of(file),
          programs.find({channel: file.mirakurunChId, start: file.start}),
          channels.asObservable
        ])),
        mergeMap(([file, queryResult, chMap]) => {
          const mirakurunChId = file.mirakurunChId
          const targetChannel = chMap[mirakurunChId]

          if (isChItem(targetChannel)) {
            const program = queryResult.programs.find(
              p => p.ChID === targetChannel.ChID && p.StTime.equals(file.start)
            )

            if (program) {
              this.logger.info(`find file: ${file.name}, TID: ${program.TID}, count: ${program.Count}, subtitle: ${program.STSubTitle}`)
              return combineLatest<[TargetFile, ProgItem, TitleItem]>([of(file), of(program), titles.find(program.TID)])
            }
          }
          return EMPTY
        })
      )
        .subscribe(([file, program, title]) => {
          const newName = `[${file.mirakurunChId}] #${this.toCount(program, title)} ${this.normalizeSubTitle(program.STSubTitle)}-${file.start.toFormat('yyyy年MM月dd日HH時mm分')}`
          const containerDirectory = this.normalizeSubTitle(`${this.toSeason(title.FirstYear, title.FirstMonth)} ${title.Title}`)

          const output = path.join(storageRoot, containerDirectory)
          const kanaContainer = path.join(kanaStorageRoot, title.TitleYomi.slice(0, 1))
          const kanaOutput = path.join(kanaContainer, containerDirectory)

          this.logger.info(`create container directory(${output}), if not exist.`)
          fs.mkdirSync(output, {recursive: true})
          fs.mkdirSync(kanaContainer, {recursive: true})
          if (!fs.existsSync(kanaOutput)) {
            fs.symlinkSync(output, kanaOutput, 'dir')
          }

          this.logger.info('move %s -> %s', path.join(file.folder, file.name), path.join(output, `${newName}.mp4`))
          if (!fs.existsSync(path.join(output, `${newName}.mp4`))) {
            fs.renameSync(path.join(file.folder, file.name), path.join(output, `${newName}.mp4`))
          }

          if (file.ass) {
            this.logger.info('move %s -> %s', path.join(file.folder, file.ass), path.join(output, `${newName}.ass`))
            if (!fs.existsSync(path.join(output, `${newName}.ass`))) {
              fs.renameSync(path.join(file.folder, file.ass), path.join(output, `${newName}.ass`))
            }
          }
          Object.entries(file.extends).forEach(([key, name]) => {
            this.logger.info('move %s -> %s', path.join(file.folder, name), path.join(output, `${newName}${key}`))
            if (!fs.existsSync(path.join(output, `${newName}${key}`))) {
              fs.renameSync(path.join(file.folder, name), path.join(output, `${newName}${key}`))
            }
          })
        }, error => {
          reject(error)
        }, () => {
          resolve()
          httpClient.dispose()
        })
    })
  }

  protected async finally(_: Error | undefined) {
    log4js.shutdown((error => {
      if (error) throw error
    }))
  }

  private toSeason(firstStartYear: number, firstStartMonth: number): string {
    return `${firstStartYear}${Math.floor((firstStartMonth - 1) / 3) + 1}Q`
  }

  private toCount(program: ProgItem, title: TitleItem): string {
    if (title.SubTitles) {
      const maxLength = Math.max(2, ...Object.keys(title.SubTitles).map(x => String(x).length))
      return String(program.Count || '0').padStart(maxLength, '0')
    }

    return String(program.Count).padStart(2, '0')
  }

  private normalizeSubTitle<T = string | undefined>(STSubTitle: T): T {
    if (!STSubTitle) {
      return STSubTitle
    }

    return sanitize(STSubTitle, {
      replacement: (substring: string) => {
        this.logger.info('convert: %s', substring)
        const ch = substring.charCodeAt(0)
        if (0x0020 < ch && ch < 0x007f) {
          return String.fromCharCode(ch + 0xfee0)
        } else {
          throw substring
        }
      }
    })
  }
}

export = Mkmovielink
