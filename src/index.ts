import {Command, flags} from '@oclif/command'
import * as fs from "fs";
import {bindNodeCallback, of} from "rxjs";
import {filter, map, mergeMap} from "rxjs/operators";
import {fromPromise} from "rxjs/internal-compatibility";
import axios from "axios";

class Mkmovielink extends Command {
  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    destination: flags.string({char: 'd', description: 'name to target'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Mkmovielink)

    const name = flags.name ?? 'w:/movie'
    const destination = flags.destination ?? 'w:/movie_kana'
    this.log(`hello ${name} from .\\src\\index.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }

    const targetDirectoryPattern = RegExp('([0-9]{4})([1-4])Q (.*)')
    bindNodeCallback(fs.readdir)('w:/movie')
      .pipe(
        mergeMap(files => {
          return of(...(files as string[]))
        }),
        filter(file => targetDirectoryPattern.test(file)),
        map(file => {
          const result = targetDirectoryPattern.exec(file) as RegExpExecArray
          return {
            year: Number(result[1]),
            season: Number(result[2]),
            title: result[3],
            origin: result[0]
          }
        })
      )
      .subscribe(file => {
        console.log(file)
      })

    fromPromise(axios.get('http://cal.syoboi.jp/?Command=ProgLookup&Range=20210110_000000-20210111_000000', {responseType: 'document'}))
      .pipe(
      ).subscribe(response => {
        console.log(response.data)
    })
  }
}

export = Mkmovielink