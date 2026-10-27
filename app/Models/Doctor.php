<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Doctor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'department_id',
        'name',
        'specialty',
        'license_number',
        'room_number',
        'email',
        'phone',
        'bio',
        'consultation_fee',
        'availability_status',
        'shift_start',
        'shift_end',
        'slot_duration_minutes',
        'working_days',
        'max_daily_patients',
    ];

    protected function casts(): array
    {
        return [
            'consultation_fee' => 'decimal:2',
            'slot_duration_minutes' => 'integer',
            'working_days' => 'array',
            'max_daily_patients' => 'integer',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}

