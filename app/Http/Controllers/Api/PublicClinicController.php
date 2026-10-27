<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ClinicSetting;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\SystemLog;
use App\Services\ClinicCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicClinicController extends Controller
{
    private const DEFAULT_SLOTS = [
        '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM',
        '10:30 AM', '11:00 AM', '11:30 AM', '01:00 PM',
        '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
        '03:30 PM', '04:00 PM',
    ];

    /**
     * Public clinic catalog, live TV queue display data, and available slots.
     */
    public function catalog(Request $request): JsonResponse
    {
        $date = $request->query('date', now()->toDateString());
        $requestedDoctorId = $request->query('doctor_id');

        $payload = ClinicCacheService::remember("public_catalog_{$date}_{$requestedDoctorId}", 30, function () use ($date, $requestedDoctorId) {
            $departments = Department::where('is_active', true)->orderBy('id')->get();
            $doctors = Doctor::with('department')->orderBy('id')->get();

            $doctorId = $requestedDoctorId ?: $doctors->first()?->id;
            $slots = $this->computeSlots((int) $doctorId, $date);

            // Live Queue for TV Display & Quick Status (Eager-loaded to prevent N+1)
            $todayAppointments = Appointment::with(['doctor.department', 'department'])
                ->whereDate('appointment_date', now()->toDateString())
                ->whereNull('deleted_at')
                ->orderByRaw("CASE status WHEN 'serving' THEN 1 WHEN 'called' THEN 2 WHEN 'waiting' THEN 3 WHEN 'checked_in' THEN 4 WHEN 'pending' THEN 5 ELSE 6 END")
                ->orderBy('id')
                ->get();

            $nowServing = $todayAppointments
                ->whereIn('status', ['serving', 'called'])
                ->values();

            $upcomingQueue = $todayAppointments
                ->whereIn('status', ['waiting', 'checked_in', 'pending'])
                ->values();

            $settings = ClinicSetting::pluck('value', 'key');

            return [
                'clinic_name' => $settings['clinic_name'] ?? 'CarePoint Clinic',
                'ticker_news' => $settings['ticker_news'] ?? 'Flu vaccines are now available. Inquiry at the reception desk. • Online appointments enjoy priority lane check-in at Desk 1.',
                'emergency_hotline' => $settings['emergency_hotline'] ?? '+1 (800) 555-CARE',
                'today_date' => now()->toDateString(),
                'departments' => $departments,
                'doctors' => $doctors,
                'slots' => $slots,
                'queue' => [
                    'now_serving' => $nowServing,
                    'upcoming' => $upcomingQueue,
                    'active_ticket_preview' => $upcomingQueue->first() ?? $nowServing->first(),
                    'total_waiting' => $upcomingQueue->count(),
                ],
                'cache_version' => ClinicCacheService::getVersion(),
            ];
        });

        $payload['server_time'] = now()->format('h:i A');

        return response()->json($payload);
    }

    /**
     * Check time slots for a specific doctor and date.
     */
    public function slots(Request $request): JsonResponse
    {
        $doctorId = (int) $request->query('doctor_id');
        $date = (string) $request->query('date', now()->toDateString());

        $slots = ClinicCacheService::remember("slots_{$doctorId}_{$date}", 30, function () use ($doctorId, $date) {
            return $this->computeSlots($doctorId, $date);
        });

        return response()->json([
            'doctor_id' => $doctorId,
            'date' => $date,
            'slots' => $slots,
        ]);
    }

    /**
     * Submit a new patient appointment reservation.
     */
    public function bookAppointment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_name' => ['required', 'string', 'min:2', 'max:120'],
            'patient_email' => ['nullable', 'email', 'max:150'],
            'patient_phone' => ['required', 'string', 'min:6', 'max:30'],
            'patient_age' => ['nullable', 'integer', 'min:0', 'max:125'],
            'department_id' => ['required', 'exists:departments,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required', 'string', 'max:25'],
            'priority' => ['nullable', 'in:normal,urgent,senior_pwd'],
            'reason_for_visit' => ['nullable', 'string', 'max:1000'],
        ]);

        // Prevent double booking of the same doctor + date + time
        $alreadyBooked = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('appointment_time', $validated['appointment_time'])
            ->whereNotIn('status', ['cancelled', 'declined'])
            ->exists();

        if ($alreadyBooked) {
            return response()->json([
                'message' => 'That time slot has just been reserved by another patient. Please select another available slot.',
            ], 422);
        }

        $department = Department::findOrFail($validated['department_id']);
        $doctor = Doctor::findOrFail($validated['doctor_id']);

        $prefix = $department->code ?: 'G';
        $countToday = Appointment::withTrashed()
            ->where('department_id', $department->id)
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->count();

        $ticketNumber = sprintf('%s-%d', $prefix, 101 + $countToday);
        $bookingRef = 'CP-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));

        $waitingAhead = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->whereIn('status', ['waiting', 'checked_in', 'pending'])
            ->count();

        $estimatedWait = max(10, ($waitingAhead + 1) * 12);

        $appointment = Appointment::create([
            'ticket_number' => $ticketNumber,
            'booking_reference' => $bookingRef,
            'patient_name' => $validated['patient_name'],
            'patient_email' => $validated['patient_email'] ?? null,
            'patient_phone' => $validated['patient_phone'],
            'patient_age' => $validated['patient_age'] ?? null,
            'department_id' => $department->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'booking_type' => 'online',
            'status' => 'waiting',
            'priority' => $validated['priority'] ?? 'normal',
            'assigned_room' => $doctor->room_number ?: $department->default_room,
            'assigned_desk' => 'DESK 1',
            'reason_for_visit' => $validated['reason_for_visit'] ?? 'General Consultation',
            'estimated_wait_minutes' => $estimatedWait,
            'checked_in_at' => now(),
        ]);

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "New online reservation {$ticketNumber} ({$bookingRef}) booked for {$doctor->name}",
            'endpoint' => $request->path(),
            'method' => 'POST',
            'ip_address' => $request->ip(),
            'context' => [
                'ticket_number' => $ticketNumber,
                'booking_reference' => $bookingRef,
                'doctor' => $doctor->name,
            ],
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => 'Appointment reserved successfully!',
            'appointment' => $appointment->load(['doctor.department', 'department']),
        ], 201);
    }

    /**
     * Look up an active ticket by ticket number, booking reference, or phone.
     */
    public function lookupTicket(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('query', ''));
        if ($query === '') {
            return response()->json(['message' => 'Please enter a ticket number, booking reference, or phone number.'], 422);
        }

        $appointment = Appointment::with(['doctor', 'department'])
            ->where(function ($q) use ($query) {
                $q->where('ticket_number', $query)
                    ->orWhere('booking_reference', $query)
                    ->orWhere('patient_phone', $query)
                    ->orWhere('patient_name', 'like', "%{$query}%");
            })
            ->latest('id')
            ->first();

        if (!$appointment) {
            return response()->json([
                'message' => "No active reservation found matching '{$query}'.",
            ], 404);
        }

        $aheadCount = Appointment::whereDate('appointment_date', $appointment->appointment_date)
            ->where('doctor_id', $appointment->doctor_id)
            ->whereIn('status', ['waiting', 'checked_in'])
            ->where('id', '<', $appointment->id)
            ->count();

        return response()->json([
            'appointment' => $appointment,
            'patients_ahead' => $aheadCount,
            'estimated_wait_minutes' => $appointment->status === 'serving' ? 0 : max(5, ($aheadCount + 1) * 10),
        ]);
    }

    private function computeSlots(int $doctorId, string $date): array
    {
        $reservedTimes = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', ['cancelled', 'declined'])
            ->pluck('appointment_time')
            ->toArray();

        return array_map(function (string $time) use ($reservedTimes) {
            return [
                'time' => $time,
                'is_reserved' => in_array($time, $reservedTimes, true),
            ];
        }, self::DEFAULT_SLOTS);
    }
}
