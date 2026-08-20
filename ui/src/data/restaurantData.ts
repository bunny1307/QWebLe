import {
  DBCategory,
  DBItem,
  DBUnit,
  Category,
  FoodItem,
  RestaurantInfo,
  RestaurantData,
} from '../types';

// Helper to determine contextual emoji icon for a category name
export function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase().trim();

  if (lower.includes('fruit')) return '🍎';
  if (
    lower.includes('biryani') ||
    lower.includes('briyani') ||
    lower.includes('rice')
  ) return '🍲';
  if (lower.includes('burger') || lower.includes('sandwich')) return '🍔';
  if (lower.includes('pizza')) return '🍕';
  if (
    lower.includes('drink') ||
    lower.includes('beverage') ||
    lower.includes('juice') ||
    lower.includes('tea') ||
    lower.includes('coffee')
  ) return '🥤';
  if (
    lower.includes('dessert') ||
    lower.includes('shake') ||
    lower.includes('ice cream') ||
    lower.includes('cake') ||
    lower.includes('sweet')
  ) return '🍨';
  if (
    lower.includes('side') ||
    lower.includes('fries') ||
    lower.includes('nugget') ||
    lower.includes('snack')
  ) return '🍟';
  if (
    lower.includes('chicken') ||
    lower.includes('non-veg') ||
    lower.includes('meat') ||
    lower.includes('tandoor')
  ) return '🍗';
  if (
    lower.includes('veg') ||
    lower.includes('salad') ||
    lower.includes('paneer')
  ) return '🥗';
  if (
    lower.includes('combo') ||
    lower.includes('meal') ||
    lower.includes('thali')
  ) return '🍱';
  if (
    lower.includes('bread') ||
    lower.includes('roti') ||
    lower.includes('naan')
  ) return '🫓';

  return '🍽️';
}

// Convert minor currency units to major currency units.
// Example: 50000 paise -> 500
export function parsePriceMinor(priceMinor: number): number {
  if (!priceMinor || isNaN(priceMinor)) return 0;

  return Number((priceMinor / 100).toFixed(2));
}

// Resolve currency symbol from currency symbol/code
export function resolveCurrencySymbol(
  symbol?: string,
  code?: string
): string {
  if (symbol && symbol !== '?' && symbol.trim() !== '') {
    return symbol.trim();
  }

  if (code) {
    const upperCode = code.toUpperCase().trim();

    if (upperCode === 'INR') return '₹';
    if (upperCode === 'USD') return '$';
    if (upperCode === 'EUR') return '€';
    if (upperCode === 'GBP') return '£';
    if (upperCode === 'AED') return 'AED ';

    return `${upperCode} `;
  }

  return '₹';
}

export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL || '';
  return envUrl.replace(/\/+$/, '');
}

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;

  const cleanPath = String(path).trim();

  // Reject serialization artifacts
  if (cleanPath === 'null' || cleanPath === 'undefined' || cleanPath === '') {
    return undefined;
  }

  // Absolute URLs (S3, CloudFront, external CDN) — return as-is, never modify
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  // Local absolute Windows/Unix paths containing /media/ or \media\ — extract filename
  let normalized = cleanPath;
  if (normalized.includes('/media/') || normalized.includes('\\media\\')) {
    const filename = normalized.split(/[/\\]media[/\\]/).pop();
    if (filename) {
      normalized = `/media/${filename}`;
    }
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  const base = getApiBaseUrl();
  if (base) {
    return `${base}${normalized}`;
  }
  return normalized;
}

/**
 * Resolves item image: uses explicit DB path first, then falls back to
 * name-based matching against bundled media files.
 */
export function getItemMediaImage(itemName: string, imagePath?: string | null): string | undefined {
  if (imagePath && String(imagePath).trim() && imagePath !== 'null') {
    return resolveMediaUrl(imagePath);
  }

  const lower = (itemName || '').toLowerCase().trim();
  if (lower.includes('dosa')) return resolveMediaUrl('/media/dosa.jpg');
  if (lower.includes('idli')) return resolveMediaUrl('/media/idli.jpg');
  if (lower.includes('fried rice')) return resolveMediaUrl('/media/fried rice.jpg');
  if (lower.includes('curd rice') || lower.includes('curdrice')) return resolveMediaUrl('/media/curdrice.jpg');
  if (lower.includes('lemon rice')) return resolveMediaUrl('/media/lemon rice.jpg');
  if (lower.includes('lemon juice') || lower.includes('lemon joice')) return resolveMediaUrl('/media/lemon joice.jpg');
  if (lower.includes('mango juice')) return resolveMediaUrl('/media/mango juice.jpg');
  if (lower.includes('gulab') || lower.includes('julab')) return resolveMediaUrl('/media/julabjamun.jpg');
  if (lower.includes('laddu') || lower.includes('ladoo')) return resolveMediaUrl('/media/laddu.jpg');
  if (lower.includes('biryani') || lower.includes('briyani')) return resolveMediaUrl('/media/biryani.jpg');
  if (lower.includes('milkshake') || lower.includes('milk shake')) return resolveMediaUrl('/media/milkshake.jpg');
  if (lower.includes('coffee')) return resolveMediaUrl('/media/milkshake.jpg');

  return undefined;
}

