import { FangComponent } from '../packages'
import { test, expect } from "vitest"

test('FangComponent', () => {
    const from = new FangComponent({
        dir: "./packages/",
        matchs: ['']
    });
    console.log(from.config);
    const obj = from.resolve('index', 'component');
    console.log(obj);
    expect(from.config.dir).toBe("./packages/");

    expect((obj?.from + '').endsWith('/packages/index.ts')).toBe(true);
});

