/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	urlShortener: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			const url = new URL(request.url);
			if (url.pathname.toLowerCase() === "/") {
				if (request.method !== "POST") {
					return new Response(`Only POST method is allowed, you sent using ${request.method}`, {
						status: 405,
						statusText: "405 Method Not Allowed"
					});
				}
				const { target, shortName }: any = await request.json().catch(() => {
					return new Response("Invalid JSON", {
						status: 400,
						statusText: "400 Bad Request"
					});
				});
				if (!target || !shortName) {
					return new Response(`Query parameters must contain a "target" and a "shortName"`, {
						status: 400,
						statusText: "400 Bad Request"
					});
				}
				await env.urlShortener.put(shortName, target);
				return new Response("200 OK", {
					status: 200,
					statusText: "200 OK"
				});
			}
			const redirectUrl = await env.urlShortener.get(url.pathname.slice(1));
			if (!redirectUrl) {
				return new Response("404 Not Found", {
					status: 404,
					statusText: "404 Not Found"
				});
			}
			return Response.redirect(redirectUrl);
		} catch (e: any) {
			return new Response(e.message, {
				status: 500,
				statusText: "500 Internal Server Error"
			});
		}
	},
};
