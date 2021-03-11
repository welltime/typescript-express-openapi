export default function createDocsStub(info: string, version: string, title: string, host: string, basePath: string, tags: {
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
