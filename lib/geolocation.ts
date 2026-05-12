// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A GPS coordinate pair. */
export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Any object that carries a `location` coordinate.
 * Used as the constraint on the generic filter helper so it works with
 * any service shape in the app — not just one fixed type.
 */
export interface Locatable {
  location: Coordinate;
}

/**
 * Augments a service object with a pre-computed `distanceKm` field
 * so callers can sort, paginate, or display distance without re-calculating.
 */
export type WithDistance<T> = T & { distanceKm: number };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Mean radius of the Earth in kilometres (WGS-84). */
const EARTH_RADIUS_KM = 6371;

// ---------------------------------------------------------------------------
// Internal helpers — not exported, single responsibility
// ---------------------------------------------------------------------------

/** Converts degrees to radians. */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// ---------------------------------------------------------------------------
// Exported utilities
// ---------------------------------------------------------------------------

/**
 * Calculates the straight-line distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param pointA - Origin coordinate `{ lat, lng }`.
 * @param pointB - Destination coordinate `{ lat, lng }`.
 * @returns Distance in kilometres, rounded to 3 decimal places.
 */
export function getDistance(pointA: Coordinate, pointB: Coordinate): number {
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pointA.lat)) *
      Math.cos(toRadians(pointB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 1000) / 1000;
}

/**
 * Filters an array of locatable service objects to those within a given radius
 * of an origin coordinate, and attaches a `distanceKm` field to each result.
 * Results are sorted nearest-first.
 *
 * The radius cutoff is always controlled by the caller — this function has
 * no opinion on what counts as "close enough".
 *
 * @param services - Array of objects that each have a `location: Coordinate` field.
 * @param origin   - The buyer's current GPS position.
 * @param radiusKm - Maximum distance in kilometres. Caller decides the cutoff
 *                   (e.g. 1 for default, 5 or 10 for expanded search).
 * @returns Filtered and sorted array of the same object type, each extended
 *          with `distanceKm: number`.
 */
export function filterByDistance<T extends Locatable>(
  services: T[],
  origin: Coordinate,
  radiusKm: number
): Array<WithDistance<T>> {
  return services
    .reduce<Array<WithDistance<T>>>((acc, service) => {
      const distanceKm = getDistance(origin, service.location);

      if (distanceKm <= radiusKm) {
        acc.push({ ...service, distanceKm });
      }

      return acc;
    }, [])
    .sort((a, b) => a.distanceKm - b.distanceKm);
}