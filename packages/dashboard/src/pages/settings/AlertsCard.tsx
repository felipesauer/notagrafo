import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BellRing } from 'lucide-react';
import { useAlertConfig, useSaveAlertConfig, type AlertConfig } from '../../api/hooks.js';
import { LoadingSkeleton, InlineError } from '../../components/shared.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Switch } from '../../components/ui/switch.js';
import { Label } from '../../components/ui/label.js';

type RuleKey = keyof AlertConfig;

/** Rules that carry a numeric threshold, and how to present/convert it. */
const THRESHOLD_RULES: Partial<Record<RuleKey, { labelKey: string; toInput: (v: number) => number; fromInput: (v: number) => number; step: number }>> = {
    highValue: { labelKey: 'alertas.config.limiarValor', toInput: (v) => v, fromInput: (v) => v, step: 1000 },
    // fractions 0..1 shown as percentages
    supplierConcentration: { labelKey: 'alertas.config.limiarConcentracao', toInput: (v) => Math.round(v * 100), fromInput: (v) => v / 100, step: 1 },
    volumeSpike: { labelKey: 'alertas.config.limiarVolume', toInput: (v) => Math.round(v * 100), fromInput: (v) => v / 100, step: 1 },
};

/**
 * Config de alertas em Configurações (EPIC-27, NOTA-186): liga/desliga cada regra
 * e ajusta os limiares. Config GLOBAL (uma por instância — ADR-19). Edição local
 * até "Salvar"; ao salvar, faz PUT /alerts/config.
 */
export function AlertsCard(): JSX.Element {
    const { t } = useTranslation();
    const { data, isLoading, isError, refetch } = useAlertConfig();
    const save = useSaveAlertConfig();
    const [draft, setDraft] = useState<AlertConfig | null>(null);

    // Semeia o rascunho quando a config chega (ou muda no servidor).
    useEffect(() => {
        if (data?.config) setDraft(data.config);
    }, [data?.config]);

    if (isLoading || !draft) return <LoadingSkeleton variant="card" />;
    if (isError) return <InlineError onRetry={() => void refetch()} />;

    const rules = Object.keys(draft) as RuleKey[];

    const setEnabled = (rule: RuleKey, enabled: boolean) =>
        setDraft((d) => (d ? { ...d, [rule]: { ...d[rule], enabled } } : d));

    const setThreshold = (rule: RuleKey, inputValue: number) => {
        const conv = THRESHOLD_RULES[rule];
        if (!conv) return;
        setDraft((d) => (d ? { ...d, [rule]: { ...d[rule], threshold: conv.fromInput(inputValue) } } : d));
    };

    const onSave = () => {
        save.mutate(draft, { onSuccess: () => toast.success(t('alertas.config.salvo')) });
    };

    return (
        <Card className="py-4">
            <CardHeader className="flex flex-row items-center gap-2 px-4 pb-0 space-y-0">
                <BellRing className="size-4 text-primary" />
                <CardTitle className="text-base">{t('alertas.config.titulo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
                <p className="text-xs text-muted-foreground">{t('alertas.config.descricao')}</p>
                <ul className="divide-y">
                    {rules.map((rule) => {
                        const conv = THRESHOLD_RULES[rule];
                        const cfg = draft[rule];
                        const threshold = 'threshold' in cfg ? cfg.threshold : undefined;
                        return (
                            <li key={rule} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                                <Label htmlFor={`alert-${rule}`} className="flex items-center gap-2 font-normal">
                                    {t(`alertas.tipo.${ruleToType(rule)}`)}
                                </Label>
                                <div className="flex items-center gap-3">
                                    {conv && threshold !== undefined && cfg.enabled && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-2xs text-muted-foreground">{t(conv.labelKey)}</span>
                                            <Input
                                                type="number"
                                                className="h-8 w-28 tabular-nums"
                                                min={0}
                                                step={conv.step}
                                                value={conv.toInput(threshold)}
                                                onChange={(e) => setThreshold(rule, Number(e.target.value))}
                                                aria-label={t(conv.labelKey)}
                                            />
                                        </div>
                                    )}
                                    <Switch
                                        id={`alert-${rule}`}
                                        checked={cfg.enabled}
                                        onCheckedChange={(on) => setEnabled(rule, on)}
                                        aria-label={t('alertas.config.ligada')}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={onSave} disabled={save.isPending}>
                        {t('alertas.config.salvar')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/** Maps the config key (camelCase) to the alert type slug used in i18n. */
function ruleToType(rule: RuleKey): string {
    const map: Record<RuleKey, string> = {
        highValue: 'high_value',
        supplierConcentration: 'supplier_concentration',
        volumeSpike: 'volume_spike',
        zeroTax: 'zero_tax',
        duplicate: 'duplicate',
        numberingGap: 'numbering_gap',
    };
    return map[rule];
}
