<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use App\Models\User;
use App\Services\ClinicCacheService;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Return all available demo accounts, role matrix, and current active role info.
     */
    public function rolesOverview(Request $request): JsonResponse
    {
        $role = strtolower((string) $request->header('X-Active-Role', 'super_admin'));
        $accounts = User::select(['id', 'name', 'email', 'role', 'phone', 'status', 'last_login_at'])
            ->orderByRaw("CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 WHEN 'doctor' THEN 3 WHEN 'staff' THEN 4 ELSE 5 END")
            ->get();

        $currentUser = $accounts->firstWhere('role', $role) ?? $accounts->first();

        return response()->json([
            'current_user' => $currentUser,
            'current_role' => $role,
            'role_meta' => RolePermissionService::getRoleMeta($role),
            'matrix' => RolePermissionService::getMatrix(),
            'demo_accounts' => $accounts,
        ]);
    }

    /**
     * Authenticate with email & password or quick role switch.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['nullable', 'email'],
            'password' => ['nullable', 'string'],
            'role' => ['nullable', 'in:patient,tv_display,staff,doctor,admin,super_admin'],
        ]);

        if (!empty($validated['email'])) {
            $user = User::where('email', $validated['email'])->first();
            if (!$user || (!empty($validated['password']) && !Hash::check($validated['password'], $user->password))) {
                SystemLog::create([
                    'level' => 'SECURITY',
                    'category' => 'security',
                    'message' => "Failed login attempt for email: {$validated['email']}",
                    'endpoint' => $request->path(),
                    'method' => 'POST',
                    'ip_address' => $request->ip(),
                ]);

                return response()->json([
                    'message' => 'Invalid email or password credentials.',
                ], 401);
            }
        } else {
            $targetRole = $validated['role'] ?? 'patient';
            $user = User::where('role', $targetRole)->where('status', 'active')->first();
            if (!$user) {
                return response()->json(['message' => "No active account found for role {$targetRole}."], 404);
            }
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'This user account has been suspended by an Administrator.',
            ], 403);
        }

        $user->update(['last_login_at' => now()]);

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "RBAC Session Authenticated: {$user->name} signed in with role [" . strtoupper($user->role) . ']',
            'endpoint' => $request->path(),
            'method' => 'POST',
            'ip_address' => $request->ip(),
            'user_id' => $user->id,
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Signed in as {$user->name} (" . RolePermissionService::getRoleMeta($user->role)['name'] . ')',
            'user' => $user,
            'role' => $user->role,
            'role_meta' => RolePermissionService::getRoleMeta($user->role),
            'token' => base64_encode("{$user->id}|{$user->role}|" . now()->timestamp),
        ]);
    }

    /**
     * Update a user's assigned role & status (Super Admin / Admin RBAC Manager).
     */
    public function updateUserRole(Request $request, int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $validated = $request->validate([
            'role' => ['required', 'in:patient,tv_display,staff,doctor,admin,super_admin'],
            'status' => ['nullable', 'in:active,suspended'],
        ]);

        $oldRole = $user->role;
        $user->update([
            'role' => $validated['role'],
            'status' => $validated['status'] ?? $user->status,
        ]);

        SystemLog::create([
            'level' => 'WARNING',
            'category' => 'audit',
            'message' => "RBAC Role Changed: {$user->name} ({$user->email}) updated from [{$oldRole}] to [{$user->role}] (Status: {$user->status})",
            'endpoint' => $request->path(),
            'method' => 'PUT',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Updated {$user->name}'s role to " . strtoupper($user->role) . " ({$user->status}).",
            'user' => $user,
        ]);
    }
}
