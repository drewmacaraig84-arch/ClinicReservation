<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SystemLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'level',
        'category',
        'message',
        'exception_class',
        'file',
        'line',
        'stack_trace',
        'endpoint',
        'method',
        'ip_address',
        'user_agent',
        'user_id',
        'context',
        'is_resolved',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'line' => 'integer',
            'context' => 'array',
            'is_resolved' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}

