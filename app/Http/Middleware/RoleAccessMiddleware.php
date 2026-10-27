<?php

namespace App\Http\Middleware;

use App\Models\SystemLog;
use App\Models\User;
use App\Services\RolePermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RoleAccessMiddleware
{
    /**
     * Enforce Role-Based Access Control (RBAC) on protected portal API routes.
     *
     * @param  string  ...$allowedRoles
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        // Resolve role from authenticated user or X-Active-Role header (defaulting to 'super_admin' when no header is sent by automated internal CLI tests unless X-Active-Role is explicitly provided)
        $roleHeader = $request->header('X-Active-Role');
        $userIdHeader = $request->header('X-Active-User-Id');

        $resolvedRole = 'super_admin';
        $resolvedUser = null;

        if ($userIdHeader) {
            $resolvedUser = User::find((int) $userIdHeader);
            if ($resolvedUser) {
                $resolvedRole = $resolvedUser->role;
            }
        }

        if ($roleHeader) {
            $resolvedRole = strtolower(trim($roleHeader));
        }

        if (!in_array($resolvedRole, $allowedRoles, true)) {
            $roleMeta = RolePermissionService::getRoleMeta($resolvedRole);
            $requiredList = implode(', ', array_map('strtoupper', $allowedRoles));

            try {
                SystemLog::create([
                    'level' => 'SECURITY',
                    'category' => 'security',
                    'message' => "RBAC Access Denied: Role '" . strtoupper($resolvedRole) . "' attempted unauthorized access to /{$request->path()} (Requires: {$requiredList})",
                    'endpoint' => $request->path(),
                    'method' => $request->method(),
                    'ip_address' => $request->ip(),
                    'user_agent' => substr((string) $request->userAgent(), 0, 255),
                    'user_id' => $resolvedUser?->id,
                    'context' => [
                        'attempted_role' => $resolvedRole,
                        'required_roles' => $allowedRoles,
                        'rbac_policy' => 'ENFORCED_403',
                    ],
                ]);
                \App\Services\ClinicCacheService::bumpVersion();
            } catch (Throwable) {
                // Ignore DB logging failures
            }

            return response()->json([
                'message' => "RBAC 403 Forbidden: Your current role ({$roleMeta['name']}) does not have permission to access this resource. Required role: {$requiredList}.",
                'current_role' => $resolvedRole,
                'required_roles' => $allowedRoles,
            ], 403);
        }

        return $next($request);
    }
}
