import {Title} from "../src/title";

describe('title', () => {
  const target = new Title()

  it('get', async () => {
    return new Promise((resolve, reject) => {
      target.find('5774')
        .subscribe(titleItem => {
          console.log({...titleItem, LastUpdate: titleItem.LastUpdate.toJSON()})
          resolve()
        })
    })
  })
})
