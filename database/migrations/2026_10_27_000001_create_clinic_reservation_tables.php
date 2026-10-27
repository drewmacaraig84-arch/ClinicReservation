<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 10)->unique();
            $table->text('description')->nullable();
            $table->string('default_room', 50)->default('ROOM 1');
            $table->integer('avg_wait_minutes')->default(15);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->string('name');
            $table->string('specialty');
            $table->string('license_number', 50)->unique();
            $table->string('room_number', 50)->default('ROOM 1');
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();
            $table->text('bio')->nullable();
            $table->decimal('consultation_fee', 10, 2)->default(500.00);
            $table->string('availability_status', 30)->default('active')->index(); // active, in_consultation, on_break, offline
            $table->string('shift_start', 20)->default('08:00 AM');
            $table->string('shift_end', 20)->default('05:00 PM');
            $table->integer('slot_duration_minutes')->default(30);
            $table->json('working_days')->nullable();
            $table->integer('max_daily_patients')->default(25);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 20)->index();
            $table->string('booking_reference', 40)->unique();
            $table->foreignId('patient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('patient_name');
            $table->string('patient_email')->nullable();
            $table->string('patient_phone', 30)->nullable();
            $table->integer('patient_age')->nullable();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            $table->date('appointment_date')->index();
            $table->string('appointment_time', 25);
            $table->string('booking_type', 20)->default('online'); // online, walk_in
            $table->string('status', 30)->default('waiting')->index(); // pending, checked_in, waiting, called, serving, completed, cancelled, no_show, declined
            $table->string('priority', 20)->default('normal'); // normal, urgent, senior_pwd
            $table->string('assigned_room', 50)->default('ROOM 1');
            $table->string('assigned_desk', 50)->default('DESK 1');
            $table->text('reason_for_visit')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->text('prescription')->nullable();
            $table->integer('estimated_wait_minutes')->default(15);
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('served_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            $table->string('level', 20)->index(); // CRITICAL, ERROR, WARNING, SECURITY, INFO
            $table->string('category', 30)->index(); // crash, security, rate_limit, audit, database, system
            $table->string('message');
            $table->string('exception_class')->nullable();
            $table->string('file')->nullable();
            $table->integer('line')->nullable();
            $table->longText('stack_trace')->nullable();
            $table->string('endpoint')->nullable();
            $table->string('method', 15)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('context')->nullable();
            $table->boolean('is_resolved')->default(false)->index();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('clinic_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_settings');
        Schema::dropIfExists('system_logs');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('departments');
    }
};

