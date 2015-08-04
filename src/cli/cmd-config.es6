import act from '../acts/config';

export default function () {
    return this
        .title('Config initialization command')
        .helpful()
        .opt()
            .name('name')
            .title('Name of configuration file')
            .short('n').long('name')
            .req()
            .end()
        .act((opts) => {
            act.createConfigFile(opts.name);
        });
}
