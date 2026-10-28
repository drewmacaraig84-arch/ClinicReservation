<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\SystemLog;
use App\Services\ClinicCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StaffPortalController extends Controller
{
    /**
     * Reception & Staff Portal Overview:
     * - Active Queue at Desk 1
     * - Walk-in & Reservation Check-In list
     * - Live Doctor Availability
     * - Quick Ticket Generation departments
     */
    public function dashboard(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $date = $request->query('date', now()->toDateString());

        $payload = ClinicCacheService::remember("staff_dashboard_{$date}_" . md5($search), 20, function () use ($search, $date) {
            $query = Appointment::with(['doctor.department', 'department'])
                ->whereDate('appointment_date', $date);

            if ($search !== '') {
                $escapedLike = '%' . addcslashes($search, '%_\\') . '%';
                $query->where(function ($q) use ($escapedLike) {
                    $q->where('patient_name', 'like', $escapedLike)
                        ->orWhere('ticket_number', 'like', $escapedLike)
                        ->orWhere('booking_reference', 'like', $escapedLike)
                        ->orWhere('patient_phone', 'like', $escapedLike);
                });
            }

            $appointments = $query
                ->orderByRaw(
                    'CASE status WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 WHEN ? THEN 4 WHEN ? THEN 5 WHEN ? THEN 6 WHEN ? THEN 7 ELSE 8 END',
                    ['called', 'serving', 'waiting', 'checked_in', 'pending', 'no_show', 'completed']
                )
                ->orderByRaw(
                    'CASE priority WHEN ? THEN 1 WHEN ? THEN 2 ELSE 3 END',
                    ['urgent', 'senior_pwd']
                )
                ->orderBy('id')
                ->get();

            $currentDeskTicket = $appointments->firstWhere('status', 'called')
                ?? $appointments->firstWhere('status', 'serving')
                ?? $appointments->firstWhere('status', 'waiting');

            $doctors = Doctor::with('department')
                ->withCount([
                    'appointments as waiting_patients_count' => function ($q) use ($date) {
                        $q->whereDate('appointment_date', $date)
                            ->whereIn('status', ['waiting', 'checked_in', 'called', 'serving']);
                    },
                    'appointments as served_today_count' => function ($q) use ($date) {
                        $q->whereDate('appointment_date', $date)
                            ->where('status', 'completed');
                    },
                ])
                ->orderBy('id')
                ->get();

            $departments = Department::where('is_active', true)->orderBy('id')->get();

            return [
                'current_desk_ticket' => $currentDeskTicket,
                'appointments' => $appointments,
                'doctors' => $doctors,
                'departments' => $departments,
                'stats' => [
                    'waiting_count' => $appointments->whereIn('status', ['waiting', 'checked_in'])->count(),
                    'serving_count' => $appointments->whereIn('status', ['called', 'serving'])->count(),
                    'pending_checkin_count' => $appointments->where('status', 'pending')->count(),
                    'completed_count' => $appointments->where('status', 'completed')->count(),
                    'available_doctors_count' => $doctors->whereIn('availability_status', ['active', 'in_consultation'])->count(),
                ],
                'cache_version' => ClinicCacheService::getVersion(),
            ];
        });

        return response()->json($payload);
    }

    /**
     * Reception Queue Control actions:
     * call_next, serve, complete, no_show_requeue, check_in
     */
    public function queueAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:call_next,serve,complete,no_show_requeue,check_in'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'desk' => ['nullable', 'string', 'max:50'],
        ]);

        $action = $validated['action'];
        $desk = $validated['desk'] ?? 'DESK 1';

        if (!empty($validated['appointment_id'])) {
            $appointment = Appointment::with(['doctor', 'department'])->findOrFail($validated['appointment_id']);
        } else {
            // Find the next logical ticket in today's queue using parameterized bindings
            $appointment = Appointment::with(['doctor', 'department'])
                ->whereDate('appointment_date', now()->toDateString())
                ->whereIn('status', $action === 'call_next' ? ['waiting', 'checked_in'] : ['called', 'serving', 'waiting'])
                ->orderByRaw(
                    'CASE priority WHEN ? THEN 1 WHEN ? THEN 2 ELSE 3 END',
                    ['urgent', 'senior_pwd']
                )
                ->orderBy('id')
                ->first();
        }

        if (!$appointment) {
            return response()->json([
                'message' => 'No matching tickets currently waiting in the queue.',
            ], 404);
        }

        switch ($action) {
            case 'call_next':
                $appointment->update([
                    'status' => 'called',
                    'assigned_desk' => $desk,
                    'called_at' => now(),
                    'estimated_wait_minutes' => 2,
                ]);
                $msg = "Ticket {$appointment->ticket_number} called to {$desk} / {$appointment->assigned_room}.";
                break;

            case 'serve':
                $appointment->update([
                    'status' => 'serving',
                    'served_at' => now(),
                    'estimated_wait_minutes' => 0,
                ]);
                if ($appointment->doctor) {
                    $appointment->doctor->update(['availability_status' => 'in_consultation']);
                }
                $msg = "Ticket {$appointment->ticket_number} is now being served in {$appointment->assigned_room}.";
                break;

            case 'complete':
                $appointment->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'estimated_wait_minutes' => 0,
                ]);
                if ($appointment->doctor) {
                    $appointment->doctor->update(['availability_status' => 'active']);
                }
                $msg = "Ticket {$appointment->ticket_number} marked as completed.";
                break;

            case 'no_show_requeue':
                $appointment->update([
                    'status' => 'waiting',
                    'called_at' => null,
                    'estimated_wait_minutes' => 20,
                ]);
                $msg = "Ticket {$appointment->ticket_number} re-queued for later call.";
                break;

            case 'check_in':
            default:
                $appointment->update([
                    'status' => 'waiting',
                    'checked_in_at' => now(),
                    'estimated_wait_minutes' => 15,
                ]);
                $msg = "Patient {$appointment->patient_name} ({$appointment->ticket_number}) checked in and added to active queue.";
                break;
        }

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "Staff Queue Action [{$action}]: {$msg}",
            'endpoint' => $request->path(),
            'method' => 'POST',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => $msg,
            'appointment' => $appointment->fresh(['doctor.department', 'department']),
        ]);
    }

    /**
     * Quick Walk-In Ticket Generation from Reception Desk (General [G], Pediatric [P], Dental [D], Laboratory [L], etc.)
     */
    public function quickWalkInTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'patient_name' => ['nullable', 'string', 'max:120'],
            'patient_phone' => ['nullable', 'string', 'max:30'],
            'priority' => ['nullable', 'in:normal,urgent,senior_pwd'],
            'reason_for_visit' => ['nullable', 'string', 'max:500'],
            'doctor_id' => ['nullable', 'exists:doctors,id'],
        ]);

        $department = Department::findOrFail($validated['department_id']);

        // Pick requested doctor or auto-assign available doctor in that department
        $doctor = !empty($validated['doctor_id'])
            ? Doctor::find($validated['doctor_id'])
            : Doctor::where('department_id', $department->id)
                ->whereIn('availability_status', ['active', 'in_consultation'])
                ->first() ?? Doctor::where('department_id', $department->id)->first();

        $countToday = Appointment::withTrashed()
            ->where('department_id', $department->id)
            ->whereDate('appointment_date', now()->toDateString())
            ->count();

        $ticketNumber = sprintf('%s-%d', $department->code ?: 'G', 101 + $countToday);
        $bookingRef = 'WK-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));

        $appointment = Appointment::create([
            'ticket_number' => $ticketNumber,
            'booking_reference' => $bookingRef,
            'patient_name' => !empty($validated['patient_name']) ? $validated['patient_name'] : "Walk-In Patient ({$ticketNumber})",
            'patient_phone' => $validated['patient_phone'] ?? 'Walk-In Desk',
            'department_id' => $department->id,
            'doctor_id' => $doctor?->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => now()->format('h:i A'),
            'booking_type' => 'walk_in',
            'status' => 'waiting',
            'priority' => $validated['priority'] ?? 'normal',
            'assigned_room' => $doctor?->room_number ?? $department->default_room,
            'assigned_desk' => 'DESK 1',
            'reason_for_visit' => $validated['reason_for_visit'] ?? "{$department->name} Walk-In Consultation",
            'estimated_wait_minutes' => $department->avg_wait_minutes ?? 15,
            'checked_in_at' => now(),
        ]);

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "Quick Walk-In Ticket {$ticketNumber} generated for {$department->name}",
            'endpoint' => $request->path(),
            'method' => 'POST',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Walk-in ticket {$ticketNumber} generated and queued for {$appointment->assigned_room}!",
            'appointment' => $appointment->load(['doctor.department', 'department']),
        ], 201);
    }
}
