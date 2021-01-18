import {Channel} from "../src/channel";

describe('channel', () => {
  it('get', async () => {
    return new Promise(resolve => {
      new Channel().get()
        .subscribe(x => {
          console.log(x)
          resolve()
        })
    })
  })
})
