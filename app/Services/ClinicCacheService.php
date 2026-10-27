<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\Cache;

class ClinicCacheService
{
    private const VERSION_KEY = 'carepoint_cache_version';

    /**
     * Get the current cache generation version.
     */
    public static function getVersion(): int
    {
        return (int) Cache::rememberForever(self::VERSION_KEY, fn () => 1);
    }

    /**
     * Invalidate all cached clinic portal responses by bumping the cache generation version.
     */
    public static function bumpVersion(): int
    {
        $next = self::getVersion() + 1;
        Cache::forever(self::VERSION_KEY, $next);
        return $next;
    }

    /**
     * Remember a query/payload under the current cache generation version.
     */
    public static function remember(string $key, int $ttlSeconds, Closure $callback): mixed
    {
        $version = self::getVersion();
        $scopedKey = "cp_v{$version}_{$key}";

        return Cache::remember($scopedKey, $ttlSeconds, $callback);
    }
}
