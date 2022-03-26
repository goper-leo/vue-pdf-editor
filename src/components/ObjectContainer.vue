<script setup>
import { reactive, toRefs, ref, computed, onMounted } from 'vue'
import ObjectImage from './objects/ObjectImage.vue'
import ObjectSignature from './objects/ObjectSignature.vue'

const props = defineProps({
    payload: { required: true },
    x: { required: true },
    y: { required: true },
    file: { required: true },
    width: { required: true },
    height: { required: true },
    pageScale: { required: true },
    opacity: { required: true },
    type: { required: true },
    path: { required: false, default: null },

    object: {
        required: true,
        type: Object,
    },
})

const emit = defineEmits(['update', 'delete'])

const canvasImage = ref()
const signature = ref(null)
const operation = ref(null)

const data = reactive({
    startX: null,
    startY: null,
    directions: [],
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
    pannableFunction: null,
})
// path.value = 'M41,10L41,13L41,16L42,22L46,30L53,39L62,51L73,66L94,80L122,100L148,119L172,134L202,143L236,153L273,156L309,158L350,158L387,154L421,147L451,139L475,130L490,123L501,113L505,106L507,96L507,90L506,85L501,81L492,76L479,70L459,65L435,62L399,62L356,62L307,65L253,75L201,90L154,106L115,131L83,153L57,176L40,198L25,219L14,235L10,250L16,267L21,280L27,286L33,292L42,296L54,296L69,296L90,292L116,288L138,283L159,277L181,272L200,266L219,260L239,255L256,251L277,247L296,244L312,240L326,236L335,234L339,230L341,230L343,230'

const moveOperation = computed(() => {
    return operation.value === 'move'
})

onMounted(() => {
    setCanvas(props)
})

function setCanvas(props) {
    let { width, height } = props
    if (props.type == 'image') {
        // use canvas to prevent img tag's auto resize
        canvasImage.value.width = width
        canvasImage.value.height = height
        canvasImage.value.getContext('2d').drawImage(props.payload, 0, 0)

        let scale = 1
        const limit = 500
        if (width > limit) {
            scale = limit / width
        }
        if (height > limit) {
            scale = Math.min(scale, limit / height)
        }
        emit('update', {
            width: width * scale,
            height: height * scale,
        })

        if (!['image/jpeg', 'image/png'].includes(props.file.type)) {
            canvasImage.value.toBlob((blob) => {
                emit('update', {
                    file: blob,
                })
            })
        }
    } else if (props.type == 'signature') {
        // signature.value.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
}

function handlePanMove(event) {
    const _dx = (event.x - data.startX) / props.pageScale
    const _dy = (event.y - data.startY) / props.pageScale
    if (operation.value === 'move') {
        data.dx = _dx
        data.dy = _dy
    } else if (operation.value === 'scale') {
        if (data.directions.includes('left')) {
            data.dx = _dx
            data.dw = -_dx
        }
        if (data.directions.includes('top')) {
            data.dy = _dy
            data.dh = -_dy
        }
        if (data.directions.includes('right')) {
            data.dw = _dx
        }
        if (data.directions.includes('bottom')) {
            data.dh = _dy
        }
    }
}

function handlePanEnd() {
    if (operation.value === 'move') {
        emit('update', {
            x: props.x + data.dx,
            y: props.y + data.dy,
        })
        data.dx = 0
        data.dy = 0
    } else if (operation.value === 'scale') {
        emit('update', {
            x: props.x + data.dx,
            y: props.y + data.dy,
            width: props.width + data.dw,
            height: props.height + data.dh,
        })

        data.dx = 0
        data.dy = 0
        data.dw = 0
        data.dh = 0
        data.directions = []
    }
    operation.value = ''
}

function handlePanStart(event) {
    data.startX = event.x
    data.startY = event.y
    if (event.target === event.currentTarget) {
        return (operation.value = 'move')
    }
    operation.value = 'scale'
    data.directions = event.target.dataset.direction.split('-')
}
</script>
<template>
    <div
        class="absolute left-0 top-0 select-none"
        :style="{ width: `${width + data.dw}px`, height: `${height + data.dh}px`, transform: `translate(${x + data.dx}px, ${y + data.dy}px)` }"
    >
        <object-image :operation="operation" @panstart="handlePanStart" @panmove="handlePanMove" @panend="handlePanEnd" />

        <!-- <object-signature v-else-if="type == 'signature'" 
            :operation="operation"
            @panstart="handlePanStart"
            @panmove="handlePanMove"
            @panend="handlePanEnd" /> -->
        <div
            @click="$emit('delete')"
            class="absolute left-0 top-0 right-0 w-6 h-6 m-auto rounded-full bg-red-100 cursor-pointer transform -translate-y-1/2 md:scale-25 text-center border border-black"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path
                    d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
                />
            </svg>
        </div>
        <canvas v-if="type == 'image'" class="w-full h-full" ref="canvasImage" />
        <svg v-else-if="type == 'signature'" ref="signature" :viewBox="`0 0 ${width} ${height}`" width="100%" height="100%">
            <path stroke-width="5" stroke-linejoin="round" stroke-linecap="round" stroke="black" fill="none" :d="object.path" />
        </svg>
    </div>
</template>
