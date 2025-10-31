
export interface Settings {
  id: number;
  site_name: string;
  maintenance_mode: boolean;
  [key: string]: any;
}

export const getSettings = async (): Promise<Settings | null> => {
    const response = await fetch('/api/settings');
    if (!response.ok) {
        throw new Error('Failed to fetch settings');
    }
    return response.json();
};

export const updateSetting = async (key: string, value: any): Promise<Settings | null> => {
    const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update setting: ${errorText}`);
    }

    return response.json();
};
