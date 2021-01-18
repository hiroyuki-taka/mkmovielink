import {expect, test} from '@oclif/test'
import {ProgItem, Programs} from "../src/programs";
import * as moment from "moment";

describe('programs', () => {

  const programs = new Programs()

  it('20210113_000000', async () => {
    return new Promise((resolve, reject) => {
      programs.find$.subscribe((response: ProgItem[]) => {
        console.log('--------------------')

        response.forEach(p => {
          console.log(JSON.stringify(p))
        })
        resolve()
      })

      programs.query$.next(moment('2021-01-13T00:00:00+09'))
    })
  })


})
