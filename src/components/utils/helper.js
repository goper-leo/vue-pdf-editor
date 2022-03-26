export function ggID() {
    let id = 0
    return function genId() {
        return id++
    }
}
export function timeout(ms) {
    return new Promise((res) => setTimeout(res, ms))
}
export const noop = () => {}

export function generateId() {
    let id = Math.log2(Date.now()) + Math.random()
    return id.toString().replace('.', '')
}
