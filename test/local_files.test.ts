import {LocalFiles} from "../src/local_files";

describe('local_files', () => {
  const target = new LocalFiles()

  it('list', async () => {
    return new Promise((resolve, reject) => {
      target.list('D:\\movie\\encoded\\アニメ／特撮')
        .subscribe((files) => {
          console.log(files.map(f => {
            return {...f, start: f.start.toJSON()}
          }))
          resolve()
        })
    })
  })
})
