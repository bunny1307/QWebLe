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

// Fallback food image based on food/category name
export function getFoodFallbackImage(
  foodName: string,
  categoryName?: string
): string {
  const lower = `${foodName} ${categoryName || ''}`.toLowerCase();

  if (lower.includes('biryani') || lower.includes('briyani')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
  }

  if (lower.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80';
  }

  if (lower.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
  }

  if (lower.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
  }

  if (lower.includes('fries') || lower.includes('chips')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80';
  }

  if (lower.includes('chicken')) {
    return 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80';
  }

  if (
    lower.includes('drink') ||
    lower.includes('juice') ||
    lower.includes('shake')
  ) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
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
    logo: primaryUnit?.logo_path || '',
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
      image: c.image_path || undefined,
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
      const catName = categoryNameMap.get(item.category_id);

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

        image:
          item.image_path || undefined,

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

/*
 * SINGLE SOURCE OF TRUTH
 *
 * React loads restaurant data ONLY from:
 *
 * /data/fromdb_categories.json
 * /data/fromdb_items.json
 * /data/fromdb_units.json
 *
 * Do NOT add fallback URLs.
 * Do NOT import JSON files from src/data.
 * Do NOT use bundled/static restaurant data.
 */
export async function fetchDBData(): Promise<RestaurantData> {
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