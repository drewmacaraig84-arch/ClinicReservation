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

class DoctorPortalController extends Controller
{
    /**
     * Doctor Dashboard:
     * - Doctor selector & active doctor profile
     * - My patients (today + upcoming)
     * - Schedule & Time in Clinic settings
     */
    public function dashboard(Request $request): JsonResponse
    {
        $requestedDoctorId = (int) $request->query('doctor_id', 0);

        $payload = ClinicCacheService::remember("doctor_dashboard_{$requestedDoctorId}", 20, function () use ($requestedDoctorId) {
            $allDoctors = Doctor::with('department')->orderBy('id')->get();
            $doctorId = $requestedDoctorId ?: $allDoctors->first()?->id;
            $doctor = $allDoctors->firstWhere('id', $doctorId) ?? $allDoctors->first();

            if (!$doctor) {
                return null;
            }

            $appointments = Appointment::with(['department', 'doctor.department'])
                ->where('doctor_id', '=', $doctor->id)
                ->orderByRaw(
                    'CASE status WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 WHEN ? THEN 4 WHEN ? THEN 5 WHEN ? THEN 6 ELSE 7 END',
                    ['serving', 'called', 'waiting', 'checked_in', 'pending', 'completed']
                )
                ->orderBy('appointment_date')
                ->orderBy('id')
                ->get();

            $todayStr = now()->toDateString();
            $todayPatients = $appointments->filter(
                fn (Appointment $a) => $a->appointment_date->toDateString() === $todayStr
            )->values();

            return [
                'doctor' => $doctor,
                'all_doctors' => $allDoctors,
                'departments' => Department::where('is_active', true)->orderBy('id')->get(),
                'appointments' => $appointments,
                'stats' => [
                    'total_patients_today' => $todayPatients->count(),
                    'waiting_for_me' => $todayPatients->whereIn('status', ['waiting', 'checked_in', 'called'])->count(),
                    'currently_serving' => $todayPatients->where('status', 'serving')->count(),
                    'completed_today' => $todayPatients->where('status', 'completed')->count(),
                    'upcoming_future' => $appointments->filter(
                        fn (Appointment $a) => $a->appointment_date->toDateString() > $todayStr
                    )->count(),
                ],
                'cache_version' => ClinicCacheService::getVersion(),
            ];
        });

        if (!$payload) {
            return response()->json(['message' => 'No doctor profiles available.'], 404);
        }

        return response()->json($payload);
    }

    /**
     * Update Doctor's clinic hours, availability status, slot duration, and working days.
     */
    public function updateSchedule(Request $request, int $doctorId): JsonResponse
    {
        $doctor = Doctor::findOrFail($doctorId);

        $validated = $request->validate([
            'availability_status' => ['required', 'in:active,in_consultation,on_break,offline'],
            'shift_start' => ['required', 'string', 'max:25'],
            'shift_end' => ['required', 'string', 'max:25'],
            'slot_duration_minutes' => ['required', 'integer', 'min:10', 'max:120'],
            'working_days' => ['required', 'array', 'min:1'],
            'max_daily_patients' => ['required', 'integer', 'min:1', 'max:100'],
            'room_number' => ['required', 'string', 'max:50'],
        ]);

        $doctor->update($validated);

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "{$doctor->name} updated clinic schedule ({$doctor->shift_start} - {$doctor->shift_end}, Status: {$doctor->availability_status})",
            'endpoint' => $request->path(),
            'method' => 'PUT',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => 'Clinic schedule and availability updated successfully!',
            'doctor' => $doctor->fresh('department'),
        ]);
    }

    /**
     * Edit Doctor's personal & professional details.
     */
    public function updateProfile(Request $request, int $doctorId): JsonResponse
    {
        $doctor = Doctor::findOrFail($doctorId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'department_id' => ['required', 'exists:departments,id'],
            'specialty' => ['required', 'string', 'max:120'],
            'license_number' => ['required', 'string', 'max:50', 'unique:doctors,license_number,' . $doctor->id],
            'email' => ['required', 'email', 'max:150', 'unique:doctors,email,' . $doctor->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'consultation_fee' => ['required', 'numeric', 'min:0', 'max:50000'],
            'room_number' => ['required', 'string', 'max:50'],
        ]);

        $doctor->update($validated);

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "Doctor profile updated for {$doctor->name} ({$doctor->license_number})",
            'endpoint' => $request->path(),
            'method' => 'PUT',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => 'Doctor profile details saved successfully!',
            'doctor' => $doctor->fresh('department'),
        ]);
    }

    /**
     * Doctor consultation workflow: Call patient, start consultation, save clinical notes & prescription, complete visit.
     */
    public function updatePatientConsultation(Request $request, int $appointmentId): JsonResponse
    {
        $appointment = Appointment::with(['doctor', 'department'])->findOrFail($appointmentId);

        $validated = $request->validate([
            'status' => ['required', 'in:called,serving,completed,waiting,no_show'],
            'doctor_notes' => ['nullable', 'string', 'max:2000'],
            'prescription' => ['nullable', 'string', 'max:2000'],
        ]);

        $updates = [
            'status' => $validated['status'],
        ];

        if (array_key_exists('doctor_notes', $validated)) {
            $updates['doctor_notes'] = $validated['doctor_notes'];
        }
        if (array_key_exists('prescription', $validated)) {
            $updates['prescription'] = $validated['prescription'];
        }

        if ($validated['status'] === 'called') {
            $updates['called_at'] = now();
            $updates['estimated_wait_minutes'] = 2;
        } elseif ($validated['status'] === 'serving') {
            $updates['served_at'] = now();
            $updates['estimated_wait_minutes'] = 0;
            $appointment->doctor?->update(['availability_status' => 'in_consultation']);
        } elseif ($validated['status'] === 'completed') {
            $updates['completed_at'] = now();
            $updates['estimated_wait_minutes'] = 0;
            $appointment->doctor?->update(['availability_status' => 'active']);
        }

        $appointment->update($updates);

        SystemLog::create([
            'level' => 'INFO',
            'category' => 'audit',
            'message' => "Dr. consultation update on {$appointment->ticket_number} ({$appointment->patient_name}) -> {$validated['status']}",
            'endpoint' => $request->path(),
            'method' => 'PUT',
            'ip_address' => $request->ip(),
        ]);

        ClinicCacheService::bumpVersion();

        return response()->json([
            'message' => "Patient {$appointment->patient_name} ({$appointment->ticket_number}) updated to {$validated['status']}.",
            'appointment' => $appointment->fresh(['doctor.department', 'department']),
        ]);
    }
}
