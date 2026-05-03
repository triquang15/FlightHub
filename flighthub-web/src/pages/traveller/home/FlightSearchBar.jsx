import React from 'react'

const cabinClasses = [
    { value: "ECONOMY", label: "Economy" },
    { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
    { value: "BUSINESS", label: "Business" },
    { value: "FIRST", label: "First Class" }
]

const specialFares = [
    {
        id: "regular",
        label: "Regular",
        description: "Regular fares",
        icon: User,
        discount: null
    },
    {
        id: "student",
        label: "Student",
        description: "Extra discounts/baggage",
        icon: GraduationCap,
        discount: null
    },
    {
        id: "armed_forces",
        label: "Armed Forces",
        description: "Up to ₹600 off",
        icon: Shield,
        discount: "$600"
    },
    {
        id: "senior_citizen",
        label: "Senior Citizen",
        description: "Up to $600 off",
        icon: User,
        discount: "$600"
    },
    {
        id: "doctor_nurses",
        label: "Doctor and Nurses",
        description: "Up to $600 off",
        icon: Stethoscope,
        discount: "$600"
    }
]

const FlightSearchBar = () => {

    const [tripType, setTripType] = React.useState("oneWay") // roundTrip, oneWay, multiCity

    return (
        <div>

        </div>
    )
}

export default FlightSearchBar
