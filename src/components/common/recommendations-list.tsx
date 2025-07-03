"use client";

import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Info,
    Lightbulb
} from 'lucide-react';
import { roundCurrency } from '../../utils/electricity-calculations';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { Recommendation, RecommendationsListProps } from './types';

export function RecommendationsList({
    recommendations = [],
    title = "Smart Recommendations",
    description = "AI-powered suggestions to optimize your energy usage",
    emptyMessage = "Your energy usage is optimized! No specific recommendations at this time.",
    onRecommendationClick,
    className = "",
    variant = 'default'
}: RecommendationsListProps) {
    const getUrgencyIcon = (urgencyLevel?: 'low' | 'medium' | 'high') => {
        switch (urgencyLevel) {
            case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case 'low': return <Info className="h-5 w-5 text-green-500" />;
            default: return <Lightbulb className="h-5 w-5 text-blue-500" />;
        }
    };

    const getUrgencyVariant = (urgencyLevel?: 'low' | 'medium' | 'high') => {
        switch (urgencyLevel) {
            case 'high': return 'destructive' as const;
            case 'medium': return 'outline' as const;
            case 'low': return 'default' as const;
            default: return 'secondary' as const;
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
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => {
                        const recommendation = normalizeRecommendation(rec);
                        return (
                            <div
                                key={index}
                                className={`flex items-start gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors ${onRecommendationClick ? 'cursor-pointer' : ''
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
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default RecommendationsList; 