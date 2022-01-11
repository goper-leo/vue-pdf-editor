<script>
import { reactive, toRefs, ref, computed, onMounted } from "vue"
import ObjectImage from "./objects/ObjectImage.vue"

export default {

    components: { ObjectImage },

    props: {
        payload: { required: true },
        x: { required: true },
        y: { required: true },
        file: { required: true },
        width: { required: true },
        height: { required: true },
        pageScale: { required: true },
        opacity: { required: true },
    },

    emits: [ 'update', 'delete' ],

    setup(props, { emit }) {
        const canvasImage = ref()

        const data = reactive({
            startX: null,
            startY: null,
            operation: '',
            directions: [],
            dx: 0,
            dy: 0,
            dw: 0,
            dh: 0,
            pannableFunction: null,
        })

        const moveOperation = computed(() => {
            return data.operation === 'move'
        })

        onMounted(() => {
            setCanvas(props)
        })

        function setCanvas(props) {
            // use canvas to prevent img tag's auto resize
            canvasImage.value.width = props.width
            canvasImage.value.height = props.height
            canvasImage.value.getContext("2d").drawImage(props.payload, 0, 0)

            let scale = 1
            const limit = 500
            if (props.width > limit) {
                scale = limit / props.width
            }
            if (props.height > limit) {
                scale = Math.min(scale, limit / props.height)
            }
            emit('update', {
                width: props.width * scale,
                height: props.height * scale
            })

            if (!["image/jpeg", "image/png"].includes(props.file.type)) {
                canvasImage.value.toBlob(blob => {
                    emit('update', {
                        file: blob
                    })
                })
            }
        }

        function handlePanMove(event) {
            const _dx = (event.x - data.startX) / props.pageScale
            const _dy = (event.y - data.startY) / props.pageScale
            if (data.operation === "move") {
                data.dx = _dx
                data.dy = _dy
            } else if (data.operation === "scale") {
                if (data.directions.includes("left")) {
                    data.dx = _dx
                    data.dw = -_dx
                }
                if (data.directions.includes("top")) {
                    data.dy = _dy
                    data.dh = -_dy
                }
                if (data.directions.includes("right")) {
                    data.dw = _dx
                }
                if (data.directions.includes("bottom")) {
                    data.dh = _dy
                }
            }
        }

        function handlePanEnd() {
            if (data.operation === "move") {
                emit("update", {
                    x: props.x + data.dx,
                    y: props.y + data.dy
                })
                data.dx = 0
                data.dy = 0
            } else if (data.operation === "scale") {
                emit('update', {
                    x: props.x + data.dx,
                    y: props.y + data.dy,
                    width: props.width + data.dw,
                    height: props.height + data.dh
                })

                data.dx = 0
                data.dy = 0
                data.dw = 0
                data.dh = 0
                data.directions = []
            }
            data.operation = ""
        }

        function handlePanStart(event) {
            data.startX = event.x
            data.startY = event.y
            if (event.target === event.currentTarget) {
                return (data.operation = "move")
            }
            data.operation = "scale"
            data.directions = event.target.dataset.direction.split("-")
        }

        return { 
            ...toRefs(data), 
            moveOperation, 
            canvasImage, 
            handlePanMove, 
            handlePanEnd, 
            handlePanStart 
        }
    }
}
</script>
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
            <img class="w-full h-full" src="./src/assets/delete.svg" alt="delete object" />
        </div>
        <canvas class="w-full h-full" ref="canvasImage" />
    </div>
</template>
