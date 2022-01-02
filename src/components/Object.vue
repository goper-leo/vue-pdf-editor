<template>
    <div
        class="absolute left-0 top-0 select-none"
        :style="{width: `${width + dw}px`, 
            height: `${height + dh}px`, 
            transform: `translate(${x + dx}px, ${y + dy}px)`,
            opacity: opacity
        }">
        <object-image :operation="operation"
            @panstart="handlePanStart"
            @panmove="handlePanMove"
            @panend="handlePanEnd" />
        <div
            @click="$emit('delete')"
            class="absolute left-0 top-0 right-0 w-6 h-6 m-auto rounded-full bg-red-100
                cursor-pointer transform -translate-y-1/2 md:scale-25 text-center border border-black">
            X
        </div>
        <canvas class="w-full h-full" ref="canvasImage" />
    </div>
</template>
<script>
import ObjectImage from "./objects/ObjectImage.vue"

export default {

    components: { ObjectImage },

    props: {

        payload: { required: true},
        x: { required: true },
        y: { required: true },
        file: { required: true },
        width: { required: true },
        height: { required: true },
        pageScale: { required: true },
        opacity: { required: true },
    },

    data: () => ({
        startX: null,
        startY: null,
        operation: '',
        directions: [],
        dx: 0,
        dy: 0,
        dw: 0,
        dh: 0,
        pannableFunction: null,
    }),

    computed: {
        moveOperation() {
            return this.operation === 'move'
        }
    },

    methods: {

        handlePanMove(event) {
            const _dx = (event.x - this.startX) / this.pageScale
            const _dy = (event.y - this.startY) / this.pageScale
            if (this.operation === "move") {
                this.dx = _dx
                this.dy = _dy
            } else if (this.operation === "scale") {
                if (this.directions.includes("left")) {
                    this.dx = _dx
                    this.dw = -_dx
                }
                if (this.directions.includes("top")) {
                    this.dy = _dy
                    this.dh = -_dy
                }
                if (this.directions.includes("right")) {
                    this.dw = _dx
                }
                if (this.directions.includes("bottom")) {
                    this.dh = _dy
                }
            }
        },

        handlePanEnd() {
            if (this.operation === "move") {
                this.$emit("update", {
                    x: this.x + this.dx,
                    y: this.y + this.dy
                })
                this.dx = 0
                this.dy = 0
            } else if (this.operation === "scale") {
                this.$emit('update', {
                    x: this.x + this.dx,
                    y: this.y + this.dy,
                    width: this.width + this. dw,
                    height: this.height + this.dh
                })

                this.dx = 0
                this.dy = 0
                this.dw = 0
                this.dh = 0
                this.directions = []
            }
            this.operation = ""
        },

        handlePanStart(event) {
            this.startX = event.x
            this.startY = event.y
            if (event.target === event.currentTarget) {
                return (this.operation = "move")
            }
            this.operation = "scale"
            this.directions = event.target.dataset.direction.split("-")
        }
    },
    
    mounted() {
        // use canvas to prevent img tag's auto resize
        this.$refs.canvasImage.width = this.width
        this.$refs.canvasImage.height = this.height
        this.$refs.canvasImage.getContext("2d").drawImage(this.payload, 0, 0)
        let scale = 1
        const limit = 500
        if (this.width > limit) {
            scale = limit / this.width
        }
        if (this.height > limit) {
            scale = Math.min(scale, limit / this.height)
        }
        this.$emit('update', {
            width: this.width * scale,
            height: this.height * scale
        })

        if (!["image/jpeg", "image/png"].includes(this.file.type)) {
            this.$refs.canvasImage.toBlob(blob => {
                this.$emit('update', {
                    file: blob
                })
            })
        }

    }
}
</script>
