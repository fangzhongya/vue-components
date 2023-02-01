
import { config as comConfig, objectMerge } from "./config"
import type { Config } from "./config";
import FangComponent from "./component"
import type { ComponentResolveResult, ComponentResolver } from 'unplugin-vue-components';



/**
 * 自动按需匹配注册
 * @returns
 */
export function ComponentsResolver(config: Config = {}): ComponentResolver[] {
    const configs = objectMerge(comConfig, config);

    const fangComp = new FangComponent(configs);

    return [
        {
            type: 'component',
            resolve: (name: string): ComponentResolveResult => {
                return fangComp.resolve(name, 'component');
            },
        },
        {
            type: 'directive',
            resolve: (name: string): ComponentResolveResult => {
                return fangComp.resolve(name, 'directive');
            },
        },
    ];
}