// Transform raw database data into the application domain model
export function transformDBData(
  rawCategories: DBCategory[],
  rawItems: DBItem[],
  rawUnits: DBUnit[]
): RestaurantData {
  const primaryUnit =
    rawUnits && rawUnits.length > 0 ? rawUnits[0] : null;

  const restaurant: RestaurantInfo = {
    id: primaryUnit?.id || 'unit_1',
    name: primaryUnit?.name || 'QSR Express',
    tagline:
      primaryUnit?.description ||
      'Fresh & Delicious Self-Ordering',
    phone: primaryUnit?.phone || null,
    email: primaryUnit?.email || null,
    address: primaryUnit?.address || null,
    logo: resolveMediaUrl(primaryUnit?.logo_path) || '',
    currencyCode: primaryUnit?.currency_code || 'INR',
    currencySymbol: resolveCurrencySymbol(
      primaryUnit?.currency_symbol,
      primaryUnit?.currency_code
    ),

    // Keep this as-is for now unless tax is stored in your DB.
    taxPercentage: 5,

    active: primaryUnit?.active === 1,
  };

  const categories: Category[] = (rawCategories || [])
    .filter((c) => c.active !== 0)
    .sort(
      (a, b) =>
        (a.display_order ?? 0) - (b.display_order ?? 0)
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      image: resolveMediaUrl(c.image_path) || undefined,
      icon: getCategoryIcon(c.name),
      displayOrder: c.display_order,
      active: c.active === 1,
    }));

  // Create category ID -> category name lookup
  const categoryNameMap = new Map<string, string>();

  categories.forEach((c) => {
    categoryNameMap.set(c.id, c.name);
  });

  const foods: FoodItem[] = (rawItems || [])
    .sort(
      (a, b) =>
        (a.display_order ?? 0) - (b.display_order ?? 0)
    )
    .map((item) => {
      const isVeg =
        item.is_veg === 1 || item.is_veg === true;

      const isAvailable =
        item.available === 1 || item.available === true;

      const price = Number(item.price);

      return {
        id: item.id,
        categoryId: item.category_id,
        name: item.name,

        description:
          item.description ||
          `${
            isVeg ? 'Vegetarian' : 'Non-Vegetarian'
          } specialty prepared fresh to order.`,

        price,
        priceMinor: price * 100,

        image: getItemMediaImage(item.name, item.image_path),

        available: isAvailable,

        isVeg,

        active:
          item.active === 1 || item.active === true,

        displayOrder: item.display_order,
      };
    });

  return {
    restaurant,
    categories,
    foods,
  };
}

/**
 * Loads restaurant data live from the cloud backend (/api/public/menu),
 * with graceful fallback to bundled static data (/data/fromdb_*.json).
 */
export async function fetchDBData(): Promise<RestaurantData> {
  const apiBase = getApiBaseUrl();
  const menuApiUrl = `${apiBase}/api/public/menu?t=${Date.now()}`;

  try {
    const menuResponse = await fetch(menuApiUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    const contentType = menuResponse.headers.get('content-type') || '';
    if (menuResponse.ok && contentType.includes('application/json')) {
      const data = await menuResponse.json();
      if (data && data.ok && Array.isArray(data.categories) && Array.isArray(data.items)) {
        return transformDBData(
          data.categories as DBCategory[],
          data.items as DBItem[],
          data.unit ? [data.unit as DBUnit] : []
        );
      }
    } else if (menuResponse.ok) {
      console.warn('Live /api/public/menu returned HTML instead of JSON. Ensure VITE_API_URL is set to your Render backend in Netlify.');
    }
  } catch (error) {
    console.warn('Live /api/public/menu request failed, falling back to static /data/ JSON:', error);
  }

  // Fallback to static JSON
  const t = Date.now();
  const categoriesUrl = `/data/fromdb_categories.json?t=${t}`;
  const itemsUrl = `/data/fromdb_items.json?t=${t}`;
  const unitsUrl = `/data/fromdb_units.json?t=${t}`;

  const [categoryResponse, itemResponse, unitResponse] =
    await Promise.all([
      fetch(categoriesUrl, {
        cache: 'no-store',
      }),

      fetch(itemsUrl, {
        cache: 'no-store',
      }),

      fetch(unitsUrl, {
        cache: 'no-store',
      }),
    ]);

  if (!categoryResponse.ok) {
    throw new Error(
      `Failed to load categories (HTTP ${categoryResponse.status})`
    );
  }

  if (!itemResponse.ok) {
    throw new Error(
      `Failed to load food items (HTTP ${itemResponse.status})`
    );
  }

  if (!unitResponse.ok) {
    throw new Error(
      `Failed to load restaurant/unit information (HTTP ${unitResponse.status})`
    );
  }

  const rawCategories =
    (await categoryResponse.json()) as DBCategory[];

  const rawItems =
    (await itemResponse.json()) as DBItem[];

  const rawUnits =
    (await unitResponse.json()) as DBUnit[];

  return transformDBData(
    rawCategories,
    rawItems,
    rawUnits
  );
}