import {Title} from "../src/title";

describe('title', () => {
  const target = new Title()

  it('get', async () => {
    return new Promise((resolve, reject) => {
      target.asObservable
        .subscribe(titleItem => {
          console.log(titleItem.LastUpdate.toString(), titleItem)
          resolve()
        })

      target.next('5774')
    })
  })
})
