<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContainerController;

Route::get('/containers/search', [ContainerController::class, 'search']);
Route::get('/containers/{id}/logs', [ContainerController::class, 'getLogs']);
Route::post('/containers', [ContainerController::class, 'store']);
Route::patch('/containers/{id}', [ContainerController::class, 'archive']);
Route::delete('/containers/{id}', [ContainerController::class, 'destroy']);