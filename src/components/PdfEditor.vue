<script setup>
import { reactive, onMounted, ref } from 'vue'
import { readAsImage, readAsPDF, readAsDataURL } from './utils/asyncReader'
import prepareAssets, { fetchFont } from './utils/prepareAssets'
import PdfPage from './PdfPage.vue'
import ObjectContainer from './ObjectContainer.vue'
import SignatureCanvas from './SignatureCanvas.vue'
import { save } from './utils/PDF'
import { generateId } from './utils/helper'
// import { dataType64toFile } from './utils/image'

const props = defineProps({
    pdf: {
        required: true,
        type: String,
    },
})

const pages = ref([])
const allObjects = ref([])
const pagesScale = ref([])
const selectedPageIndex = ref(0)
const signatureCanvas = reactive({
    isShow: false,
})
const opacity = ref(1)
const pdfFile = ref(null)
onMounted(() => {
    mountPdf()
})

async function mountPdf() {
    try {
        const { pdf } = props
        const res = await fetch(pdf)
        const pdfBlob = await res.blob()
        await addPDF(pdfBlob)

        selectedPageIndex.value = 0

        setTimeout(() => {
            fetchFont('Times-Roman')
            prepareAssets()
        }, 5000)
    } catch (e) {
        console.log('Error:', e)
    }
}

async function addPDF(file) {
    try {
        const pdf = await readAsPDF(file)
        pdfFile.value = file
        const numPages = pdf.numPages

        pages.value.splice(0, pages.value.length)
        pages.value = Array(numPages).fill().map((_, i) => pdf.getPage(i + 1))

        allObjects.value.splice(0, allObjects.value.length)
        
        pagesScale.value = Array(numPages).fill(1)
    } catch (e) {
        console.log('Failed to add pdf. Please try again.', e)
    }
}

function onMeasure(scale, pageIndex) {
    pagesScale.value[pageIndex] = scale
}

function selectPage(index) {
    selectedPageIndex.value = index
}

function updateObject(objectId, payload) {
    allObjects.value = allObjects.value.map((object) => {
        if (object.page == selectedPageIndex.value && object.id === objectId) {
            console.log('found', { ...object, ...payload })
            return { ...object, ...payload }
        } else {
            return object
        }
    })
}

function deleteObject(objectId) {
    allObjects.value = allObjects.value.filter((object) => object.page == this.selectedPageIndex && object.id !== objectId)
}

async function addImage(file) {
    try {
        // get dataURL to prevent canvas from tainted
        const url = await readAsDataURL(file)
        const img = await readAsImage(url)
        const id = Math.floor(Math.random() * 100)
        const { width, height } = img

        const object = {
            id,
            type: 'image',
            width,
            height,
            x: 0,
            y: 0,
            payload: img,
            file: file,
            page: selectedPageIndex.value,
        }

        allObjects.value = [object]
    } catch (e) {
        console.log('Failed to add image.', e)
    }
}

async function download() {
    try {
        await save(pdfFile.value, allObjects.value, 'PDF Copy', pagesScale.value)
    } catch (e) {
        console.log('Error on saving, please try again.', e)
    }
}

function uploadImage(e) {
    const file = e.target.files[0]
    if (file && selectedPageIndex.value >= 0) {
        addImage(file)
    }
    e.target.value = null
}

function addSignature() {
    // @TODO check selectedPageIndex
    signatureCanvas.isShow = true
}

function pasteSignature({ width, height, path, scale }) {
    const id = generateId()
    const signatureObject = {
        id,
        path,
        type: 'signature',
        x: 0,
        y: 0,
        height,
        width: width * scale,
        scale: 500,
        page: selectedPageIndex.value,
    }
    allObjects.value = [signatureObject]
    signatureCanvas.isShow = false
}
</script>
<template>
    <div class="mb-4 flex flex-col relative">
        <!-- Signature Canvas -->
        <signature-canvas v-if="signatureCanvas.isShow" @finish="pasteSignature" @cancel="signatureCanvas.isShow = false" />
        <!-- END -->
        <div class="absolute right-0 p-4 mb-4 flex flex-col">
            <input type="file" id="image" name="image" class="hidden" @change="uploadImage" />
            <label for="image" class="text-black border border-black cursor-pointer font-medium text-sm px-5 py-2.5 text-center mr-2 mb-2">
                Add Image
            </label>
            <button
                @click="addSignature"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
                Add Signature
            </button>
            <button
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                @click="download"
            >
                Save
            </button>
        </div>
        <div class="w-full overflow-auto">
            <div
                v-for="(page, pageIndex) in pages"
                :key="pageIndex"
                class="p-5 w-full flex flex-col items-center overflow-hidden"
                @mousedown="() => selectPage(pageIndex)"
                @touchstart="() => selectPage(pageIndex)"
            >
                <div :class="['relative shadow-lg mb-4', { 'selected-pdf': pageIndex == selectedPageIndex }]">
                    <pdf-page :page="pages[pageIndex]" @measure="(payload) => onMeasure(payload, pageIndex)" />
                    <div
                        class="absolute top-0 left-0 transform origin-top-left"
                        :style="{ transform: `scale(${pagesScale[pageIndex]})`, touchAction: 'none' }"
                    >
                        <object-container
                            v-for="(object, objectIndex) in allObjects"
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
                            :pageScale="pagesScale[pageIndex]"
                            :type="object.type"
                            :path="object.type"

                            :object="object"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.selected-pdf {
    box-shadow: 0 0 0 1px rgba(52, 117, 224, 0.5);
}

.slider-blue {
    --slider-connect-bg: #3475e0;
    --slider-tooltip-bg: #3475e0;
    --slider-handle-ring-color: #3475e0;
}
</style>
