import Express from 'express';
/**
 * Этот класс призван.
 * 1. Проверять входные аргументы API запроса.
 * 2. Предоставлять аргументы API запроса в виде понятного typescript типа
 * 3. Предоставлять документацию
 */
interface ParameterDetail {
    name: string;
    type: string;
    description: string;
    required: boolean;
}
interface Parameters<T> {
    example: T;
    body_params: ParameterDetail[];
    is_file_upload?: boolean;
    query_params?: ParameterDetail[];
    header_params: ParameterDetail[];
    checks: ((obj: T) => Promise<boolean>)[];
}
export declare class ApiHelper {
    app: any;
    documentationPaths: any;
    constructor(app: any, documentationPaths: any);
    add<T>(url: string, method: string, parameters: Parameters<T>, docs: {
        description: string;
        summary: string;
        tags: string[];
        bodyDesc?: string;
        response: any;
    }, callback: ((params: T, res: Express.Response) => any)): void;
}
export declare function createDocsStub(info: string, version: string, title: string, host: string, basePath: string, tags: {
    name: string;
    description: string;
}[]): {
    openapi: string;
    info: {
        description: string;
        version: string;
        title: string;
    };
    host: string;
    basePath: string;
    tags: {
        name: string;
        description: string;
    }[];
    schemes: string[];
    paths: {};
    components: {
        description: {
            alwaysok: string;
        };
        property: {
            ok: {
                type: string;
                description: string;
            };
        };
    };
};
export {};
