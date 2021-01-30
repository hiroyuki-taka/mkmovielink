import {Command, flags} from '@oclif/command'
import * as log4js from 'log4js'

class Mkmovielink extends Command {
  readonly logger: log4js.Logger = log4js.getLogger()

  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    name: flags.string({char: 'n', description: 'name to print'}),
    destination: flags.string({char: 'd', description: 'name to target'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Mkmovielink)

    const name = flags.name ?? 'w:/movie'
    const destination = flags.destination ?? 'w:/movie_kana'
  }
}

export = Mkmovielink
