// Type definitions for Cloudflare Workers
declare global {
    interface PagesFunction<Env = unknown> {
        (context: EventContext<Env, string, unknown>): Response | Promise<Response>;
    }

    interface EventContext<Env, P extends string, Data> {
        request: Request;
        env: Env;
        params: Record<P, string | string[]>;
        waitUntil(promise: Promise<unknown>): void;
        passThroughOnException(): void;
        next(input?: Request | string, init?: RequestInit): Promise<Response>;
        data: Data;
    }
}

export { };
