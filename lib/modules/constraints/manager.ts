
import { ConstraintPlugin, ConstraintContext, ConstraintResult } from './types'
import { MaxHoursPerWeekPlugin } from './plugins/max-hours-per-week'
import { PostCallProtectionPlugin } from './plugins/post-call-protection'
import { MaxNightsPerMonthPlugin } from './plugins/max-nights-per-month'
import { MinDaysOffPerWeekPlugin } from './plugins/min-days-off'
import { No24hAfterNightPlugin } from './plugins/no-24h-after-night'
import { WeekendFrequencyPlugin } from './plugins/weekend-frequency'

export class ConstraintManager {
    private plugins = new Map<string, ConstraintPlugin>()
    private configs = new Map<string, any>()

    constructor() {
        // Register all available plugins
        this.register(new MaxHoursPerWeekPlugin())
        this.register(new PostCallProtectionPlugin())
        this.register(new MaxNightsPerMonthPlugin())
        this.register(new MinDaysOffPerWeekPlugin())
        this.register(new No24hAfterNightPlugin())
        this.register(new WeekendFrequencyPlugin())
    }

    register(plugin: ConstraintPlugin) {
        this.plugins.set(plugin.id, plugin)
    }

    configure(pluginId: string, config: any) {
        this.configs.set(pluginId, config)
    }

    async validateAll(context: ConstraintContext): Promise<ConstraintResult> {
        let totalPenalty = 0
        const reasons: string[] = []

        for (const [id, plugin] of this.plugins) {
            const config = this.configs.get(id) || plugin.defaultConfig
            const result = await plugin.validate(context, config)

            if (!result.success) {
                // If it's a hard constraint (implied if we return false without penalty info,
                // or if we decide to handle types differently. For now, let's assume all plugins
                // can be hard or soft depending on config, but if result.success is false, it's a hard fail.)
                return { success: false, reason: result.reason }
            }

            if (result.penalty) {
                totalPenalty += result.penalty
                if (result.reason) reasons.push(result.reason)
            }
        }

        return {
            success: true,
            penalty: totalPenalty,
            reason: reasons.length > 0 ? reasons.join('; ') : undefined
        }
    }

    getPlugin(id: string) {
        return this.plugins.get(id)
    }
}
