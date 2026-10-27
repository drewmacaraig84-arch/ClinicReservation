<?php

use App\Http\Middleware\InputSanitizationMiddleware;
use App\Http\Middleware\RoleAccessMiddleware;
use App\Http\Middleware\SecurityHeadersMiddleware;
use App\Models\SystemLog;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(SecurityHeadersMiddleware::class);
        $middleware->append(InputSanitizationMiddleware::class);
        $middleware->alias([
            'role' => RoleAccessMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->report(function (Throwable $e) {
            try {
                $request = request();
                SystemLog::create([
                    'level' => 'CRITICAL',
                    'category' => 'crash',
                    'message' => substr($e->getMessage() ?: 'Unhandled Runtime Exception', 0, 250),
                    'exception_class' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'stack_trace' => substr($e->getTraceAsString(), 0, 5000),
                    'endpoint' => $request ? $request->path() : 'cli',
                    'method' => $request ? $request->method() : 'CLI',
                    'ip_address' => $request ? $request->ip() : '127.0.0.1',
                    'user_agent' => $request ? substr((string) $request->userAgent(), 0, 255) : 'CLI',
                ]);
            } catch (Throwable) {
                // Prevent infinite loop if DB is unreachable
            }
        });
    })->create();
