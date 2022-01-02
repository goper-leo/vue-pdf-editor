import { readAsArrayBuffer } from "./asyncReader.js"
import { fetchFont, getAsset } from "./prepareAssets"
import { noop } from "./helper.js"
import { textToPdf } from "./makeTextPDF"

export async function save(pdfFile, objects, name) {
    
    const PDFLib = await getAsset("PDFLib")
    const download = await getAsset("download")
    
    let pdfDoc
    try {
        pdfDoc = await PDFLib.PDFDocument.load(await readAsArrayBuffer(pdfFile))
    } catch (e) {
        this.$notify.error("Failed to load PDF while saving, please try again.")
        throw e
    }
    
    const pagesProcesses = pdfDoc.getPages().map(async (page, pageIndex) => {
        const pageObjects = objects.filter((o) => o.page == pageIndex)
        // 'y' starts from bottom in PDFLib, use this to calculate y
        const pageHeight = page.getHeight()
        const embedProcesses = pageObjects.map(async (object) => {
            
            if (object.type === "image") {
                let { file, x, y, width, height } = object
                let img
                try {
                    if (file.type === "image/jpeg") {
                        img = await pdfDoc.embedJpg(await readAsArrayBuffer(file))
                    } else {
                        img = await pdfDoc.embedPng(await readAsArrayBuffer(file))
                    }
                    
                    return () =>
                        page.drawImage(img, {
                            x,
                            y: pageHeight - y - height,
                            width,
                            height,
                            opacity: 0.6,
                        })
                } catch (e) {
                    this.$notify.error("Failed to embed image.")
                    return noop
                }
            } else if (object.type === "text") {
                let { x, y, lines, lineHeight, size, fontFamily, width } = object
                const height = size * lineHeight * lines.length
                const font = await fetchFont(fontFamily)
                const [textPage] = await pdfDoc.embedPdf(
                    await textToPdf({
                        lines,
                        fontSize: size,
                        lineHeight,
                        width,
                        height,
                        font: font.buffer || fontFamily, // built-in font family
                        dy: font.correction(size, lineHeight),
                    })
                )
                return () =>
                    page.drawPage(textPage, {
                        width,
                        height,
                        x,
                        y: pageHeight - y - height,
                    })
            } else if (object.type === "drawing") {
                let { x, y, path, scale } = object
                const { pushGraphicsState, setLineCap, popGraphicsState, setLineJoin, LineCapStyle, LineJoinStyle } = PDFLib
                return () => {
                    page.pushOperators(pushGraphicsState(), setLineCap(LineCapStyle.Round), setLineJoin(LineJoinStyle.Round))
                    page.drawSvgPath(path, {
                        borderWidth: 5,
                        scale,
                        x,
                        y: pageHeight - y,
                    })
                    page.pushOperators(popGraphicsState())
                }
            }
        })
        // embed objects in order
        const drawProcesses = await Promise.all(embedProcesses)
        drawProcesses.forEach((p) => p())
    })
    
    await Promise.all(pagesProcesses)
    try {
        const pdfBytes = await pdfDoc.save()
        download(pdfBytes, name, "application/pdf")
        return await pdfDoc.saveAsBase64({ dataUri: true })
    } catch (e) {
        this.$notify.error("Failed to save PDF.")
        throw e
    }
}
