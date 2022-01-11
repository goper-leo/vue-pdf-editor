<script>
import { reactive, toRefs, onBeforeUnmount, ref, onMounted } from "vue"

export default {

    props: {
        page: {
            required: true
        }
    },

    emits: [ 'measure' ],

    setup(props, { emit }) {
        const pdfCanvas = ref()

        const data = reactive({
            width: 0,
            height: 0,
        })

        onMounted(() => {
            setupPage(props)
        })

        async function setupPage(props) {
            const _page = await props.page
            const context = pdfCanvas.value.getContext("2d")
            const viewport = _page.getViewport({ scale: 1, rotation: 0 })
            data.width = viewport.width
            data.height = viewport.height
            await _page.render({
                canvasContext: context,
                viewport
            }).promise
            measure()
            window.addEventListener("resize", measure)
        }

        function measure() {
            emit('measure', pdfCanvas.value.clientWidth / data.width)
            return 
        }

        onBeforeUnmount(() => {
            window.removeEventListener("resize", measure)
        })

        return { ...toRefs(data), measure, pdfCanvas }
    }
}
</script>
<template>
    <div>
        <canvas
            ref="pdfCanvas"
            class="max-w-full"
            :style="{width: `${width}px`}"
            :width="width"
            :height="height" />
    </div>
</template>
