<template>
    <div>
        <canvas
            ref="pdfCanvas"
            class="max-w-full"
            :style="{width: `${width}px`}"
            :width="width"
            :height="height"/>
    </div>
</template>
<script>
export default {

    props: {
        page: {
            required: true
        }
    },

    data: () => ({
        width: 0,
        height: 0,
    }),

    methods: {
        measure() {
            this.$emit('measure', this.$refs.pdfCanvas.clientWidth / this.width)
            return 
        },
    },

    async mounted() {
        const _page = await this.page
        const context = this.$refs.pdfCanvas.getContext("2d")
        const viewport = _page.getViewport({ scale: 1, rotation: 0 })
        this.width = viewport.width
        this.height = viewport.height
        await _page.render({
            canvasContext: context,
            viewport
        }).promise
        this.measure()
        window.addEventListener("resize", this.measure)
    },

    beforeDestroy() {
        window.removeEventListener("resize", this.measure)
    }
}
</script>
