import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    changeMyCustomerPassword,
    getMyCustomerProfile,
    getMyFavoriteVehicles,
    removeMyFavoriteVehicle,
    scanMyCustomerLicenseOcr,
    sendEmailOtpForProfileUpdate,
    uploadMyCustomerAvatar,
    updateMyCustomerBasicInfo,
    updateMyCustomerLicenseInfo,
    updateMyCustomerPhone,
    verifyEmailOtpForProfileUpdate
} from '../../api/customers'
import { getMyBookings } from '../../api/bookings'
import { useAuth } from '../../hooks/useAuth'
import {
    CURRENT_TRIP_STATUS,
    EMPTY_PROFILE_FORM,
    MENU,
    SUCCESS_TRIP_STATUS,
    TRIP_TAB
} from '../../utils/customerProfile/constants'
import { formatDateTime, statusClassName } from '../../utils/customerProfile/utils'
import Sidebar from '../../components/user/customer-profile/Sidebar'
import DashboardSection from '../../components/user/customer-profile/DashboardSection'
import AccountSection from '../../components/user/customer-profile/AccountSection'
import FavoritesSection from '../../components/user/customer-profile/FavoritesSection'
import TripsSection from '../../components/user/customer-profile/TripsSection'
import PasswordSection from '../../components/user/customer-profile/PasswordSection'
import '../../styles/customer-profile/Layout.css'
import '../../styles/customer-profile/Dashboard.css'
import '../../styles/customer-profile/Account.css'
import '../../styles/customer-profile/FavoritesTrips.css'
import '../../styles/MyBookings.css'

