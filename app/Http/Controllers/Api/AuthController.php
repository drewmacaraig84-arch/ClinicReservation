<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Doctor;
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
     * Create a new portal user account (Doctor, Staff/Reception, TV Display, Admin, or Super Admin).
     * If role is 'doctor', also creates/links a Doctor clinic profile automatically.
     */
    public function createAccount(Request $request): JsonResponse
    {
        $callerRole = strtolower((string) $request->header('X-Active-Role', 'admin'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:4', 'max:100'],
            'role' => ['required', 'in:doctor,staff,tv_display,admin,super_admin,patient'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'specialty' => ['nullable', 'string', 'max:120'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'room_number' => ['nullable', 'string', 'max:50'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Only a Super Admin can create another Super Admin account
        if ($validated['role'] === 'super_admin' && $callerRole !== 'super_admin') {
            return response()->json([
                'message' => 'Only a Super Administrator can create another Super Admin account.',
            ], 403);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        $doctorProfile = null;
        if ($validated['role'] === 'doctor') {
            $deptId = !empty($validated['department_id'])
                ? (int) $validated['department_id']
                : (Department::first()?->id ?? 1);
            $license = !empty($validated['license_number'])
                ? $validated['license_number']
                : 'PRC-' . now()->format('Y') . '-' . rand(10000, 99999);

            $doctorProfile = Doctor::updateOrCreate(
                ['email' => $user->email],
                [
                    'user_id' => $user->id,
                    'department_id' => $deptId,
                    'name' => $user->name,
                    'specialty' => $validated['specialty'] ?: 'General & Internal Medicine Specialist',
                    'license_number' => $license,
                    'room_number' => $validated['room_number'] ?: 'ROOM 1',
                    'phone' => $user->phone,
                    'consultation_fee' => $validated['consultation_fee'] ?? 650.00,
                    'availability_status' => 'active',
                    'shift_start' => '08:00 AM',
                    'shift_end' => '05:00 PM',
                    'slot_duration_minutes' => 30,
                    'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    'max_daily_patients' => 25,
                ]
            );
        }

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "Account Manager created new [" . strtoupper($user->role) . "] account: {$user->name} ({$user->email})",
            'endpoint' => $request->path(),
            'method' => 'POST',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Created " . strtoupper($user->role) . " account for {$user->name} ({$user->email})!",
            'user' => $user,
            'doctor' => $doctorProfile,
        ], 201);
    }

    /**
     * Update a user's assigned role, status, or password (Super Admin / Admin Account Manager).
     */
    public function updateUserRole(Request $request, int $userId): JsonResponse
    {
        $callerRole = strtolower((string) $request->header('X-Active-Role', 'admin'));
        $user = User::findOrFail($userId);

        if ($user->role === 'super_admin' && $callerRole !== 'super_admin') {
            return response()->json([
                'message' => 'Only a Super Administrator can modify a Super Admin account.',
            ], 403);
        }

        $validated = $request->validate([
            'role' => ['nullable', 'in:patient,tv_display,staff,doctor,admin,super_admin'],
            'status' => ['nullable', 'in:active,suspended'],
            'password' => ['nullable', 'string', 'min:4', 'max:100'],
            'name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        if (($validated['role'] ?? null) === 'super_admin' && $callerRole !== 'super_admin') {
            return response()->json([
                'message' => 'Only a Super Administrator can grant the Super Admin role.',
            ], 403);
        }

        $oldRole = $user->role;
        $updates = [
            'role' => $validated['role'] ?? $user->role,
            'status' => $validated['status'] ?? $user->status,
            'name' => $validated['name'] ?? $user->name,
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $user->phone,
        ];

        if (!empty($validated['password'])) {
            $updates['password'] = Hash::make($validated['password']);
        }

        $user->update($updates);

        SystemLog::create([
            'level' => 'WARNING',
            'category' => 'audit',
            'message' => "Account Updated: {$user->name} ({$user->email}) role=[{$oldRole} -> {$user->role}] status=[{$user->status}]",
            'endpoint' => $request->path(),
            'method' => 'PUT',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Updated {$user->name}'s account (" . strtoupper($user->role) . " • {$user->status}).",
            'user' => $user,
        ]);
    }

    /**
     * Soft-delete a user account from Account Manager.
     */
    public function deleteAccount(Request $request, int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        if ($user->role === 'super_admin') {
            return response()->json([
                'message' => 'Cannot archive the Super Administrator account.',
            ], 422);
        }

        $name = $user->name;
        $email = $user->email;
        $user->delete();

        SystemLog::create([
            'level' => 'WARNING',
            'category' => 'audit',
            'message' => "Account Manager archived user account: {$name} ({$email})",
            'endpoint' => $request->path(),
            'method' => 'DELETE',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Account '{$name}' ({$email}) archived and moved to Super Admin Recovery Vault.",
        ]);
    }
}
