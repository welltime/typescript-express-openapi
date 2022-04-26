export const is_dev_env = process.env.IS_DEV_ENV == 'true'
export const is_stage_env = process.env.IS_STAGE_ENV == 'true'

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