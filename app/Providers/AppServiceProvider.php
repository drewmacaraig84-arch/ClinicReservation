<?php

namespace App\Providers;

use App\Models\SystemLog;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(120);

        // Strictly prevent N+1 lazy loading queries
        Model::preventLazyLoading(!app()->isProduction());
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    $this->logRateLimit($request, 'API General Tier (120/min)');
                    return response()->json([
                        'message' => 'Too many requests. Rate limit exceeded.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429, $headers);
                });
        });

        RateLimiter::for('booking', function (Request $request) {
            return Limit::perMinute(15)->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    $this->logRateLimit($request, 'Booking Protection Tier (15/min)');
                    return response()->json([
                        'message' => 'Reservation rate limit reached. Please wait a moment before booking again.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429, $headers);
                });
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    $this->logRateLimit($request, 'Authentication Brute-Force Shield (10/min)');
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again in 60 seconds.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429, $headers);
                });
        });
    }

    private function logRateLimit(Request $request, string $tier): void
    {
        try {
            SystemLog::create([
                'level' => 'WARNING',
                'category' => 'rate_limit',
                'message' => "Rate Limiter throttled request on {$tier}",
                'endpoint' => $request->path(),
                'method' => $request->method(),
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
                'context' => ['tier' => $tier],
            ]);
        } catch (Throwable) {
            // Ignore DB errors during rate limit logging
        }
    }
}
