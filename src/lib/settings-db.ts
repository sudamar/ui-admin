
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseAdminClient: SupabaseClient | null = null;

function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseServiceKey || !supabaseUrl) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdminClient;
}

export interface Settings {
  id: number;
  nome_site: string;
  manutencao: boolean;
  drmsocial: boolean;
  [key: string]: any;
}

export const getSettingsFromDB = async (): Promise<Settings | null> => {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error("Supabase admin client is not initialized.");
  }

  const { data, error } = await adminClient.from('settings').select('*').eq('id', 1).single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
  return data as Settings | null;
};

export const updateSettingInDB = async (key: string, value: any): Promise<Settings | null> => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
        throw new Error("Supabase admin client is not initialized.");
    }

    const { data, error } = await adminClient
        .from('settings')
        .update({ [key]: value })
        .eq('id', 1)
        .select();

    if (error) {
        console.error('Error updating setting:', error);
        throw error;
    }

    return data ? data[0] : null;
};
