/**
 * Convert dataType64 to File
 */
export const dataType64toFile = (dataurl) => {
    let filename = new Date().getTime()
    //Convert base64 to file
    let arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    let newFile = new File([u8arr], filename, {
        type: mime,
    })
    return newFile
}
