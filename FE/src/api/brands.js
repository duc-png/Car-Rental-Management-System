const API_BASE_URL = import.meta.env.VITE_API_V1_URL || 'http://localhost:8080/api/v1'

const parseJson = async (response) => {
    const text = await response.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

const unwrapApiResponse = (data) => {
    if (data == null) return null
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && 'result' in data) return data.result
    return data
}

export const listBrands = async () => {
    const response = await fetch(`${API_BASE_URL}/brands`)
    const data = await parseJson(response)
    if (!response.ok) {
        const message =
            (data && typeof data === 'object' && (data.message || data.error))
                ? (data.message || data.error)
                : `API Error: ${response.status}`
        throw new Error(message)
    }
    return unwrapApiResponse(data) || []
}
