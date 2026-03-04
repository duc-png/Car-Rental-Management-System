export const MAX_OWNER_REGISTRATION_IMAGES = 5
export const CUSTOM_MODEL_OPTION = '__custom_model__'
export const ACCEPTED_OWNER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const createEmptyOwnerRegistrationForm = () => ({
    owner: {
        email: '',
        phone: '',
        fullName: '',
        password: '',
    },
    vehicle: {
        licensePlate: '',
        brand: '',
        model: '',
        seatCount: '',
        manufacturingYear: '',
        transmission: 'AUTOMATIC',
        fuelType: 'GASOLINE',
        pricePerDay: '',
        addressDetail: '',
        deliveryEnabled: true,
        freeDeliveryWithinKm: 0,
        maxDeliveryDistanceKm: 20,
        extraFeePerKm: 10000,
        fuelConsumption: '',
        description: '',
        featureIds: [],
    },
})
