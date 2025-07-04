"use client";

import {
    BarChart3,
    Bell,
    ChevronDown,
    HelpCircle,
    Menu,
    Search,
    Settings,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIsHydrated } from '../../hooks/use-hydration-safe';
import { useTranslation } from '../../hooks/use-translation';
import { LanguageSelector } from '../common/language-selector';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

interface NavigationProps {
    children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
    const { t } = useTranslation('navigation');
    const { t: tCommon } = useTranslation('common');
    const [notifications, setNotifications] = useState(3);
    const [currentTime, setCurrentTime] = useState<string>('');
    const isHydrated = useIsHydrated();

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString());
        };

        updateTime(); // Set initial time
        const interval = setInterval(updateTime, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        { icon: BarChart3, label: t('menu.dashboard'), active: true },
        { icon: Zap, label: t('menu.consumption'), active: false },
        { icon: Settings, label: t('menu.settings'), active: false },
        { icon: HelpCircle, label: t('menu.help'), active: false },
    ];

    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">{t('actions.toggleMenu')}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <nav className="flex flex-col space-y-4">
                                <div className="flex items-center space-x-2 px-4 py-2">
                                    <Zap className="h-6 w-6 text-primary" />
                                    <span className="text-xl font-bold">Strahil's Bakery</span>
                                </div>
                                <div className="space-y-1">
                                    {menuItems.map((item) => (
                                        <Button
                                            key={item.label}
                                            variant={item.active ? "default" : "ghost"}
                                            className="w-full justify-start"
                                            size="sm"
                                        >
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="px-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{tCommon('labels.language')}</span>
                                        <LanguageSelector variant="select" size="sm" />
                                    </div>
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center space-x-4 md:space-x-6">
                        <div className="flex items-center space-x-2">
                            <Zap className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold hidden md:block">Strahil's Bakery</span>
                        </div>
                        <Badge variant="outline" className="hidden md:flex">
                            {t('menu.electricityManagement')}
                        </Badge>
                    </div>

                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="search"
                                    placeholder={tCommon('placeholders.searchPlaceholder')}
                                    className="pl-8 pr-4 py-2 text-sm bg-muted/50 border border-input rounded-md w-[300px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        <LanguageSelector variant="button" size="sm" />

                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-4 w-4" />
                            {notifications > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                                >
                                    {notifications}
                                </Badge>
                            )}
                            <span className="sr-only">{t('menu.notifications')}</span>
                        </Button>

                        <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>ST</AvatarFallback>
                            </Avatar>
                            <div className="hidden md:block">
                                <div className="flex items-center space-x-1">
                                    <span className="text-sm font-medium">Strahil</span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Strahil's Bakery</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                v1.0.0
                            </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{t('footer.builtWith')}</span>
                            <span>•</span>
                            <span>{t('footer.cloudStorage')}</span>
                            <span>•</span>
                            <span>{t('footer.realTimeAnalytics')}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {isHydrated && currentTime && (
                                <span>{t('footer.lastUpdated')}: {currentTime}</span>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
} 