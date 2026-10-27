<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\ClinicSetting;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\SystemLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the CarePoint Clinic application database.
     */
    public function run(): void
    {
        // 1. Clinic Settings
        $settings = [
            ['key' => 'clinic_name', 'value' => 'CarePoint Clinic', 'group' => 'general'],
            ['key' => 'ticker_news', 'value' => 'Flu vaccines are now available. Inquiry at the reception desk. • Priority check-in at Desk 1 for online reservations.', 'group' => 'display'],
            ['key' => 'emergency_hotline', 'value' => '+1 (800) 555-0199', 'group' => 'general'],
        ];
        foreach ($settings as $s) {
            ClinicSetting::updateOrCreate(['key' => $s['key']], $s);
        }

        // 2. Users across all 5 roles
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@carepoint.clinic'],
            [
                'name' => 'chief.architect (Super Admin)',
                'role' => 'super_admin',
                'phone' => '+1-555-0100',
                'status' => 'active',
                'last_login_at' => now(),
                'password' => Hash::make('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@carepoint.clinic'],
            [
                'name' => 'Admin User',
                'role' => 'admin',
                'phone' => '+1-555-0101',
                'status' => 'active',
                'last_login_at' => now()->subMinutes(14),
                'password' => Hash::make('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'reception@carepoint.clinic'],
            [
                'name' => 'Clara Receptionist (Desk 1)',
                'role' => 'staff',
                'phone' => '+1-555-0102',
                'status' => 'active',
                'last_login_at' => now()->subMinutes(5),
                'password' => Hash::make('password123'),
            ]
        );

        $drSarahUser = User::updateOrCreate(
            ['email' => 'sarah.johnson@carepoint.clinic'],
            [
                'name' => 'Dr. Sarah Johnson',
                'role' => 'doctor',
                'phone' => '+1-555-0103',
                'status' => 'active',
                'last_login_at' => now()->subMinutes(20),
                'password' => Hash::make('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'tv@carepoint.clinic'],
            [
                'name' => 'Waiting Lounge TV Display',
                'role' => 'tv_display',
                'phone' => '+1-555-0105',
                'status' => 'active',
                'last_login_at' => now()->subMinutes(2),
                'password' => Hash::make('password123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'john.doe@example.com'],
            [
                'name' => 'John Doe',
                'role' => 'patient',
                'phone' => '+1-555-0192',
                'status' => 'active',
                'last_login_at' => now()->subHours(1),
                'password' => Hash::make('password123'),
            ]
        );

        // Soft-deleted user for Super Admin Recovery Vault
        $trashedUser = User::withTrashed()->updateOrCreate(
            ['email' => 'former.staff@carepoint.clinic'],
            [
                'name' => 'Kevin Miller (Archived Staff)',
                'role' => 'staff',
                'phone' => '+1-555-0188',
                'status' => 'suspended',
                'password' => Hash::make('password123'),
            ]
        );
        if (!$trashedUser->trashed()) {
            $trashedUser->delete();
        }

        // 3. Departments
        $deptGeneral = Department::updateOrCreate(
            ['code' => 'G'],
            [
                'name' => 'General Medicine',
                'description' => 'Primary care, comprehensive physical exams, and acute illness consultations.',
                'default_room' => 'ROOM 1',
                'avg_wait_minutes' => 15,
                'is_active' => true,
            ]
        );

        $deptInternal = Department::updateOrCreate(
            ['code' => 'A'],
            [
                'name' => 'Internal Medicine & Primary',
                'description' => 'Adult internal medicine, chronic disease management, and preventive care.',
                'default_room' => 'ROOM 1',
                'avg_wait_minutes' => 12,
                'is_active' => true,
            ]
        );

        $deptCardio = Department::updateOrCreate(
            ['code' => 'B'],
            [
                'name' => 'Cardiology & Specialist',
                'description' => 'Heart health diagnostics, ECG monitoring, and hypertension clinics.',
                'default_room' => 'ROOM 3',
                'avg_wait_minutes' => 20,
                'is_active' => true,
            ]
        );

        $deptClinical = Department::updateOrCreate(
            ['code' => 'C'],
            [
                'name' => 'Family & Clinical Care',
                'description' => 'Comprehensive family consultations and follow-up checkups.',
                'default_room' => 'ROOM 3',
                'avg_wait_minutes' => 18,
                'is_active' => true,
            ]
        );

        $deptPeds = Department::updateOrCreate(
            ['code' => 'P'],
            [
                'name' => 'Pediatric Care',
                'description' => 'Dedicated infant, child, and adolescent wellness and immunizations.',
                'default_room' => 'ROOM 2',
                'avg_wait_minutes' => 15,
                'is_active' => true,
            ]
        );

        $deptDental = Department::updateOrCreate(
            ['code' => 'D'],
            [
                'name' => 'Dental & Oral Surgery',
                'description' => 'Preventive dentistry, oral prophylaxis, and restorative procedures.',
                'default_room' => 'ROOM 4',
                'avg_wait_minutes' => 25,
                'is_active' => true,
            ]
        );

        $deptLab = Department::updateOrCreate(
            ['code' => 'L'],
            [
                'name' => 'Laboratory & Diagnostics',
                'description' => 'Complete blood chemistry, urinalysis, X-Ray, and rapid diagnostic panels.',
                'default_room' => 'LAB 1',
                'avg_wait_minutes' => 10,
                'is_active' => true,
            ]
        );

        // 4. Doctors
        $drSarah = Doctor::updateOrCreate(
            ['email' => 'sarah.johnson@carepoint.clinic'],
            [
                'user_id' => $drSarahUser->id,
                'department_id' => $deptGeneral->id,
                'name' => 'Dr. Sarah Johnson',
                'specialty' => 'Senior General & Internal Physician',
                'license_number' => 'MD-2026-88412',
                'room_number' => 'ROOM 1',
                'phone' => '+1-555-2301',
                'bio' => 'Board-certified General & Internal Medicine specialist with 12+ years of clinical experience in preventive care and diagnostics.',
                'consultation_fee' => 750.00,
                'availability_status' => 'active',
                'shift_start' => '08:00 AM',
                'shift_end' => '05:00 PM',
                'slot_duration_minutes' => 30,
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'max_daily_patients' => 30,
            ]
        );

        $drMarcus = Doctor::updateOrCreate(
            ['email' => 'marcus.vance@carepoint.clinic'],
            [
                'department_id' => $deptPeds->id,
                'name' => 'Dr. Marcus Vance',
                'specialty' => 'Pediatric Specialist',
                'license_number' => 'MD-2026-77219',
                'room_number' => 'ROOM 2',
                'phone' => '+1-555-2302',
                'bio' => 'Specialist in childhood immunizations, developmental pediatrics, and acute pediatric care.',
                'consultation_fee' => 800.00,
                'availability_status' => 'active',
                'shift_start' => '08:30 AM',
                'shift_end' => '04:30 PM',
                'slot_duration_minutes' => 30,
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                'max_daily_patients' => 25,
            ]
        );

        $drElena = Doctor::updateOrCreate(
            ['email' => 'elena.rostova@carepoint.clinic'],
            [
                'department_id' => $deptCardio->id,
                'name' => 'Dr. Elena Rostova',
                'specialty' => 'Cardiologist & Clinical Consultant',
                'license_number' => 'MD-2026-99104',
                'room_number' => 'ROOM 3',
                'phone' => '+1-555-2303',
                'bio' => 'Interventional and non-invasive cardiology consultant specializing in hypertension and arrhythmia.',
                'consultation_fee' => 1100.00,
                'availability_status' => 'in_consultation',
                'shift_start' => '09:00 AM',
                'shift_end' => '05:00 PM',
                'slot_duration_minutes' => 30,
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                'max_daily_patients' => 20,
            ]
        );

        $drJulian = Doctor::updateOrCreate(
            ['email' => 'julian.chen@carepoint.clinic'],
            [
                'department_id' => $deptDental->id,
                'name' => 'Dr. Julian Chen',
                'specialty' => 'Dental & Maxillofacial Surgeon',
                'license_number' => 'DMD-2026-55410',
                'room_number' => 'ROOM 4',
                'phone' => '+1-555-2304',
                'bio' => 'Restorative dental care, endodontics, and cosmetic oral surgery.',
                'consultation_fee' => 900.00,
                'availability_status' => 'on_break',
                'shift_start' => '09:00 AM',
                'shift_end' => '06:00 PM',
                'slot_duration_minutes' => 30,
                'working_days' => ['Mon', 'Wed', 'Thu', 'Fri', 'Sat'],
                'max_daily_patients' => 18,
            ]
        );

        $drPriya = Doctor::updateOrCreate(
            ['email' => 'priya.nair@carepoint.clinic'],
            [
                'department_id' => $deptLab->id,
                'name' => 'Dr. Priya Nair',
                'specialty' => 'Pathology & Diagnostic Medicine',
                'license_number' => 'MD-2026-61208',
                'room_number' => 'LAB 1',
                'phone' => '+1-555-2305',
                'bio' => 'Clinical pathology and rapid diagnostic imaging lead.',
                'consultation_fee' => 600.00,
                'availability_status' => 'offline',
                'shift_start' => '07:30 AM',
                'shift_end' => '03:30 PM',
                'slot_duration_minutes' => 20,
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                'max_daily_patients' => 35,
            ]
        );

        // Soft-deleted Doctor for Super Admin Recovery Vault
        $trashedDoc = Doctor::withTrashed()->updateOrCreate(
            ['email' => 'robert.sterling@carepoint.clinic'],
            [
                'department_id' => $deptGeneral->id,
                'name' => 'Dr. Robert Sterling (Visiting)',
                'specialty' => 'Visiting Pulmonologist',
                'license_number' => 'MD-2025-31002',
                'room_number' => 'ROOM 5',
                'phone' => '+1-555-2399',
                'bio' => 'Visiting consultant (archived rotation).',
                'consultation_fee' => 950.00,
                'availability_status' => 'offline',
                'working_days' => ['Tue', 'Thu'],
            ]
        );
        if (!$trashedDoc->trashed()) {
            $trashedDoc->delete();
        }

        // 5. Appointments & Live Queue matching the Mockup
        $today = now()->toDateString();

        $sampleAppointments = [
            // Currently at Reception Desk 1 (Mockup: CURRENT TICKET AT DESK 1: A-101)
            [
                'ticket_number' => 'A-101',
                'booking_reference' => 'CP-20261027-A101',
                'patient_name' => 'Maria Santos',
                'patient_email' => 'maria.santos@example.com',
                'patient_phone' => '+1-555-3401',
                'patient_age' => 34,
                'department_id' => $deptInternal->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '02:30 PM',
                'booking_type' => 'online',
                'status' => 'called',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 1',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Annual Physical & Blood Pressure Consultation',
                'estimated_wait_minutes' => 2,
                'checked_in_at' => now()->subMinutes(18),
                'called_at' => now()->subMinutes(2),
            ],
            // TV Display NOW SERVING: A-102 -> ROOM 1
            [
                'ticket_number' => 'A-102',
                'booking_reference' => 'CP-20261027-A102',
                'patient_name' => 'Arthur Pendelton',
                'patient_email' => 'arthur.p@example.com',
                'patient_phone' => '+1-555-3402',
                'patient_age' => 58,
                'department_id' => $deptInternal->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '09:00 AM',
                'booking_type' => 'online',
                'status' => 'serving',
                'priority' => 'senior_pwd',
                'assigned_room' => 'ROOM 1',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Follow-up Hypertension & Lipid Profile Review',
                'doctor_notes' => 'BP 126/82 mmHg. Responded well to current regimen.',
                'prescription' => 'Amlodipine 5mg OD, continue lifestyle modification.',
                'estimated_wait_minutes' => 0,
                'checked_in_at' => now()->subMinutes(35),
                'called_at' => now()->subMinutes(15),
                'served_at' => now()->subMinutes(12),
            ],
            // TV Display NOW SERVING: B-204 -> ROOM 3
            [
                'ticket_number' => 'B-204',
                'booking_reference' => 'CP-20261027-B204',
                'patient_name' => 'Evelyn Harper',
                'patient_email' => 'evelyn.h@example.com',
                'patient_phone' => '+1-555-3403',
                'patient_age' => 46,
                'department_id' => $deptCardio->id,
                'doctor_id' => $drElena->id,
                'appointment_date' => $today,
                'appointment_time' => '09:30 AM',
                'booking_type' => 'online',
                'status' => 'serving',
                'priority' => 'urgent',
                'assigned_room' => 'ROOM 3',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'ECG Evaluation & Palpitation Assessment',
                'doctor_notes' => 'Normal sinus rhythm on resting 12-lead ECG.',
                'estimated_wait_minutes' => 0,
                'checked_in_at' => now()->subMinutes(40),
                'called_at' => now()->subMinutes(20),
                'served_at' => now()->subMinutes(14),
            ],
            // UPCOMING QUEUE & USER QUICK STATUS: G-105 -> ROOM 1 (John Doe, Dr. Sarah Johnson, 10:30 AM Reserved)
            [
                'ticket_number' => 'G-105',
                'booking_reference' => 'CP-20261027-G105',
                'patient_name' => 'John Doe',
                'patient_email' => 'john.doe@example.com',
                'patient_phone' => '+1-555-0192',
                'patient_age' => 31,
                'department_id' => $deptGeneral->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '10:30 AM',
                'booking_type' => 'online',
                'status' => 'waiting',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 1',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'General Medical Checkup & Flu Vaccination Inquiry',
                'estimated_wait_minutes' => 15,
                'checked_in_at' => now()->subMinutes(12),
            ],
            // UPCOMING QUEUE: A-103 -> ROOM 1
            [
                'ticket_number' => 'A-103',
                'booking_reference' => 'CP-20261027-A103',
                'patient_name' => 'Maria Santos',
                'patient_email' => 'maria.s@example.com',
                'patient_phone' => '+1-555-3405',
                'patient_age' => 29,
                'department_id' => $deptInternal->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '11:00 AM',
                'booking_type' => 'online',
                'status' => 'waiting',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 1',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Migraine & Seasonal Allergy Consultation',
                'estimated_wait_minutes' => 12,
                'checked_in_at' => now()->subMinutes(12),
            ],
            // UPCOMING QUEUE: C-301 -> ROOM 3
            [
                'ticket_number' => 'C-301',
                'booking_reference' => 'CP-20261027-C301',
                'patient_name' => 'Liam O\'Connor',
                'patient_email' => 'liam.oc@example.com',
                'patient_phone' => '+1-555-3406',
                'patient_age' => 41,
                'department_id' => $deptClinical->id,
                'doctor_id' => $drElena->id,
                'appointment_date' => $today,
                'appointment_time' => '11:30 AM',
                'booking_type' => 'online',
                'status' => 'waiting',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 3',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Cardiovascular Wellness Clearance',
                'estimated_wait_minutes' => 18,
                'checked_in_at' => now()->subMinutes(10),
            ],
            // UPCOMING QUEUE: B-205 -> ROOM 2
            [
                'ticket_number' => 'B-205',
                'booking_reference' => 'CP-20261027-B205',
                'patient_name' => 'Sophia Martinez',
                'patient_email' => 'sophia.m@example.com',
                'patient_phone' => '+1-555-3407',
                'patient_age' => 8,
                'department_id' => $deptPeds->id,
                'doctor_id' => $drMarcus->id,
                'appointment_date' => $today,
                'appointment_time' => '01:00 PM',
                'booking_type' => 'walk_in',
                'status' => 'waiting',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 2',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Pediatric Wellness Check & Booster',
                'estimated_wait_minutes' => 15,
                'checked_in_at' => now()->subMinutes(8),
            ],
            // UPCOMING QUEUE: G-106 -> ROOM 3
            [
                'ticket_number' => 'G-106',
                'booking_reference' => 'CP-20261027-G106',
                'patient_name' => 'Daniel Kim',
                'patient_email' => 'daniel.kim@example.com',
                'patient_phone' => '+1-555-3408',
                'patient_age' => 36,
                'department_id' => $deptGeneral->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '01:30 PM',
                'booking_type' => 'online',
                'status' => 'waiting',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 1',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Annual Executive Medical Clearance',
                'estimated_wait_minutes' => 22,
                'checked_in_at' => now()->subMinutes(5),
            ],
            // Completed Today
            [
                'ticket_number' => 'G-101',
                'booking_reference' => 'CP-20261027-G101',
                'patient_name' => 'Hannah Abbott',
                'patient_email' => 'hannah.a@example.com',
                'patient_phone' => '+1-555-3409',
                'patient_age' => 27,
                'department_id' => $deptGeneral->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '08:30 AM',
                'booking_type' => 'online',
                'status' => 'completed',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 1',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Routine Physical Exam',
                'doctor_notes' => 'Vitals normal. Cleared for return to work.',
                'prescription' => 'Multivitamins + Vitamin D3 1000 IU daily.',
                'estimated_wait_minutes' => 0,
                'checked_in_at' => now()->subHours(3),
                'called_at' => now()->subHours(2)->subMinutes(45),
                'served_at' => now()->subHours(2)->subMinutes(40),
                'completed_at' => now()->subHours(2)->subMinutes(15),
            ],
            [
                'ticket_number' => 'P-101',
                'booking_reference' => 'CP-20261027-P101',
                'patient_name' => 'Noah Williams',
                'patient_email' => 'noah.w@example.com',
                'patient_phone' => '+1-555-3410',
                'patient_age' => 6,
                'department_id' => $deptPeds->id,
                'doctor_id' => $drMarcus->id,
                'appointment_date' => $today,
                'appointment_time' => '09:00 AM',
                'booking_type' => 'walk_in',
                'status' => 'completed',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 2',
                'assigned_desk' => 'DESK 1',
                'reason_for_visit' => 'Pediatric Ear & Throat Checkup',
                'doctor_notes' => 'Mild pharyngitis, afebrile.',
                'prescription' => 'Saline throat spray + hydration.',
                'estimated_wait_minutes' => 0,
                'checked_in_at' => now()->subHours(2),
                'completed_at' => now()->subHours(1),
            ],
        ];

        foreach ($sampleAppointments as $apptData) {
            Appointment::updateOrCreate(
                ['booking_reference' => $apptData['booking_reference']],
                $apptData
            );
        }

        // Soft-Deleted Reservations for Super Admin Recovery Vault
        $trashedAppts = [
            [
                'ticket_number' => 'G-100',
                'booking_reference' => 'CP-20261027-G100',
                'patient_name' => 'Thomas Shelby (Duplicate Entry)',
                'patient_email' => 'thomas.s@example.com',
                'patient_phone' => '+1-555-3900',
                'patient_age' => 39,
                'department_id' => $deptGeneral->id,
                'doctor_id' => $drSarah->id,
                'appointment_date' => $today,
                'appointment_time' => '08:30 AM',
                'booking_type' => 'online',
                'status' => 'cancelled',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 1',
                'reason_for_visit' => 'Accidental duplicate booking removed by reception',
            ],
            [
                'ticket_number' => 'D-201',
                'booking_reference' => 'CP-20261027-D201',
                'patient_name' => 'Grace Burgess',
                'patient_email' => 'grace.b@example.com',
                'patient_phone' => '+1-555-3901',
                'patient_age' => 32,
                'department_id' => $deptDental->id,
                'doctor_id' => $drJulian->id,
                'appointment_date' => $today,
                'appointment_time' => '02:00 PM',
                'booking_type' => 'online',
                'status' => 'declined',
                'priority' => 'normal',
                'assigned_room' => 'ROOM 4',
                'reason_for_visit' => 'Dental Prophylaxis (Rescheduled)',
            ],
        ];

        foreach ($trashedAppts as $tData) {
            $record = Appointment::withTrashed()->updateOrCreate(
                ['booking_reference' => $tData['booking_reference']],
                $tData
            );
            if (!$record->trashed()) {
                $record->delete();
            }
        }

        // 6. Seed System Logs (Crash Logs, Security WAF Alerts, Rate Limit Logs, Audit Logs)
        if (SystemLog::count() === 0) {
            SystemLog::create([
                'level' => 'CRITICAL',
                'category' => 'crash',
                'message' => 'PDOException: Lock wait timeout exceeded during concurrent batch report export on replica-node-2',
                'exception_class' => 'Illuminate\\Database\\QueryException',
                'file' => app_path('Services/ReportExporterService.php'),
                'line' => 87,
                'stack_trace' => "#0 vendor/laravel/framework/src/Illuminate/Database/Connection.php(829): runQueryCallback()\n#1 app/Services/ReportExporterService.php(87): select()\n#2 app/Http/Controllers/Api/AdminPortalController.php(112): exportBatch()",
                'endpoint' => 'api/v1/admin/reports/export',
                'method' => 'POST',
                'ip_address' => '10.0.14.22',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'context' => ['node' => 'carepoint-node-2', 'auto_failover' => 'rerouted_to_primary'],
                'is_resolved' => false,
            ]);

            SystemLog::create([
                'level' => 'CRITICAL',
                'category' => 'crash',
                'message' => 'RedisClusterException: Transient socket read timeout on SMS notification queue worker',
                'exception_class' => 'Predis\\CommunicationException',
                'file' => app_path('Jobs/SendSmsTicketNotification.php'),
                'line' => 54,
                'stack_trace' => "#0 app/Jobs/SendSmsTicketNotification.php(54): dispatchSms('G-105')\n#1 vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(120): call()",
                'endpoint' => 'queue:work',
                'method' => 'CLI',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Laravel Queue Worker v13',
                'context' => ['retry_attempt' => 2, 'status' => 'recovered_on_retry_3'],
                'is_resolved' => true,
                'resolved_at' => now()->subMinutes(30),
            ]);

            SystemLog::create([
                'level' => 'SECURITY',
                'category' => 'security',
                'message' => 'WAF Sanitizer neutralized SQL Injection Signature Probe (UNION SELECT) on public lookup endpoint',
                'exception_class' => 'App\\Http\\Middleware\\InputSanitizationMiddleware',
                'file' => app_path('Http/Middleware/InputSanitizationMiddleware.php'),
                'line' => 45,
                'stack_trace' => "Sanitized query payload: G-105' UNION SELECT username,password FROM users--",
                'endpoint' => 'api/v1/public/lookup',
                'method' => 'GET',
                'ip_address' => '198.51.100.74',
                'user_agent' => 'sqlmap/1.8.2#stable',
                'context' => ['rule' => 'WAF-SQLI-01', 'action' => 'stripped_and_logged'],
                'is_resolved' => false,
            ]);

            SystemLog::create([
                'level' => 'WARNING',
                'category' => 'rate_limit',
                'message' => 'Rate Limiter throttled burst booking attempt on Booking Protection Tier (15/min)',
                'endpoint' => 'api/v1/public/book',
                'method' => 'POST',
                'ip_address' => '203.0.113.19',
                'user_agent' => 'Mozilla/5.0 (Automated Scraper)',
                'context' => ['tier' => 'booking (15/min)', 'http_status' => 429],
                'is_resolved' => true,
                'resolved_at' => now()->subMinutes(10),
            ]);

            SystemLog::create([
                'level' => 'INFO',
                'category' => 'audit',
                'message' => 'System initialized with Nginx Load Balancer, Multi-Tier Rate Limiter, and WAF Input Sanitizer active.',
                'endpoint' => 'system/boot',
                'method' => 'SYSTEM',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'CarePoint Core Kernel',
                'user_id' => $superAdmin->id,
                'is_resolved' => true,
                'resolved_at' => now(),
            ]);
        }
    }
}
