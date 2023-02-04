import { writeFile } from 'node:fs';
import { resolve } from 'node:path';
import { config as comConfig, objectMerge } from './config';
import type { FangConfig } from './config';
import FangComponent from './component';
import type {
    ComponentResolveResult,
    ComponentResolver,
} from 'unplugin-vue-components';

const archiveConfig: FangConfig = {
    /**
     * 自动导入的文件目录
     */
    dir: './packages/',

    /**
     * 匹配文件名称和文件类型
     */
    matchexts: ['/src/index.vue'],

    /**
     * 是否去掉路径的前缀
     */
    urlprefix: true,
    /**
     * 是否生成json 配置文件
     */
    isJson: true,
    /**
     * 生成json 配置文件名称
     */
    jsonName: './components.config.json',
};

function setJson(obj: FangConfig) {
    if (obj.isJson && obj.dir) {
        global._ComponentsResolverArchive_ =
            global._ComponentsResolverArchive_ || {};
        global._ComponentsResolverArchive_[obj.dir] = obj;

        if (obj.jsonName) {
            let url = resolve(process.cwd(), obj.jsonName);
            writeFile(
                url,
                JSON.stringify(
                    global._ComponentsResolverArchive_,
                ),
                'utf-8',
                () => {},
            );
        }
    }
}

/**
 * 自动按需匹配注册
 * @returns
 */
export function ComponentsResolverArchive(
    config: FangConfig = {},
): ComponentResolver[] {
    const configs = objectMerge(
        comConfig,
        archiveConfig,
        2,
        true,
    );

    const fangComp = new FangComponent(
        objectMerge(configs, config),
    );

    setJson(fangComp.config);

    return [
        {
            type: 'component',
            resolve: (
                name: string,
            ): ComponentResolveResult => {
                return fangComp.resolve(name, 'component');
            },
        },
        {
            type: 'directive',
            resolve: (
                name: string,
            ): ComponentResolveResult => {
                return fangComp.resolve(name, 'directive');
            },
        },
    ];
}
