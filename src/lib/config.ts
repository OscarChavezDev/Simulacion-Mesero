function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa .env.local (ver .env.example).`
    );
  }
  return value;
}

export const config = {
  restaurantsApiUrl: required(
    "NEXT_PUBLIC_RESTAURANTS_API_URL",
    process.env.NEXT_PUBLIC_RESTAURANTS_API_URL
  ),
  restaurantId: required(
    "NEXT_PUBLIC_RESTAURANT_ID",
    process.env.NEXT_PUBLIC_RESTAURANT_ID
  ),
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
};
