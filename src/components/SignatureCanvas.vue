<script setup>
import { reactive, onMounted, onBeforeUnmount, ref } from 'vue'

const emit = defineEmits(['cancel', 'finish'])

const signatureCanvas = ref()
const paths = ref([])
const path = ref('')
const data = reactive({
    drawing: false,
    x: 0,
    y: 0,
    minX: Infinity,
    minY: Infinity,
    maxX: 0,
    maxY: 0,
})

onMounted(() => {
    setupEvent()
})

onBeforeUnmount(() => {
    signatureCanvas.value.removeEventListener('mousedown', handleMousedown)
    signatureCanvas.value.removeEventListener('touchstart', handleTouchStart)
})

function setupEvent() {
    signatureCanvas.value.addEventListener('mousedown', handleMousedown)
    signatureCanvas.value.addEventListener('touchstart', handleTouchStart)
}

function handleMousedown(event) {
    data.x = event.clientX
    data.y = event.clientY
    const target = event.target
    // emit('panstart', {
    //     x: data.x,
    //     y: data.y,
    //     target,
    //     currentTarget: signatureCanvas.value
    // })
    handlePanStart({
        x: data.x,
        y: data.y,
        target,
        currentTarget: signatureCanvas.value,
    })
    signatureCanvas.value.addEventListener('mousemove', handleMousemove)
    signatureCanvas.value.addEventListener('mouseup', handleMouseup)
}

function handleMousemove(event) {
    const dx = event.clientX - data.x
    const dy = event.clientY - data.y
    data.x = event.clientX
    data.y = event.clientY

    // emit('panmove', {
    //     x: data.x,
    //     y: data.y,
    //     dx,
    //     dy
    // })
    handlePanMove({
        x: data.x,
        y: data.y,
        dx,
        dy,
    })
}

function handleMouseup(event) {
    data.x = event.clientX
    data.y = event.clientY

    // emit('panend', { x: data.x, y: data.y })
    handlePanEnd({ x: data.x, y: data.y })
    signatureCanvas.value.removeEventListener('mousemove', handleMousemove)
    signatureCanvas.value.removeEventListener('mouseup', handleMouseup)
}

function handleTouchStart(event) {
    if (event.touches.length > 1) return
    const touch = event.touches[0]
    data.x = touch.clientX
    data.y = touch.clientY
    const target = touch.target

    // emit('panstart', { x: data.x, y: data.y, target })
    handlePanStart({ x: data.x, y: data.y, target })

    signatureCanvas.value.addEventListener('touchmove', handleTouchmove) // { passive: false }
    signatureCanvas.value.addEventListener('touchend', handleTouchend)
}

function handleTouchmove(event) {
    event.preventDefault()
    if (event.touches.length > 1) return
    const touch = event.touches[0]
    const dx = touch.clientX - data.x
    const dy = touch.clientY - data.y
    data.x = touch.clientX
    data.y = touch.clientY

    // emit('panmove', { x: data.x, y: data.y, dx, dy })
    handlePanMove({ x: data.x, y: data.y, dx, dy })
}

function handleTouchend(event) {
    const touch = event.changedTouches[0]
    data.x = touch.clientX
    data.y = touch.clientY

    // emit('panend', { x: data.x, y: data.y })
    handlePanEnd({ x: data.x, y: data.y })
    signatureCanvas.value.removeEventListener('touchmove', handleTouchmove)
    signatureCanvas.value.removeEventListener('touchend', handleTouchend)
}

// --------------------------- pannable end ------------------

function handlePanStart(event) {
    if (event.target !== event.currentTarget) {
        data.drawing = false
        return
    }

    data.drawing = true
    data.x = event.x
    data.y = event.y
    data.minX = Math.min(data.minX, data.x)
    data.maxX = Math.max(data.maxX, data.x)
    data.minY = Math.min(data.minY, data.y)
    data.maxY = Math.max(data.maxY, data.y)
    paths.value.push(['M', data.x, data.y])
    path.value += `M${data.x},${data.y}`
}

function handlePanMove(event) {
    if (!data.drawing) return

    data.x = event.x
    data.y = event.y
    data.minX = Math.min(data.minX, data.x)
    data.maxX = Math.max(data.maxX, data.x)
    data.minY = Math.min(data.minY, data.y)
    data.maxY = Math.max(data.maxY, data.y)
    path.value += `L${data.x},${data.y}`

    paths.value.push(['L', data.x, data.y])
}

function handlePanEnd() {
    data.drawing = false
}

function finish() {
    if (!paths.value.length) return
    const dx = -(data.minX - 10)
    const dy = -(data.minY - 10)
    const originWidth = data.maxX - data.minX + 20
    const originHeight = data.maxY - data.minY + 20

    let scale = 1
    if (originWidth > 500) {
        scale = 500 / originWidth;
    }

    emit('finish', {
        width: originWidth,
        height: originHeight,
        path: paths.value.reduce((acc, cur) => {
            return acc + cur[0] + (cur[1] + dx) + ',' + (cur[2] + dy)
        }, ''),
        scale
    })
}

function cancel() {
    emit('cancel')
}

// return {
//     ...toRefs(data),
//     handlePanEnd,
//     handlePanStart,
//     handlePanMove,
//     finish,
//     cancel,
//     signatureCanvas,
// }
// @TODO pencil color
</script>
<template>
    <div style="height: 50%" class="fixed z-10 top-0 left-0 right-0 border-b border-gray-300 bg-white shadow-lg">
        <div
            ref="signatureCanvas"
            @panstart="handlePanStart"
            @panmove="handlePanMove"
            @panend="handlePanEnd"
            class="relative w-full h-full select-none"
        >
            <div class="absolute right-0 bottom-0 mr-4 mb-4 flex">
                <button @click="cancel" class="w-24 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded mr-4">Cancel</button>
                <button @click="finish" class="w-24 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">Done</button>
            </div>
            <svg class="w-full h-full pointer-events-none">
                <path stroke-width="5" stroke-linejoin="round" stroke-linecap="round" :d="path" stroke="black" fill="none" />
            </svg>
        </div>
    </div>
</template>
