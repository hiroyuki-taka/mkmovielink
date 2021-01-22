import {bindNodeCallback, Observable} from "rxjs";
import * as fs from "fs";
import * as path from 'path';
import * as log4js from 'log4js';
import {map} from "rxjs/operators";
import {DateTime} from "luxon";
import {Filename, TargetFile} from "./types";

export class LocalFiles {

  readonly logger: log4js.Logger

  constructor() {
    this.logger = log4js.getLogger('LocalFiles')
  }

  list(root: string): Observable<TargetFile[]> {
    const targetName = /\[(.*)]-(.*)-([0-9]{4}年[0-9]{2}月[0-9]{2}日[0-9]{2}時[0-9]{2}分)(-.*)?\.(.*)/
    return bindNodeCallback(fs.readdir)(root).pipe(
      map((files) => {
        const groupingMap = new Map<string, RegExpMatchArray[]>();

        (files as string[])
          .map(name => {
            return name.match(targetName)
          })
          .forEach((m: RegExpMatchArray | null) => {
            if (m !== null) {
              const key = `${m[1]}-${m[2]}-${m[3]}`
              if (!groupingMap.has(key)) {
                groupingMap.set(key, [])
              }
              groupingMap.get(key)!.push(m)
            }
          })

        const response: TargetFile[] = []
        groupingMap.forEach((value, key) => {
          const base = value.find(v => v[4] === undefined && v[5] === 'mp4')
          const ass = value.find(v => v[4] === undefined && v[5] === 'ass')
          const ex = value.filter(v => v[4] !== undefined)

          if (base) {
            const exFiles: {[key: string]: Filename} = {}
            ex.forEach(exf => {
              exFiles[exf[4]] = exf[0]
            })
            response.push(<TargetFile>{
              name: base[0],
              full: path.join(root, base[0]),
              mirakurunChId: base[1],
              title: base[2],
              start: DateTime.fromFormat(base[3], 'yyyy年MM月dd日HH時mm分'),
              ass: ass ? ass[0] : undefined,
              'extends': exFiles
            })
          }
        })
        return response
      })
    )
  }
}
