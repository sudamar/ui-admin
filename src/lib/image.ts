type CompressImageOptions = {
  maxSizeBytes?: number
  maxWidth?: number
  maxHeight?: number
  initialQuality?: number
  minQuality?: number
  qualityStep?: number
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        resolve(result)
      } else {
        reject(new Error("Não foi possível ler o arquivo selecionado."))
      }
    }
    reader.onerror = () => reject(new Error("Falha ao carregar o arquivo."))
    reader.readAsDataURL(file)
  })
}

async function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Não foi possível processar a imagem."))
    image.src = dataUrl
  })
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        resolve(result)
      } else {
        reject(new Error("Não foi possível converter a imagem compactada."))
      }
    }
    reader.onerror = () =>
      reject(new Error("Falha ao converter a imagem compactada."))
    reader.readAsDataURL(blob)
  })
}

export async function compressImageFile(
  file: File,
  {
    maxSizeBytes = 1024 * 1024,
    maxWidth = 600,
    maxHeight = 600,
    initialQuality = 0.85,
    minQuality = 0.4,
    qualityStep = 0.05,
  }: CompressImageOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.")
  }

  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImageElement(dataUrl)

  const ratio = Math.min(
    1,
    maxWidth / image.width,
    maxHeight / image.height
  )

  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.width * ratio))
  canvas.height = Math.max(1, Math.round(image.height * ratio))

  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) {
    throw new Error("Não foi possível preparar o processador de imagens.")
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  let quality = initialQuality
  let blob = await canvasToBlob(canvas, "image/jpeg", quality)

  while (blob && blob.size > maxSizeBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - qualityStep)
    blob = await canvasToBlob(canvas, "image/jpeg", quality)
  }

  if (!blob || blob.size > maxSizeBytes) {
    throw new Error("Não foi possível compactar a imagem para menos de 1MB.")
  }

  return blobToDataUrl(blob)
}

