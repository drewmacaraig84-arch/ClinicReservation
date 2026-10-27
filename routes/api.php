<?php

use App\Http\Controllers\Api\AdminPortalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DoctorPortalController;
use App\Http\Controllers\Api\PublicClinicController;
use App\Http\Controllers\Api\StaffPortalController;
use App\Http\Controllers\Api\SuperAdminPortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function () {
    // 0. RBAC Authentication & Role Matrix Endpoints
    Route::get('/auth/roles', [AuthController::class, 'rolesOverview']);
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');

    // 1. Client / Public Reservation & TV Queue Endpoints (Accessible to all roles: patient, staff, doctor, admin, super_admin)
    Route::get('/public/catalog', [PublicClinicController::class, 'catalog']);
    Route::get('/public/slots', [PublicClinicController::class, 'slots']);
    Route::post('/public/book', [PublicClinicController::class, 'bookAppointment'])->middleware('throttle:booking');
    Route::get('/public/lookup', [PublicClinicController::class, 'lookupTicket']);

    // 2. Staff / Reception Desk Endpoints (RBAC Protected: staff, admin, super_admin)
    Route::middleware('role:staff,admin,super_admin')->group(function () {
        Route::get('/staff/dashboard', [StaffPortalController::class, 'dashboard']);
        Route::post('/staff/queue-action', [StaffPortalController::class, 'queueAction']);
        Route::post('/staff/walk-in', [StaffPortalController::class, 'quickWalkInTicket']);
    });

    // 3. Doctor Portal Endpoints (RBAC Protected: doctor, admin, super_admin)
    Route::middleware('role:doctor,admin,super_admin')->group(function () {
        Route::get('/doctor/dashboard', [DoctorPortalController::class, 'dashboard']);
        Route::put('/doctor/{doctorId}/schedule', [DoctorPortalController::class, 'updateSchedule']);
        Route::put('/doctor/{doctorId}/profile', [DoctorPortalController::class, 'updateProfile']);
        Route::put('/doctor/appointments/{appointmentId}', [DoctorPortalController::class, 'updatePatientConsultation']);
    });

    // 4. Admin Dashboard & Graph Reports Endpoints (RBAC Protected: admin, super_admin)
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/admin/dashboard', [AdminPortalController::class, 'dashboard']);
        Route::post('/admin/appointments/{appointmentId}/action', [AdminPortalController::class, 'manageAppointment']);
        Route::post('/admin/doctors', [AdminPortalController::class, 'storeDoctor']);
        Route::delete('/admin/doctors/{doctorId}', [AdminPortalController::class, 'deleteDoctor']);
        Route::put('/admin/settings', [AdminPortalController::class, 'updateSettings']);
        Route::put('/admin/users/{userId}/role', [AuthController::class, 'updateUserRole']);
    });

    // 5. Super Admin Observatory (RBAC Protected: super_admin ONLY)
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/super-admin/dashboard', [SuperAdminPortalController::class, 'dashboard']);
        Route::post('/super-admin/restore', [SuperAdminPortalController::class, 'restoreRecord']);
        Route::delete('/super-admin/force-delete', [SuperAdminPortalController::class, 'forceDeleteRecord']);
        Route::delete('/super-admin/users/{userId}', [SuperAdminPortalController::class, 'softDeleteUser']);
        Route::put('/super-admin/users/{userId}/role', [AuthController::class, 'updateUserRole']);
        Route::post('/super-admin/logs/{logId}/resolve', [SuperAdminPortalController::class, 'resolveLog']);
        Route::post('/super-admin/simulate', [SuperAdminPortalController::class, 'simulateDiagnostic']);
    });
});