function CustomerProfile() {
    const navigate = useNavigate()
    const { token, isAuthenticated, loading: authLoading, refreshProfile, logout } = useAuth()
    const [activeMenu, setActiveMenu] = useState(MENU.DASHBOARD)
    const [activeTripTab, setActiveTripTab] = useState(TRIP_TAB.CURRENT)
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
    const [infoModalForm, setInfoModalForm] = useState({
        fullName: '',
        birthDate: '',
        gender: 'Nam'
    })

    const [formData, setFormData] = useState(EMPTY_PROFILE_FORM)
    const [profileMeta, setProfileMeta] = useState({
        createdAt: null,
        totalBookings: 0
    })
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [phoneSaving, setPhoneSaving] = useState(false)
    const [emailOtpSending, setEmailOtpSending] = useState(false)
    const [emailVerifying, setEmailVerifying] = useState(false)
    const [error, setError] = useState('')

    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
    const [phoneModalValue, setPhoneModalValue] = useState('')
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
    const [licenseModalForm, setLicenseModalForm] = useState({
        licenseNumber: '',
        licenseFullName: '',
        birthDate: '',
        nation: '',
        address: '',
        addressRaw: '',
        issueLocation: '',
        issueDate: '',
        licenseClass: '',
        expiryDate: ''
    })
    const [licenseModalPreview, setLicenseModalPreview] = useState('')
    const [licenseOcrScanning, setLicenseOcrScanning] = useState(false)
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
    const [emailModalForm, setEmailModalForm] = useState({
        newEmail: '',
        otp: '',
        otpSent: false
    })

    const [favoriteCars, setFavoriteCars] = useState([])
    const [favoriteLoading, setFavoriteLoading] = useState(false)

    const [bookings, setBookings] = useState([])
    const [bookingLoading, setBookingLoading] = useState(false)
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
    const [avatarDraftFile, setAvatarDraftFile] = useState(null)
    const [avatarDraftPreview, setAvatarDraftPreview] = useState('')
    const [avatarZoom, setAvatarZoom] = useState(1)
    const [avatarPosition, setAvatarPosition] = useState({ x: 50, y: 50 })
    const avatarInputRef = useRef(null)
    const avatarPreviewUrlRef = useRef('')
    const licenseOcrInputRef = useRef(null)
    const licenseOcrPreviewUrlRef = useRef('')

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
    const normalizeBirthDateInput = (value) => {
        const raw = String(value || '').trim()
        if (!raw) return ''
        const parsed = new Date(raw)
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10)
        }
        const compact = raw.replace(/\./g, '-').replace(/\//g, '-')
        const parts = compact.split('-').map((part) => part.trim())
        if (parts.length === 3 && parts[2].length === 4) {
            const [day, month, year] = parts
            const dd = day.padStart(2, '0')
            const mm = month.padStart(2, '0')
            return `${year}-${mm}-${dd}`
        }
        return ''
    }

    const formatBirthDateLabel = (value) => {
        const normalized = normalizeBirthDateInput(value)
        if (!normalized) return '--/--/----'
        const [year, month, day] = normalized.split('-')
        return `${day}/${month}/${year}`
    }

    const createCroppedAvatarFile = useCallback((file, zoom, position) => {
        return new Promise((resolve, reject) => {
            const sourceUrl = URL.createObjectURL(file)
            const image = new Image()

            image.onload = () => {
                try {
                    const outputSize = 720
                    const canvas = document.createElement('canvas')
                    canvas.width = outputSize
                    canvas.height = outputSize
                    const context = canvas.getContext('2d')

                    if (!context) {
                        reject(new Error('Không thể khởi tạo bộ xử lý ảnh'))
                        return
                    }

                    const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight)
                    const baseWidth = image.naturalWidth * baseScale
                    const baseHeight = image.naturalHeight * baseScale
                    const parsedZoom = Number(zoom)
                    const parsedX = Number(position?.x)
                    const parsedY = Number(position?.y)
                    const safeZoom = clamp(Number.isFinite(parsedZoom) ? parsedZoom : 1, 1, 2.5)
                    const safeX = clamp(Number.isFinite(parsedX) ? parsedX : 50, 0, 100)
                    const safeY = clamp(Number.isFinite(parsedY) ? parsedY : 50, 0, 100)

                    const baseX = (outputSize - baseWidth) * (safeX / 100)
                    const baseY = (outputSize - baseHeight) * (safeY / 100)

                    const drawWidth = baseWidth * safeZoom
                    const drawHeight = baseHeight * safeZoom
                    const drawX = (baseX - outputSize / 2) * safeZoom + outputSize / 2
                    const drawY = (baseY - outputSize / 2) * safeZoom + outputSize / 2

                    context.clearRect(0, 0, outputSize, outputSize)
                    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

                    const outputType = ['image/png', 'image/webp', 'image/jpeg'].includes(file.type)
                        ? file.type
                        : 'image/jpeg'
                    const quality = outputType === 'image/jpeg' ? 0.92 : undefined
                    const extension = outputType === 'image/png' ? 'png' : outputType === 'image/webp' ? 'webp' : 'jpg'
                    const baseName = String(file.name || 'avatar').replace(/\.[^.]+$/, '')

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Không thể tạo ảnh sau khi cắt'))
                            return
                        }

                        resolve(new File([blob], `${baseName}-cropped.${extension}`, { type: outputType }))
                    }, outputType, quality)
                } finally {
                    URL.revokeObjectURL(sourceUrl)
                }
            }

            image.onerror = () => {
                URL.revokeObjectURL(sourceUrl)
                reject(new Error('Không thể đọc file ảnh'))
            }

            image.src = sourceUrl
        })
    }, [])

    const currentTrips = useMemo(
        () => bookings.filter((booking) => CURRENT_TRIP_STATUS.has(String(booking?.status || ''))),
        [bookings]
    )

    const successTrips = useMemo(
        () => bookings.filter((booking) => SUCCESS_TRIP_STATUS.has(String(booking?.status || ''))),
        [bookings]
    )

    const tripHistory = useMemo(
        () => bookings.filter((booking) => !CURRENT_TRIP_STATUS.has(String(booking?.status || ''))),
        [bookings]
    )

    const displayedTrips = useMemo(
        () => (activeTripTab === TRIP_TAB.CURRENT ? currentTrips : tripHistory),
        [activeTripTab, currentTrips, tripHistory]
    )

    const recentTrips = useMemo(() => {
        return [...bookings]
            .sort((a, b) => new Date(b?.startDate || 0).getTime() - new Date(a?.startDate || 0).getTime())
            .slice(0, 4)
    }, [bookings])

    const spendingTotal = useMemo(() => {
        return successTrips.reduce((sum, item) => sum + Number(item?.totalPrice || 0), 0)
    }, [successTrips])

    const highlightedTrip = useMemo(() => {
        if (currentTrips.length > 0) return currentTrips[0]
        return recentTrips[0] || null
    }, [currentTrips, recentTrips])

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return

            try {
                setLoading(true)
                setError('')
                const payload = await getMyCustomerProfile(token)
                const profile = payload?.result

                if (!profile) {
                    setError('Không tải được hồ sơ cá nhân.')
                    return
                }

                setFormData({
                    fullName: profile.fullName || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    licenseNumber: profile.licenseNumber || '',
                    licenseFullName: profile.licenseFullName || profile.fullName || '',
                    licenseBirthDate: normalizeBirthDateInput(profile.licenseDob || ''),
                    licenseNation: String(profile.nation || '').trim(),
                    licenseAddress: String(profile.licenseAddress || '').trim(),
                    licenseAddressRaw: String(profile.licenseAddressRaw || '').trim(),
                    licenseIssueLocation: String(profile.issueLocation || '').trim(),
                    licenseIssueDate: normalizeBirthDateInput(profile.issueDate || ''),
                    licenseClass: String(profile.licenseClass || '').trim(),
                    licenseExpiryDate: normalizeBirthDateInput(profile.expiryDate || ''),
                    licenseImagePreview: String(profile.licenseImageUrl || '').trim(),
                    licenseVerificationStatus: String(profile.licenseVerificationStatus || '').trim(),
                    licenseVerificationNote: String(profile.licenseVerificationNote || '').trim(),
                    licenseVerifiedAt: profile.licenseVerifiedAt || '',
                    avatar: profile.avatar || '',
                    address: profile.address || '',
                    birthDate: normalizeBirthDateInput(profile.birthDate || profile.dateOfBirth || ''),
                    gender: String(profile.gender || '').trim() || 'Nam'
                })
                setProfileMeta({
                    createdAt: profile.createdAt || null,
                    totalBookings: Number(profile.totalBookings || 0)
                })
            } catch (e) {
                setError(e.message || 'Không tải được hồ sơ cá nhân.')
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && !isAuthenticated) {
            navigate('/login')
            return
        }

        fetchProfile()
    }, [authLoading, isAuthenticated, navigate, token])

    const loadFavoriteCars = useCallback(async () => {
        try {
            setFavoriteLoading(true)
            const payload = await getMyFavoriteVehicles(token)
            setFavoriteCars(payload?.result || [])
        } catch (e) {
            toast.error(e.message || 'Không tải được xe yêu thích')
            setFavoriteCars([])
        } finally {
            setFavoriteLoading(false)
        }
    }, [token])

    const loadBookings = useCallback(async () => {
        try {
            setBookingLoading(true)
            const data = await getMyBookings()
            setBookings(data || [])
        } catch (e) {
            toast.error(e.message || 'Không tải được chuyến đi')
        } finally {
            setBookingLoading(false)
        }
    }, [])

    useEffect(() => {
        if (activeMenu === MENU.DASHBOARD || activeMenu === MENU.FAVORITES) {
            loadFavoriteCars()
        }

        if (activeMenu === MENU.TRIPS) {
            loadBookings()
        }
    }, [activeMenu, loadBookings, loadFavoriteCars])

    useEffect(() => {
        if (token) {
            loadBookings()
        }
    }, [token, loadBookings])

    const previewAvatar = useMemo(() => {
        const value = String(formData.avatar || '').trim()
        return value || ''
    }, [formData.avatar])

    const getCreatedDateParts = (value) => {
        const raw = String(value || '').trim()
        if (!raw) return null

        const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
            return { year: match[1], month: match[2], day: match[3] }
        }

        const date = new Date(raw)
        if (Number.isNaN(date.getTime())) return null

        return {
            year: String(date.getUTCFullYear()),
            month: String(date.getUTCMonth() + 1).padStart(2, '0'),
            day: String(date.getUTCDate()).padStart(2, '0')
        }
    }

    const joinedDateLabel = useMemo(() => {
        const parts = getCreatedDateParts(profileMeta.createdAt)
        if (!parts) return '--/--/----'
        return `${parts.day}/${parts.month}/${parts.year}`
    }, [profileMeta.createdAt])

    const memberSinceYearLabel = useMemo(() => {
        const parts = getCreatedDateParts(profileMeta.createdAt)
        if (!parts) return '--'
        return parts.year
    }, [profileMeta.createdAt])

    const phoneVerified = useMemo(() => String(formData.phone || '').trim().length > 0, [formData.phone])

    const openInfoModal = () => {
        setInfoModalForm({
            fullName: String(formData.fullName || '').trim(),
            birthDate: normalizeBirthDateInput(formData.birthDate),
            gender: String(formData.gender || '').trim() || 'Nam'
        })
        setIsInfoModalOpen(true)
    }

    const closeInfoModal = () => {
        if (saving) return
        setIsInfoModalOpen(false)
    }

    const handleInfoModalChange = (event) => {
        const { name, value } = event.target
        setInfoModalForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const submitInfoModal = async (event) => {
        event.preventDefault()

        const fullName = String(infoModalForm.fullName || '').trim()
        if (!fullName) {
            toast.error('Vui lòng nhập tên tài khoản')
            return
        }

        try {
            setSaving(true)
            await updateMyCustomerBasicInfo(token, { fullName })
            await refreshProfile()

            setFormData((prev) => ({
                ...prev,
                fullName,
                birthDate: normalizeBirthDateInput(infoModalForm.birthDate),
                gender: String(infoModalForm.gender || '').trim() || 'Nam'
            }))
            setIsInfoModalOpen(false)
            toast.success('Cập nhật thông tin thành công')
        } catch (e) {
            toast.error(e.message || 'Không thể cập nhật thông tin')
        } finally {
            setSaving(false)
        }
    }

    const openPhoneModal = () => {
        setPhoneModalValue(String(formData.phone || '').trim())
        setIsPhoneModalOpen(true)
    }

    const openLicenseModal = () => {
        const committedPreview = String(formData.licenseImagePreview || '').trim()
        setLicenseModalForm({
            licenseNumber: String(formData.licenseNumber || '').trim(),
            licenseFullName: String(formData.licenseFullName || '').trim(),
            birthDate: normalizeBirthDateInput(formData.licenseBirthDate),
            nation: String(formData.licenseNation || '').trim(),
            address: String(formData.licenseAddress || '').trim(),
            addressRaw: String(formData.licenseAddressRaw || '').trim(),
            issueLocation: String(formData.licenseIssueLocation || '').trim(),
            issueDate: normalizeBirthDateInput(formData.licenseIssueDate),
            licenseClass: String(formData.licenseClass || '').trim(),
            expiryDate: normalizeBirthDateInput(formData.licenseExpiryDate)
        })
        setLicenseModalPreview(committedPreview)
        setIsLicenseModalOpen(true)
    }

    const closeLicenseModal = () => {
        if (saving || licenseOcrScanning) return

        const committedPreview = String(formData.licenseImagePreview || '').trim()
        const draftPreview = String(licenseModalPreview || '').trim()
        if (draftPreview && draftPreview !== committedPreview && draftPreview.startsWith('blob:')) {
            URL.revokeObjectURL(draftPreview)
        }

        if (licenseOcrPreviewUrlRef.current === draftPreview && draftPreview !== committedPreview) {
            licenseOcrPreviewUrlRef.current = ''
        }

        setLicenseModalPreview(committedPreview)
        setIsLicenseModalOpen(false)
    }

    const handleLicenseModalChange = (event) => {
        const { name, value } = event.target
        setLicenseModalForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const submitLicenseModal = async (event) => {
        event.preventDefault()

        const licenseFullName = String(licenseModalForm.licenseFullName || '').trim()
        if (!licenseFullName) {
            toast.error('Vui lòng nhập họ và tên trên GPLX')
            return
        }

        try {
            setSaving(true)
            const nextPreview = String(licenseModalPreview || '').trim()
            const normalizedLicenseImageUrl = /^https?:\/\//i.test(nextPreview)
                ? nextPreview
                : String(formData.licenseImagePreview || '').trim()

            const payload = await updateMyCustomerLicenseInfo(token, {
                licenseFullName,
                licenseNumber: String(licenseModalForm.licenseNumber || '').trim(),
                birthDate: normalizeBirthDateInput(licenseModalForm.birthDate),
                nation: String(licenseModalForm.nation || '').trim(),
                address: String(licenseModalForm.address || '').trim(),
                addressRaw: String(licenseModalForm.addressRaw || '').trim(),
                issueLocation: String(licenseModalForm.issueLocation || '').trim(),
                issueDate: normalizeBirthDateInput(licenseModalForm.issueDate),
                licenseClass: String(licenseModalForm.licenseClass || '').trim(),
                expiryDate: normalizeBirthDateInput(licenseModalForm.expiryDate),
                licenseImageUrl: normalizedLicenseImageUrl
            })

            const updated = payload?.result || {}
            const committedPreview = String(formData.licenseImagePreview || '').trim()
            if (committedPreview && committedPreview !== nextPreview && committedPreview.startsWith('blob:')) {
                URL.revokeObjectURL(committedPreview)
            }

            setFormData((prev) => ({
                ...prev,
                licenseFullName: String(updated.licenseFullName || licenseFullName),
                licenseNumber: String(updated.licenseNumber || licenseModalForm.licenseNumber || '').trim(),
                licenseBirthDate: normalizeBirthDateInput(updated.licenseDob || licenseModalForm.birthDate),
                licenseNation: String(updated.nation || licenseModalForm.nation || '').trim(),
                licenseAddress: String(updated.licenseAddress || licenseModalForm.address || '').trim(),
                licenseAddressRaw: String(updated.licenseAddressRaw || licenseModalForm.addressRaw || '').trim(),
                licenseIssueLocation: String(updated.issueLocation || licenseModalForm.issueLocation || '').trim(),
                licenseIssueDate: normalizeBirthDateInput(updated.issueDate || licenseModalForm.issueDate),
                licenseClass: String(updated.licenseClass || licenseModalForm.licenseClass || '').trim(),
                licenseExpiryDate: normalizeBirthDateInput(updated.expiryDate || licenseModalForm.expiryDate),
                licenseImagePreview: String(updated.licenseImageUrl || normalizedLicenseImageUrl || prev.licenseImagePreview || '').trim(),
                licenseVerificationStatus: String(updated.licenseVerificationStatus || 'PENDING').trim(),
                licenseVerificationNote: String(updated.licenseVerificationNote || '').trim(),
                licenseVerifiedAt: updated.licenseVerifiedAt || ''
            }))
            await refreshProfile()
            setIsLicenseModalOpen(false)
            setLicenseModalPreview(String(updated.licenseImageUrl || normalizedLicenseImageUrl || '').trim())
            toast.success('Cập nhật thông tin GPLX thành công')
        } catch (e) {
            toast.error(e.message || 'Không thể cập nhật thông tin GPLX')
        } finally {
            setSaving(false)
        }
    }

    const openLicenseOcrPicker = () => {
        if (licenseOcrScanning) return
        licenseOcrInputRef.current?.click()
    }

    const handleLicenseOcrFileChange = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''

        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh hợp lệ')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh GPLX không được vượt quá 5MB')
            return
        }

        try {
            setLicenseOcrScanning(true)
            const committedPreview = String(formData.licenseImagePreview || '').trim()
            if (licenseOcrPreviewUrlRef.current && licenseOcrPreviewUrlRef.current !== committedPreview) {
                URL.revokeObjectURL(licenseOcrPreviewUrlRef.current)
                licenseOcrPreviewUrlRef.current = ''
            }

            const localPreview = URL.createObjectURL(file)
            licenseOcrPreviewUrlRef.current = localPreview

            const payload = await scanMyCustomerLicenseOcr(token, file)
            const result = payload?.result || {}
            const uploadedImageUrl = String(result.licenseImageUrl || '').trim()

            if (uploadedImageUrl) {
                URL.revokeObjectURL(localPreview)
                licenseOcrPreviewUrlRef.current = ''
            }

            setLicenseModalPreview(uploadedImageUrl || localPreview)

            setLicenseModalForm((prev) => ({
                ...prev,
                licenseNumber: String(result.licenseNumber || prev.licenseNumber || '').trim(),
                licenseFullName: String(result.licenseFullName || prev.licenseFullName || '').trim(),
                birthDate: normalizeBirthDateInput(result.birthDate || prev.birthDate),
                nation: String(result.nation || prev.nation || '').trim(),
                address: String(result.address || prev.address || '').trim(),
                addressRaw: String(result.addressRaw || prev.addressRaw || '').trim(),
                issueLocation: String(result.issueLocation || prev.issueLocation || '').trim(),
                issueDate: normalizeBirthDateInput(result.issueDate || prev.issueDate),
                licenseClass: String(result.licenseClass || prev.licenseClass || '').trim(),
                expiryDate: normalizeBirthDateInput(result.expiryDate || prev.expiryDate)
            }))

            toast.success('Quét OCR thành công, nhấn Cập nhật để gửi xác minh cho admin')
        } catch (e) {
            toast.error(e.message || 'Không thể quét OCR GPLX')
        } finally {
            setLicenseOcrScanning(false)
        }
    }

    const closePhoneModal = () => {
        if (phoneSaving) return
        setIsPhoneModalOpen(false)
    }

    const submitPhoneModal = async (event) => {
        event.preventDefault()
        const nextPhone = String(phoneModalValue || '').trim()

        if (!nextPhone) {
            toast.error('Vui lòng nhập số điện thoại')
            return
        }

        try {
            setPhoneSaving(true)
            const payload = await updateMyCustomerPhone(token, nextPhone)
            const updatedPhone = String(payload?.result?.phone || nextPhone)
            setFormData((prev) => ({
                ...prev,
                phone: updatedPhone
            }))
            await refreshProfile()
            setIsPhoneModalOpen(false)
            toast.success('Cập nhật số điện thoại thành công')
        } catch (e) {
            toast.error(e.message || 'Không thể cập nhật số điện thoại')
        } finally {
            setPhoneSaving(false)
        }
    }

    const openEmailModal = () => {
        setEmailModalForm({
            newEmail: String(formData.email || '').trim(),
            otp: '',
            otpSent: false
        })
        setIsEmailModalOpen(true)
    }

    const closeEmailModal = () => {
        if (emailOtpSending || emailVerifying) return
        setIsEmailModalOpen(false)
    }

    const handleEmailModalChange = (event) => {
        const { name, value } = event.target
        setEmailModalForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const submitSendEmailOtp = async (event) => {
        event.preventDefault()
        const newEmail = String(emailModalForm.newEmail || '').trim()

        if (!newEmail) {
            toast.error('Vui lòng nhập email mới')
            return
        }

        try {
            setEmailOtpSending(true)
            await sendEmailOtpForProfileUpdate(token, newEmail)
            setEmailModalForm((prev) => ({
                ...prev,
                newEmail,
                otpSent: true
            }))
            toast.success('Đã gửi OTP đến email mới')
        } catch (e) {
            toast.error(e.message || 'Không thể gửi OTP')
        } finally {
            setEmailOtpSending(false)
        }
    }

    const submitVerifyEmailOtp = async (event) => {
        event.preventDefault()
        const newEmail = String(emailModalForm.newEmail || '').trim()
        const otp = String(emailModalForm.otp || '').trim()

        if (!newEmail || !otp) {
            toast.error('Vui lòng nhập đầy đủ email và OTP')
            return
        }

        try {
            setEmailVerifying(true)
            const payload = await verifyEmailOtpForProfileUpdate(token, { newEmail, otp })
            const updatedEmail = String(payload?.result?.email || newEmail)
            setFormData((prev) => ({
                ...prev,
                email: updatedEmail
            }))
            await refreshProfile()
            setIsEmailModalOpen(false)
            toast.success('Cập nhật email thành công')
        } catch (e) {
            toast.error(e.message || 'OTP không hợp lệ')
        } finally {
            setEmailVerifying(false)
        }
    }

    const openAvatarModal = () => {
        setIsAvatarModalOpen(true)
    }

    const closeAvatarModal = () => {
        if (avatarUploading) return
        setIsAvatarModalOpen(false)
        setAvatarDraftFile(null)
        setAvatarDraftPreview('')
        setAvatarZoom(1)
        setAvatarPosition({ x: 50, y: 50 })
        if (avatarInputRef.current) {
            avatarInputRef.current.value = ''
        }
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current)
            avatarPreviewUrlRef.current = ''
        }
    }

    const openAvatarPicker = () => {
        avatarInputRef.current?.click()
    }

    const handleAvatarFileChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh hợp lệ')
            event.target.value = ''
            return
        }

        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current)
            avatarPreviewUrlRef.current = ''
        }

        const previewUrl = URL.createObjectURL(file)
        avatarPreviewUrlRef.current = previewUrl
        setAvatarDraftFile(file)
        setAvatarDraftPreview(previewUrl)
        setAvatarZoom(1)
        setAvatarPosition({ x: 50, y: 50 })
        event.target.value = ''
    }

    const submitAvatarUpdate = async () => {
        if (!avatarDraftFile) {
            toast.error('Vui lòng chọn ảnh trước khi cập nhật')
            return
        }

        try {
            setAvatarUploading(true)
            const croppedFile = await createCroppedAvatarFile(avatarDraftFile, avatarZoom, avatarPosition)
            const payload = await uploadMyCustomerAvatar(token, croppedFile)
            const avatarUrl = String(payload?.result || '').trim()

            if (!avatarUrl) {
                throw new Error('Không nhận được URL ảnh đại diện')
            }

            setFormData((prev) => ({
                ...prev,
                avatar: avatarUrl
            }))
            await refreshProfile()
            toast.success('Tải ảnh đại diện thành công')
            closeAvatarModal()
        } catch (e) {
            toast.error(e.message || 'Không thể tải ảnh đại diện')
        } finally {
            setAvatarUploading(false)
        }
    }

    useEffect(() => {
        return () => {
            if (avatarPreviewUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewUrlRef.current)
            }
            if (licenseOcrPreviewUrlRef.current) {
                URL.revokeObjectURL(licenseOcrPreviewUrlRef.current)
            }
        }
    }, [])

    const removeFavoriteCar = (vehicleId) => {
        const run = async () => {
            try {
                const payload = await removeMyFavoriteVehicle(token, vehicleId)
                setFavoriteCars(payload?.result || [])
                toast.success('Đã xóa xe khỏi danh sách yêu thích')
            } catch (e) {
                toast.error(e.message || 'Không thể xóa xe yêu thích')
            }
        }

        run()
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const handlePasswordChange = (event) => {
        const { name, value } = event.target
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const submitPasswordForm = (event) => {
        event.preventDefault()

        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin đổi mật khẩu')
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận không khớp')
            return
        }

        const run = async () => {
            try {
                await changeMyCustomerPassword(token, {
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword,
                    confirmPassword: passwordForm.confirmPassword
                })

                toast.success('Đổi mật khẩu thành công')
                setPasswordForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
            } catch (e) {
                toast.error(e.message || 'Không thể đổi mật khẩu')
            }
        }

        run()
    }

    if (loading || authLoading) {
        return (
            <div className="customer-profile-page">
                <div className="customer-profile-state">Đang tải hồ sơ...</div>
            </div>
        )
    }

    return (
        <div className="customer-profile-page">
            <div className="customer-profile-shell">
                <div className="customer-profile-layout">
                    <Sidebar
                        previewAvatar={previewAvatar}
                        fullName={formData.fullName}
                        email={formData.email}
                        activeMenu={activeMenu}
                        onMenuChange={setActiveMenu}
                        onLogout={handleLogout}
                    />

                    <section className="customer-content">
                        {activeMenu === MENU.DASHBOARD ? (
                            <DashboardSection
                                fullName={formData.fullName}
                                memberSinceYear={memberSinceYearLabel}
                                currentTrips={currentTrips}
                                favoriteCars={favoriteCars}
                                spendingTotal={spendingTotal}
                                highlightedTrip={highlightedTrip}
                                recentTrips={recentTrips}
                                onOpenTrips={() => setActiveMenu(MENU.TRIPS)}
                                formatDateTime={formatDateTime}
                                statusClassName={statusClassName}
                            />
                        ) : null}

                        {activeMenu === MENU.ACCOUNT ? (
                            <AccountSection
                                formData={formData}
                                successTripsCount={successTrips.length}
                                birthDateLabel={formatBirthDateLabel(formData.birthDate)}
                                licenseBirthDateLabel={formatBirthDateLabel(formData.licenseBirthDate)}
                                genderLabel={formData.gender || 'Nam'}
                                joinedDateLabel={joinedDateLabel}
                                phoneVerified={phoneVerified}
                                avatarUploading={avatarUploading}
                                previewAvatar={previewAvatar}
                                isAvatarModalOpen={isAvatarModalOpen}
                                avatarModalPreview={avatarDraftPreview}
                                isInfoModalOpen={isInfoModalOpen}
                                infoModalForm={infoModalForm}
                                isPhoneModalOpen={isPhoneModalOpen}
                                phoneModalValue={phoneModalValue}
                                isLicenseModalOpen={isLicenseModalOpen}
                                licenseModalForm={licenseModalForm}
                                licenseModalPreview={licenseModalPreview}
                                licenseOcrScanning={licenseOcrScanning}
                                isEmailModalOpen={isEmailModalOpen}
                                emailModalForm={emailModalForm}
                                avatarZoom={avatarZoom}
                                avatarPosition={avatarPosition}
                                avatarInputRef={avatarInputRef}
                                onOpenInfoModal={openInfoModal}
                                onCloseInfoModal={closeInfoModal}
                                onInfoModalChange={handleInfoModalChange}
                                onInfoModalSubmit={submitInfoModal}
                                onOpenPhoneModal={openPhoneModal}
                                onClosePhoneModal={closePhoneModal}
                                onPhoneModalChange={setPhoneModalValue}
                                onPhoneModalSubmit={submitPhoneModal}
                                onOpenLicenseModal={openLicenseModal}
                                onCloseLicenseModal={closeLicenseModal}
                                onLicenseModalChange={handleLicenseModalChange}
                                onLicenseModalSubmit={submitLicenseModal}
                                onOpenLicenseOcrPicker={openLicenseOcrPicker}
                                onLicenseOcrFileChange={handleLicenseOcrFileChange}
                                onOpenEmailModal={openEmailModal}
                                onCloseEmailModal={closeEmailModal}
                                onEmailModalChange={handleEmailModalChange}
                                onSendEmailOtp={submitSendEmailOtp}
                                onVerifyEmailOtp={submitVerifyEmailOtp}
                                onOpenAvatarModal={openAvatarModal}
                                onCloseAvatarModal={closeAvatarModal}
                                onOpenAvatarPicker={openAvatarPicker}
                                onAvatarFileChange={handleAvatarFileChange}
                                onAvatarZoomChange={(nextZoom) => setAvatarZoom(clamp(nextZoom, 1, 2.5))}
                                onAvatarPositionChange={(nextPosition) => {
                                    const parsedX = Number(nextPosition?.x)
                                    const parsedY = Number(nextPosition?.y)
                                    setAvatarPosition({
                                        x: clamp(Number.isFinite(parsedX) ? parsedX : 50, 0, 100),
                                        y: clamp(Number.isFinite(parsedY) ? parsedY : 50, 0, 100)
                                    })
                                }}
                                onAvatarUpdate={submitAvatarUpdate}
                                saving={saving}
                                phoneSaving={phoneSaving}
                                licenseOcrInputRef={licenseOcrInputRef}
                                emailOtpSending={emailOtpSending}
                                emailVerifying={emailVerifying}
                                error={error}
                            />
                        ) : null}

                        {activeMenu === MENU.FAVORITES ? (
                            <FavoritesSection
                                favoriteLoading={favoriteLoading}
                                favoriteCars={favoriteCars}
                                onRemoveFavorite={removeFavoriteCar}
                            />
                        ) : null}

                        {activeMenu === MENU.TRIPS ? (
                            <TripsSection
                                bookingLoading={bookingLoading}
                                activeTripTab={activeTripTab}
                                currentTrips={currentTrips}
                                tripHistory={tripHistory}
                                displayedTrips={displayedTrips}
                                onTripTabChange={setActiveTripTab}
                                onRefresh={loadBookings}
                            />
                        ) : null}

                        {activeMenu === MENU.PASSWORD ? (
                            <PasswordSection
                                passwordForm={passwordForm}
                                onChange={handlePasswordChange}
                                onSubmit={submitPasswordForm}
                            />
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default CustomerProfile
