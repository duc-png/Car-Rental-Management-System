export const MENU = {
    DASHBOARD: 'dashboard',
    ACCOUNT: 'account',
    PASSWORD: 'password',
    FAVORITES: 'favorites',
    TRIPS: 'trips'
}

export const TRIP_TAB = {
    CURRENT: 'current',
    HISTORY: 'history'
}

export const CURRENT_TRIP_STATUS = new Set(['PENDING', 'CONFIRMED', 'ONGOING'])
export const SUCCESS_TRIP_STATUS = new Set(['COMPLETED'])

export const EMPTY_PROFILE_FORM = {
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseFullName: '',
    licenseBirthDate: '',
    licenseNation: '',
    licenseAddress: '',
    licenseAddressRaw: '',
    licenseIssueLocation: '',
    licenseIssueDate: '',
    licenseClass: '',
    licenseExpiryDate: '',
    licenseImagePreview: '',
    licenseVerificationStatus: '',
    licenseVerificationNote: '',
    licenseVerifiedAt: '',
    avatar: '',
    address: '',
    birthDate: '',
    gender: 'Nam'
}
