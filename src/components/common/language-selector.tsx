"use client"

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { localeNames } from '@/config/translation-config'
import { useLocale } from '@/contexts/translation-context'
import { Globe } from 'lucide-react'

interface LanguageSelectorProps {
    variant?: 'select' | 'button'
    size?: 'sm' | 'default' | 'lg'
}

export function LanguageSelector({ variant = 'select', size = 'default' }: LanguageSelectorProps) {
    const { locale, setLocale } = useLocale()

    if (variant === 'button') {
        return (
            <Button
                variant="outline"
                size={size}
                onClick={() => setLocale(locale === 'en' ? 'bg' : 'en')}
                className="flex items-center gap-2"
            >
                <Globe className="h-4 w-4" />
                {localeNames[locale]}
            </Button>
        )
    }

    return (
        <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-auto min-w-[120px]">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <SelectValue placeholder={localeNames[locale]} />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">
                    <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">🇺🇸</span>
                        {localeNames.en}
                    </div>
                </SelectItem>
                <SelectItem value="bg">
                    <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">🇧🇬</span>
                        {localeNames.bg}
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    )
} 