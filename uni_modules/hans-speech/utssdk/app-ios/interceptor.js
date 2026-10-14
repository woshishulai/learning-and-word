// The iOS async proxy converts UniError to Error without its public fields.
// Preserve the Promise contract using the native one-shot callback transport.
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
