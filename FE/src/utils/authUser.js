const looksLikeEmail = (value) => /.+@.+\..+/.test(String(value || '').trim())

export const getDisplayName = (user) => {
    const candidates = [
        user?.fullName,
        user?.fullname,
        user?.name,
        user?.full_name,
        user?.given_name && user?.family_name ? `${user.given_name} ${user.family_name}` : '',
        user?.given_name,
        user?.family_name,
        user?.preferred_username,
        user?.username,
    ]

    const firstValid = candidates
        .map((item) => String(item || '').trim())
        .find((item) => item && !looksLikeEmail(item))

    if (firstValid) return firstValid

    const email = String(user?.email || user?.sub || '').trim()
    if (looksLikeEmail(email)) {
        return email.split('@')[0]
    }

    return 'User'
}

export const getDashboardPathByRole = (user) => {
    const rawRole = user?.role ?? user?.scope ?? ''
    const roleText = Array.isArray(rawRole)
        ? rawRole.join(' ')
        : String(rawRole)

    if (roleText.includes('ROLE_ADMIN') || roleText.includes('ADMIN')) {
        return '/admin/dashboard'
    }

    if (roleText.includes('ROLE_CAR_OWNER') || roleText.includes('CAR_OWNER')) {
        return '/owner/fleet'
    }

    return '/my-bookings'
}
