<?php

namespace App\Services;

class RolePermissionService
{
    public const ROLES = [
        'patient' => [
            'name' => 'Patient / Client',
            'badge_color' => 'slate',
            'default_portal' => 'client',
            'allowed_portals' => ['client'],
            'permissions' => [
                'public.catalog.view',
                'public.appointment.book',
                'public.ticket.lookup',
            ],
        ],
        'tv_display' => [
            'name' => 'Queuing TV Monitor',
            'badge_color' => 'amber',
            'default_portal' => 'tv',
            'allowed_portals' => ['tv', 'client'],
            'permissions' => [
                'tv.queue.view',
                'public.catalog.view',
            ],
        ],
        'staff' => [
            'name' => 'Reception / Clinic Staff',
            'badge_color' => 'cyan',
            'default_portal' => 'staff',
            'allowed_portals' => ['staff', 'tv', 'client'],
            'permissions' => [
                'staff.queue.manage',
                'staff.walkin.generate',
                'staff.checkin.process',
                'staff.doctors.availability',
                'tv.queue.view',
            ],
        ],
        'doctor' => [
            'name' => 'Physician / Doctor',
            'badge_color' => 'teal',
            'default_portal' => 'doctor',
            'allowed_portals' => ['doctor', 'tv', 'client'],
            'permissions' => [
                'doctor.patients.view',
                'doctor.consultation.record',
                'doctor.schedule.edit',
                'doctor.profile.edit',
            ],
        ],
        'admin' => [
            'name' => 'Clinic Administrator',
            'badge_color' => 'blue',
            'default_portal' => 'admin',
            'allowed_portals' => ['admin', 'staff', 'doctor', 'tv', 'client'],
            'permissions' => [
                'admin.dashboard.view',
                'admin.reports.graphs',
                'admin.reports.export',
                'admin.appointments.manage',
                'admin.doctors.manage',
                'admin.settings.edit',
                'staff.*',
                'doctor.*',
                'tv.*',
            ],
        ],
        'super_admin' => [
            'name' => 'Super Administrator',
            'badge_color' => 'emerald',
            'default_portal' => 'super_admin',
            'allowed_portals' => ['super_admin', 'admin', 'staff', 'doctor', 'tv', 'client'],
            'permissions' => [
                '* (Unrestricted Root Access)',
                'super_admin.health.telemetry',
                'super_admin.crash_logs.inspect',
                'super_admin.waf_security.monitor',
                'super_admin.soft_deletes.restore',
                'super_admin.soft_deletes.purge',
                'super_admin.users.roles.manage',
            ],
        ],
    ];

    public static function getRoleMeta(string $role): array
    {
        return self::ROLES[$role] ?? self::ROLES['patient'];
    }

    public static function canAccessPortal(string $role, string $portal): bool
    {
        $meta = self::getRoleMeta($role);
        return in_array($portal, $meta['allowed_portals'], true);
    }

    public static function getMatrix(): array
    {
        return self::ROLES;
    }
}
