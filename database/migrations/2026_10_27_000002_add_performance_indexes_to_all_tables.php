<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add comprehensive single-column and composite indexes to all tables
     * for sub-millisecond lookups, filtering, sorting, and N+1 elimination.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'status', 'deleted_at'], 'idx_users_role_status_deleted');
            $table->index('deleted_at', 'idx_users_deleted_at');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->index(['is_active', 'deleted_at'], 'idx_departments_active_deleted');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->index(['department_id', 'availability_status', 'deleted_at'], 'idx_doctors_dept_status_deleted');
            $table->index(['availability_status', 'deleted_at'], 'idx_doctors_status_deleted');
            $table->index('room_number', 'idx_doctors_room');
            $table->index('deleted_at', 'idx_doctors_deleted_at');
        });

        Schema::table('appointments', function (Blueprint $table) {
            // Composite index for slot availability & double-booking checks
            $table->index(
                ['doctor_id', 'appointment_date', 'appointment_time', 'status'],
                'idx_appts_doctor_date_time_status'
            );
            // Composite index for live TV queue & reception dashboard sorting
            $table->index(
                ['appointment_date', 'status', 'priority', 'deleted_at'],
                'idx_appts_date_status_priority_deleted'
            );
            // Composite index for department daily ticket counter
            $table->index(
                ['department_id', 'appointment_date'],
                'idx_appts_dept_date'
            );
            // Fast lookup indexes for patient search
            $table->index('patient_phone', 'idx_appts_patient_phone');
            $table->index('patient_name', 'idx_appts_patient_name');
            $table->index('booking_type', 'idx_appts_booking_type');
            $table->index('deleted_at', 'idx_appts_deleted_at');
        });

        Schema::table('system_logs', function (Blueprint $table) {
            $table->index(['level', 'category', 'is_resolved'], 'idx_logs_level_cat_resolved');
            $table->index(['created_at', 'level'], 'idx_logs_created_level');
            $table->index('deleted_at', 'idx_logs_deleted_at');
        });

        Schema::table('clinic_settings', function (Blueprint $table) {
            $table->index('group', 'idx_settings_group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role_status_deleted');
            $table->dropIndex('idx_users_deleted_at');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropIndex('idx_departments_active_deleted');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropIndex('idx_doctors_dept_status_deleted');
            $table->dropIndex('idx_doctors_status_deleted');
            $table->dropIndex('idx_doctors_room');
            $table->dropIndex('idx_doctors_deleted_at');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appts_doctor_date_time_status');
            $table->dropIndex('idx_appts_date_status_priority_deleted');
            $table->dropIndex('idx_appts_dept_date');
            $table->dropIndex('idx_appts_patient_phone');
            $table->dropIndex('idx_appts_patient_name');
            $table->dropIndex('idx_appts_booking_type');
            $table->dropIndex('idx_appts_deleted_at');
        });

        Schema::table('system_logs', function (Blueprint $table) {
            $table->dropIndex('idx_logs_level_cat_resolved');
            $table->dropIndex('idx_logs_created_level');
            $table->dropIndex('idx_logs_deleted_at');
        });

        Schema::table('clinic_settings', function (Blueprint $table) {
            $table->dropIndex('idx_settings_group');
        });
    }
};
