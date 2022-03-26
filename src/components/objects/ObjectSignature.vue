<script setup>
import { ref } from 'vue'
// import { onMount, createEventDispatcher } from 'svelte'
// import { pannable } from './utils/pannable.js'
// import { readAsArrayBuffer } from './utils/asyncReader.js'


const x = ref(0)
const y = ref(0)
const ratio = ref(1)

async function render() {
    svg.setAttribute('viewBox', `0 0 ${originWidth} ${originHeight}`)
}
function handlePanMove(event) {
    const _dx = (event.detail.x - startX) / pageScale
    const _dy = (event.detail.y - startY) / pageScale
    if (operation === 'move') {
        dx = _dx
        dy = _dy
    } else if (operation === 'scale') {
        if (direction === 'left-top') {
            let d = Infinity
            d = Math.min(_dx, _dy * ratio)
            dx = d
            dw = -d
            dy = d / ratio
        }
        if (direction === 'right-bottom') {
            let d = -Infinity
            d = Math.max(_dx, _dy * ratio)
            dw = d
        }
    }
}

function handlePanEnd(event) {
    if (operation === 'move') {
        dispatch('update', {
            x: x + dx,
            y: y + dy,
        })
        dx = 0
        dy = 0
    } else if (operation === 'scale') {
        dispatch('update', {
            x: x + dx,
            y: y + dy,
            width: width + dw,
            scale: (width + dw) / originWidth,
        })
        dx = 0
        dy = 0
        dw = 0
        direction = ''
    }
    operation = ''
}
function handlePanStart(event) {
    startX = event.detail.x
    startY = event.detail.y
    if (event.detail.target === event.currentTarget) {
        return (operation = 'move')
    }
    operation = 'scale'
    direction = event.detail.target.dataset.direction
}
function onDelete() {
    dispatch('delete')
}
</script>
<template>
        <svg bind:this={svg} width="100%" height="100%">
    <path
      stroke-width="5"
      stroke-linejoin="round"
      stroke-linecap="round"
      stroke="black"
      fill="none"
      d={path} />
  </svg>
</template>

<style scoped>
.operation {
    background-color: rgba(0, 0, 0, 0.1);
}
</style>
