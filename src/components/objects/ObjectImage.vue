<script>
import { reactive, toRefs, computed, ref, onMounted, onBeforeUnmount } from "vue"

export default {
    
    props: {
        operation: { required: true }
    },

    emits: [ 'panstart', 'panmove', 'panend' ],

    setup(props, { emit }) {
        const signatureContainer = ref()
        const data = reactive({
            x: 0,
            y: 0,
        })

        const moveOperation = computed(() => props.operation === 'move')

        onMounted(() => {
            setupEvent()
        })

        onBeforeUnmount(() => {
            signatureContainer.value.removeEventListener('mousedown', handleMousedown)
            signatureContainer.value.removeEventListener('touchstart', handleTouchStart)
        })

        function setupEvent() {
            signatureContainer.value.addEventListener('mousedown', handleMousedown)
            signatureContainer.value.addEventListener('touchstart', handleTouchStart)
        }

        function handleMousedown(event) {
            data.x = event.clientX
            data.y = event.clientY
            const target = event.target
            emit('panstart', { 
                x: data.x, 
                y: data.y, 
                target, 
                currentTarget: signatureContainer.value
            })
            signatureContainer.value.addEventListener('mousemove', handleMousemove)
            signatureContainer.value.addEventListener('mouseup', handleMouseup)
        }

        function handleMousemove(event) {
            const dx = event.clientX - data.x
            const dy = event.clientY - data.y
            data.x = event.clientX
            data.y = event.clientY

            emit('panmove', { 
                x: data.x, 
                y: data.y, 
                dx, 
                dy 
            })
        }

        function handleMouseup(event) {
            data.x = event.clientX
            data.y = event.clientY

            emit('panend', { x: data.x, y: data.y })

            signatureContainer.value.removeEventListener('mousemove', handleMousemove)
            signatureContainer.value.removeEventListener('mouseup', handleMouseup)
        }

        function handleTouchStart(event) {
            if (event.touches.length > 1) return
            const touch = event.touches[0]
            data.x = touch.clientX
            data.y = touch.clientY
            const target = touch.target

            emit('panstart', { x: data.x, y: data.y, target })
            signatureContainer.value.addEventListener('touchmove', handleTouchmove) // { passive: false }
            signatureContainer.value.addEventListener('touchend', handleTouchend)
        }

        function handleTouchmove(event) {
            event.preventDefault()
            if (event.touches.length > 1) return
            const touch = event.touches[0]
            const dx = touch.clientX - data.x
            const dy = touch.clientY - data.y
            data.x = touch.clientX
            data.y = touch.clientY

            emit('panmove', { x: data.x, y: data.y, dx, dy })
        }

        function handleTouchend(event) {
            const touch = event.changedTouches[0]
            data.x = touch.clientX
            data.y = touch.clientY

            emit('panend', { x: data.x, y: data.y })
            signatureContainer.value.removeEventListener('touchmove', handleTouchmove)
            signatureContainer.value.removeEventListener('touchend', handleTouchend)
        }

        return { 
            ...toRefs(data),
            moveOperation,
            signatureContainer,
            handleMousedown,
            handleMousemove,
            handleMouseup,
            handleTouchStart,
            handleTouchmove,
            handleTouchend,
        }
    }
}
</script>
<template>
    <div ref="signatureContainer" 
        @mousedown.passive="handleMousedown"
        @touchstart.passive="handleTouchStart"
        :class="['absolute w-full h-full cursor-grab operation', 
            { 'cursor-grabbing': moveOperation }]">
        <div data-direction="left"
            class="resize-border h-full w-1 left-0 top-0 border-l cursor-ew-resize" />
        <div data-direction="top"
            class="resize-border w-full h-1 left-0 top-0 border-t cursor-ns-resize" />
        <div data-direction="bottom"
            class="resize-border w-full h-1 left-0 bottom-0 border-b cursor-ns-resize" />
        <div data-direction="right"
            class="resize-border h-full w-1 right-0 top-0 border-r cursor-ew-resize" />
        <div data-direction="left-top"
            class="resize-corner left-0 top-0 cursor-nwse-resize transform-translate-x-1/2 -translate-y-1/2 md:scale-25" />
        <div data-direction="right-top"
            class="resize-corner right-0 top-0 cursor-nesw-resize transform
                translate-x-1/2 -translate-y-1/2 md:scale-25" />
        <div data-direction="left-bottom"
            class="resize-corner left-0 bottom-0 cursor-nesw-resize transform
                -translate-x-1/2 translate-y-1/2 md:scale-25" />
        <div data-direction="right-bottom"
            class="resize-corner right-0 bottom-0 cursor-nwse-resize transform
            translate-x-1/2 translate-y-1/2 md:scale-25" />
    </div>
</template>
<style scoped>
    .operation {
        background-color: rgba(0, 0, 0, 0.3)
    }
    .resize-border {
        position: absolute;
        border-style: dashed;
        border-color: #718096;
    }
    .resize-corner {
        position: absolute;
        width: .7rem;
        height: .7rem;
        background-color: #3475E0;
        border-radius: 9999px;
    }
</style>
