<?php

namespace App\Http\Middleware;

use App\Models\SystemLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class InputSanitizationMiddleware
{
    /**
     * Sanitize inputs against XSS, null-byte injection, and log suspicious payloads.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        $suspiciousDetected = false;
        $triggeredPattern = null;

        array_walk_recursive($input, function (&$value, $key) use (&$suspiciousDetected, &$triggeredPattern) {
            if (!is_string($value)) {
                return;
            }

            // Remove null bytes
            $value = str_replace("\0", '', $value);

            // Detect common XSS or SQLi probe signatures for Super Admin security telemetry
            $patterns = [
                '/<script\b[^>]*>(.*?)<\/script>/is' => 'XSS Script Tag Probe',
                '/javascript\s*:/i' => 'XSS JavaScript URI Probe',
                '/on(load|error|click|mouseover)\s*=/i' => 'XSS Event Handler Probe',
                '/(\bUNION\b\s+\bSELECT\b|\bDROP\b\s+\bTABLE\b|--\s*$)/i' => 'SQL Injection Signature Probe',
            ];

            foreach ($patterns as $pattern => $label) {
                if (preg_match($pattern, $value)) {
                    $suspiciousDetected = true;
                    $triggeredPattern = $label;
                }
            }

            // Strip HTML tags from standard fields
            $value = trim(strip_tags($value));
        });

        $request->merge($input);

        if ($suspiciousDetected) {
            try {
                SystemLog::create([
                    'level' => 'SECURITY',
                    'category' => 'security',
                    'message' => "WAF Sanitizer neutralized {$triggeredPattern}",
                    'endpoint' => $request->path(),
                    'method' => $request->method(),
                    'ip_address' => $request->ip(),
                    'user_agent' => substr((string) $request->userAgent(), 0, 255),
                    'context' => [
                        'pattern' => $triggeredPattern,
                        'action' => 'sanitized_and_logged',
                    ],
                ]);
            } catch (Throwable) {
                // Fail gracefully if DB is not yet migrated
            }
        }

        return $next($request);
    }
}

