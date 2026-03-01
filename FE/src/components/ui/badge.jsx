import * as React from "react"
import { cva } from "class-variance-authority"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-blue-600 text-white hover:bg-blue-700",
                secondary:
                    "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={badgeVariants({ variant, className })} {...props} />
    )
}

export { Badge, badgeVariants }
