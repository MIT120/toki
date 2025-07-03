"use client";

import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Info
} from 'lucide-react';
import { useTranslation } from '../../hooks/use-translation';
import { roundCurrency } from '../../utils/electricity-calculations';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { Recommendation, RecommendationsListProps } from './types';

export function RecommendationsList({
    recommendations = [],
    title,
    description,
    emptyMessage,
    onRecommendationClick,
    className = "",
    variant = 'default',
    titleKey,
    descriptionKey,
    emptyMessageKey,
    namespace = 'common'
}: RecommendationsListProps) {
    const { t } = useTranslation(namespace);

    const displayTitle = titleKey ? t(titleKey) : title || "Smart Recommendations";
    const displayDescription = descriptionKey ? t(descriptionKey) : description || "AI-powered suggestions to optimize your energy usage";
    const displayEmptyMessage = emptyMessageKey ? t(emptyMessageKey) : emptyMessage || "Your energy usage is optimized! No specific recommendations at this time.";

    const getUrgencyIcon = (level?: string) => {
        switch (level) {
            case 'high':
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'medium':
                return <Clock className="h-5 w-5 text-orange-500" />;
            case 'low':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getUrgencyVariant = (level?: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (level) {
            case 'high':
                return 'destructive';
            case 'medium':
                return 'outline';
            case 'low':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const normalizeRecommendation = (rec: Recommendation | string): Recommendation => {
        if (typeof rec === 'string') {
            // Infer urgency from content
            const urgency = rec.toLowerCase().includes('high') || rec.toLowerCase().includes('alert') ? 'high' :
                rec.toLowerCase().includes('consider') || rec.toLowerCase().includes('timing') ? 'medium' : 'low';

            return { message: rec, urgencyLevel: urgency };
        }
        return rec;
    };

    if (variant === 'compact') {
        return (
            <div className={`space-y-3 ${className}`}>
                {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => {
                        const recommendation = normalizeRecommendation(rec);
                        return (
                            <div
                                key={index}
                                className={`flex items-start gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors ${onRecommendationClick ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => onRecommendationClick?.(rec, index)}
                            >
                                {getUrgencyIcon(recommendation.urgencyLevel)}
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm">{recommendation.message}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getUrgencyVariant(recommendation.urgencyLevel)} className="text-xs">
                                            {recommendation.urgencyLevel?.toUpperCase() || 'INFO'}
                                        </Badge>
                                        {recommendation.potentialSavings && (
                                            <span className="text-xs font-semibold text-green-600">
                                                Save {roundCurrency(recommendation.potentialSavings)} BGN
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-muted-foreground">{displayEmptyMessage}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{displayTitle}</CardTitle>
                <CardDescription>{displayDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => {
                        const recommendation = normalizeRecommendation(rec);
                        return (
                            <div
                                key={index}
                                className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${onRecommendationClick ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => onRecommendationClick?.(rec, index)}
                            >
                                {getUrgencyIcon(recommendation.urgencyLevel)}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={getUrgencyVariant(recommendation.urgencyLevel)} className="text-xs">
                                            {recommendation.urgencyLevel?.toUpperCase() || 'INFO'} PRIORITY
                                        </Badge>
                                        {recommendation.potentialSavings && (
                                            <span className="text-sm font-semibold text-green-600">
                                                Save {roundCurrency(recommendation.potentialSavings)} BGN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm">{recommendation.message}</p>
                                    {recommendation.type && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-xs">
                                                {recommendation.type.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-muted-foreground">{displayEmptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default RecommendationsList; 