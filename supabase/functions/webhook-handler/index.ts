// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// @ts-ignore
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts'

// @ts-ignore
serve(async (req: Request) => {
    try {
        // Handle CORS preflight
        const corsPreFlight = handleCorsPreFlight(req)
        if (corsPreFlight) {
            return corsPreFlight
        }

        const origin = req.headers.get('origin')
        const corsHeaders = getCorsHeaders(origin)

        // Initialize Supabase Admin Client
        // Accessing Deno.env directly inside the handler
        // @ts-ignore
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        // @ts-ignore
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }

        const url = new URL(req.url);
        const provider = url.searchParams.get('provider'); // ?provider=paystack or ?provider=mpesa

        if (!provider) {
            throw new Error('Missing provider');
        }

        const body = await req.text();
        let eventData: any = {};

        if (provider === 'paystack') {
            // --- PAYSTACK WEBHOOK HANDLER ---
            const signature = req.headers.get('x-paystack-signature');
            // @ts-ignore
            const secret = Deno.env.get('PAYSTACK_SECRET_KEY');

            if (!secret || !signature) {
                throw new Error('Missing Paystack secret or signature');
            }

            // Verify signature (Node crypto style logic for Deno)
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const cryptoKey = await crypto.subtle.importKey(
                "raw", keyData, { name: "HMAC", hash: "SHA-512" }, false, ["verify"]
            );
            const signatureBuf = hexToBuf(signature || "");
            const verified = await crypto.subtle.verify(
                "HMAC", cryptoKey, signatureBuf, encoder.encode(body)
            );

            if (!verified) {
                throw new Error("Invalid Paystack Signature");
            }

            const json = JSON.parse(body);
            if (json.event === 'charge.success') {
                eventData = {
                    status: 'Success',
                    reference: json.data.reference,
                    amount: json.data.amount / 100,
                    metadata: json.data.metadata
                };
            } else {
                return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
        } else if (provider === 'mpesa') {
            // --- M-PESA WEBHOOK HANDLER ---
            const json = JSON.parse(body);
            // M-Pesa structure varies (C2B vs STK Push). Assuming STK Push Callback for now.
            const stkCallback = json.Body?.stkCallback;
            if (stkCallback) {
                const resultCode = stkCallback.ResultCode;
                const checkoutRequestId = stkCallback.CheckoutRequestID;

                if (resultCode === 0) {
                    eventData = {
                        status: 'Success',
                        reference: checkoutRequestId,
                        amount: stkCallback.CallbackMetadata?.Item?.find((i: any) => i.Name === 'Amount')?.Value,
                        metadata: {} // M-Pesa callbacks don't return initial metadata easily, usually keyed by CheckoutRequestID in DB
                    };
                } else {
                    eventData = { status: 'Failed', reference: checkoutRequestId };
                }
            }
        } else {
            throw new Error("Unknown Provider");
        }

        // --- EXECUTE DB UPDATES ---
        if (eventData.status === 'Success' || eventData.status === 'Failed') {
            try {
                // 1. Update Transaction Status
                const { data: txn, error: txnError } = await supabase
                    .from('transactions')
                    .update({
                        status: eventData.status,
                        metadata: { ...eventData.metadata, webhook_received_at: new Date().toISOString() }
                    })
                    .eq('reference', eventData.reference)
                    .select()
                    .single();

                if (txnError) {
                    console.error("Error updating transaction:", txnError);
                    throw new Error('Failed to update transaction');
                }

                // 2. Identify and handle specific payment types
                if (eventData.status === 'Success') {
                    const metadata = eventData.metadata || {};

                    // Case A: Patient Visit Payment
                    if (metadata.invoiceId || metadata.visitId) {
                        const visitId = metadata.invoiceId || metadata.visitId;
                        console.log(`Updating payment status for visit: ${visitId}`);

                        const { error: visitError } = await supabase
                            .from('visits')
                            .update({
                                payment_status: 'Paid',
                                total_bill: eventData.amount // Ensure bill matches paid amount
                            })
                            .eq('id', visitId);

                        if (visitError) {
                            console.error("Error updating visit payment status:", visitError);
                            throw new Error('Failed to update visit payment status');
                        }
                    }

                    // Case B: Clinic SaaS Plan Payment
                    if (metadata.type === 'Plan' && txn) {
                        const clinicId = txn.clinic_id;
                        const newPlan = metadata.plan || 'pro';

                        console.log(`Upgrading clinic ${clinicId} to plan: ${newPlan}`);

                        const { error: clinicError } = await supabase
                            .from('clinics')
                            .update({
                                plan: newPlan,
                                status: 'active',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', clinicId);

                        if (clinicError) {
                            console.error("Error upgrading clinic:", clinicError);
                            throw new Error('Failed to upgrade clinic');
                        }
                    }
                }
            } catch (error: any) {
                console.error("Error updating database:", error);
                throw new Error('Failed to update database');
            }
        }

        return new Response(
            JSON.stringify({ received: true, status: 'processed' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown Error' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})

// Helper for hex string to buffer
function hexToBuf(hex: string) {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}