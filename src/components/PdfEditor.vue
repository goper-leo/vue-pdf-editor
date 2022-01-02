<template>
    <div class="mb-4 flex flex-col relative">
        <div class="absolute right-0 p-4 mb-4">
            <input type="file"
                id="image"
                name="image"
                class="hidden"
                @change="uploadImage" />
            <label for="image"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Add Image
            </label>
        </div>
        <div class="w-full overflow-auto">
            <div v-for="(page, pageIndex) in pages" 
                :key="pageIndex"
                class="p-5 w-full flex flex-col items-center overflow-hidden"
                @mousedown="() => selectPage(pageIndex)"
                @touchstart="() => selectPage(pageIndex)" >
                <div :class="['relative shadow-lg mb-4', { 'selected-pdf': pageIndex == selectedPageIndex}]">
                    <pdf-page :page="pages[pageIndex]"
                        @measure="(payload) => onMeasure(payload, pageIndex)" />
                    <div class="absolute top-0 left-0 transform origin-top-left"
                        :style="{transform: `scale(${pagesScale[pageIndex]})`, 
                            touchAction: 'none'
                        }">
                        <Object v-for="(object, objectIndex) in allObjects"
                            :key="objectIndex"
                            @update="(payload) => updateObject(object.id, payload)"
                            @delete="() => deleteObject(object.id)"
                            :file="object.file"
                            :payload="object.payload"
                            :x="object.x"
                            :y="object.y"
                            :width="object.width"
                            :height="object.height"
                            :opacity="opacity"
                            :pageScale="pagesScale[pageIndex]" />

                    </div>
                </div>
            </div>
        </div>
    </div>
    <button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        @click="sign">Save</button>
</template>
<script>

import {
    readAsImage,
    readAsPDF,
    readAsDataURL
} from "./utils/asyncReader"
import prepareAssets, { fetchFont } from "./utils/prepareAssets"
import PdfPage from "./PdfPage.vue"
import Object from "./Object.vue"
import { save } from "./utils/PDF"
import { dataType64toFile } from './utils/image'

export default {

    components: { Object, PdfPage },

    props: {

        pdf: {
            required: true,
            type: String
        }
    },

    data: () => ({
        pagesScale: [],
        allObjects: [],
        pages: [],
        selectedPageIndex: 0,
        pdfFile: null,
        opacity: 1,
    }),

    async mounted() {
        try {
            const res = await fetch(this.pdf)
            const pdfBlob = await res.blob()
            await this.addPDF(pdfBlob)

            this.selectedPageIndex = 0

            setTimeout(() => {
                fetchFont("Times-Roman")
                prepareAssets()
            }, 5000)

        } catch (e) {
            console.log('Error:', e)
        }
    },

    methods: {

        async sign() {
            try {
                await save(
                    this.pdfFile, 
                    this.allObjects, 
                    'PDF Copy', 
                    this.pagesScale
                )
            } catch (e) {
                console.log('Error on saving, please try again.', e)
            }
        },

        onMeasure(scale, pageIndex) {
            this.pagesScale[pageIndex] = scale
        },

        selectPage(index) {
            this.selectedPageIndex = index
        },

        updateObject(objectId, payload) {
            this.allObjects = this.allObjects.map((object, pIndex) => {
                if (object.page == this.selectedPageIndex && object.id === objectId)
                    return { ...object, ...payload }
                else
                    return object
            })
        },

        deleteObject(objectId) {
            this.allObjects = this.allObjects.filter((object, pIndex) => object.page == this.selectedPageIndex && object.id !== objectId)
        },

        async addPDF(file) {
            try {
                const pdf = await readAsPDF(file)
                this.pdfFile = file
                const numPages = pdf.numPages

                this.pages = Array(numPages)
                    .fill()
                    .map((_, i) => pdf.getPage(i + 1))

                this.allObjects = []
                this.pagesScale = Array(numPages).fill(1)

            } catch (e) {
                console.log('Failed to add pdf. Please try again.', e)
            }
        },

        async addImage(file) {
            try {
                // get dataURL to prevent canvas from tainted
                const url = await readAsDataURL(file)
                const img = await readAsImage(url)
                const id = Math.floor(Math.random() * 100)
                const { width, height } = img

                const object = {
                    id,
                    type: "image",
                    width,
                    height,
                    x: 0,
                    y: 0,
                    payload: img,
                    file: file,
                    page: this.selectedPageIndex
                }

                this.allObjects = [object]
            } catch (e) {
                console.log('Failed to add image.', e)
            }
        },

        uploadImage(e) {
            const file = e.target.files[0];
            if (file && this.selectedPageIndex >= 0) {
                this.addImage(file);
            }
            e.target.value = null;
        }
    },
}
</script>
<style >

.selected-pdf {
    box-shadow: 0 0 0 1px rgba(52, 117, 224, 0.5);
}

.slider-blue {
  --slider-connect-bg: #3475E0;
  --slider-tooltip-bg: #3475E0;
  --slider-handle-ring-color: #3475E0;
}
</style>

