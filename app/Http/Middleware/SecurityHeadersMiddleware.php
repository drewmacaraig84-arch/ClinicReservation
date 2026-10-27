<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Apply enterprise security, CDN, and Load Balancer telemetry headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        $response->headers->set('X-Load-Balancer-Node', env('APP_NODE_ID', 'carepoint-node-primary'));

        if ($request->is('api/v1/public/catalog')) {
            $response->headers->set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
            $response->headers->set('X-CDN-Cache', 'EDGE-CACHEABLE');
        } else {
            $response->headers->set('X-CDN-Cache', 'BYPASS-DYNAMIC');
        }

        return $response;
    }
}

