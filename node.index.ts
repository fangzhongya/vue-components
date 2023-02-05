import { runDev } from '@fangzhongya/create/package';

runDev({
    matchexts: [/(?<![\\|\/](util|config)\.ts)$/],
});
