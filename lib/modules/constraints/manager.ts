
import { ConstraintPlugin, ConstraintContext, ConstraintResult } from './types'

export class ConstraintManager {
    private plugins = new Map<string, ConstraintPlugin>()
    private configs = new Map<string, any>()

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
