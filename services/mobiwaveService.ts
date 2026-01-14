
const API_BASE_URL = 'https://sms.mobiwave.co.ke/api/v3';
const API_TOKEN = import.meta.env.VITE_MOBIWAVE_API_TOKEN || '49|LNFe8WJ7CPtvl2mzowAB4ll4enbFR0XGgnQh2qWY';

export interface MobiwaveResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
}

export interface MobiwaveContact {
    uid: string;
    phone: string;
    first_name?: string;
    last_name?: string;
}

export interface MobiwaveGroup {
    uid: string;
    name: string;
}

const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

export const mobiwaveService = {
    // --- SMS API ---
    sendSMS: async (recipient: string, message: string, senderId: string = 'JuaAfya'): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sms/send`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    recipient,
                    sender_id: senderId,
                    type: 'plain',
                    message,
                }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    sendCampaign: async (contactListId: string, message: string, senderId: string = 'JuaAfya'): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/sms/campaign`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    contact_list_id: contactListId,
                    sender_id: senderId,
                    type: 'plain',
                    message,
                }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    // --- Contacts API ---
    getContactsInGroup: async (groupId: string): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${groupId}/all`, {
                method: 'POST',
                headers,
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    storeContact: async (groupId: string, phone: string, firstName?: string, lastName?: string): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${groupId}/store`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    phone,
                    first_name: firstName,
                    last_name: lastName,
                }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    updateContact: async (groupId: string, contactUid: string, phone: string, firstName?: string, lastName?: string): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${groupId}/update/${contactUid}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    phone,
                    first_name: firstName,
                    last_name: lastName,
                }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    deleteContact: async (groupId: string, contactUid: string): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${groupId}/delete/${contactUid}`, {
                method: 'DELETE',
                headers,
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    // --- Groups API ---
    getGroups: async (): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts`, {
                method: 'GET',
                headers,
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    storeGroup: async (name: string): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },

    deleteGroup: async (groupId: string): Promise<MobiwaveResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${groupId}`, {
                method: 'DELETE',
                headers,
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: String(error) };
        }
    },
};
