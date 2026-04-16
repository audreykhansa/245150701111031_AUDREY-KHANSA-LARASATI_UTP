<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class ContainerController extends Controller
{
    private function getContainers()
    {
        return Cache::rememberForever('wowo_containers', function () {
            return [
                [
                    'container_id' => 'CB31097',
                    'waste_type' => 'Chemical',
                    'weight_kg' => 143,
                    'status' => 'Active',
                    'tracking_logs' => [
                        ['location' => 'Gudang Utama', 'timestamp' => '2026-04-16 08:00', 'description' => 'Penerimaan limbah'],
                        ['location' => 'Area Isolasi B', 'timestamp' => '2026-04-16 10:30', 'description' => 'Proses pelabelan Chemical']
                    ]
                ],
                [
                    'container_id' => 'JY22994',
                    'waste_type' => 'Solid',
                    'weight_kg' => 1200,
                    'status' => 'Archived',
                    'tracking_logs' => [
                        ['location' => 'Fasilitas Daur Ulang', 'timestamp' => '2026-04-15 09:00', 'description' => 'Selesai diproses']
                    ]
                ]
            ];
        });
    }

    private function saveContainers($data)
    {
        Cache::put('wowo_containers', $data);
    }

    public function index()
    {
        return response()->json($this->getContainers(), 200);
    }

    public function search(Request $request)
    {
        $type = $request->query('type');
        $minWeight = $request->query('min_weight');
        $results = collect($this->getContainers());

        if ($type) $results = $results->where('waste_type', $type);
        if ($minWeight) $results = $results->where('weight_kg', '>=', (float)$minWeight);

        return response()->json($results->values()->all(), 200);
    }

    public function showLogs($id)
    {
        $container = collect($this->getContainers())->firstWhere('container_id', $id);
        if (!$container) return response()->json(['message' => 'Kontainer tidak ditemukan'], 404);
        return response()->json($container['tracking_logs'], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'container_id' => ['required', 'string', 'regex:/^[A-Z]{2}[0-9]{5}$/'],
            'waste_type' => 'required|string',
            'weight_kg' => 'required|numeric|min:10|max:5000',
        ], [
            'container_id.regex' => 'Format ID harus 2 Huruf Kapital diikuti 5 Angka (contoh: CB31097).',
            'weight_kg.min' => 'Berat minimal adalah 10 kg.',
            'weight_kg.max' => 'Berat maksimal adalah 5000 kg.',
        ]);

        $validator->after(function ($validator) use ($request) {
            if ($request->waste_type === 'Chemical' && $request->weight_kg > 1000) {
                $validator->errors()->forget('weight_kg'); 
                $validator->errors()->add('weight_kg', 'Berat maksimal Chemical adalah 1000 kg.');
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $containers = $this->getContainers();

        if (collect($containers)->contains('container_id', $request->container_id)) {
            return response()->json([
                'errors' => ['container_id' => ['Container ID sudah terdaftar di sistem.']]
            ], 422);
        }

        $newContainer = [
            'container_id' => $request->container_id,
            'waste_type' => $request->waste_type,
            'weight_kg' => (float) $request->weight_kg, 
            'status' => 'Active',
            'tracking_logs' => [
                ['location' => 'Entry Point', 'timestamp' => now()->format('Y-m-d H:i'), 'description' => 'Kontainer didaftarkan']
            ]
        ];

        $containers[] = $newContainer;
        $this->saveContainers($containers);

        return response()->json(['message' => 'Berhasil!', 'data' => $newContainer], 201);
    }

    public function archive($id)
    {
        $containers = $this->getContainers();
        $isFound = false;
        foreach ($containers as &$container) {
            if ($container['container_id'] === $id) {
                $container['status'] = 'Archived';
                $isFound = true;
                break;
            }
        }
        if (!$isFound) return response()->json(['message' => 'Tidak ditemukan'], 404);
        $this->saveContainers($containers);
        return response()->json(['message' => 'Status kontainer berhasil diubah menjadi Archived'], 200);
    }

    public function destroy($id)
    {
        $containers = $this->getContainers();
        $filtered = array_filter($containers, fn($c) => $c['container_id'] !== $id);
        if (count($filtered) === count($containers)) return response()->json(['message' => 'Tidak ditemukan'], 404);
        $this->saveContainers(array_values($filtered));
        return response()->json(['message' => 'Kontainer berhasil dihapus'], 200);
    }
}