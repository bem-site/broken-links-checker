import * as action from '../acts/run';

export default function () {
    return this
        .title('Run checker command')
        .helpful()
        .opt()
            .name('config')
            .title('Path to configuration file')
            .short('c').long('config')
            .req()
            .end()
        .act((options) => {
            action.run(options);
        });
}
