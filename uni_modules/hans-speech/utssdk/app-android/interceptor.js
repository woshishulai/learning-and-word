// The native async proxy in HBuilderX 5.24 drops Promise rejections. Use its
// one-shot callback transport and settle the public Promise in the JS runtime.
export function initSynthesizeToFileAsync(_nativeMethod) {
  return (text, options) => new Promise((resolve, reject) => {
    synthesizeToFileForJs(text, options ?? null, (path, message) => {
      if (message) {
        const error = new Error(message)
        error.errSubject = 'hans-speech'
        error.errCode = 9010005
        error.errMsg = message
        reject(error)
      } else {
        resolve(path)
      }
    })
  })
}
