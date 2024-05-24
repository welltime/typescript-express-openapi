import Express from 'express';
import { projects } from './constants';
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
    enum?: any[];
}
interface Parameters<T, P extends permissions_t> {
    example: T;
    body_params: ParameterDetail[];
    is_file_upload?: boolean;
    path_params?: ParameterDetail[];
    query_params?: ParameterDetail[];
    header_params: ParameterDetail[];
    permissions_required?: P;
    checks: ((obj: T) => Promise<boolean>)[];
}
interface ExpressReq {
    express_req: Express.Request;
}
declare type permissions_t = (string[] | string)[];
declare type request_t<T, Permissions extends permissions_t> = Permissions extends string[] ? T & ExpressReq & {
    permissions: string[];
} : T & ExpressReq;
export declare class ApiHelper {
    app: any;
    documentationPaths: any;
    getPermissions?: (req: Express.Request) => Promise<String[]>;
    /**
     * Constructs a new instance of the ApiHelper class.
     *
     * @param app - The Express application instance.
     * @param documentationPaths - The paths to the OpenAPI documentation files.
     * @param getPermissions - Function to retrieve the permissions for a request. Required if permissions are used.
     */
    constructor(app: any, documentationPaths: any, getPermissions?: (req: Express.Request) => Promise<String[]>);
    /**
     * Adds a route to the Express application and updates the OpenAPI documentation.
     * @param url The URL of the route.
     * @param method The HTTP method of the route.
     * @param parameters An object containing the parameters for the route.
     * @param docs An object containing the documentation for the route.
     * @param required_permissions An array of permissions required to access the route.
     * In case of several permissions have to be met use arrays as elements for OR operation.
     * e.g. A & (B|C) & (D|E) -> [A, [B,C], [D,E]]
     * @param callback The function to be executed when the route is called.
     */
    add<T, P extends permissions_t>(url: string, method: `${'g' | 'G'}${'e' | 'E'}${'T' | 't'}` | `${'P' | 'p'}${'o' | 'O'}${'s' | 's'}${'T' | 't'}` | `${'P' | 'p'}${'a' | 'A'}${'T' | 't'}${'C' | 'c'}${'H' | 'h'}` | `${'P' | 'p'}${'U' | 'u'}${'T' | 't'}` | `${'D' | 'e'}${'E' | 'e'}${'L' | 'l'}${'E' | 'e'}${'T' | 't'}${'E' | 'e'}`, parameters: Parameters<T, P>, docs: {
        description: string;
        summary: string;
        tags: string[];
        bodyDesc?: string;
        response: any;
    }, callback: (params: request_t<T, P>, res: Express.Response) => any): void;
}
export declare function createDocsStub(info: string, version: string, title: string, projectName: keyof typeof projects, baseApiPath: string, tags: {
    name: string;
    description: string;
}[]): {
    openapi: string;
    info: {
        description: string;
        version: string;
        title: string;
    };
    servers: {
        url: string;
    }[];
    tags: {
        name: string;
        description: string;
    }[];
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
