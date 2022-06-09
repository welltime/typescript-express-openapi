export const is_dev_env = (process.env.DEPLOY_ENV === 'dev') || (process.env.DEV_ENV === 'true');
export const is_stage_env = process.env.DEPLOY_ENV === 'stage';

export enum projects {
    chatbots = 'chatbots',
    robocall = 'robocall',
    messaging = 'messaging',
    apiproxy = 'apiproxy',
    base = 'base'
}

export enum privacy {
    protected = 'protected',
    private = 'private',
    public = 'public'
}
