import fastGlob from 'fast-glob';
import { resolve } from 'path';
import type { Config, FangConfig } from './config';
import type { ComponentInfo } from 'unplugin-vue-components';
import {
    styleLog,
    getComponentNames,
    humpToLine,
    firstUpper,
} from './util';

type FangComponentInfo = ComponentInfo | undefined | void;

type FangFromUrl = string | undefined | void;

type FangMatch = string | RegExp;
type FangMatchs = Array<FangMatch>;
/**
 *
 * | com-page | ComPage  | comPage  | compage  | 注册名称
 * | :------: | :------: | :------: | :------: |
 * | com-page | com-page | com-page | :------: | 组件写法
 * | :------: | ComPage  | :------: | :------: |
 * | :------: | comPage  | comPage  | :------: |
 * | :------: | :------: | :------: | compage  |
 *
 */

/**
 * 获取directive 指令匹配数组
 * @param {*} name
 * @returns
 */
function getMatchDir(name: string) {
    return [name + '.js'];
}

/**
 * 判断是否匹配
 */
function isUrlsMatchi(
    key: string,
    arr: FangMatchs,
): boolean {
    if (arr) {
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            if (typeof element == 'string') {
                if (key.endsWith(element)) {
                    return true;
                }
            } else {
                if (element.test(key)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * 循环匹配对应值
 * @param {*} arr
 * @param {*} name
 * @returns
 */
function getForUrl(
    arr: Array<string>,
    name: FangMatch,
): FangFromUrl {
    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        if (typeof name == 'string') {
            if (element.endsWith(name)) {
                return element;
            }
        } else {
            if (name.test(element)) {
                return element;
            }
        }
    }
}

/**
 * 循环匹配对应值
 * @param {*} arr
 * @param {*} name
 * @returns
 */
function getForUrlStart(
    arr: Array<string> | undefined,
    name: string,
): FangFromUrl {
    if (arr) {
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            if (name.startsWith(element)) {
                return name;
            }
        }
    }
}

interface CacheObj {
    component?: {
        [key: string]: FangComponentInfo;
    };
    directive?: {
        [key: string]: FangComponentInfo;
    };
}

type ResolveType = 'component' | 'directive';

/**
 * 自动注册组件和指令的方法
 */
class FangComponent {
    config: FangConfig;
    #comUrls: Array<string> | undefined;
    #dirUrls: Array<string> | undefined;
    #cacheObj: CacheObj | undefined;
    #curDir: string | undefined;
    #aliassArr: Array<string> | undefined;
    #aliassValueArr: Array<string> | undefined;
    constructor(config?: Config) {
        this.config = config || {};

        this.#setConfigValue();
    }

    // /**
    //  * 配置参数
    //  */
    // get config() {
    //     return this.config;
    // }

    /**
     * 初始化数据
     */
    #setConfigValue() {
        this.#setGetMatch();

        /**
         * 组件的地址
         */
        this.#comUrls = [];

        /**
         * 指令的地址
         */
        this.#dirUrls = [];

        /**
         * 缓存的数据
         */
        this.#cacheObj = {};

        /**
         * 当前完整的地址
         */
        this.#curDir = '';

        if (this.config.dir) {
            this.config.dir = this.config.dir + '/';
            this.config.dir = this.config.dir.replace(
                /\/\/$/,
                '/',
            );
            this.#curDir =
                resolve(
                    process.cwd(),
                    this.config.dir,
                ).replace(/\\/g, '/') + '/';
        }

        /**
         * 别名数组
         */
        this.#aliassArr = [];
        const aliass = this.config.aliass;
        if (aliass) {
            this.#aliassArr = Object.keys(aliass);
            /**
             * 别名完整路径的数组
             */
            this.#aliassValueArr = this.#aliassArr.map(
                (key: string) => {
                    return this.#curDir + aliass[key] + '/';
                },
            );
        }

        this.#getUrls();
    }

    /**
     * 设置getMatch默认方法
     */
    #setGetMatch() {
        if (!this.config.getMatch) {
            this.config.getMatch = function (
                v,
                extensions,
                matchs,
                matchexts,
            ) {
                const urls: FangMatchs = [];
                if (matchs) {
                    matchs.forEach((key) => {
                        const s = '/' + v + key;
                        if (extensions) {
                            extensions?.forEach((z) => {
                                urls.push(s + '.' + z);
                            });
                        } else {
                            const reg = new RegExp(
                                s + '.([a-z|A-Z]+?)$',
                            );
                            urls.push(reg);
                        }
                    });
                }
                if (matchexts) {
                    matchexts.forEach((key) => {
                        urls.push('/' + v + key);
                    });
                }
                return [...new Set(urls)];
            };
        }
    }

    /**
     * 读取url地址列表
     */
    #getUrls() {
        const url = this.#getFgUrl();
        if (url) {
            this.#comUrls = fastGlob.sync(url, {
                onlyFiles: false,
                absolute: true,
            });
        }

        if (this.config.directives) {
            const durl =
                this.config.dir +
                '**/' +
                this.config.directives +
                '/*.js';
            this.#dirUrls =
                fastGlob.sync(durl, {
                    onlyFiles: false,
                    absolute: true,
                }) || [];
        }

        if (this.config.urlprefix) {
            if (this.config.dir) {
                const dir = this.config.dir;
                const reg = new RegExp('^' + this.#curDir);
                const urls = [] as Array<string>;
                const dirUrls = [] as Array<string>;
                this.#comUrls?.forEach((key) => {
                    urls.push(key.replace(reg, dir));
                });
                this.#dirUrls?.forEach((key) => {
                    dirUrls.push(key.replace(reg, dir));
                });
                /**
                 * 格式化的组件的地址
                 */
                this.config.urls = urls;
                /**
                 * 格式化的指令的地址
                 */
                this.config.dirUrls = dirUrls;
            }
        }
    }

    /**
     * 获取components 的匹配路径
     * @returns { String } 匹配路径
     */
    #getFgUrl(): FangFromUrl {
        if (this.config.extensions) {
            if (this.config.extensions.length > 1) {
                return (
                    this.config.dir +
                    '**/*.{' +
                    this.config.extensions.join(',') +
                    '}'
                );
            } else if (this.config.extensions.length == 1) {
                return (
                    this.config.dir +
                    '**/*.' +
                    this.config.extensions[0]
                );
            }
        } else {
            return this.config.dir + '**/*.*';
        }
    }

    /**
     * 获取当前缓存数
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns { Object } 注册的对象
     */
    #getCache(
        name: string,
        type: ResolveType,
    ): FangComponentInfo {
        if (this.#cacheObj) {
            const obj = this.#cacheObj[type] || {};
            return obj[name];
        }
    }

    /**
     * 设置缓存数据
     * @param {String} name 名称
     * @param {String} type 类型
     * @param { Object } 注册的对象
     */
    #setCache(
        name: string,
        type: ResolveType,
        obj: FangComponentInfo,
    ): FangComponentInfo {
        const cach = this.#cacheObj || {};
        const co = cach[type] || {};
        co[name] = obj;
        cach[type] = co;
    }

    /**
     * 是否要替换
     * @param { String } name 名称
     * @returns { Boolean } 是否要替换
     */
    #namefilter(name: string): boolean {
        name = humpToLine(name);
        if (this.config.startss) {
            for (
                let index = 0;
                index < this.config.startss.length;
                index++
            ) {
                const element =
                    this.config.startss[index] + '-';
                if (name.startsWith(element)) {
                    return false;
                }
            }
        }
        if (this.config.filtes) {
            for (
                let index = 0;
                index < this.config.filtes.length;
                index++
            ) {
                const element = this.config.filtes[index];
                if (name === element) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 返回对应的值
     * @param {String} from 文件地址
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns  { Object } 注册的对象
     */
    #getNameFromUrl(
        from: string,
        name: string,
        type: ResolveType,
    ): FangComponentInfo {
        let dname = '';
        if (this.config.getFromName) {
            dname = this.config.getFromName(
                from,
                name,
                type,
            );
        }
        return {
            name: dname || 'default',
            from: from,
        };
    }

    /**
     * 获取对应的url
     * @param {String} type 类型
     * @param {Array} urls 匹配到的地址数组
     * @param {string} ml 匹配的目录
     * @param {string} yname 原来名称
     * @param {string} top 匹配的值
     * @param {string} name 名称
     * @returns { String } 文件地址
     */
    #getCorrespondUrl2(
        type: ResolveType,
        urls: Array<string>,
        ml: string,
        yname: string,
        top: string,
    ): FangFromUrl {
        const v = this.#curDir + ml + '/';

        const as: Array<string> = [];
        for (let index = 0; index < urls.length; index++) {
            const element = urls[index];
            if (element.startsWith(v)) {
                as.push(element);
            }
        }
        if (as.length == 1) {
            return as[0];
        } else if (as.length > 1) {
            let m;
            if (/[A-Z]/.test(yname.slice(0, 1))) {
                m = yname.replace(firstUpper(top), '');
            } else {
                m = yname.replace(top, '');
            }
            return this.#getCorrespondUrl(as, m, type, ml);
        }
    }

    /**
     *  有前缀匹配
     * @param {String } type 类型
     * @param {String } name 名称
     * @param {String } ml 匹配的目录
     * @param {String } yname 原来名称
     * @param {String } top 匹配的值
     * @returns {String } 文件地址
     */
    #getConfigUrl(
        type: ResolveType,
        name: string,
        ml: string,
        yname: string,
        top: string,
    ): FangFromUrl {
        const ms = this.#setMatchUrls(name, type);
        const urls = this.#getUrlsMatchi(ms, type);
        if (urls.length == 1) {
            return urls[0];
        } else if (urls.length > 1) {
            return this.#getCorrespondUrl2(
                type,
                urls,
                ml,
                yname,
                top,
            );
        }
    }

    /**
     * 通过名称匹配对应路径
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns  { Object } 注册的对象
     */
    #setNameFrom(
        name: string,
        type: ResolveType,
    ): FangComponentInfo {
        let mb = humpToLine(name);
        //匹配别名返回值
        const alias = this.config.alias;
        if (alias) {
            if (mb.startsWith(alias + '-')) {
                const reg = new RegExp('^' + alias + '-');
                mb = mb.replace(reg, '');
                const reg1 = new RegExp('^' + alias);
                const reg2 = new RegExp(
                    '^' + firstUpper(alias),
                );
                if (reg1.test(name)) {
                    name = name.replace(reg1, '');
                } else if (reg2.test(name)) {
                    name = name.replace(reg2, '');
                } else if (reg.test(name)) {
                    name = name.replace(reg, '');
                }
            } else {
                if (this.config.onlyAlias) {
                    return;
                }
            }
        }

        if (this.#aliassArr) {
            for (
                let index = 0;
                index < this.#aliassArr.length;
                index++
            ) {
                const element = this.#aliassArr[index];
                const aliass = this.config.aliass || {};
                if (mb.startsWith(element + '-')) {
                    const sl = mb.substring(
                        element.length + 1,
                    );
                    const from = this.#getConfigUrl(
                        type,
                        sl,
                        aliass[element],
                        name,
                        element,
                    );
                    if (from) {
                        return this.#getNameFromUrl(
                            from,
                            name,
                            type,
                        );
                    }
                }
            }
        }
        const from = this.#getMatchUrl(name, type);
        if (from) {
            return this.#getNameFromUrl(from, name, type);
        }
    }

    /**
     * 需要匹配的地址名称
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns {Array} 需要匹配的地址名称数组
     */
    #setMatchUrls(
        name: string,
        type: ResolveType,
    ): FangMatchs {
        const arr = getComponentNames(name);
        const urls: FangMatchs = [];
        if (type == 'directive') {
            arr.forEach((v) => {
                const vs = getMatchDir(v);
                urls.push(...vs);
            });
        } else {
            const getMatch = this.config.getMatch;
            if (getMatch) {
                arr.forEach((v) => {
                    const vs = getMatch(
                        v,
                        this.config.extensions,
                        this.config.matchs,
                        this.config.matchexts,
                    );
                    if (vs) {
                        urls.push(...vs);
                    }
                });
            }
        }
        return urls;
    }

    /**
     * 需要匹配的地址
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns {Array} 需要匹配的地址名称数组
     */
    #setMatchUrl(
        name: string,
        type: ResolveType,
    ): FangMatchs {
        let urls: FangMatchs = [];
        if (type == 'directive') {
            urls = getMatchDir(name);
        } else {
            const getMatch = this.config.getMatch;
            if (getMatch) {
                urls = getMatch(
                    name,
                    this.config.extensions,
                    this.config.matchs,
                    this.config.matchexts,
                );
            }
        }
        return urls;
    }

    /**
     * 匹配到url地址
     * @param {Array} arr 需要匹配的地址名称数组
     * @param {String} type 类型
     * @returns  {Array} 匹配到的地址数组
     */
    #getUrlsMatchi(
        arr: FangMatchs,
        type: ResolveType,
    ): Array<string> {
        const as: Array<string> = [];
        if (type == 'directive') {
            this.#dirUrls?.forEach((key) => {
                if (isUrlsMatchi(key, arr)) {
                    as.push(key);
                }
            });
        } else {
            this.#comUrls?.forEach((key) => {
                if (isUrlsMatchi(key, arr)) {
                    as.push(key);
                }
            });
        }
        return as;
    }

    /**
     * 排除别名
     * @param {Array} urls 匹配到的地址数组
     * @returns {Array} 匹配到的地址数组
     */
    #excludeBm(urls: Array<string>): Array<string> {
        let val: Array<string> = [];
        urls.forEach((v) => {
            if (!getForUrlStart(this.#aliassValueArr, v)) {
                val.push(v);
            }
        });
        if (val.length == 0) {
            val = urls;
        }
        return val;
    }

    /**
     * 获取对应的url
     * @param {Array} urls 匹配到的地址数组
     * @param {String} name 名称
     * @param {String} type 类型
     * @param {string} ml 匹配的目录
     * @returns { String } 文件地址
     */
    #getCorrespondUrl(
        urls: Array<string>,
        name: string,
        type: ResolveType,
        bm?: string,
    ): FangFromUrl {
        if (!bm) {
            urls = this.#excludeBm(urls);
        }
        if (urls.length == 1) {
            return urls[0];
        }
        const arr = this.#setMatchUrl(name, type);
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            let url = getForUrl(urls, element);
            if (url) {
                return url;
            }
        }
    }

    /**
     * 无前缀匹配
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns { String } 文件地址
     */
    #getMatchUrl(
        name: string,
        type: ResolveType,
    ): FangFromUrl {
        const ml = this.#setMatchUrls(name, type);
        const urls = this.#getUrlsMatchi(ml, type);
        if (urls.length == 1) {
            return urls[0];
        } else if (urls.length > 1) {
            return this.#getCorrespondUrl(urls, name, type);
        }
    }

    /**
     * 输出日志
     * @param name
     * @param type
     * @param obj
     * @param is
     */
    #setLog(
        name: string,
        type: ResolveType,
        obj: FangComponentInfo,
        is?: boolean,
    ) {
        if (this.config.log) {
            const texts = {
                component: 2,
                directive: 5,
            };
            const arr = [];
            arr.push(
                styleLog('[@fangzhongya/vue-components]', {
                    text: 3,
                }),
            );
            if (obj && obj.from) {
                let sfrom = styleLog(obj?.from, {
                    text: 4,
                    revert: true,
                });
                arr.push(
                    styleLog(type, {
                        text: texts[type],
                    }),
                );
                arr.push(
                    styleLog(name, {
                        bold: true,
                    }),
                );

                if (!is) {
                    sfrom =
                        styleLog('+', {
                            text: 2,
                        }) + sfrom;
                }
                arr.push(sfrom);
            } else {
                arr.push(
                    styleLog(type, {
                        text: texts[type],
                    }),
                );
                arr.push(
                    styleLog(name, {
                        bold: true,
                        text: 1,
                    }),
                );
            }
            console.log(arr.join(' '));
        }
    }
    /**
     * 自动按需匹配注册
     * @param {String} name 名称
     * @param {String} type 类型
     * @returns  { Object } 注册的对象
     */
    resolve(
        name: string,
        type: ResolveType,
    ): FangComponentInfo {
        const cache = this.#getCache(name, type);
        if (this.config.isCache && cache) {
            this.#setLog(name, type, cache, true);
            return cache;
        } else if (this.#namefilter(name)) {
            let obj = this.#setNameFrom(name, type);
            this.#setLog(name, type, obj);
            if (obj) {
                this.#setCache(name, type, obj);
                return obj;
            }
        }
    }
}

export default FangComponent;
