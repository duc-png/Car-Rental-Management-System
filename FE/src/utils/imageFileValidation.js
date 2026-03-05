const IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif|heic|heif)$/i

export const isImageFile = (file) => {
    if (!file || typeof file !== 'object') return false

    const type = String(file.type || '').toLowerCase()
    if (type.startsWith('image/')) {
        return true
    }

    const name = String(file.name || '')
    return IMAGE_EXTENSION_PATTERN.test(name)
}

export const splitImageFiles = (files) => {
    const source = Array.isArray(files) ? files : []
    const validFiles = []
    const invalidFiles = []

    for (const file of source) {
        if (isImageFile(file)) {
            validFiles.push(file)
        } else {
            invalidFiles.push(file)
        }
    }

    return { validFiles, invalidFiles }
}

export const buildInvalidImageFilesMessage = (invalidFiles) => {
    const list = Array.isArray(invalidFiles) ? invalidFiles : []
    if (list.length === 0) {
        return ''
    }

    const names = list
        .map((file) => String(file?.name || 'unknown-file'))
        .slice(0, 3)
        .join(', ')

    const suffix = list.length > 3 ? '...' : ''
    return `Chi duoc tai len file anh. File khong hop le: ${names}${suffix}`
}

export const getInvalidFileNames = (invalidFiles) => {
    const list = Array.isArray(invalidFiles) ? invalidFiles : []
    return list
        .map((file) => String(file?.name || '').trim())
        .filter(Boolean)
}
