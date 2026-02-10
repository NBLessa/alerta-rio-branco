interface SentinelaLogoProps {
    className?: string;
    size?: number;
}

export function SentinelaLogo({ className = '', size = 48 }: SentinelaLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 200 230"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Shield outline - navy blue */}
            <path
                d="M100 8 L185 45 C185 45 190 150 100 222 C10 150 15 45 15 45 Z"
                fill="#1a365d"
                stroke="#0f2847"
                strokeWidth="3"
            />

            {/* Inner shield - orange top */}
            <path
                d="M100 20 L175 52 C175 52 178 120 100 120 C22 120 25 52 25 52 Z"
                fill="url(#orangeGradient)"
            />

            {/* Inner shield - blue bottom (water) */}
            <path
                d="M100 120 C178 120 175 52 175 52 C178 155 100 210 100 210 C22 155 25 52 25 52 C25 52 22 120 100 120Z"
                fill="url(#blueGradient)"
            />

            {/* Water wave 1 */}
            <path
                d="M35 125 Q55 110 75 125 Q95 140 115 125 Q135 110 155 125 Q165 130 170 135"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.8"
            />

            {/* Water wave 2 */}
            <path
                d="M40 145 Q60 130 80 145 Q100 160 120 145 Q140 130 160 145"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.5"
            />

            {/* Water wave 3 */}
            <path
                d="M50 163 Q70 150 90 163 Q105 173 120 163 Q135 153 150 163"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.3"
            />

            {/* Radar/signal rings */}
            <circle cx="100" cy="75" r="12" fill="white" opacity="0.95" />
            <circle cx="100" cy="75" r="22" fill="none" stroke="white" strokeWidth="3.5" opacity="0.7" />
            <circle cx="100" cy="75" r="34" fill="none" stroke="white" strokeWidth="3" opacity="0.5" />
            <circle cx="100" cy="75" r="46" fill="none" stroke="white" strokeWidth="2.5" opacity="0.3" />

            {/* Orange accent wave */}
            <path
                d="M35 140 Q50 128 65 140 Q75 148 85 140"
                fill="none"
                stroke="#f97316"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.8"
            />

            {/* Gradients */}
            <defs>
                <linearGradient id="orangeGradient" x1="100" y1="20" x2="100" y2="120" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="100" y1="120" x2="100" y2="210" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="40%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#1a365d" />
                </linearGradient>
            </defs>
        </svg>
    );
}
