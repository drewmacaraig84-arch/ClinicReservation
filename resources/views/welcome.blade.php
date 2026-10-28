<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>CarePoint Clinic — Integrated Reservation, Queue & Multi-Portal System</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet" />
        @php
            $manifestPath = public_path('build/manifest.json');
            $hotPath = public_path('hot');
            $manifest = (!file_exists($hotPath) && file_exists($manifestPath))
                ? json_decode(file_get_contents($manifestPath), true)
                : null;
        @endphp
        @if ($manifest && isset($manifest['resources/js/app.jsx']))
            @if (isset($manifest['resources/css/app.css']['file']))
                <link rel="stylesheet" href="/build/{{ $manifest['resources/css/app.css']['file'] }}" />
            @endif
            @foreach ($manifest['resources/js/app.jsx']['css'] ?? [] as $cssFile)
                <link rel="stylesheet" href="/build/{{ $cssFile }}" />
            @endforeach
            <script type="module" src="/build/{{ $manifest['resources/js/app.jsx']['file'] }}"></script>
        @else
            @viteReactRefresh
            @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @endif
    </head>
    <body class="bg-slate-100 text-slate-900 antialiased selection:bg-teal-600 selection:text-white">
        <div id="carepoint-root"></div>
    </body>
</html>
