import Express from 'express';
export * as generateDocsStub from './docs';
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
export default class ApiHelper {
    app: Express.Application;
    documentationPaths: any;
    constructor(app: Express.Application, documentationPaths: any);
    add<T>(url: string, method: string, parameters: Parameters<T>, docs: {
        description: string;
        summary: string;
        tags: string[];
        bodyDesc?: string;
        response: any;
    }, callback: ((params: T, res: Express.Response) => any)): void;
}
