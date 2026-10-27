<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_number',
        'booking_reference',
        'patient_id',
        'patient_name',
        'patient_email',
        'patient_phone',
        'patient_age',
        'department_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'booking_type',
        'status',
        'priority',
        'assigned_room',
        'assigned_desk',
        'reason_for_visit',
        'doctor_notes',
        'prescription',
        'estimated_wait_minutes',
        'checked_in_at',
        'called_at',
        'served_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date:Y-m-d',
            'patient_age' => 'integer',
            'estimated_wait_minutes' => 'integer',
            'checked_in_at' => 'datetime',
            'called_at' => 'datetime',
            'served_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class)->withTrashed();
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class)->withTrashed();
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id')->withTrashed();
    }
}

