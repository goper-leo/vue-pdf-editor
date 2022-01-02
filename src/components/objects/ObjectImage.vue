<template>
    <div ref="signatureContainer" 
        @mousedown="handleMousedown"
        @touchstart="handleTouchStart"
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
<script>
export default {
    
    props: {
        operation: { required: true }
    },

    data: () => ({
        x: 0,
        y: 0,
    }),

    methods: {

        setDirection() {
            
        },

        handleMousedown(event) {
            this.x = event.clientX
            this.y = event.clientY
            const target = event.target
            console.log('this.$refs', this.$refs);
            this.$emit('panstart', { 
                x: this.x, 
                y: this.y, 
                target, 
                currentTarget: this.$refs.signatureContainer
            })
            this.$refs.signatureContainer.addEventListener('mousemove', this.handleMousemove)
            this.$refs.signatureContainer.addEventListener('mouseup', this.handleMouseup)
        },

        handleMousemove(event) {
            const dx = event.clientX - this.x
            const dy = event.clientY - this.y
            this.x = event.clientX
            this.y = event.clientY

            this.$emit('panmove', { 
                x: this.x, 
                y: this.y, 
                dx, 
                dy 
            })
        },

        handleMouseup(event) {
            this.x = event.clientX
            this.y = event.clientY

            this.$emit('panend', { x: this.x, y: this.y })

            this.$refs.signatureContainer.removeEventListener('mousemove', this.handleMousemove)
            this.$refs.signatureContainer.removeEventListener('mouseup', this.handleMouseup)
        },

        handleTouchStart(event) {
            if (event.touches.length > 1) return
            const touch = event.touches[0]
            this.x = touch.clientX
            this.y = touch.clientY
            const target = touch.target

            this.$emit('panstart', { x: this.x, y: this.y, target })
            this.$refs.signatureContainer.addEventListener('touchmove', this.handleTouchmove) // { passive: false }
            this.$refs.signatureContainer.addEventListener('touchend', this.handleTouchend)
        },

        handleTouchmove(event) {
            event.preventDefault()
            if (event.touches.length > 1) return
            const touch = event.touches[0]
            const dx = touch.clientX - this.x
            const dy = touch.clientY - this.y
            this.x = touch.clientX
            this.y = touch.clientY

            this.$emit('panmove', { x: this.x, y: this.y, dx, dy })
        },

        handleTouchend(event) {
            const touch = event.changedTouches[0]
            this.x = touch.clientX
            this.y = touch.clientY

            this.$emit('panend', { x: this.x, y: this.y })
            this.$refs.signatureContainer.removeEventListener('touchmove', this.handleTouchmove)
            this.$refs.signatureContainer.removeEventListener('touchend', this.handleTouchend)
        },
    },

    destroyed() {
        if (this.$refs.signatureContainer) {
            this.$refs.signatureContainer.removeEventListener('mousedown', this.handleMousedown)
            this.$refs.signatureContainer.removeEventListener('touchstart', this.handleTouchStart)
        }
    },

    computed: {
        moveOperation() {
            return this.operation === 'move'
        }
    },

    mounted() {
        this.$refs.signatureContainer.addEventListener('mousedown', this.handleMousedown)
        this.$refs.signatureContainer.addEventListener('touchstart', this.handleTouchStart)
    }
}
</script>
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
