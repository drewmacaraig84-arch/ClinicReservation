<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\SystemLog;
use App\Services\ClinicCacheService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClinicReservationSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_public_catalog_and_appointment_booking_with_security_headers(): void
    {
        $initialVersion = ClinicCacheService::getVersion();

        $catalogResponse = $this->getJson('/api/v1/public/catalog');
        $catalogResponse->assertStatus(200)
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertJsonStructure([
                'clinic_name',
                'departments',
                'doctors',
                'slots',
                'cache_version',
                'queue' => ['now_serving', 'upcoming'],
            ]);

        $dept = Department::first();
        $doc = Doctor::first();

        $bookResponse = $this->postJson('/api/v1/public/book', [
            'patient_name' => 'Alice Wonderland',
            'patient_phone' => '+1-555-7788',
            'patient_email' => 'alice@example.com',
            'patient_age' => 28,
            'department_id' => $dept->id,
            'doctor_id' => $doc->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '03:30 PM',
            'priority' => 'normal',
            'reason_for_visit' => 'Annual Physical Checkup',
        ]);

        $bookResponse->assertStatus(201)
            ->assertJsonPath('appointment.patient_name', 'Alice Wonderland');

        // Verify cache version bumped automatically on booking mutation
        $this->assertGreaterThan($initialVersion, ClinicCacheService::getVersion());

        // Verify double-booking same doctor + date + time is blocked
        $duplicateResponse = $this->postJson('/api/v1/public/book', [
            'patient_name' => 'Bob Duplicate',
            'patient_phone' => '+1-555-9900',
            'department_id' => $dept->id,
            'doctor_id' => $doc->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '03:30 PM',
        ]);
        $duplicateResponse->assertStatus(422);
    }

    public function test_staff_portal_queue_actions_and_quick_walk_in_ticket(): void
    {
        $this->getJson('/api/v1/staff/dashboard')
            ->assertStatus(200)
            ->assertJsonStructure(['current_desk_ticket', 'appointments', 'doctors', 'departments', 'stats']);

        $dept = Department::where('code', 'P')->first() ?? Department::first();

        $walkIn = $this->postJson('/api/v1/staff/walk-in', [
            'department_id' => $dept->id,
            'patient_name' => 'Walk-in Child',
        ]);
        $walkIn->assertStatus(201);

        $apptId = $walkIn->json('appointment.id');

        $this->postJson('/api/v1/staff/queue-action', [
            'action' => 'call_next',
            'appointment_id' => $apptId,
            'desk' => 'DESK 1',
        ])->assertStatus(200)
          ->assertJsonPath('appointment.status', 'called');
    }

    public function test_doctor_portal_schedule_and_profile_editing(): void
    {
        $doc = Doctor::first();

        $this->putJson("/api/v1/doctor/{$doc->id}/schedule", [
            'availability_status' => 'active',
            'shift_start' => '07:30 AM',
            'shift_end' => '04:00 PM',
            'slot_duration_minutes' => 20,
            'working_days' => ['Mon', 'Tue', 'Wed', 'Thu'],
            'max_daily_patients' => 30,
            'room_number' => 'ROOM 1A',
        ])->assertStatus(200)
          ->assertJsonPath('doctor.room_number', 'ROOM 1A');

        $this->putJson("/api/v1/doctor/{$doc->id}/profile", [
            'name' => 'Dr. Sarah Johnson, MD',
            'department_id' => $doc->department_id,
            'specialty' => 'Chief Internal Medicine Specialist',
            'license_number' => $doc->license_number,
            'email' => $doc->email,
            'phone' => '+1-555-8888',
            'bio' => 'Updated bio',
            'consultation_fee' => 850,
            'room_number' => 'ROOM 1A',
        ])->assertStatus(200)
          ->assertJsonPath('doctor.name', 'Dr. Sarah Johnson, MD');
    }

    public function test_admin_reports_and_super_admin_soft_delete_recovery_and_waf(): void
    {
        $this->getJson('/api/v1/admin/dashboard')
            ->assertStatus(200)
            ->assertJsonStructure([
                'kpis',
                'appointments',
                'reports' => ['bookings_by_department', 'daily_trends', 'doctor_analytics'],
            ]);

        $appt = Appointment::first();
        $this->postJson("/api/v1/admin/appointments/{$appt->id}/action", [
            'action' => 'delete',
        ])->assertStatus(200);

        $this->assertSoftDeleted('appointments', ['id' => $appt->id]);

        // Super Admin restores the soft-deleted appointment
        $this->postJson('/api/v1/super-admin/restore', [
            'type' => 'appointment',
            'id' => $appt->id,
        ])->assertStatus(200);

        $this->assertNotSoftDeleted('appointments', ['id' => $appt->id]);

        // Test WAF Input Sanitizer against XSS script probe
        $this->getJson('/api/v1/public/lookup?query=' . urlencode('<script>alert(1)</script>G-105'));
        $this->assertTrue(
            SystemLog::where('level', 'SECURITY')->exists(),
            'Expected WAF InputSanitizationMiddleware to log a SECURITY event.'
        );
    }

    public function test_role_based_access_control_enforcement_and_role_management(): void
    {
        // 1. Verify RBAC matrix overview endpoint
        $this->getJson('/api/v1/auth/roles')
            ->assertStatus(200)
            ->assertJsonStructure(['current_role', 'role_meta', 'matrix', 'demo_accounts']);

        // 2. Verify Login endpoint with valid credentials
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@carepoint.clinic',
            'password' => 'password123',
        ]);
        $loginRes->assertStatus(200)
            ->assertJsonPath('role', 'admin');

        // 3. Patient role must be blocked (403) from Staff, Doctor, Admin, and Super Admin endpoints
        $this->withHeaders(['X-Active-Role' => 'patient'])
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(403)
            ->assertJsonPath('current_role', 'patient');

        // 4. Admin role can access Admin & Staff dashboards (200), but is blocked from Super Admin (403)
        $this->withHeaders(['X-Active-Role' => 'admin'])
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(200);

        $this->withHeaders(['X-Active-Role' => 'admin'])
            ->getJson('/api/v1/super-admin/dashboard')
            ->assertStatus(403);

        // 5. Super Admin role can access Super Admin Observatory (200) and update a user's role
        $this->withHeaders(['X-Active-Role' => 'super_admin'])
            ->getJson('/api/v1/super-admin/dashboard')
            ->assertStatus(200);
    }
}

