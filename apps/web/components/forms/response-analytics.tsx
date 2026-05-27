"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "~/components/ui/chart";
import type { FormDoc, FormField, ResponseDoc } from "~/components/forms/types";

const CHART_COLORS = [
    "var(--grass)",
    "var(--diamond)",
    "var(--gold)",
    "var(--redstone)",
    "var(--stone)",
    "var(--dirt)",
];

const timelineConfig = {
    count: { label: "Responses", color: "var(--grass)" },
} satisfies ChartConfig;

function formatDay(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function buildTimeline(items: ResponseDoc[]) {
    const byDay = new Map<string, number>();
    for (const item of items) {
        const d = new Date(item.submittedAt);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString();
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([iso, count]) => ({
            day: formatDay(new Date(iso).getTime()),
            count,
        }));
}

function buildChoiceDistribution(field: FormField, items: ResponseDoc[]) {
    const counts = new Map<string, number>();
    for (const opt of field.options ?? []) {
        counts.set(opt.id ?? opt.label, 0);
    }
    for (const item of items) {
        const raw = item.values[field.id];
        if (field.type === "single_choice" && typeof raw === "string") {
            counts.set(raw, (counts.get(raw) ?? 0) + 1);
        }
        if (field.type === "multi_choice" && Array.isArray(raw)) {
            for (const id of raw) {
                counts.set(id, (counts.get(id) ?? 0) + 1);
            }
        }
    }
    return (field.options ?? []).map((opt) => {
        const key = opt.id ?? opt.label;
        return {
            name: opt.label,
            value: counts.get(key) ?? 0,
        };
    });
}

function buildRatingDistribution(field: FormField, items: ResponseDoc[]) {
    const buckets = [1, 2, 3, 4, 5].map((stars) => ({ stars: `${stars}★`, count: 0 }));
    for (const item of items) {
        const raw = item.values[field.id];
        const n = typeof raw === "number" ? raw : Number(raw);
        if (n >= 1 && n <= 5) {
            buckets[n - 1]!.count += 1;
        }
    }
    return buckets;
}

function McChartCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mc-panel rounded-md p-5">
            <div className="font-pixel text-[10px] text-primary mb-1">{title}</div>
            {subtitle && <p className="font-mc text-sm text-muted-foreground mb-4">{subtitle}</p>}
            {children}
        </div>
    );
}

export function ResponseAnalytics({ form, items }: { form: FormDoc; items: ResponseDoc[] }) {
    const timeline = useMemo(() => buildTimeline(items), [items]);

    const choiceFields = form.fields.filter(
        (f) => f.type === "single_choice" || f.type === "multi_choice",
    );
    const ratingFields = form.fields.filter((f) => f.type === "rating");

    const choiceCharts = useMemo(
        () =>
            choiceFields.map((field) => ({
                field,
                data: buildChoiceDistribution(field, items),
            })),
        [choiceFields, items],
    );

    const ratingCharts = useMemo(
        () =>
            ratingFields.map((field) => ({
                field,
                data: buildRatingDistribution(field, items),
                avg: (() => {
                    const vals = items
                        .map((i) => Number(i.values[field.id]))
                        .filter((n) => !Number.isNaN(n) && n > 0);
                    if (!vals.length) return null;
                    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
                })(),
            })),
        [ratingFields, items],
    );

    if (items.length === 0) return null;

    return (
        <div className="space-y-6 mb-8">
            <McChartCard title="// SUBMISSIONS OVER TIME" subtitle="Responses mined per day">
                <ChartContainer config={timelineConfig} className="h-[220px] w-full">
                    <BarChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontFamily: "var(--font-mc)", fontSize: 12 }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontFamily: "var(--font-mc)", fontSize: 12 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                            dataKey="count"
                            fill="var(--grass)"
                            radius={[2, 2, 0, 0]}
                            name="Responses"
                        />
                    </BarChart>
                </ChartContainer>
            </McChartCard>

            {choiceCharts.length > 0 && (
                <div className="grid md:grid-cols-2 gap-5">
                    {choiceCharts.map(({ field, data }, idx) => {
                        const pieConfig = Object.fromEntries(
                            data.map((d, i) => [
                                d.name,
                                { label: d.name, color: CHART_COLORS[i % CHART_COLORS.length] },
                            ]),
                        ) satisfies ChartConfig;
                        const total = data.reduce((s, d) => s + d.value, 0);
                        return (
                            <McChartCard
                                key={field.id}
                                title={`// ${field.label.toUpperCase()}`}
                                subtitle={
                                    total > 0
                                        ? `${total} selection${total === 1 ? "" : "s"}`
                                        : "No answers yet"
                                }
                            >
                                <ChartContainer
                                    config={pieConfig}
                                    className="mx-auto h-[200px] w-full max-w-[280px]"
                                >
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Pie
                                            data={data}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={40}
                                            outerRadius={70}
                                            strokeWidth={2}
                                        >
                                            {data.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={
                                                        CHART_COLORS[
                                                            (idx + i) % CHART_COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </McChartCard>
                        );
                    })}
                </div>
            )}

            {ratingCharts.length > 0 && (
                <div className="grid md:grid-cols-2 gap-5">
                    {ratingCharts.map(({ field, data, avg }) => (
                        <McChartCard
                            key={field.id}
                            title={`// ${field.label.toUpperCase()}`}
                            subtitle={avg ? `Average ${avg} / 5 stars` : "No ratings yet"}
                        >
                            <ChartContainer
                                config={{
                                    count: { label: "Responses", color: "var(--gold)" },
                                }}
                                className="h-[200px] w-full"
                            >
                                <BarChart data={data}>
                                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                                    <XAxis dataKey="stars" tickLine={false} axisLine={false} />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--gold)" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </McChartCard>
                    ))}
                </div>
            )}
        </div>
    );
}
